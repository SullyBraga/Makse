'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, RefreshCw, X, Check, User, CreditCard, Layers, AlertCircle, Edit3, Calendar, Truck, Package, Clock, Filter } from 'lucide-react'
import Image from 'next/image'

type Variant = { id: string; label: string; price: number; priceVendedor: number | null; stock: number }
type Product = { id: string; name: string; sku: string | null; price: number; pricePro: number | null; priceVendedor: number | null; proOnly: boolean; images: string[]; variants: Variant[] }
type Kit = { id: string; name: string; sku: string | null; price: number; priceVendedor: number | null; images: string[] }
type CartItem = { productId?: string; kitId?: string; variantId: string | null; name: string; variantLabel: string; price: number; image: string; quantity: number; proOnly?: boolean; isKit?: boolean }

type UserResult = {
  id: string; name: string; email: string; role: string
  professionalReq?: { phone: string; cnpj?: string | null; salonAddress?: string | null } | null
  addresses?: {
    id: string
    street: string
    number: string
    complement: string | null
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }[]
}

type SaleOrder = {
  id: string
  createdAt: string
  total: number
  status: string
  deliveryStatus: string | null
  deliveryDate: string | null
  paymentMethod: string | null
  sellerNote: string | null
  customerName: string | null
  customerCpf: string | null
  customerPhone: string | null
  customerAddress: string | null
  user?: { name: string; email: string }
  seller?: { name: string }
  items: {
    id: string
    quantity: number
    unitPrice: number
    productId: string | null
    kitId: string | null
    variantId: string | null
    product?: { id: string; name: string; images: string[]; price: number }
    kit?: { id: string; name: string; images: string[]; price: number }
    variant?: { id: string; label: string; price: number }
  }[]
}

const PAYMENTS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'OUTRO', label: 'Outro' },
]

