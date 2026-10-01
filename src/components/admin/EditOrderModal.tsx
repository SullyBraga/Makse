'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, X, RefreshCw, Layers, Check, AlertCircle, Package, Truck, Calendar, Store, User } from 'lucide-react'
import Image from 'next/image'

type Variant = { id: string; label: string; price: number; pricePro?: number | null; priceVendedor: number | null; stock: number }
type Product = { id: string; name: string; sku: string | null; price: number; pricePro: number | null; priceVendedor: number | null; proOnly: boolean; images: string[]; variants: Variant[] }
type Kit = { id: string; name: string; sku: string | null; price: number; pricePro?: number | null; priceVendedor: number | null; images: string[] }

export type EditOrderItem = {
  id?: string
  productId?: string | null
  kitId?: string | null
  variantId?: string | null
  name: string
  variantLabel?: string
  price: number
  image: string
  quantity: number
  isKit?: boolean
  proOnly?: boolean
}

export type EditOrderTarget = {
  id: string
  total: number
  status: string
  deliveryStatus?: string | null
  deliveryDate?: string | Date | null
  stockDeducted?: boolean | null
  paymentMethod?: string | null
  sellerNote?: string | null
  customerName?: string | null
  customerCpf?: string | null
  customerPhone?: string | null
  customerAddress?: string | null
  user?: { name?: string | null; email?: string | null } | null
  seller?: { name?: string | null } | null
  items: {
    id?: string
    quantity: number
    unitPrice: number
    productId?: string | null
    kitId?: string | null
    variantId?: string | null
    product?: { name?: string; images?: any; price?: number } | null
    kit?: { name?: string; images?: any; price?: number } | null
    variant?: { label?: string; price?: number } | null
  }[]
}

interface EditOrderModalProps {
  order: EditOrderTarget | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedOrder: any) => void
}

const PAYMENTS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'OUTRO', label: 'Outro' },
]

