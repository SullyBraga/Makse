'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ProfessionalForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', salonName: '', city: '', instagram: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) setSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="text-center py-12">
      <CheckCircle size={48} className="text-[#c9a96e] mx-auto mb-4"/>
      <h3 className="text-xl font-light text-[#0d1b2a] mb-2" style={{fontFamily:'Cormorant Garamond, serif'}}>Cadastro enviado!</h3>
      <p className="text-sm text-[#6b6b6b]">Nossa equipe entrará em contato em até 2 dias úteis.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">Nome completo *</label>
          <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">E-mail *</label>
          <input type="email" className="input-field" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">Telefone / WhatsApp *</label>
          <input className="input-field" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
        </div>
        <div>
          <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">Nome do Salão *</label>
          <input className="input-field" required value={form.salonName} onChange={e => setForm({...form, salonName: e.target.value})}/>
        </div>
      </div>
      <div>
        <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">Cidade *</label>
        <input className="input-field" required value={form.city} onChange={e => setForm({...form, city: e.target.value})}/>
      </div>
      <div>
        <label className="text-xs tracking-widest uppercase text-[#6b6b6b] block mb-1.5">Instagram (opcional)</label>
        <input className="input-field" placeholder="@seusalao" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})}/>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? 'Enviando...' : 'Enviar Solicitação'}
      </button>
      <p className="text-xs text-[#6b6b6b] text-center">Ao enviar, você concorda com nossa Política de Privacidade.</p>
    </form>
  )
}