const PAYMENT_STATUSES = [
  { value: 'PAGO', label: 'Pago', bg: '#dcfce7', color: '#166534' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento', bg: '#ffedd5', color: '#c2410c' },
  { value: 'CANCELADO', label: 'Cancelado', bg: '#fee2e2', color: '#dc2626' },
]

const DELIVERY_STATUSES = [
  { value: 'PENDENTE', label: 'Entrega Pendente', bg: '#fef3c7', color: '#b45309' },
  { value: 'EM_SEPARACAO', label: 'Em Separação', bg: '#fef9c3', color: '#a16207' },
  { value: 'ENVIADO', label: 'Enviado', bg: '#dbeafe', color: '#1e40af' },
  { value: 'ENTREGUE', label: 'Entregue', bg: '#f3f4f6', color: '#4b5563' },
  { value: 'CANCELADO', label: 'Cancelado', bg: '#fee2e2', color: '#dc2626' },
]

export default function VendasPage() {
  const [mainTab, setMainTab] = useState<'nova' | 'lista'>('nova')

  // Search & Cart states for New Sale
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loadingProds, setLoadingProds] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<UserResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<UserResult | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerCpf, setCustomerCpf] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [status, setStatus] = useState('PAGO')
  const [deliveryStatus, setDeliveryStatus] = useState('PENDENTE')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Sales Listing states
  const [sales, setSales] = useState<SaleOrder[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [salesFilterSearch, setSalesFilterSearch] = useState('')

  // Edit Sale Modal states
  const [editingSale, setEditingSale] = useState<SaleOrder | null>(null)
  const [editCart, setEditCart] = useState<CartItem[]>([])
  const [editCustomerName, setEditCustomerName] = useState('')
  const [editCustomerCpf, setEditCustomerCpf] = useState('')
  const [editCustomerPhone, setEditCustomerPhone] = useState('')
  const [editCustomerAddress, setEditCustomerAddress] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('PIX')
  const [editStatus, setEditStatus] = useState('PAGO')
  const [editDeliveryStatus, setEditDeliveryStatus] = useState('PENDENTE')
  const [editDeliveryDate, setEditDeliveryDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editSearch, setEditSearch] = useState('')
  const [editProds, setEditProds] = useState<Product[]>([])
  const [editKits, setEditKits] = useState<Kit[]>([])
  const [loadingEditProds, setLoadingEditProds] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchSales = useCallback(async () => {
    setLoadingSales(true)
    try {
      const res = await fetch('/api/admin/sales')
      if (res.ok) {
        const data = await res.json()
        setSales(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSales(false)
    }
  }, [])

  useEffect(() => {
    if (mainTab === 'lista') {
      fetchSales()
    }
  }, [mainTab, fetchSales])

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); setKits([]); return }
    setLoadingProds(true)
    const [pr, kr] = await Promise.all([
      fetch(`/api/admin/products?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/admin/kits?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
    ])
    setProducts(pr)
    setKits(kr)
    setLoadingProds(false)
  }, [])

  useEffect(() => { const t = setTimeout(() => searchProducts(search), 300); return () => clearTimeout(t) }, [search, searchProducts])

  const searchEditProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setEditProds([]); setEditKits([]); return }
    setLoadingEditProds(true)
    const [pr, kr] = await Promise.all([
      fetch(`/api/admin/products?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/admin/kits?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
    ])
    setEditProds(pr)
    setEditKits(kr)
    setLoadingEditProds(false)
  }, [])

  useEffect(() => { const t = setTimeout(() => searchEditProducts(editSearch), 300); return () => clearTimeout(t) }, [editSearch, searchEditProducts])

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return }
    const r = await fetch(`/api/admin/users-list?search=${encodeURIComponent(q)}`)
    if (r.ok) setCustomerResults(await r.json())
  }, [])

  useEffect(() => { const t = setTimeout(() => searchCustomers(customerSearch), 300); return () => clearTimeout(t) }, [customerSearch, searchCustomers])

  const addProduct = (product: Product, variant: Variant) => {
    const price = variant.priceVendedor ?? product.priceVendedor ?? variant.price
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id && i.variantId === variant.id)
      if (ex) return prev.map(i => i.productId === product.id && i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, variantId: variant.id, name: product.name, variantLabel: variant.label, price, image: product.images[0] || '', quantity: 1, proOnly: product.proOnly }]
    })
    setSearch(''); setProducts([]); setKits([])
  }

  const addKit = (kit: Kit) => {
    const price = kit.priceVendedor ?? kit.price
    setCart(prev => {
      const ex = prev.find(i => i.kitId === kit.id)
      if (ex) return prev.map(i => i.kitId === kit.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { kitId: kit.id, variantId: null, name: kit.name, variantLabel: 'Kit', price, image: kit.images[0] || '', quantity: 1, isKit: true }]
    })
    setSearch(''); setProducts([]); setKits([])
  }

  const addEditProduct = (product: Product, variant: Variant) => {
    const price = variant.priceVendedor ?? product.priceVendedor ?? variant.price
    setEditCart(prev => {
      const ex = prev.find(i => i.productId === product.id && i.variantId === variant.id)
      if (ex) return prev.map(i => i.productId === product.id && i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, variantId: variant.id, name: product.name, variantLabel: variant.label, price, image: product.images[0] || '', quantity: 1, proOnly: product.proOnly }]
    })
    setEditSearch(''); setEditProds([]); setEditKits([])
  }

  const addEditKit = (kit: Kit) => {
    const price = kit.priceVendedor ?? kit.price
    setEditCart(prev => {
      const ex = prev.find(i => i.kitId === kit.id)
      if (ex) return prev.map(i => i.kitId === kit.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { kitId: kit.id, variantId: null, name: kit.name, variantLabel: 'Kit', price, image: kit.images[0] || '', quantity: 1, isKit: true }]
    })
    setEditSearch(''); setEditProds([]); setEditKits([])
  }

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter((_, i) => i !== idx))
    else setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }

  const updateEditQty = (idx: number, qty: number) => {
    if (qty <= 0) setEditCart(prev => prev.filter((_, i) => i !== idx))
    else setEditCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }

  const updatePrice = (idx: number, price: number) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, price } : item))
  }

  const updateEditPrice = (idx: number, price: number) => {
    setEditCart(prev => prev.map((item, i) => i === idx ? { ...item, price } : item))
  }

  const formatAddress = (addr: any) => {
    if (!addr) return ''
    return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.city} - ${addr.state}, CEP ${addr.zipCode}`
  }

  const handleSelectCustomer = (u: UserResult) => {
    setSelectedCustomer(u)
    setCustomerSearch('')
    setCustomerResults([])
    setCustomerName(u.name)
    setCustomerPhone(u.professionalReq?.phone || '')
    setCustomerCpf(u.professionalReq?.cnpj || '')
    const addresses = u.addresses || []
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
    if (defaultAddr) setCustomerAddress(formatAddress(defaultAddr))
    else setCustomerAddress('')
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const editTotal = editCart.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSell = async () => {
    if (!selectedCustomer && !customerName.trim()) { setError('Informe o cliente'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer ? selectedCustomer.name : customerName.trim(),
        customerCpf: customerCpf.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        paymentMethod,
        status,
        deliveryStatus,
        deliveryDate: deliveryDate || null,
        note: note || null,
        items: cart.map(i => ({ productId: i.productId || null, kitId: i.kitId || null, variantId: i.variantId, quantity: i.quantity, unitPrice: i.price })),
      }),
    })
    if (res.ok) {
      setSuccess(true); setCart([]); setSelectedCustomer(null)
      setCustomerName(''); setCustomerCpf(''); setCustomerPhone(''); setCustomerAddress(''); setNote('')
      setTimeout(() => { setSuccess(false); setStep('cart'); setMainTab('lista') }, 1500)
    } else {
      const d = await res.json(); setError(d.error || 'Erro ao registrar venda')
    }
    setSaving(false)
  }

  const openEditModal = (sale: SaleOrder) => {
    setEditingSale(sale)
    setEditCustomerName(sale.customerName || sale.user?.name || '')
    setEditCustomerCpf(sale.customerCpf || '')
    setEditCustomerPhone(sale.customerPhone || '')
    setEditCustomerAddress(sale.customerAddress || '')
    setEditPaymentMethod(sale.paymentMethod || 'PIX')
    setEditStatus(sale.status || 'PAGO')
    setEditDeliveryStatus(sale.deliveryStatus || 'PENDENTE')
    setEditDeliveryDate(sale.deliveryDate ? new Date(sale.deliveryDate).toISOString().split('T')[0] : '')
    setEditNote(sale.sellerNote || '')

    const initialEditCart: CartItem[] = sale.items.map(item => {
      const name = item.product?.name || item.kit?.name || 'Item'
      const variantLabel = item.variant?.label || (item.kit ? 'Kit' : '')
      const image = item.product?.images?.[0] || item.kit?.images?.[0] || ''
      return {
        productId: item.productId || undefined,
        kitId: item.kitId || undefined,
        variantId: item.variantId || null,
        name,
        variantLabel,
        price: item.unitPrice,
        image,
        quantity: item.quantity,
        isKit: !!item.kitId,
      }
    })
    setEditCart(initialEditCart)
  }

  const handleSaveEdit = async () => {
    if (!editingSale) return
    if (!editCustomerName.trim()) { alert('Informe o nome do cliente'); return }
    if (editCart.length === 0) { alert('A venda precisa ter ao menos 1 item'); return }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editCustomerName.trim(),
          customerCpf: editCustomerCpf.trim() || null,
          customerPhone: editCustomerPhone.trim() || null,
          customerAddress: editCustomerAddress.trim() || null,
          paymentMethod: editPaymentMethod,
          status: editStatus,
          deliveryStatus: editDeliveryStatus,
          deliveryDate: editDeliveryDate || null,
          note: editNote.trim() || null,
          items: editCart.map(i => ({
            productId: i.productId || null,
            kitId: i.kitId || null,
            variantId: i.variantId || null,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar venda')

      alert('Venda atualizada com sucesso!')
      setEditingSale(null)
      fetchSales()
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar venda')
    } finally {
      setSavingEdit(false)
    }
  }

  const s = { width: '100%', padding: '0.6rem 0.875rem', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.84rem', outline: 'none', fontFamily: 'var(--font-dm-sans), sans-serif', background: '#fff', color: 'var(--navy)' } as const
  const lbl = { fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }

  if (success) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={36} style={{ color: '#16a34a' }} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' }}>Venda registrada com sucesso!</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Redirecionando para a lista de vendas...</p>
      </div>
    </div>
  )

  const hasResults = products.length > 0 || kits.length > 0
  const hasEditResults = editProds.length > 0 || editKits.length > 0

  const filteredSales = sales.filter(sale => {
    if (!salesFilterSearch.trim()) return true
    const q = salesFilterSearch.toLowerCase()
    const idMatch = sale.id.toLowerCase().includes(q)
    const nameMatch = (sale.customerName || sale.user?.name || '').toLowerCase().includes(q)
    const pmMatch = (sale.paymentMethod || '').toLowerCase().includes(q)
    return idMatch || nameMatch || pmMatch
  })

  return (
    <div>
      {/* Top Title & Main Nav Tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.2rem' }}>
            Painel de Vendas
          </h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>
            Registre novas vendas comerciais ou gerencie suas vendas ativas
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--border)', borderRadius: '99px', padding: '4px' }}>
          <button
            onClick={() => setMainTab('nova')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '99px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: mainTab === 'nova' ? 'var(--navy)' : 'transparent',
              color: mainTab === 'nova' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={14} /> Registrar Venda
          </button>
          <button
            onClick={() => setMainTab('lista')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '99px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: mainTab === 'lista' ? 'var(--navy)' : 'transparent',
              color: mainTab === 'lista' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingCart size={14} /> Minhas Vendas ({sales.length})
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>{error}</div>}

      {/* TAB 1: REGISTRAR NOVA VENDA */}
      {mainTab === 'nova' && (
        <div className="vendas-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Product + Kit search */}
            {step === 'cart' && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1rem' }}>Adicionar Produtos ou Kits</h2>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ ...s, paddingLeft: '2.25rem', borderRadius: '99px' }} />
                </div>
                {(hasResults || loadingProds) && search && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', maxHeight: '360px', overflowY: 'auto' }}>
                    {loadingProds ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}><RefreshCw size={16} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} /></div>
                    ) : (
                      <>
                        {products.map(prod => prod.variants.map(variant => (
                          <button key={`${prod.id}-${variant.id}`} onClick={() => addProduct(prod, variant)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ width: 40, height: 40, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {prod.images[0] ? <Image src={prod.images[0]} alt={prod.name} fill style={{ objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{prod.name} — {variant.label}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Estoque: {variant.stock} · R$ {(variant.priceVendedor ?? prod.priceVendedor ?? variant.price).toFixed(2).replace('.', ',')}
                                {prod.proOnly && <span style={{ marginLeft: '0.4rem', background: '#7c3aed', color: '#fff', fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>PRO</span>}
                              </p>
                            </div>
                            <Plus size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          </button>
                        )))}
                        {kits.map(kit => (
                          <button key={kit.id} onClick={() => addKit(kit)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                            <div style={{ width: 40, height: 40, background: '#f5f3ff', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {kit.images[0] ? <Image src={kit.images[0]} alt={kit.name} fill style={{ objectFit: 'cover' }} /> : <Layers size={18} style={{ color: '#7c3aed', margin: 'auto' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{kit.name}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700, marginRight: '0.4rem' }}>KIT</span>
                                R$ {(kit.priceVendedor ?? kit.price).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <Plus size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer & Payment & Delivery */}
            {step === 'checkout' && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)' }}>Dados da Venda</h2>

                <div>
                  <label style={lbl}>Cliente</label>
                  {selectedCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--cream)', borderRadius: '10px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} style={{ color: 'var(--navy)' }} />
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)' }}>{selectedCustomer.name}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedCustomer.email} · {selectedCustomer.role}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedCustomer(null); setCustomerName(''); setCustomerCpf(''); setCustomerPhone(''); setCustomerAddress('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Buscar usuário cadastrado (opcional)..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} style={{ ...s, paddingLeft: '2rem' }} />
                      </div>
                      {customerResults.length > 0 && (
                        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          {customerResults.map(u => (
                            <button key={u.id} onClick={() => handleSelectCustomer(u)}
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
                    </>
                  )}

                  {/* Customer details fields */}
                  <div style={{ background: 'var(--cream)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {!selectedCustomer && (
                      <div>
                        <label style={lbl}>Nome *</label>
                        <input style={s} placeholder="Nome completo" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={lbl}>CPF / CNPJ</label>
                        <input style={s} placeholder="000.000.000-00" value={customerCpf} onChange={e => setCustomerCpf(e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Telefone</label>
                        <input style={s} placeholder="(00) 00000-0000" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                      </div>
                    </div>
                    {selectedCustomer && selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={lbl}>Selecionar Endereço Salvo</label>
                        <select
                          style={s}
                          onChange={e => {
                            const idx = parseInt(e.target.value)
                            if (idx >= 0 && selectedCustomer.addresses) {
                              setCustomerAddress(formatAddress(selectedCustomer.addresses[idx]))
                            }
                          }}
                          defaultValue={
                            (() => {
                              const defIdx = selectedCustomer.addresses.findIndex(a => a.isDefault)
                              return defIdx >= 0 ? defIdx : 0
                            })()
                          }
                        >
                          {selectedCustomer.addresses.map((addr, idx) => (
                            <option key={addr.id} value={idx}>
                              {addr.isDefault ? '[Padrão] ' : ''}{addr.street}, {addr.number} ({addr.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={lbl}>Endereço</label>
                      <input style={s} placeholder="Rua, número, bairro, cidade" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Pagamento e Entrega */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={lbl}>Forma de Pagamento</label>
                      <select style={s} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                        {PAYMENTS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Status do Pagamento</label>
                      <select style={s} value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="PAGO">Pago (Confirmado)</option>
                        <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={lbl}>Status da Entrega</label>
                      <select style={s} value={deliveryStatus} onChange={e => setDeliveryStatus(e.target.value)}>
                        {DELIVERY_STATUSES.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Data Prevista da Entrega (Opcional)</label>
                      <input type="date" style={s} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Observações / Anotações Internas</label>
                  <textarea style={{ ...s, minHeight: '60px', resize: 'vertical' }} placeholder="Anotações..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          <div className="cart-sidebar-container" style={{ position: 'sticky', top: '1.5rem' }}>
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
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 40, height: 40, background: item.isKit ? '#f5f3ff' : 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        {item.image ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} /> : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{item.name}</p>
                          {item.proOnly && (
                            <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0 }}>
                              <AlertCircle size={8} /> PRO
                            </span>
                          )}
                          {item.isKit && (
                            <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>KIT</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.variantLabel ? `${item.variantLabel} · ` : ''}R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={e => {
                              const val = parseFloat(e.target.value)
                              updatePrice(idx, isNaN(val) ? 0 : val)
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
                        <button onClick={() => updateQty(idx, item.quantity - 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Minus size={10} /></button>
                        <span style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', fontWeight: 500, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Plus size={10} /></button>
                      </div>
                      <button onClick={() => updateQty(idx, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--navy)' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {step === 'cart' ? (
                    <button onClick={() => setStep('checkout')} style={{ width: '100%', padding: '0.75rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
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
      )}

      {/* TAB 2: MINHAS VENDAS (LISTA DE VENDAS REGISTRADAS COM EDIÇÃO) */}
      {mainTab === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Controls */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por cliente, pedido ou pagamento..."
                value={salesFilterSearch}
                onChange={e => setSalesFilterSearch(e.target.value)}
                style={{ ...s, paddingLeft: '2.25rem', borderRadius: '99px' }}
              />
            </div>
            <button
              onClick={fetchSales}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--navy)' }}
            >
              <RefreshCw size={13} style={{ animation: loadingSales ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
            </button>
          </div>

          {/* Sales List */}
          {loadingSales ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={24} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '4rem 1.5rem', textAlign: 'center' }}>
              <ShoppingCart size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {salesFilterSearch ? 'Nenhuma venda encontrada para esta busca' : 'Nenhuma venda registrada até o momento.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSales.map(sale => {
                const paySt = PAYMENT_STATUSES.find(p => p.value === sale.status) || { label: sale.status, bg: '#f3f4f6', color: '#4b5563' }
                const delSt = DELIVERY_STATUSES.find(d => d.value === sale.deliveryStatus) || { label: sale.deliveryStatus || 'Pendente', bg: '#fef3c7', color: '#b45309' }

                return (
                  <div key={sale.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: '#fff', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          #{sale.id.slice(-8).toUpperCase()}
                        </span>
                        
                        {/* Status Pagamento */}
                        <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.65rem', borderRadius: '99px', background: paySt.bg, color: paySt.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                          Pagamento: {paySt.label}
                        </span>

                        {/* Status Entrega */}
                        <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.65rem', borderRadius: '99px', background: delSt.bg, color: delSt.color, fontWeight: 700, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Truck size={10} /> Entrega: {delSt.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)' }}>
                          R$ {sale.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Details Body */}
                    <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                      
                      {/* Cliente */}
                      <div>
                        <p style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={10} /> Cliente
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                          {sale.customerName || sale.user?.name || 'Cliente Geral'}
                        </p>
                        {sale.customerCpf && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>CPF/CNPJ: {sale.customerCpf}</p>}
                        {sale.customerPhone && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>Tel: {sale.customerPhone}</p>}
                        {sale.customerAddress && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0', lineHeight: 1.4 }}>{sale.customerAddress}</p>}
                      </div>

                      {/* Pagamento e Entrega */}
                      <div>
                        <p style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CreditCard size={10} /> Pagamento & Entrega
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--navy)', margin: 0 }}>
                          Meio: <strong>{sale.paymentMethod || 'Outro'}</strong>
                        </p>
                        {sale.seller && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                            Vendedor: {sale.seller.name}
                          </p>
                        )}
                        {sale.deliveryDate && (
                          <p style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={11} /> Entrega Agendada: {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {sale.sellerNote && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.35rem 0 0' }}>
                            "{sale.sellerNote}"
                          </p>
                        )}
                      </div>

                      {/* Itens */}
                      <div>
                        <p style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                          Itens ({sale.items?.length || 0})
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                          {sale.items?.map(item => {
                            const name = item.product?.name || item.kit?.name || 'Item'
                            const varLabel = item.variant?.label ? ` (${item.variant.label})` : ''
                            return (
                              <div key={item.id} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--navy)' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                  {item.quantity}x {name}{varLabel}
                                </span>
                                <span style={{ fontWeight: 600, marginLeft: '0.5rem' }}>
                                  R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Actions Footer */}
                    <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#fff' }}>
                      <button
                        onClick={() => openEditModal(sale)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.55rem 1.25rem',
                          background: 'var(--navy)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '99px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(13,27,42,0.15)',
                        }}
                      >
                        <Edit3 size={13} /> Editar Venda
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE VENDA */}
      {editingSale && (
        <div
          onClick={() => !savingEdit && setEditingSale(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 27, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  Editar Venda #{editingSale.id.slice(-8).toUpperCase()}
                </span>
                <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--navy)', margin: '0.2rem 0 0' }}>
                  Editar Detalhes & Itens da Venda
                </h2>
              </div>
              <button
                onClick={() => !savingEdit && setEditingSale(null)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer Details Form */}
            <div style={{ background: 'var(--cream)', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Dados do Cliente</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Nome do Cliente *</label>
                  <input style={s} value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>CPF / CNPJ</label>
                  <input style={s} value={editCustomerCpf} onChange={e => setEditCustomerCpf(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Telefone</label>
                  <input style={s} value={editCustomerPhone} onChange={e => setEditCustomerPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Endereço de Entrega</label>
                <input style={s} value={editCustomerAddress} onChange={e => setEditCustomerAddress(e.target.value)} />
              </div>
            </div>

            {/* Payment & Delivery Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Forma Pagamento</label>
                <select style={s} value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)}>
                  {PAYMENTS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Status Pagamento</label>
                <select style={s} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  {PAYMENT_STATUSES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Status Entrega</label>
                <select style={s} value={editDeliveryStatus} onChange={e => setEditDeliveryStatus(e.target.value)}>
                  {DELIVERY_STATUSES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Data Prevista Entrega</label>
                <input type="date" style={s} value={editDeliveryDate} onChange={e => setEditDeliveryDate(e.target.value)} />
              </div>
            </div>

            {/* Add Products to Edit Cart */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>
                Adicionar mais produtos / kits nesta venda
              </h3>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar produtos ou kits para adicionar..."
                  value={editSearch}
                  onChange={e => setEditSearch(e.target.value)}
                  style={{ ...s, paddingLeft: '2.25rem', borderRadius: '99px' }}
                />
              </div>

              {(hasEditResults || loadingEditProds) && editSearch && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {loadingEditProds ? (
                    <div style={{ padding: '1rem', textAlign: 'center' }}><RefreshCw size={16} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} /></div>
                  ) : (
                    <>
                      {editProds.map(prod => prod.variants.map(variant => (
                        <button key={`${prod.id}-${variant.id}`} onClick={() => addEditProduct(prod, variant)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>{prod.name} — {variant.label}</p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                              Estoque: {variant.stock} · R$ {(variant.priceVendedor ?? prod.priceVendedor ?? variant.price).toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <Plus size={15} style={{ color: 'var(--gold)' }} />
                        </button>
                      )))}
                      {editKits.map(kit => (
                        <button key={kit.id} onClick={() => addEditKit(kit)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>[KIT] {kit.name}</p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                              R$ {(kit.priceVendedor ?? kit.price).toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <Plus size={15} style={{ color: '#7c3aed' }} />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Current Edit Cart Items */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>
                Itens da Venda ({editCart.length})
              </h3>
              <div style={{ border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                {editCart.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderBottom: idx < editCart.length - 1 ? '1px solid var(--border)' : 'none',
                      background: '#fff',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                        {item.name} {item.variantLabel ? `(${item.variantLabel})` : ''}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Preço unitário: R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={e => updateEditPrice(idx, parseFloat(e.target.value) || 0)}
                          style={{ width: '80px', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => updateEditQty(idx, item.quantity - 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Minus size={11} /></button>
                        <span style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 600, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{item.quantity}</span>
                        <button onClick={() => updateEditQty(idx, item.quantity + 1)} style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}><Plus size={11} /></button>
                      </div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)', width: '90px', textAlign: 'right', margin: 0 }}>
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </p>
                      <button onClick={() => updateEditQty(idx, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note & Total */}
            <div>
              <label style={lbl}>Observação</label>
              <textarea style={{ ...s, minHeight: '60px', resize: 'vertical' }} value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Anotações internas..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Novo Total da Venda</span>
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy)' }}>
                  R$ {editTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingSale(null)}
                  className="btn-outline"
                  style={{ fontSize: '0.78rem', padding: '0.65rem 1.25rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.65rem 1.5rem',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '99px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    opacity: savingEdit ? 0.7 : 1,
                  }}
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .vendas-layout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .vendas-layout-grid {
            grid-template-columns: 1fr;
          }
          .cart-sidebar-container {
            position: static !important;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