const PAYMENT_STATUSES = [
  { value: 'PAGO', label: 'Pago (Confirmado)' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const DELIVERY_STATUSES = [
  { value: 'PENDENTE', label: 'Entrega Pendente' },
  { value: 'PRE_VENDA', label: 'Pré-Venda (Aguardando Estoque)' },
  { value: 'EM_SEPARACAO', label: 'Em Separação' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

export default function EditOrderModal({ order, isOpen, onClose, onSuccess }: EditOrderModalProps) {
  const [cart, setCart] = useState<EditOrderItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerCpf, setCustomerCpf] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [status, setStatus] = useState('PAGO')
  const [deliveryStatus, setDeliveryStatus] = useState('PENDENTE')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deductStock, setDeductStock] = useState(false)
  const [note, setNote] = useState('')

  // Product search
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [loadingProds, setLoadingProds] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customerName || order.user?.name || '')
      setCustomerCpf(order.customerCpf || '')
      setCustomerPhone(order.customerPhone || '')
      setCustomerAddress(order.customerAddress || '')
      setPaymentMethod(order.paymentMethod || 'PIX')
      setStatus(order.status || 'PAGO')
      const deliv = order.deliveryStatus || 'PENDENTE'
      setDeliveryStatus(deliv)
      setDeliveryDate(order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '')
      setDeductStock(order.stockDeducted ?? (['ENVIADO', 'ENTREGUE'].includes(deliv)))
      setNote(order.sellerNote || '')
      setError('')

      const initialCart: EditOrderItem[] = (order.items || []).map(i => {
        let img = ''
        if (i.product?.images) {
          const imgs = Array.isArray(i.product.images) ? i.product.images : []
          img = imgs[0] || ''
        } else if (i.kit?.images) {
          const imgs = Array.isArray(i.kit.images) ? i.kit.images : []
          img = imgs[0] || ''
        }

        return {
          id: i.id,
          productId: i.productId,
          kitId: i.kitId,
          variantId: i.variantId,
          name: i.product?.name || i.kit?.name || 'Item',
          variantLabel: i.variant?.label || (i.kit ? 'Kit' : ''),
          price: i.unitPrice,
          image: img,
          quantity: i.quantity,
          isKit: !!i.kitId,
        }
      })
      setCart(initialCart)
    }
  }, [order, isOpen])

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); setKits([]); return }
    setLoadingProds(true)
    try {
      const [pr, kr] = await Promise.all([
        fetch(`/api/admin/products?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/admin/kits?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
      ])
      setProducts(pr)
      setKits(kr)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingProds(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search, searchProducts])

  // Quando o status de entrega mudar, sugere ajuste automático de baixa no estoque
  const handleDeliveryStatusChange = (newVal: string) => {
    setDeliveryStatus(newVal)
    if (newVal === 'ENVIADO' || newVal === 'ENTREGUE') {
      setDeductStock(true)
    } else if (newVal === 'PRE_VENDA' || newVal === 'PENDENTE' || newVal === 'CANCELADO') {
      setDeductStock(false)
    }
  }

  const addProduct = (prod: Product, variant: Variant) => {
    const unitPrice = variant.priceVendedor ?? prod.priceVendedor ?? variant.price
    setCart(prev => {
      const ex = prev.find(i => i.productId === prod.id && i.variantId === variant.id)
      if (ex) {
        return prev.map(i => i.productId === prod.id && i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [
        ...prev,
        {
          productId: prod.id,
          variantId: variant.id,
          name: prod.name,
          variantLabel: variant.label,
          price: unitPrice,
          image: prod.images?.[0] || '',
          quantity: 1,
          proOnly: prod.proOnly,
        }
      ]
    })
    setSearch('')
    setProducts([])
    setKits([])
  }

  const addKit = (kit: Kit) => {
    const unitPrice = kit.priceVendedor ?? kit.price
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
          price: unitPrice,
          image: kit.images?.[0] || '',
          quantity: 1,
          isKit: true,
        }
      ]
    })
    setSearch('')
    setProducts([])
    setKits([])
  }

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== idx))
    } else {
      setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
    }
  }

  const updatePrice = (idx: number, price: number) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, price } : item))
  }

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0)

  const handleSave = async () => {
    if (!order) return
    if (!customerName.trim()) {
      setError('Informe o nome do cliente')
      return
    }
    if (cart.length === 0) {
      setError('O pedido precisa ter ao menos um item')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/sales/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerCpf: customerCpf.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerAddress: customerAddress.trim() || null,
          paymentMethod,
          status,
          deliveryStatus,
          deliveryDate: deliveryDate || null,
          deductStock,
          note: note.trim() || null,
          items: cart.map(i => ({
            productId: i.productId || null,
            kitId: i.kitId || null,
            variantId: i.variantId || null,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar alterações no pedido')
      }

      onSuccess(data)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar pedido')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !order) return null

  const s = { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', background: '#fff', color: 'var(--navy)' } as const
  const lbl = { fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8f5' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                Editar Pedido #{order.id.slice(-8).toUpperCase()}
              </h2>
              {order.seller?.name && (
                <span style={{ fontSize: '0.65rem', background: '#fef9c3', color: '#a16207', padding: '0.15rem 0.45rem', borderRadius: '99px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Store size={10} /> {order.seller.name}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Modifique itens, produtos, preços, dados do cliente e controle o estoque separadamente.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.35rem', borderRadius: '8px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* ITENS DO PEDIDO */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                Itens do Pedido ({cart.length})
              </h3>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gold)' }}>
                Total: R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Itens List */}
            {cart.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Nenhum item no pedido. Adicione itens abaixo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#faf8f5', borderRadius: '10px' }}>
                    <div style={{ width: 36, height: 36, background: '#f0ebe4', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={14} style={{ color: '#9b8f88' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name} {item.variantLabel ? `— ${item.variantLabel}` : ''}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Preço unitário: R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            updatePrice(idx, isNaN(val) ? 0 : val)
                          }}
                          style={{ width: '75px', padding: '0.15rem 0.35rem', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff' }}>
                      <button onClick={() => updateQty(idx, item.quantity - 1)} style={{ padding: '0.2rem 0.35rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Minus size={11} />
                      </button>
                      <span style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ padding: '0.2rem 0.35rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                    <div style={{ minWidth: '70px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--navy)' }}>
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <button onClick={() => updateQty(idx, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.2rem' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar novos produtos */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Pesquisar e adicionar outro produto ou kit..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...s, paddingLeft: '2.1rem', borderRadius: '8px' }}
                />
              </div>

              {search && (products.length > 0 || kits.length > 0 || loadingProds) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                  {loadingProds ? (
                    <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
                    </div>
                  ) : (
                    <>
                      {products.map(p => p.variants.map(v => (
                        <button
                          key={`${p.id}-${v.id}`}
                          onClick={() => addProduct(p, v)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: 'none', borderBottom: '1px solid #f0ebe4', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div>
                            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>{p.name} — {v.label}</p>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Estoque: {v.stock} · R$ {(v.priceVendedor ?? p.priceVendedor ?? v.price).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <Plus size={14} style={{ color: 'var(--gold)' }} />
                        </button>
                      )))}
                      {kits.map(k => (
                        <button
                          key={k.id}
                          onClick={() => addKit(k)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: 'none', borderBottom: '1px solid #f0ebe4', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div>
                            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>[Kit] {k.name}</p>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>R$ {(k.priceVendedor ?? k.price).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <Plus size={14} style={{ color: '#7c3aed' }} />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEPARAÇÃO: CONTROLE DE ESTOQUE (PRÉ-VENDA) */}
          <div style={{ background: deductStock ? '#ecfdf5' : '#f5f3ff', border: `1px solid ${deductStock ? '#a7f3d0' : '#ddd6fe'}`, borderRadius: '12px', padding: '0.875rem 1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={deductStock}
                onChange={e => setDeductStock(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a', marginTop: '2px', cursor: 'pointer' }}
              />
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: deductStock ? '#065f46' : '#5b21b6', margin: 0 }}>
                  {deductStock ? '✓ Dar baixa no estoque dos produtos' : '⏳ Pré-venda / Não dar baixa no estoque agora'}
                </p>
                <p style={{ fontSize: '0.72rem', color: deductStock ? '#047857' : '#6d28d9', margin: '0.2rem 0 0 0' }}>
                  {deductStock
                    ? 'O estoque das variantes e kits deste pedido será deduzido do inventário.'
                    : 'Ideal para pré-vendas ou produtos que ainda não chegaram ao estoque físico. O financeiro fica registrado sem afetar a contagem de estoque atual.'}
                </p>
              </div>
            </label>
          </div>

          {/* DADOS DE STATUS, PAGAMENTO E ENTREGA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Status do Pagamento</label>
              <select style={s} value={status} onChange={e => setStatus(e.target.value)}>
                {PAYMENT_STATUSES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Forma de Pagamento</label>
              <select style={s} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENTS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
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
              <label style={lbl}>Data Prevista de Entrega</label>
              <input type="date" style={s} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          {/* DADOS DO CLIENTE */}
          <div style={{ background: '#faf8f5', borderRadius: '12px', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dados do Cliente
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={lbl}>Nome do Cliente *</label>
                <input style={s} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label style={lbl}>CPF / CNPJ</label>
                <input style={s} value={customerCpf} onChange={e => setCustomerCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={lbl}>Telefone</label>
                <input style={s} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div>
              <label style={lbl}>Endereço Completo</label>
              <input style={s} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Rua, número, complemento, bairro, cidade" />
            </div>
          </div>

          {/* OBSERVAÇÃO / NOTA */}
          <div>
            <label style={lbl}>Observações / Anotações Internas</label>
            <textarea
              style={{ ...s, minHeight: '60px', resize: 'vertical' }}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Produto substituído a pedido do cliente..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Valor total atualizado: </span>
            <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--navy)' }}>
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{ padding: '0.55rem 1.1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '0.55rem 1.25rem', background: 'var(--navy)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <>
                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...
                </>
              ) : (
                <>
                  <Check size={14} /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
