'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, RefreshCw, ArrowLeft, ImagePlus, Info, Search, X, Link2 } from 'lucide-react'
import ProductImageManager from '@/components/admin/ProductImageManager'
import Image from 'next/image'

const PRODUCT_TYPES = ['Shampoo', 'Condicionador', 'Máscara', 'Pó Descolorante', 'OX', 'Finalizador', 'Creme', 'Tônico', 'Serum', 'Perfume Capilar', 'Outro']

type Variant = {
  label: string
  price: string          // cliente final (preço de venda)
  originalPrice: string  // preço original de tabela (opcional, para De X por Y)
  pricePro: string       // profissional
  priceVendedor: string  // vendedor
  stock: string
}

type Line = { id: string; name: string }

type Props = {
  initialData?: any
  mode?: 'create' | 'edit'
}

export default function ProductForm({ initialData, mode = 'create' }: Props) {
  const router = useRouter()
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    sku: initialData?.sku ?? '',
    productType: initialData?.productType ?? '',
    weight: initialData?.weight ?? '',
    lineId: initialData?.lineId ?? '',
    description: initialData?.description ?? '',
    ingredients: initialData?.ingredients ?? '',
    howToUse: initialData?.howToUse ?? '',
    usage: initialData?.usage ?? '',
    proOnly: initialData?.proOnly ?? false,
    featured: initialData?.featured ?? false,
    active: initialData?.active ?? true,
  })

  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants?.length > 0
      ? initialData.variants.map((v: any) => ({
          label: v.label,
          price: v.price?.toString() ?? '',
          originalPrice: v.originalPrice?.toString() ?? (initialData?.originalPrice?.toString() ?? ''),
          pricePro: v.pricePro?.toString() ?? '',
          priceVendedor: v.priceVendedor?.toString() ?? '',
          stock: v.stock?.toString() ?? '0',
        }))
      : [{ label: 'Padrão', price: '', originalPrice: '', pricePro: '', priceVendedor: '', stock: '0' }]
  )

  // Related products (manual suggestions)
  const [relatedProducts, setRelatedProducts] = useState<{ id: string; name: string; images: string[] }[]>(
    initialData?.relatedProductsData ?? []
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
      setRelResults(data.filter((p: any) => p.id !== initialData?.id && !relatedProducts.find(r => r.id === p.id)))
    }
    setRelLoading(false)
  }, [initialData?.id, relatedProducts])

  useEffect(() => {
    const t = setTimeout(() => searchRelated(relSearch), 300)
    return () => clearTimeout(t)
  }, [relSearch, searchRelated])


  useEffect(() => {
    fetch('/api/admin/lines').then(r => r.json()).then(setLines).catch(() => {})
  }, [])

  const updateVariant = (i: number, field: keyof Variant, val: string) => {
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v))
  }

  const addVariant = () => {
    // Copy prices from first variant as default
    const first = variants[0]
    setVariants(v => [...v, {
      label: '',
      price: first?.price ?? '',
      originalPrice: first?.originalPrice ?? '',
      pricePro: first?.pricePro ?? '',
      priceVendedor: first?.priceVendedor ?? '',
      stock: '0',
    }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    // Validate: pro-only products don't need a client price
    const firstVariant = variants[0]
    if (!form.proOnly && !firstVariant.price) {
      setError('Informe o preço para cliente final, ou marque como Exclusivo Profissional.')
      setLoading(false); return
    }
    if (form.proOnly && !firstVariant.pricePro) {
      setError('Produtos exclusivos profissionais precisam de um Preço Pro.')
      setLoading(false); return
    }

    try {
      // Compute product-level price as the first variant's price (fallback)
      const basePrice = parseFloat(firstVariant.price || firstVariant.pricePro || '0')
      const baseOriginalPrice = firstVariant.originalPrice ? parseFloat(firstVariant.originalPrice) : null
      const body = {
        ...form,
        price: basePrice,
        originalPrice: baseOriginalPrice,
        pricePro: firstVariant.pricePro ? parseFloat(firstVariant.pricePro) : null,
        priceVendedor: firstVariant.priceVendedor ? parseFloat(firstVariant.priceVendedor) : null,
        relatedProducts: relatedProducts.map(p => p.id),
        variants: variants.map(v => ({
          label: v.label,
          price: parseFloat(v.price || firstVariant.pricePro || '0'),
          originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
          pricePro: v.pricePro ? parseFloat(v.pricePro) : null,
          priceVendedor: v.priceVendedor ? parseFloat(v.priceVendedor) : null,
          stock: parseInt(v.stock) || 0,
        })),
        ...(mode === 'edit' && { id: initialData.id }),
      }

      const res = await fetch('/api/admin/products', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setSuccess(true)
      setTimeout(() => router.push('/admin/produtos'), 1200)
    } finally {
      setLoading(false)
    }
  }

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '0.63rem', letterSpacing: '0.15em',
    textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.875rem', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '0.84rem', outline: 'none',
    fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)',
  }
  const priceInp: React.CSSProperties = { ...inp, paddingLeft: '2rem', width: '100%' }
  const priceCol: React.CSSProperties = { position: 'relative', flex: 1, minWidth: 0 }
  const priceSymbol: React.CSSProperties = {
    position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
    fontSize: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none',
  }

  const [showAddLineModal, setShowAddLineModal] = useState(false)
  const [newLineName, setNewLineName] = useState('')
  const [addingLine, setAddingLine] = useState(false)
  const [lineError, setLineError] = useState('')

  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLineName.trim()) return
    setAddingLine(true)
    setLineError('')
    try {
      const res = await fetch('/api/admin/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLineName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLineError(data.error || 'Erro ao criar linha')
        return
      }
      setLines(prev => [...prev, data])
      setForm(f => ({ ...f, lineId: data.id }))
      setNewLineName('')
      setShowAddLineModal(false)
    } catch {
      setLineError('Erro de conexão ao criar linha')
    } finally {
      setAddingLine(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button type="button" onClick={() => router.push('/admin/produtos')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 0.875rem', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Voltar
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)' }}>
            {mode === 'edit' ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {mode === 'edit' ? 'Atualize dados, variantes e preços' : 'Configure preços por perfil de cliente'}
          </p>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#dc2626' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#166534' }}>✓ Produto salvo com sucesso!</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Coluna principal ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Identificação */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Identificação</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Nome do Produto *</label>
                  <input required style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Máscara Nutrição Profissional" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>SKU / Código</label>
                    <input style={inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="MKS-001" />
                  </div>
                  <div>
                    <label style={lbl}>Gramatura / Volume base</label>
                    <input style={inp} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="1L, 500g, 1Kg..." />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>Tipo de Produto</label>
                    <input
                      list="product-types-list"
                      style={inp}
                      value={form.productType}
                      onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                      placeholder="Selecione ou digite um novo tipo..."
                    />
                    <datalist id="product-types-list">
                      {PRODUCT_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ ...lbl, marginBottom: 0 }}>Linha</label>
                      <button
                        type="button"
                        onClick={() => setShowAddLineModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                      >
                        <Plus size={11} /> Criar Linha
                      </button>
                    </div>
                    <select style={inp} value={form.lineId} onChange={e => setForm(f => ({ ...f, lineId: e.target.value }))}>
                      <option value="">Sem linha</option>
                      {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Descrição & Composição</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Descrição *</label>
                  <textarea required style={{ ...inp, minHeight: '90px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do produto para o cliente..." />
                </div>
                <div>
                  <label style={lbl}>Ativos / Ingredientes</label>
                  <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} placeholder="Aqua, queratina hidrolisada, pantenol..." />
                </div>
                <div>
                  <label style={lbl}>Modo de Uso</label>
                  <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={form.howToUse} onChange={e => setForm(f => ({ ...f, howToUse: e.target.value }))} placeholder="Aplique nos fios molhados..." />
                </div>
                <div>
                  <label style={lbl}>Indicação de Uso</label>
                  <input style={inp} value={form.usage} onChange={e => setForm(f => ({ ...f, usage: e.target.value }))} placeholder="Cabelos danificados, pós-química..." />
                </div>
              </div>
            </div>

            {/* Variantes & Preços */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.15rem' }}>Variantes & Preços</h2>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cada tamanho tem seus próprios preços por perfil e opção de promoção (De / Por)</p>
                </div>
                <button type="button" onClick={addVariant}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.875rem', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.7rem', cursor: 'pointer', background: '#fff', color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                  <Plus size={12} /> Variante
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 70px 32px', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--cream)' }}>
                {['Tamanho / Label', 'Preço De (Original)', 'Preço Por (Venda)', 'Preço Pro', 'Preço Vendedor', 'Estoque', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {h}
                    {h === 'Preço Por (Venda)' && form.proOnly && (
                      <span style={{ marginLeft: '0.25rem', color: '#d97706' }}>(opcional)</span>
                    )}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {variants.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr 1fr 70px 32px', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Label */}
                    <input placeholder="500g, 1Kg..." style={inp} value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} />

                    {/* Preço Original (De:) */}
                    <div style={priceCol}>
                      <span style={priceSymbol}>R$</span>
                      <input
                        type="number" step="0.01" placeholder="150,00"
                        style={{ ...priceInp, borderColor: '#fde68a', background: '#fffbeb' }}
                        value={v.originalPrice} onChange={e => updateVariant(i, 'originalPrice', e.target.value)}
                      />
                    </div>

                    {/* Preço Por (Venda) */}
                    <div style={priceCol}>
                      <span style={priceSymbol}>R$</span>
                      <input
                        type="number" step="0.01" placeholder={form.proOnly ? '—' : '99,00'}
                        style={{ ...priceInp, background: form.proOnly ? '#fafafa' : '#fff', opacity: form.proOnly ? 0.5 : 1 }}
                        value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)}
                        disabled={form.proOnly && !v.price}
                      />
                    </div>

                    {/* Preço pro */}
                    <div style={priceCol}>
                      <span style={priceSymbol}>R$</span>
                      <input type="number" step="0.01" placeholder="0,00"
                        style={{ ...priceInp, borderColor: '#e0d4f7', background: '#faf5ff' }}
                        value={v.pricePro} onChange={e => updateVariant(i, 'pricePro', e.target.value)} />
                    </div>

                    {/* Preço vendedor */}
                    <div style={priceCol}>
                      <span style={priceSymbol}>R$</span>
                      <input type="number" step="0.01" placeholder="0,00"
                        style={{ ...priceInp, borderColor: '#d4e4f7', background: '#f0f7ff' }}
                        value={v.priceVendedor} onChange={e => updateVariant(i, 'priceVendedor', e.target.value)} />
                    </div>

                    {/* Estoque */}
                    <input type="number" placeholder="0"
                      style={{ ...inp, textAlign: 'center' }}
                      value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />

                    {/* Remove */}
                    {variants.length > 1 ? (
                      <button type="button" onClick={() => setVariants(vs => vs.filter((_, idx) => idx !== i))}
                        style={{ padding: '0.35rem', background: 'none', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  { color: '#fffbeb', border: '#fde68a', label: 'De (Original) — preço sem desconto para selo De/Por (opcional)' },
                  { color: '#fff', border: 'var(--border)', label: 'Por (Venda) — valor atual praticado para cliente final' },
                  { color: '#faf5ff', border: '#e0d4f7', label: 'Pro — profissionais (cabeleireiras)' },
                  { color: '#f0f7ff', border: '#d4e4f7', label: 'Vendedor — preço de abordagem comercial' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '3px', background: l.color, border: `1px solid ${l.border}`, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Imagens */}
            {mode === 'edit' && initialData?.id ? (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <ImagePlus size={15} style={{ color: 'var(--gold)' }} />
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Imagens do Produto</h2>
                </div>
                <ProductImageManager productId={initialData.id} initialImages={initialData.images ?? []} />
              </div>
            ) : (
              <div style={{ background: 'var(--cream)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImagePlus size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Salve o produto primeiro para adicionar imagens.</p>
              </div>
            )}
          </div>

          {/* ── Coluna lateral ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>

            {/* Info de preços */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Info size={14} style={{ color: 'var(--navy)' }} />
                <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Lógica de Preços</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { tag: 'Cliente Final', desc: 'Preço público. Exibido a todos os visitantes não logados e clientes finais.' },
                  { tag: 'Pro', desc: 'Preço para cabeleireiras/profissionais. Pode ter desconto adicional de campanha (%).' },
                  { tag: 'Vendedor', desc: 'Preço exclusivo para abordagem comercial. Usado no painel Vendas.' },
                ].map(({ tag, desc }) => (
                  <div key={tag} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--navy)' }}>{tag}:</strong> {desc}
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>Configurações</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { key: 'active', label: 'Produto ativo', desc: 'Visível no catálogo' },
                  { key: 'proOnly', label: 'Exclusivo Profissional', desc: 'Oculto para clientes finais' },
                  { key: 'featured', label: 'Produto em destaque', desc: 'Aparece no início' },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <div
                      style={{
                        width: 40, height: 22, borderRadius: '99px', marginTop: '2px', flexShrink: 0,
                        background: (form as any)[key] ? 'var(--navy)' : 'var(--border)', transition: 'background 0.2s', position: 'relative', cursor: 'pointer',
                      }}
                      onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute',
                        top: 3, left: (form as any)[key] ? 21 : 3, transition: 'left 0.2s',
                      }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '0.1rem' }}>{label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Produtos Relacionados (Sugestões) */}
            {mode === 'edit' && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Link2 size={14} style={{ color: 'var(--gold)' }} />
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>Produtos Relacionados</h2>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Aparecerão como sugestão &ldquo;Compre Junto&rdquo; na página individual deste produto.</p>

                <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
                  <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Buscar produto por nome ou SKU..." value={relSearch}
                    onChange={e => setRelSearch(e.target.value)}
                    style={{ ...inp, paddingLeft: '2rem', borderRadius: '99px' }} />
                </div>

                {relLoading && <div style={{ padding: '0.5rem', textAlign: 'center' }}><RefreshCw size={14} style={{ color: 'var(--gold)', animation: 'spin 0.7s linear infinite' }} /></div>}
                {relResults.length > 0 && relSearch && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    {relResults.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setRelatedProducts(prev => [...prev, p]); setRelSearch(''); setRelResults([]) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 32, height: 32, background: 'var(--cream)', borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                          {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 500 }}>{p.name}</span>
                        <Plus size={13} style={{ marginLeft: 'auto', color: 'var(--gold)', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                )}

                {relatedProducts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {relatedProducts.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'var(--cream)', borderRadius: '8px' }}>
                        <div style={{ width: 32, height: 32, background: '#fff', borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                          {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                        </div>
                        <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 500 }}>{p.name}</span>
                        <button type="button" onClick={() => setRelatedProducts(prev => prev.filter(r => r.id !== p.id))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', background: 'var(--cream)', borderRadius: '8px' }}>Nenhum produto relacionado</p>
                )}
              </div>
            )}

            {/* Salvar */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.875rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {loading ? <RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
              {loading ? 'Salvando...' : success ? '✓ Salvo!' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </div>
      </form>

      {showAddLineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.75rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', color: 'var(--navy)', margin: 0 }}>Nova Linha de Produto</h3>
              <button type="button" onClick={() => setShowAddLineModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {lineError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.625rem', fontSize: '0.75rem', color: '#dc2626', marginBottom: '1rem' }}>{lineError}</div>}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Nome da Nova Linha *</label>
              <input
                autoFocus
                style={inp}
                placeholder="Ex: Linha Gold Repair"
                value={newLineName}
                onChange={e => setNewLineName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAddLineModal(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateLine}
                disabled={addingLine || !newLineName.trim()}
                style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '99px', background: 'var(--navy)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: addingLine || !newLineName.trim() ? 'not-allowed' : 'pointer', opacity: addingLine || !newLineName.trim() ? 0.6 : 1 }}
              >
                {addingLine ? 'Salvando...' : 'Salvar e Selecionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
