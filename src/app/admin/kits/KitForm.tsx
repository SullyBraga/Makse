'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Search, Layers, RefreshCw, ImagePlus, Trash2, Upload, Link2 } from 'lucide-react'
import Image from 'next/image'
import { compressImage } from '@/lib/compress'

type Product = {
  id: string; name: string; sku: string | null; price: number
  pricePro: number | null; images: string[]; variants: { id: string; label: string; price: number; pricePro: number | null }[]
}

type KitComponent = {
  productId: string; variantId: string | null; quantity: number
  product: Pick<Product, 'id' | 'name' | 'sku' | 'images'>; variantLabel: string
}

type Props = {
  kitId?: string
  defaultValues?: {
    name: string; sku: string; description: string; price: string; pricePro: string
    priceVendedor: string; showInCatalog: boolean; showAsSuggestion: boolean; active: boolean
    items: KitComponent[]
    images?: string[]
    relatedProductsData?: { id: string; name: string; images: string[] }[]
  }
}

export default function KitForm({ kitId, defaultValues }: Props) {
  const router = useRouter()
  const isEdit = !!kitId

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [sku, setSku] = useState(defaultValues?.sku ?? '')
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [price, setPrice] = useState(defaultValues?.price ?? '')
  const [pricePro, setPricePro] = useState(defaultValues?.pricePro ?? '')
  const [priceVendedor, setPriceVendedor] = useState(defaultValues?.priceVendedor ?? '')
  const [showInCatalog, setShowInCatalog] = useState(defaultValues?.showInCatalog ?? false)
  const [showAsSuggestion, setShowAsSuggestion] = useState(defaultValues?.showAsSuggestion ?? true)
  const [active, setActive] = useState(defaultValues?.active ?? true)
  const [components, setComponents] = useState<KitComponent[]>(defaultValues?.items ?? [])
  const [kitImages, setKitImages] = useState<string[]>(defaultValues?.images ?? [])
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Related products (manual suggestions)
  const [relatedProducts, setRelatedProducts] = useState<{ id: string; name: string; images: string[] }[]>(
    defaultValues?.relatedProductsData ?? []
  )
  const [relSearch, setRelSearch] = useState('')
  const [relResults, setRelResults] = useState<{ id: string; name: string; images: string[] }[]>([])
  const [relLoading, setRelLoading] = useState(false)

  const searchRelated = useCallback(async (q: string) => {
    if (!q.trim()) { setRelResults([]); return }
    setRelLoading(true)
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=8`)
    if (res.ok) {
      const data = await res.json()
      setRelResults(data.filter((p: any) => !relatedProducts.find(r => r.id === p.id)))
    }
    setRelLoading(false)
  }, [relatedProducts])

  useEffect(() => { const t = setTimeout(() => searchRelated(relSearch), 300); return () => clearTimeout(t) }, [relSearch, searchRelated])

  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProds, setLoadingProds] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return }
    setLoadingProds(true)
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}`)
    if (res.ok) setProducts(await res.json())
    setLoadingProds(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300)
    return () => clearTimeout(t)
  }, [productSearch, searchProducts])

  const addComponent = (product: Product) => {
    const variant = product.variants[0] || null
    const existing = components.find(c => c.productId === product.id && c.variantId === (variant?.id ?? null))
    if (existing) {
      setComponents(prev => prev.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setComponents(prev => [...prev, {
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: 1,
        product: { id: product.id, name: product.name, sku: product.sku, images: product.images },
        variantLabel: variant?.label ?? 'Padrão',
      }])
    }
    setProductSearch('')
    setProducts([])
  }

  const removeComponent = (productId: string) => {
    setComponents(prev => prev.filter(c => c.productId !== productId))
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeComponent(productId); return }
    setComponents(prev => prev.map(c => c.productId === productId ? { ...c, quantity: qty } : c))
  }

  const handleSave = async () => {
    if (!name.trim() || !price) { setError('Nome e preço são obrigatórios'); return }
    if (components.length === 0) { setError('Adicione ao menos um produto ao kit'); return }
    setSaving(true); setError('')

    const body = {
      name, sku: sku || null, description, price, pricePro: pricePro || null,
      priceVendedor: priceVendedor || null, showInCatalog, showAsSuggestion, active,
      relatedProducts: relatedProducts.map(p => p.id),
      items: components.map(c => ({ productId: c.productId, variantId: c.variantId, quantity: c.quantity })),
    }

    const url = isEdit ? '/api/admin/kits' : '/api/admin/kits'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: kitId, ...body } : body),
    })

    if (res.ok) {
      const saved = await res.json()
      if (!isEdit && saved.id) {
        router.push(`/admin/kits/${saved.id}/editar`)
      } else {
        router.push('/admin/kits')
      }
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao salvar kit')
    }
    setSaving(false)
  }

  const fieldStyle = {
    width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '0.84rem', outline: 'none',
    fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)',
  }

  const labelStyle = { fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/kits')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Voltar
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)' }}>
            {isEdit ? 'Editar Kit' : 'Novo Kit'}
          </h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>
            {isEdit ? 'Atualize os dados do kit' : 'Configure um conjunto de produtos'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="kit-form-grid">
        {/* Main form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Dados básicos */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Dados do Kit</h2>
            <div className="kit-basic-grid">
              <div>
                <label style={labelStyle}>Nome *</label>
                <input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Kit Nutrição Completa" />
              </div>
              <div>
                <label style={labelStyle}>SKU</label>
                <input style={fieldStyle} value={sku} onChange={e => setSku(e.target.value)} placeholder="KIT-001" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <textarea style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o kit e seus benefícios..." />
            </div>
          </div>

          {/* Preços */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Preços</h2>
            <div className="kit-prices-grid">
              <div>
                <label style={labelStyle}>Preço Cliente Final *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>R$</span>
                  <input style={{ ...fieldStyle, paddingLeft: '2rem' }} type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Preço Profissional (Pro)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>R$</span>
                  <input style={{ ...fieldStyle, paddingLeft: '2rem' }} type="number" step="0.01" value={pricePro} onChange={e => setPricePro(e.target.value)} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Preço Vendedor</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>R$</span>
                  <input style={{ ...fieldStyle, paddingLeft: '2rem' }} type="number" step="0.01" value={priceVendedor} onChange={e => setPriceVendedor(e.target.value)} placeholder="0,00" />
                </div>
              </div>
            </div>
          </div>

          {/* Produtos do kit */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1rem' }}>Produtos do Kit</h2>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar produto por nome ou SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ ...fieldStyle, paddingLeft: '2.25rem', borderRadius: '99px' }}
              />
            </div>

            {/* Results dropdown */}
            {(products.length > 0 || loadingProds) && productSearch && (
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                {loadingProds ? (
                  <div style={{ padding: '1rem', textAlign: 'center' }}><RefreshCw size={16} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} /></div>
                ) : products.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => addComponent(prod)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 40, height: 40, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {prod.images[0] ? <Image src={prod.images[0]} alt={prod.name} fill style={{ objectFit: 'cover' }} /> : null}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.2 }}>{prod.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prod.sku ?? '—'} · R$ {prod.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <Plus size={16} style={{ marginLeft: 'auto', color: 'var(--gold)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {/* Components list */}
            {components.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                <Layers size={28} style={{ color: 'var(--border)', margin: '0 auto 0.5rem', display: 'block' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Busque e adicione produtos ao kit</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {components.map(comp => (
                  <div key={comp.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cream)', borderRadius: '10px' }}>
                    <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {comp.product.images[0] ? <Image src={comp.product.images[0]} alt={comp.product.name} fill style={{ objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.product.name}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{comp.variantLabel}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      <button onClick={() => updateQty(comp.productId, comp.quantity - 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}>−</button>
                      <span style={{ padding: '0.3rem 0.5rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: 32, textAlign: 'center' }}>{comp.quantity}</span>
                      <button onClick={() => updateQty(comp.productId, comp.quantity + 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}>+</button>
                    </div>
                    <button onClick={() => removeComponent(comp.productId)} style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Imagens do Kit */}
          {isEdit && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImagePlus size={15} style={{ color: 'var(--gold)' }} />
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Imagens do Kit</h2>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  disabled={uploadingImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.875rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.7rem', cursor: 'pointer', background: '#fff', color: 'var(--navy)' }}>
                  {uploadingImage ? <RefreshCw size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Upload size={11} />}
                  Adicionar
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (!files.length) return
                    setUploadingImage(true)
                    for (const file of files) {
                      let uploadBlob: Blob = file
                      try {
                        uploadBlob = await compressImage(file)
                      } catch (err) {
                        console.error('[KitForm] Erro ao comprimir imagem:', err)
                      }
                      const fd = new FormData()
                      fd.append('file', uploadBlob, 'image.jpg')
                      const r = await fetch(`/api/admin/kits/${kitId}/images`, { method: 'POST', body: fd })
                      if (r.ok) { const d = await r.json(); setKitImages(prev => [...prev, d.url]) }
                    }
                    setUploadingImage(false)
                    e.target.value = ''
                  }}
                />
              </div>
              {kitImages.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                  <ImagePlus size={28} style={{ color: 'var(--border)', margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma imagem adicionada</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem' }}>
                  {kitImages.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Image src={url} alt={`Kit image ${idx+1}`} fill style={{ objectFit: 'cover' }} />
                      <button type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/kits/${kitId}/images`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
                          setKitImages(prev => prev.filter(u => u !== url))
                        }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <X size={10} />
                      </button>
                      {idx === 0 && (
                        <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '0.5rem', background: 'var(--navy)', color: 'var(--gold)', padding: '1px 5px', borderRadius: '99px', fontWeight: 700 }}>CAPA</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isEdit && (
            <div style={{ background: 'var(--cream)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImagePlus size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Salve o kit primeiro para adicionar imagens.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="kit-sidebar-container">
          {/* Visibilidade */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Visibilidade</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Exibir no Catálogo', sub: 'Aparece na listagem de produtos como item comprável', value: showInCatalog, set: setShowInCatalog },
                { label: 'Exibir como Sugestão', sub: 'Aparece na página de produto ("Compre Junto")', value: showAsSuggestion, set: setShowAsSuggestion },
                { label: 'Kit Ativo', sub: 'Kit disponível para compra', value: active, set: setActive },
              ].map(opt => (
                <label key={opt.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <div
                    style={{
                      width: 40, height: 22, borderRadius: '99px', marginTop: '2px', flexShrink: 0,
                      background: opt.value ? 'var(--navy)' : 'var(--border)', transition: 'background 0.2s', position: 'relative', cursor: 'pointer'
                    }}
                    onClick={() => opt.set(!opt.value)}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute',
                      top: 3, left: opt.value ? 21 : 3, transition: 'left 0.2s',
                    }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '2px' }}>{opt.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Related products */}
          {isEdit && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Link2 size={13} style={{ color: 'var(--gold)' }} />
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Produtos Relacionados</h2>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>Aparecerão como "Compre Junto" na página do kit.</p>
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={12} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar produto..." value={relSearch} onChange={e => setRelSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.78rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif' }} />
              </div>
              {relLoading && <div style={{ textAlign: 'center', padding: '0.5rem' }}><RefreshCw size={12} style={{ color: 'var(--gold)', animation: 'spin 0.7s linear infinite' }} /></div>}
              {relResults.length > 0 && relSearch && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.625rem' }}>
                  {relResults.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setRelatedProducts(prev => [...prev, p]); setRelSearch(''); setRelResults([]) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 28, height: 28, background: 'var(--cream)', borderRadius: '5px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 500, flex: 1 }}>{p.name}</span>
                      <Plus size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
              {relatedProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {relatedProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.625rem', background: 'var(--cream)', borderRadius: '7px' }}>
                      <div style={{ width: 28, height: 28, background: '#fff', borderRadius: '5px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                      </div>
                      <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 500 }}>{p.name}</span>
                      <button type="button" onClick={() => setRelatedProducts(prev => prev.filter(r => r.id !== p.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem' }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem', background: 'var(--cream)', borderRadius: '7px' }}>Nenhum produto relacionado</p>
              )}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', padding: '0.875rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            {saving ? <><RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Salvando...</> : isEdit ? 'Salvar Alterações' : 'Criar Kit'}
          </button>
        </div>
      </div>
      <style>{`
        .kit-form-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          align-items: start;
        }
        .kit-basic-grid {
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .kit-prices-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }
        .kit-sidebar-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 1.5rem;
        }

        @media (max-width: 1024px) {
          .kit-form-grid {
            grid-template-columns: 1fr;
          }
          .kit-sidebar-container {
            position: static !important;
          }
        }

        @media (max-width: 768px) {
          .kit-prices-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .kit-basic-grid {
            grid-template-columns: 1fr;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
