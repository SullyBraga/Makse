'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag, Lock, ArrowRight, RefreshCw, MapPin, Plus, Check, Truck, Globe } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type Address = {
  id: string
  street: string
  number: string
  complement: string | null
  city: string
  state: string
  zipCode: string
  country: string
}

type ShippingOption = {
  name: string
  price: number
  deliveryTime: string
  serviceCode: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { items, total, clearCart } = useCartStore()

  // Estados de Endereço
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [fetchingAddresses, setFetchingAddresses] = useState(true)

  // Campos do Formulário de Novo Endereço
  const [country, setCountry] = useState('Brasil')
  const [zipCode, setZipCode] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Estados de Frete
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')

  // Geral
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estados de Cupom
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const role = (session?.user as any)?.role
  const discountPct: number = (session?.user as any)?.discountPct ?? 0
  const isPro = role === 'CABELEIREIRA' && discountPct > 0

  // 1. Redirecionar Vendedores
  useEffect(() => {
    if (role === 'VENDEDOR') {
      window.location.href = '/admin/vendas'
    }
  }, [role])

  // 2. Buscar endereços cadastrados
  const fetchAddresses = async () => {
    if (!session) return
    setFetchingAddresses(true)
    try {
      const res = await fetch('/api/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
        if (data.length > 0) {
          setSelectedAddressId(data[0].id)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar endereços:', err)
    } finally {
      setFetchingAddresses(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchAddresses()
    }
  }, [session])

  // 3. Buscar CEP automático (Brasil)
  useEffect(() => {
    const cleanCep = zipCode.replace(/\D/g, '')
    if (cleanCep.length === 8 && country === 'Brasil') {
      const lookupCep = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
          if (res.ok) {
            const data = await res.json()
            if (!data.erro) {
              setStreet(data.logradouro || '')
              setCity(data.localidade || '')
              setState(data.uf || '')
            }
          }
        } catch (e) {
          console.error(e)
        }
      }
      lookupCep()
    }
  }, [zipCode, country])

  // 4. Calcular frete quando o endereço selecionado mudar
  const calcShipping = async (addrId: string) => {
    const address = addresses.find(a => a.id === addrId)
    if (!address) return

    setShippingLoading(true)
    setShippingError('')
    setSelectedShipping(null)
    setShippingOptions([])

    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode: address.zipCode,
          country: address.country,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            weight: (i as any).proOnly ? '1kg' : '0.5kg' // Estimativa de peso base por tipo
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao calcular frete')
      setShippingOptions(data)
      if (data.length > 0) {
        setSelectedShipping(data[0]) // Seleciona a primeira opção por padrão
      }
    } catch (err: any) {
      setShippingError(err.message || 'Erro ao calcular prazo e frete')
    } finally {
      setShippingLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAddressId && items.length > 0) {
      calcShipping(selectedAddressId)
    }
  }, [selectedAddressId, items])

  // 5. Cadastrar novo endereço
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressError('')
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street,
          number,
          complement: complement || undefined,
          city,
          state,
          zipCode: zipCode || '00000-000',
          country
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar endereço')

      // Resetar form
      setStreet('')
      setNumber('')
      setComplement('')
      setCity('')
      setState('')
      setZipCode('')
      setCountry('Brasil')
      setShowAddForm(false)

      // Atualizar lista
      setAddresses(prev => [data, ...prev])
      setSelectedAddressId(data.id)
    } catch (err: any) {
      setAddressError(err.message)
    } finally {
      setSavingAddress(false)
    }
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError('')
    setCouponSuccess('')

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: itemsTotal,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'Erro ao validar cupom')
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon(data.coupon)
        setCouponSuccess(`Cupom ${data.coupon.code} aplicado!`)
      }
    } catch {
      setCouponError('Erro ao validar cupom. Tente novamente.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponSuccess('')
    setCouponError('')
  }

  // 6. Checkout Mercado Pago
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setError('Por favor, selecione um endereço de entrega.')
      return
    }
    if (!selectedShipping) {
      setError('Por favor, selecione um método de envio.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          shippingPrice: selectedShipping.price,
          shippingMethod: selectedShipping.name,
          couponId: appliedCoupon?.id || null,
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId || null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar pagamento')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <RefreshCw size={28} style={{ color: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <Lock size={40} style={{ color: 'var(--gold)', margin: '0 auto 1.5rem', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          Entre para continuar
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Você precisa estar logado para finalizar a compra.
        </p>
        <Link href="/login?redirect=/checkout" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Entrar <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
        <ShoppingBag size={40} style={{ color: 'var(--cream-dark)', margin: '0 auto 1.5rem', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          Carrinho vazio
        </h1>
        <Link href="/catalogo" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Ver Catálogo <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const itemsTotal = isPro ? total() * (1 - discountPct / 100) : total()
  const shippingCost = selectedShipping?.price ?? 0
  
  let couponDiscountValue = 0
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      couponDiscountValue = itemsTotal * (appliedCoupon.value / 100)
    } else {
      couponDiscountValue = Math.min(appliedCoupon.value, itemsTotal)
    }
  }

  const itemsTotalAfterCoupon = Math.max(0, itemsTotal - couponDiscountValue)
  const finalTotal = itemsTotalAfterCoupon + shippingCost

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 400, color: 'var(--navy)', marginBottom: '2rem' }}>
        Finalizar Compra
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }} className="checkout-container">
        
        {/* LEFT COLUMN: Address Selection, Delivery & Order Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* STEP 1: Endereço de Entrega */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} style={{ color: 'var(--gold)' }} />
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.35rem', fontWeight: 500, color: 'var(--navy)' }}>
                  Endereço de Entrega
                </h2>
              </div>
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.35rem 0.75rem', fontSize: '0.7rem', color: 'var(--navy)', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus size={12} /> Novo Endereço
                </button>
              )}
            </div>

            {fetchingAddresses ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Carregando endereços...</span>
              </div>
            ) : showAddForm ? (
              /* FORM DE ADICIONAR ENDEREÇO */
              <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--cream)', padding: '1.25rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>País</label>
                    <select value={country} onChange={e => { setCountry(e.target.value); setZipCode(''); }} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem', background: '#fff' }}>
                      <option value="Brasil">Brasil</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="França">França</option>
                      <option value="Espanha">Espanha</option>
                      <option value="Reino Unido">Reino Unido</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>
                      {country === 'Brasil' ? 'CEP *' : 'Código Postal'}
                    </label>
                    <input type="text" placeholder={country === 'Brasil' ? '00000-000' : 'ZIP Code'} value={zipCode} onChange={e => setZipCode(e.target.value)} required style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 3, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>Rua / Logradouro *</label>
                    <input type="text" placeholder="Ex: Av. Paulista" value={street} onChange={e => setStreet(e.target.value)} required style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '80px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>Número *</label>
                    <input type="text" placeholder="123" value={number} onChange={e => setNumber(e.target.value)} required style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>Complemento</label>
                    <input type="text" placeholder="Apto, Bloco..." value={complement} onChange={e => setComplement(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ flex: 2, minWidth: '120px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>Cidade *</label>
                    <input type="text" placeholder="Ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} required style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '70px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.3rem' }}>UF *</label>
                    <input type="text" placeholder="SP" value={state} onChange={e => setState(e.target.value)} required maxLength={20} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.82rem' }} />
                  </div>
                </div>

                {addressError && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0 }}>{addressError}</p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '0.5rem 1.25rem', border: '1px solid var(--border)', borderRadius: '99px', background: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingAddress} style={{ padding: '0.5rem 1.5rem', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {savingAddress ? 'Salvando...' : 'Salvar Endereço'}
                  </button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Você não tem nenhum endereço cadastrado.</p>
                <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}>
                  <Plus size={13} /> Cadastrar Endereço
                </button>
              </div>
            ) : (
              /* SELEÇÃO DE ENDEREÇO EXISTENTE */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {addresses.map(addr => {
                  const isSelected = selectedAddressId === addr.id
                  return (
                    <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} style={{
                      border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`,
                      borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                      background: isSelected ? '#fafaf9' : '#fff',
                      transition: 'border-color 0.2s, background 0.2s', position: 'relative'
                    }}>
                      {isSelected && (
                        <span style={{ position: 'absolute', right: '0.75rem', top: '0.75rem', background: 'var(--navy)', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={10} />
                        </span>
                      )}
                      <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {addr.country !== 'Brasil' ? <Globe size={13} style={{ color: 'var(--gold)' }} /> : <MapPin size={13} style={{ color: 'var(--gold)' }} />}
                        {addr.country}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {addr.street}, {addr.number}
                        {addr.complement && ` — ${addr.complement}`}
                        <br />
                        {addr.city} - {addr.state}
                        <br />
                        CEP: {addr.zipCode}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Método de Envio (Correios) */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Truck size={18} style={{ color: 'var(--gold)' }} />
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.35rem', fontWeight: 500, color: 'var(--navy)' }}>
                Opções de Envio (Correios)
              </h2>
            </div>

            {!selectedAddressId ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Cadastre ou selecione um endereço de entrega para cotar o frete.</p>
            ) : shippingLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Calculando frete e prazo nos Correios...</span>
              </div>
            ) : shippingError ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#dc2626' }}>
                {shippingError}
              </div>
            ) : shippingOptions.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Nenhuma opção de entrega disponível para este CEP/Região.</p>
            ) : (
              /* SELEÇÃO DE OPÇÃO DE FRETE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {shippingOptions.map(option => {
                  const isSelected = selectedShipping?.serviceCode === option.serviceCode
                  return (
                    <div key={option.serviceCode} onClick={() => setSelectedShipping(option)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: `1.5px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`,
                      borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                      background: isSelected ? '#fafaf9' : '#fff',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ border: `1.5px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <div style={{ background: 'var(--navy)', borderRadius: '50%', width: 8, height: 8 }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>{option.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>Prazo: {option.deliveryTime}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                        {option.price === 0 ? 'Grátis' : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ITENS COMPRADOS */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '1.25rem' }}>
              Itens no Pedido
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(item => {
                const itemPrice = isPro ? item.price * (1 - discountPct / 100) : item.price
                return (
                  <div key={`${item.productId}-${item.variantId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 56, height: 56, background: 'var(--cream)', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)' }}>{item.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantLabel} · Qtd: {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                      R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Checkout Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.50rem' }}>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--navy)', marginBottom: '1rem' }}>Resumo de Valores</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--navy)' }}>R$ {total().toFixed(2).replace('.', ',')}</span>
            </div>

            {isPro && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>Desconto pro ({discountPct})%</span>
                <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>
                  -R$ {(total() - itemsTotal).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', color: '#16a34a' }}>
                <span style={{ fontSize: '0.82rem' }}>Cupom ({appliedCoupon.code})</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                  -R$ {couponDiscountValue.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Custo de Envio (Correios)</span>
              <span style={{ fontSize: '0.82rem', color: selectedShipping ? 'var(--navy)' : 'var(--text-muted)' }}>
                {selectedShipping ? (selectedShipping.price === 0 ? 'Grátis' : `R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}`) : 'Não selecionado'}
              </span>
            </div>

            {selectedShipping && (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '-0.5rem 0 0.75rem', textAlign: 'right' }}>
                Método: <strong>{selectedShipping.name}</strong>
              </p>
            )}

            {/* Input Cupom */}
            <div style={{ margin: '1rem 0', padding: '0.75rem 0', borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 500 }}>
                    🎟️ {appliedCoupon.code}
                  </span>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}>
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Cupom de desconto"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.625rem',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    style={{
                      background: 'var(--navy)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      opacity: couponLoading ? 0.7 : 1,
                    }}
                  >
                    Aplicar
                  </button>
                </form>
              )}
              {couponError && <p style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>{couponError}</p>}
              {couponSuccess && <p style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>{couponSuccess}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid var(--cream-dark)', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>Total Geral</span>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.6rem', fontWeight: 400, color: 'var(--navy)' }}>
                R$ {finalTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button onClick={handleCheckout} disabled={loading}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, background: '#009EE3' }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Processando...</>
              : <>Pagar com Mercado Pago <ArrowRight size={14} /></>
            }
          </button>

          <Link href="/catalogo" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none', marginTop: '0.5rem' }}>
            ← Voltar ao Catálogo
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .checkout-container { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
