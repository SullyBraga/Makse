'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, RefreshCw, X, Check, User, CreditCard } from 'lucide-react'
import Image from 'next/image'

type Product = {
  id: string; name: string; sku: string | null; price: number
  pricePro: number | null; priceVendedor: number | null; images: string[]
  variants: { id: string; label: string; price: number; priceVendedor: number | null; stock: number }[]
}

type CartItem = {
  productId: string; variantId: string | null; name: string; variantLabel: string
  price: number; image: string; quantity: number
}

type UserResult = { id: string; name: string; email: string; role: string }

const PAYMENT_METHODS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDITO', label: 'Cartão de Crédito' },
  { value: 'DEBITO', label: 'Cartão de Débito' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function VendasPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loadingProds, setLoadingProds] = useState(false)

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<UserResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<UserResult | null>(null)
  const [customerName, setCustomerName] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [note, setNote] = useState('')

  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return }
    setLoadingProds(true)
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}`)
    if (res.ok) setProducts(await res.json())
    setLoadingProds(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search, searchProducts])

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return }
    const res = await fetch(`/api/admin/users-list?search=${encodeURIComponent(q)}`)
    if (res.ok) setCustomerResults(await res.json())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300)
    return () => clearTimeout(t)
  }, [customerSearch, searchCustomers])

  const addToCart = (product: Product, variant: Product['variants'][0]) => {
    const key = `${product.id}-${variant.id}`
    const price = variant.priceVendedor ?? product.priceVendedor ?? variant.price
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id && i.variantId === variant.id)
      if (existing) return prev.map(i => i.productId === product.id && i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, variantId: variant.id, name: product.name, variantLabel: variant.label, price, image: product.images[0] || '', quantity: 1 }]
    })
    setSearch(''); setProducts([])
  }

  const updateQty = (productId: string, variantId: string | null, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)))
    else setCart(prev => prev.map(i => i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i))
  }

  const updatePrice = (productId: string, variantId: string | null, price: number) => {
    setCart(prev => prev.map(i => i.productId === productId && i.variantId === variantId ? { ...i, price } : i))
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSell = async () => {
    if (!selectedCustomer && !customerName.trim()) { setError('Informe o cliente'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: selectedCustomer?.id || null,
        customerName: !selectedCustomer ? customerName.trim() : null,
        paymentMethod,
        note: note || null,
        items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, unitPrice: i.price })),
      }),
    })
    if (res.ok) {
      setSuccess(true); setCart([]); setSelectedCustomer(null); setCustomerName('')
      setTimeout(() => { setSuccess(false); setStep('cart') }, 3000)
    } else {
      const d = await res.json(); setError(d.error || 'Erro ao registrar venda')
    }
    setSaving(false)
  }

  const inp = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' } as const
  const lbl = { fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }

  if (success) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={36} style={{ color: '#16a34a' }} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' }}>Venda registrada!</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>O pedido foi criado como pago e o estoque foi atualizado.</p>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>Registrar Venda</h1>
        <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>Adicione produtos e selecione o cliente para registrar uma venda direta</p>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Product search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {step === 'cart' && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1rem' }}>Adicionar Produtos</h2>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: '2.25rem', borderRadius: '99px' }} />
              </div>
              {(products.length > 0 || loadingProds) && search && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  {loadingProds ? (
                    <div style={{ padding: '1rem', textAlign: 'center' }}><RefreshCw size={16} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} /></div>
                  ) : products.map(prod =>
                    prod.variants.map(variant => (
                      <button key={`${prod.id}-${variant.id}`} onClick={() => addToCart(prod, variant)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 40, height: 40, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          {prod.images[0] ? <Image src={prod.images[0]} alt={prod.name} fill style={{ objectFit: 'cover' }} /> : null}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{prod.name} — {variant.label}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Estoque: {variant.stock} · Preço vendedor: R$ {(variant.priceVendedor ?? prod.priceVendedor ?? variant.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <Plus size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer & payment (step checkout) */}
          {step === 'checkout' && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)' }}>Dados da Venda</h2>

              {/* Customer search */}
              <div>
                <label style={lbl}>Cliente</label>
                {selectedCustomer ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--cream)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: 'var(--navy)' }} />
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{selectedCustomer.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                      <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" placeholder="Buscar usuário cadastrado..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                        style={{ ...inp, paddingLeft: '2rem' }} />
                    </div>
                    {customerResults.length > 0 && (
                      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        {customerResults.map(u => (
                          <button key={u.id} onClick={() => { setSelectedCustomer(u); setCustomerSearch(''); setCustomerResults([]) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                            <User size={13} style={{ color: 'var(--text-muted)' }} />
                            <div>
                              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)' }}>{u.name}</p>
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{u.email} · {u.role}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <label style={{ ...lbl, marginTop: '0.25rem' }}>Ou informar nome avulso</label>
                    <input type="text" placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} style={inp} />
                  </>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label style={lbl}>Meio de Pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                      style={{ padding: '0.5rem', border: `1px solid ${paymentMethod === m.value ? 'var(--navy)' : 'var(--border)'}`, borderRadius: '8px', background: paymentMethod === m.value ? 'var(--navy)' : '#fff', color: paymentMethod === m.value ? '#fff' : 'var(--navy)', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <CreditCard size={11} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={lbl}>Observação (opcional)</label>
                <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }} placeholder="Anotações sobre a venda..." value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.375rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={14} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)' }}>Carrinho ({cart.length})</h2>
            </div>

            {cart.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <ShoppingCart size={28} style={{ color: 'var(--border)', margin: '0 auto 0.75rem', display: 'block' }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Nenhum produto adicionado</p>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cart.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 40, height: 40, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {item.image ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.variantLabel ? `${item.variantLabel} · ` : ''}R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            updatePrice(item.productId, item.variantId, isNaN(val) ? 0 : val)
                          }}
                          style={{
                            width: '64px',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0.15rem 0.35rem',
                            fontSize: '0.68rem',
                            color: 'var(--navy)',
                            outline: 'none',
                            fontFamily: 'var(--font-dm-sans), sans-serif',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                      <button onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Minus size={10} /></button>
                      <span style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', fontWeight: 500, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Plus size={10} /></button>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter(i => !(i.productId === item.productId && i.variantId === item.variantId)))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--navy)' }}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {step === 'cart' ? (
                  <button onClick={() => setStep('checkout')}
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                    Prosseguir →
                  </button>
                ) : (
                  <>
                    <button onClick={handleSell} disabled={saving}
                      style={{ width: '100%', padding: '0.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}>
                      {saving ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Registrando...</> : <><Check size={14} /> Confirmar Venda</>}
                    </button>
                    <button onClick={() => setStep('cart')} style={{ width: '100%', padding: '0.625rem', background: 'none', color: 'var(--text-muted)', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}>
                      ← Voltar ao carrinho
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
