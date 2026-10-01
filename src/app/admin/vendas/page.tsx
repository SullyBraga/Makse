'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, RefreshCw, X, Check, User, CreditCard, Layers, AlertCircle, Edit3, Calendar, Truck, Package, Clock, Filter, CheckCircle2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import EditOrderModal, { EditOrderTarget } from '@/components/admin/EditOrderModal'

type Variant = { id: string; label: string; price: number; pricePro?: number | null; priceVendedor: number | null; stock: number }
type Product = { id: string; name: string; sku: string | null; price: number; pricePro: number | null; priceVendedor: number | null; proOnly: boolean; images: string[]; variants: Variant[] }
type Kit = { id: string; name: string; sku: string | null; price: number; pricePro?: number | null; priceVendedor: number | null; images: string[] }

type UserResult = {
  id: string
  name: string
  email: string
  role: string
  discountTable?: {
    id: string
    name: string
    percentage: number
  } | null
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

type CartItem = {
  productId?: string
  kitId?: string
  variantId: string | null
  name: string
  variantLabel: string
  price: number
  basePrice: number
  image: string
  quantity: number
  proOnly?: boolean
  isKit?: boolean
  rawProduct?: Product
  rawVariant?: Variant
  rawKit?: Kit
}

type SaleOrder = {
  id: string
  createdAt: string
  total: number
  status: string
  deliveryStatus: string | null
  deliveryDate: string | null
  stockDeducted?: boolean | null
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
    product?: { id: string; name: string; images: string[]; price: number; priceVendedor?: number | null; pricePro?: number | null }
    kit?: { id: string; name: string; images: string[]; price: number; priceVendedor?: number | null; pricePro?: number | null }
    variant?: { id: string; label: string; price: number; priceVendedor?: number | null; pricePro?: number | null }
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
  { value: 'PAGO', label: 'Pago (Confirmado)', bg: '#dcfce7', color: '#166534' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento', bg: '#ffedd5', color: '#c2410c' },
  { value: 'CANCELADO', label: 'Cancelado', bg: '#fee2e2', color: '#dc2626' },
]

const DELIVERY_STATUSES = [
  { value: 'PENDENTE', label: 'Entrega Pendente', bg: '#fef3c7', color: '#b45309' },
  { value: 'PRE_VENDA', label: 'Pré-Venda (Aguardando Estoque)', bg: '#ede9fe', color: '#6d28d9' },
  { value: 'EM_SEPARACAO', label: 'Em Separação', bg: '#fef9c3', color: '#a16207' },
  { value: 'ENVIADO', label: 'Enviado', bg: '#dbeafe', color: '#1e40af' },
  { value: 'ENTREGUE', label: 'Entregue', bg: '#f3f4f6', color: '#4b5563' },
  { value: 'CANCELADO', label: 'Cancelado', bg: '#fee2e2', color: '#dc2626' },
]

// Função de cálculo de preço baseada no cliente e tabela de desconto
function computeProductPrice(
  prod: { price: number; pricePro?: number | null; priceVendedor?: number | null },
  variant?: { price: number; pricePro?: number | null; priceVendedor?: number | null } | null,
  customer?: UserResult | null
) {
  const role = customer?.role
  let base = variant?.price ?? prod.price

  if (role === 'CABELEIREIRA' || role === 'ADMIN') {
    // Para cabeleireira / parceiro de salão, o valor base é o preço profissional (pricePro), ou priceVendedor/price
    base = variant?.pricePro ?? prod.pricePro ?? variant?.priceVendedor ?? prod.priceVendedor ?? variant?.price ?? prod.price
  } else if (role === 'VENDEDOR') {
    base = variant?.priceVendedor ?? prod.priceVendedor ?? variant?.price ?? prod.price
  } else {
    // Preço do vendedor por padrão ou preço de tabela
    base = variant?.priceVendedor ?? prod.priceVendedor ?? variant?.price ?? prod.price
  }

  const discountPct = customer?.discountTable?.percentage ?? 0
  let finalPrice = base
  if (discountPct > 0) {
    finalPrice = base * (1 - discountPct / 100)
  }

  return {
    basePrice: base,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountPct,
  }
}

function computeKitPrice(
  kit: { price: number; pricePro?: number | null; priceVendedor?: number | null },
  customer?: UserResult | null
) {
  const role = customer?.role
  let base = kit.price

  if (role === 'CABELEIREIRA' || role === 'ADMIN') {
    base = kit.pricePro ?? kit.priceVendedor ?? kit.price
  } else {
    base = kit.priceVendedor ?? kit.price
  }

  const discountPct = customer?.discountTable?.percentage ?? 0
  let finalPrice = base
  if (discountPct > 0) {
    finalPrice = base * (1 - discountPct / 100)
  }

  return {
    basePrice: base,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountPct,
  }
}

export default function VendasPage() {
  const [mainTab, setMainTab] = useState<'nova' | 'lista'>('nova')

  // Search & Cart states for New Sale
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loadingProds, setLoadingProds] = useState(false)

  // Customer states (Inverted Flow: Cliente primeiro)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<UserResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<UserResult | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerCpf, setCustomerCpf] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [isManualCustomer, setIsManualCustomer] = useState(false)
  const [discountNotice, setDiscountNotice] = useState<string | null>(null)

  // Payment, Delivery & Stock Separation states
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [status, setStatus] = useState('PAGO')
  const [deliveryStatus, setDeliveryStatus] = useState('PENDENTE')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deductStock, setDeductStock] = useState(false) // Separação Financeiro x Estoque
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Sales Listing states
  const [sales, setSales] = useState<SaleOrder[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [salesFilterSearch, setSalesFilterSearch] = useState('')

  // Edit Sale Modal
  const [editingSale, setEditingSale] = useState<EditOrderTarget | null>(null)

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

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search, searchProducts])

  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setCustomerResults([]); return }
    const r = await fetch(`/api/admin/users-list?search=${encodeURIComponent(q)}`)
    if (r.ok) setCustomerResults(await r.json())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300)
    return () => clearTimeout(t)
  }, [customerSearch, searchCustomers])

  const formatAddress = (addr: any) => {
    if (!addr) return ''
    return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.city} - ${addr.state}, CEP ${addr.zipCode}`
  }

  // Recalcular carrinho ao mudar de cliente
  const recalculateCartForCustomer = (cust: UserResult | null) => {
    setCart(prev => prev.map(item => {
      if (item.rawKit) {
        const { finalPrice, basePrice } = computeKitPrice(item.rawKit, cust)
        return { ...item, price: finalPrice, basePrice }
      } else if (item.rawProduct && item.rawVariant) {
        const { finalPrice, basePrice } = computeProductPrice(item.rawProduct, item.rawVariant, cust)
        return { ...item, price: finalPrice, basePrice }
      }
      return item
    }))
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
    setIsManualCustomer(false)

    // Recalcula todos os itens do carrinho com os valores da tabela do cliente!
    recalculateCartForCustomer(u)

    if (u.discountTable && u.discountTable.percentage > 0) {
      setDiscountNotice(`Tabela "${u.discountTable.name}" aplicada! ${u.discountTable.percentage}% de desconto em todos os produtos.`)
    } else {
      setDiscountNotice(null)
    }
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerCpf('')
    setCustomerPhone('')
    setCustomerAddress('')
    setDiscountNotice(null)
    recalculateCartForCustomer(null)
  }

  const handleDeliveryStatusChange = (newVal: string) => {
    setDeliveryStatus(newVal)
    // Sugestão automática de estoque de acordo com o status de entrega
    if (newVal === 'ENVIADO' || newVal === 'ENTREGUE') {
      setDeductStock(true)
    } else if (newVal === 'PRE_VENDA' || newVal === 'PENDENTE' || newVal === 'CANCELADO') {
      setDeductStock(false)
    }
  }

  const addProduct = (product: Product, variant: Variant) => {
    const { finalPrice, basePrice } = computeProductPrice(product, variant, selectedCustomer)

    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id && i.variantId === variant.id)
      if (ex) {
        return prev.map(i => i.productId === product.id && i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantLabel: variant.label,
          price: finalPrice,
          basePrice,
          image: product.images[0] || '',
          quantity: 1,
          proOnly: product.proOnly,
          rawProduct: product,
          rawVariant: variant,
        }
      ]
    })
    setSearch('')
    setProducts([])
    setKits([])
  }

  const addKit = (kit: Kit) => {
    const { finalPrice, basePrice } = computeKitPrice(kit, selectedCustomer)

    setCart(prev => {
      const ex = prev.find(i => i.kitId === kit.id)
      if (ex) {
        return prev.map(i => i.kitId === kit.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [
        ...prev,
        {
          kitId: kit.id,
          variantId: null,
          name: kit.name,
          variantLabel: 'Kit',
          price: finalPrice,
          basePrice,
          image: kit.images[0] || '',
          quantity: 1,
          isKit: true,
          rawKit: kit,
        }
      ]
    })
    setSearch('')
    setProducts([])
    setKits([])
  }

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter((_, i) => i !== idx))
    else setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }

  const updatePrice = (idx: number, price: number) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, price } : item))
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleSell = async () => {
    if (!selectedCustomer && !customerName.trim()) {
      setError('Informe ou selecione o cliente da venda')
      return
    }
    if (cart.length === 0) {
      setError('Adicione pelo menos um produto ao carrinho')
      return
    }

    setSaving(true)
    setError('')

    try {
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
          deductStock, // Separação explícita de financeiro e estoque
          note: note || null,
          items: cart.map(i => ({
            productId: i.productId || null,
            kitId: i.kitId || null,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setCart([])
        handleClearCustomer()
        setTimeout(() => {
          setSuccess(false)
          setMainTab('lista')
          fetchSales()
        }, 1500)
      } else {
        const d = await res.json()
        setError(d.error || 'Erro ao registrar venda')
      }
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação ao registrar venda')
    } finally {
      setSaving(false)
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
            Registre novas vendas comerciais ou gerencie suas vendas ativas com suporte a pré-venda e tabelas de desconto
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

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.875rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* TAB 1: REGISTRAR NOVA VENDA (FLUXO INVERTIDO: CLIENTE PRIMEIRO) */}
      {mainTab === 'nova' && (
        <div className="vendas-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* SEÇÃO 1: SELEÇÃO DE CLIENTE (PRIMEIRO PASSO) */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                    1. Cliente da Venda
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    Selecione o cliente primeiro para carregar sua tabela de desconto exclusiva (ex: 20% Salão Parceiro).
                  </p>
                </div>

                {!selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => setIsManualCustomer(!isManualCustomer)}
                    style={{ fontSize: '0.72rem', color: 'var(--navy)', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.35rem 0.85rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isManualCustomer ? 'Buscar cliente cadastrado' : '+ Digitar cliente avulso'}
                  </button>
                )}
              </div>

              {/* Cliente Selecionado */}
              {selectedCustomer ? (
                <div style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                        {selectedCustomer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>{selectedCustomer.name}</p>
                          <span style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }}>
                            {selectedCustomer.role}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{selectedCustomer.email}</p>
                      </div>
                    </div>

                    <button onClick={handleClearCustomer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                      <X size={14} /> Trocar cliente
                    </button>
                  </div>

                  {/* Badge da Tabela de Desconto */}
                  {selectedCustomer.discountTable && selectedCustomer.discountTable.percentage > 0 ? (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46' }}>
                        Tabela Ativa: {selectedCustomer.discountTable.name} ({selectedCustomer.discountTable.percentage}% de desconto aplicado automaticamente)
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Cliente sem tabela percentual específica. Preços base de vendedor/profissional aplicados.
                    </div>
                  )}

                  {/* Contato e Endereço */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--navy)', paddingTop: '0.5rem', borderTop: '1px solid #f0ebe4' }}>
                    <div><strong>CPF/CNPJ:</strong> {customerCpf || '—'}</div>
                    <div><strong>Telefone:</strong> {customerPhone || '—'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Endereço:</strong> {customerAddress || '—'}</div>
                  </div>
                </div>
              ) : isManualCustomer ? (
                /* Cliente Avulso Form */
                <div style={{ background: '#faf8f5', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--navy)' }}>Dados do Cliente Avulso</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={lbl}>Nome *</label>
                      <input style={s} placeholder="Nome completo" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>CPF / CNPJ</label>
                      <input style={s} placeholder="000.000.000-00" value={customerCpf} onChange={e => setCustomerCpf(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Telefone</label>
                      <input style={s} placeholder="(00) 00000-0000" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Endereço</label>
                    <input style={s} placeholder="Rua, número, complemento, bairro, cidade" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                  </div>
                </div>
              ) : (
                /* Busca de Cliente Cadastrado */
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Pesquise o salão ou cliente por nome ou e-mail..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      style={{ ...s, paddingLeft: '2.25rem', borderRadius: '99px' }}
                    />
                  </div>

                  {customerResults.length > 0 && customerSearch && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', zIndex: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                      {customerResults.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectCustomer(u)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>{u.name}</p>
                              <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '99px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                {u.role}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{u.email}</p>
                          </div>

                          {u.discountTable && u.discountTable.percentage > 0 ? (
                            <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#065f46', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Sparkles size={11} /> {u.discountTable.name} ({u.discountTable.percentage}%)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Selecionar</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: ADICIONAR PRODUTOS OU KITS */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                    2. Adicionar Produtos ou Kits
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    {selectedCustomer?.discountTable && selectedCustomer.discountTable.percentage > 0
                      ? `Preços calculados com ${selectedCustomer.discountTable.percentage}% de desconto da tabela "${selectedCustomer.discountTable.name}".`
                      : 'Busque produtos pelo nome ou SKU para incluir na venda.'}
                  </p>
                </div>

                {discountNotice && (
                  <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#065f46', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 600 }}>
                    {discountNotice}
                  </span>
                )}
              </div>

              {/* Product search input */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...s, paddingLeft: '2.25rem', borderRadius: '99px' }}
                />
              </div>

              {(hasResults || loadingProds) && search && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', maxHeight: '360px', overflowY: 'auto' }}>
                  {loadingProds ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <RefreshCw size={16} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <>
                      {products.map(prod => prod.variants.map(variant => {
                        const { finalPrice, basePrice, discountPct } = computeProductPrice(prod, variant, selectedCustomer)
                        return (
                          <button
                            key={`${prod.id}-${variant.id}`}
                            onClick={() => addProduct(prod, variant)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <div style={{ width: 40, height: 40, background: 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {prod.images[0] ? <Image src={prod.images[0]} alt={prod.name} fill style={{ objectFit: 'cover' }} /> : null}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>
                                {prod.name} — {variant.label}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estoque: {variant.stock}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--navy)' }}>
                                  R$ {finalPrice.toFixed(2).replace('.', ',')}
                                </span>
                                {discountPct > 0 && (
                                  <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#065f46', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                    {discountPct}% OFF (de R$ {basePrice.toFixed(2).replace('.', ',')})
                                  </span>
                                )}
                                {prod.proOnly && (
                                  <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                    PRO
                                  </span>
                                )}
                              </div>
                            </div>
                            <Plus size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                          </button>
                        )
                      }))}

                      {kits.map(kit => {
                        const { finalPrice, basePrice, discountPct } = computeKitPrice(kit, selectedCustomer)
                        return (
                          <button
                            key={kit.id}
                            onClick={() => addKit(kit)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid var(--cream)', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <div style={{ width: 40, height: 40, background: '#f5f3ff', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {kit.images[0] ? <Image src={kit.images[0]} alt={kit.name} fill style={{ objectFit: 'cover' }} /> : <Layers size={18} style={{ color: '#7c3aed', margin: 'auto' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>
                                {kit.name}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>KIT</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--navy)' }}>
                                  R$ {finalPrice.toFixed(2).replace('.', ',')}
                                </span>
                                {discountPct > 0 && (
                                  <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#065f46', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                    {discountPct}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                            <Plus size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO 3: PAGAMENTO, ENTREGA E CONTROLE DE ESTOQUE (SEPARADO) */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                  3. Pagamento, Entrega & Estoque
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  O financeiro é separado do estoque: pedidos em pré-venda ou entrega pendente não baixam o estoque automaticamente.
                </p>
              </div>

              {/* Status do Estoque / Pré-Venda Callout */}
              <div style={{ background: deductStock ? '#ecfdf5' : '#f5f3ff', border: `1px solid ${deductStock ? '#a7f3d0' : '#ddd6fe'}`, borderRadius: '12px', padding: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={deductStock}
                    onChange={e => setDeductStock(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: deductStock ? '#065f46' : '#5b21b6', margin: 0 }}>
                      {deductStock ? '✓ Dar baixa no estoque dos produtos agora' : '⏳ Pré-venda / Não dar baixa no estoque agora'}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: deductStock ? '#047857' : '#6d28d9', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                      {deductStock
                        ? 'O estoque das variantes e kits será deduzido do inventário no ato desta venda.'
                        : 'Deixe desmarcado para produtos que ainda não chegaram ao estoque (pré-venda). A venda é registrada no financeiro, e a baixa poderá ser dada quando o status for alterado para Enviado ou Entregue.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Status e Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Status do Pagamento</label>
                  <select style={s} value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="PAGO">Pago (Confirmado)</option>
                    <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                  </select>
                </div>

                <div>
                  <label style={lbl}>Forma de Pagamento</label>
                  <select style={s} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {PAYMENTS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Status da Entrega</label>
                  <select style={s} value={deliveryStatus} onChange={e => handleDeliveryStatusChange(e.target.value)}>
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

              <div>
                <label style={lbl}>Observações / Anotações Internas</label>
                <textarea
                  style={{ ...s, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Ex: Pedido com tabela especial, aguardando lote de produção..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* SIDEBAR DO CARRINHO */}
          <div className="cart-sidebar-container" style={{ position: 'sticky', top: '1.5rem' }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.375rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={15} style={{ color: 'var(--gold)' }} />
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>Carrinho ({cart.length})</h2>
                </div>

                {selectedCustomer && (
                  <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>
                    {selectedCustomer.name.split(' ')[0]}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <ShoppingCart size={28} style={{ color: 'var(--border)', margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Nenhum produto adicionado</p>
                </div>
              ) : (
                <div style={{ padding: '0.75rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 40, height: 40, background: item.isKit ? '#f5f3ff' : 'var(--cream)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        {item.image ? <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} /> : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px', margin: 0 }}>
                            {item.name}
                          </p>
                          {item.proOnly && (
                            <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                              PRO
                            </span>
                          )}
                          {item.isKit && (
                            <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                              KIT
                            </span>
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
                              width: '70px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '0.15rem 0.35rem',
                              fontSize: '0.7rem',
                              color: 'var(--navy)',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => updateQty(idx, item.quantity - 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}>
                          <Minus size={10} />
                        </button>
                        <span style={{ padding: '0.25rem 0.4rem', fontSize: '0.78rem', fontWeight: 500, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ padding: '0.25rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}>
                          <Plus size={10} />
                        </button>
                      </div>

                      <button onClick={() => updateQty(idx, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Total & Submit */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#faf8f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total da Venda</span>
                  <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--navy)' }}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={handleSell}
                  disabled={saving || cart.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: cart.length === 0 || saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: saving || cart.length === 0 ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Registrando...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Confirmar Venda
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MINHAS VENDAS COM EDIÇÃO INTEGRADA */}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={fetchSales}
                disabled={loadingSales}
                style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '99px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--navy)' }}
              >
                <RefreshCw size={13} style={{ animation: loadingSales ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
              </button>
            </div>
          </div>

          {/* Sales Listing */}
          {loadingSales ? (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carregando vendas...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <ShoppingCart size={32} style={{ color: 'var(--border)', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--navy)' }}>Nenhuma venda encontrada</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSales.map(sale => {
                const sc = PAYMENT_STATUSES.find(p => p.value === sale.status) || { label: sale.status, bg: '#f3f4f6', color: '#4b5563' }
                const dc = DELIVERY_STATUSES.find(d => d.value === sale.deliveryStatus) || { label: sale.deliveryStatus || 'Pendente', bg: '#fef3c7', color: '#b45309' }
                const isStockDeducted = sale.stockDeducted ?? false

                return (
                  <div key={sale.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem', background: '#faf8f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)', background: '#fff', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          #{sale.id.slice(-8).toUpperCase()}
                        </span>

                        <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: sc.bg, color: sc.color, fontWeight: 600 }}>
                          {sc.label}
                        </span>

                        <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.625rem', borderRadius: '99px', background: dc.bg, color: dc.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Truck size={10} /> {dc.label}
                        </span>

                        {isStockDeducted ? (
                          <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#ecfdf5', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={10} /> Estoque Baixado
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', borderRadius: '99px', background: '#f5f3ff', color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} /> Sem Baixa (Pré-Venda)
                          </span>
                        )}
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
                            <Calendar size={11} /> Previsão Entrega: {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}
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
                        onClick={() => setEditingSale(sale as any)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1.15rem',
                          background: 'var(--navy)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
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

      {/* MODAL DE EDIÇÃO DE VENDA COMPARTILHADO */}
      {editingSale && (
        <EditOrderModal
          order={editingSale}
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
          onSuccess={() => {
            fetchSales()
          }}
        />
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
