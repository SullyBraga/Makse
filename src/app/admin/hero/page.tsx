'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, RefreshCw, Eye, EyeOff, Layers, Upload, Info, Image as ImageIcon, Monitor, Smartphone, Tablet, Laptop, Tv } from 'lucide-react'
import Image from 'next/image'
import { compressImage } from '@/lib/compress'

type HeroSlide = {
  id: string
  order: number
  active: boolean
  resolutionMode: 'SINGLE' | 'MULTI'
  image: string | null
  imageUltrawide: string | null
  imageFullhd: string | null
  imageNotebook: string | null
  imageTablet: string | null
  imageMobile: string | null
  label: string | null
  titleLine1: string | null
  titleLine2: string | null
  description: string | null
  primaryCtaText: string | null
  primaryCtaLink: string | null
  secondaryCtaText: string | null
  secondaryCtaLink: string | null
}

const RESOLUTION_GUIDE = [
  { device: '🖥️ Ultra Wide (Monitores 2K / 4K / Ultrawide)', res: '2560 x 1080 px (ou 3840 x 1600 px)', ratio: 'Proporção 21:9', field: 'imageUltrawide', icon: <Tv size={16} /> },
  { device: '💻 Full HD (Desktops padrão)', res: '1920 x 1080 px', ratio: 'Proporção 16:9', field: 'imageFullhd', icon: <Monitor size={16} /> },
  { device: '💻 Notebook (Telas de notebook)', res: '1440 x 900 px (ou 1366 x 768 px)', ratio: 'Proporção 16:10', field: 'imageNotebook', icon: <Laptop size={16} /> },
  { device: '📱 Tablet (iPads / Tablets)', res: '1024 x 1366 px (Vertical)', ratio: 'Proporção 3:4', field: 'imageTablet', icon: <Tablet size={16} /> },
  { device: '📱 Celular / Mobile (Smartphones)', res: '1080 x 1920 px (Vertical)', ratio: 'Proporção 9:16', field: 'imageMobile', icon: <Smartphone size={16} /> },
]

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [saving, setSaving] = useState(false)

  const [resolutionMode, setResolutionMode] = useState<'SINGLE' | 'MULTI'>('SINGLE')
  const [image, setImage] = useState('')
  const [imageUltrawide, setImageUltrawide] = useState('')
  const [imageFullhd, setImageFullhd] = useState('')
  const [imageNotebook, setImageNotebook] = useState('')
  const [imageTablet, setImageTablet] = useState('')
  const [imageMobile, setImageMobile] = useState('')

  const [label, setLabel] = useState('')
  const [titleLine1, setTitleLine1] = useState('')
  const [titleLine2, setTitleLine2] = useState('')
  const [description, setDescription] = useState('')
  const [primaryCtaText, setPrimaryCtaText] = useState('')
  const [primaryCtaLink, setPrimaryCtaLink] = useState('')
  const [secondaryCtaText, setSecondaryCtaText] = useState('')
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('')
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const fetchSlides = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hero-slides')
      if (res.ok) {
        setSlides(await res.json())
      }
    } catch {
      setError('Erro ao carregar slides')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  const openNewModal = () => {
    setEditingSlide(null)
    setResolutionMode('SINGLE')
    setImage('/foto-hero.jpeg')
    setImageUltrawide('')
    setImageFullhd('')
    setImageNotebook('')
    setImageTablet('')
    setImageMobile('')
    setLabel('Cosmética Avançada')
    setTitleLine1('Beleza que se sente')
    setTitleLine2('no toque')
    setDescription('Fórmulas exclusivas desenvolvidas para profissionais.')
    setPrimaryCtaText('Explorar Coleção')
    setPrimaryCtaLink('/catalogo')
    setSecondaryCtaText('Cadastro Pro')
    setSecondaryCtaLink('/cadastro')
    setModalOpen(true)
  }

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setResolutionMode(slide.resolutionMode || 'SINGLE')
    setImage(slide.image || '')
    setImageUltrawide(slide.imageUltrawide || '')
    setImageFullhd(slide.imageFullhd || '')
    setImageNotebook(slide.imageNotebook || '')
    setImageTablet(slide.imageTablet || '')
    setImageMobile(slide.imageMobile || '')
    setLabel(slide.label || '')
    setTitleLine1(slide.titleLine1 || '')
    setTitleLine2(slide.titleLine2 || '')
    setDescription(slide.description || '')
    setPrimaryCtaText(slide.primaryCtaText || '')
    setPrimaryCtaLink(slide.primaryCtaLink || '')
    setSecondaryCtaText(slide.secondaryCtaText || '')
    setSecondaryCtaLink(slide.secondaryCtaLink || '')
    setModalOpen(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingField(targetField)

    try {
      const compressedBlob = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressedBlob, file.name || 'image.jpg')

      const res = await fetch('/api/admin/hero-slides/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        if (targetField === 'image') setImage(data.url)
        else if (targetField === 'imageUltrawide') setImageUltrawide(data.url)
        else if (targetField === 'imageFullhd') setImageFullhd(data.url)
        else if (targetField === 'imageNotebook') setImageNotebook(data.url)
        else if (targetField === 'imageTablet') setImageTablet(data.url)
        else if (targetField === 'imageMobile') setImageMobile(data.url)
      } else {
        alert(data.error || 'Erro ao enviar imagem')
      }
    } catch (err) {
      console.error(err)
      alert('Falha ao processar a imagem')
    } finally {
      setUploadingField(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      resolutionMode,
      image: resolutionMode === 'SINGLE' ? image : null,
      imageUltrawide: resolutionMode === 'MULTI' ? imageUltrawide : null,
      imageFullhd: resolutionMode === 'MULTI' ? imageFullhd : null,
      imageNotebook: resolutionMode === 'MULTI' ? imageNotebook : null,
      imageTablet: resolutionMode === 'MULTI' ? imageTablet : null,
      imageMobile: resolutionMode === 'MULTI' ? imageMobile : null,
      label,
      titleLine1,
      titleLine2,
      description,
      primaryCtaText,
      primaryCtaLink,
      secondaryCtaText,
      secondaryCtaLink,
    }

    try {
      const url = '/api/admin/hero-slides'
      const method = editingSlide ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide ? { id: editingSlide.id, ...payload } : payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar slide')
      } else {
        setSuccess('Slide salvo com sucesso!')
        setModalOpen(false)
        fetchSlides()
      }
    } catch {
      setError('Erro de conexão ao salvar slide')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await fetch('/api/admin/hero-slides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slide.id, active: !slide.active }),
      })
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, active: !s.active } : s))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este slide da Hero permanentemente?')) return
    try {
      const res = await fetch('/api/admin/hero-slides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setSlides(prev => prev.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const inpStyle = {
    width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)',
    borderRadius: '10px', fontSize: '0.84rem', outline: 'none', background: '#fff', color: 'var(--navy)',
  }

  const lblStyle = {
    display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem',
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', margin: 0 }}>
            Gerenciar Banners da Hero (Home)
          </h1>
          <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Cadastre slides com imagem única responsiva ou imagens personalizadas para cada resolução de tela
          </p>
        </div>

        <button
          onClick={openNewModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem',
            background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '99px',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}
        >
          <Plus size={14} /> Novo Slide
        </button>
      </div>

      {/* Guia de Resoluções em Pixels */}
      <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Info size={16} style={{ color: 'var(--gold)' }} />
          <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--navy)', margin: 0 }}>
            Guia de Resoluções em Pixels (Para Produção de Arte)
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Ao optar pelo modo <strong>Resoluções Diversas</strong>, forneça as imagens nas medidas exatas abaixo para garantir o melhor enquadramento e velocidade:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {RESOLUTION_GUIDE.map((g, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.2rem' }}>{g.device}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace' }}>{g.res}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{g.ratio}</div>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.85rem 1.25rem', fontSize: '0.84rem', color: '#dc2626', marginBottom: '1.5rem' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.85rem 1.25rem', fontSize: '0.84rem', color: '#166534', marginBottom: '1.5rem' }}>{success}</div>}

      {/* Lista de Slides */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={24} style={{ color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : slides.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed var(--border)', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center' }}>
          <Layers size={36} style={{ color: 'var(--border)', margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.3rem', color: 'var(--navy)' }}>Nenhum slide personalizado cadastrado</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>O site está exibindo os slides padrão da Makse. Adicione um slide para personalizar!</p>
          <button onClick={openNewModal} style={{ background: 'var(--navy)', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Cadastrar Primeiro Slide
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {slides.map(slide => (
            <div key={slide.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Image Preview */}
              <div style={{ width: 120, height: 75, background: 'var(--navy)', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {slide.image || slide.imageFullhd || slide.imageUltrawide || slide.imageMobile ? (
                  <img src={(slide.image || slide.imageFullhd || slide.imageUltrawide || slide.imageMobile)!} alt={slide.titleLine1 || 'Slide'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gold)' }}><ImageIcon size={24} /></div>
                )}
              </div>

              {/* Slide Meta */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '99px', background: slide.resolutionMode === 'MULTI' ? '#ede9fe' : '#e0f2fe', color: slide.resolutionMode === 'MULTI' ? '#6d28d9' : '#0369a1', fontWeight: 600 }}>
                    {slide.resolutionMode === 'MULTI' ? '✨ Resoluções Diversas' : '📐 Resolução Única'}
                  </span>
                  <span style={{ fontSize: '0.62rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: slide.active ? '#dcfce7' : '#fee2e2', color: slide.active ? '#166534' : '#dc2626', fontWeight: 600 }}>
                    {slide.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--navy)', margin: '0.2rem 0' }}>
                  {slide.titleLine1} {slide.titleLine2}
                </h3>
                {slide.label && <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, margin: 0 }}>{slide.label}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => handleToggleActive(slide)} title={slide.active ? 'Desativar slide' : 'Ativar slide'} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                  {slide.active ? <EyeOff size={14} /> : <Eye size={14} />} {slide.active ? 'Ocultar' : 'Exibir'}
                </button>
                <button onClick={() => openEditModal(slide)} title="Editar slide" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(slide.id)} title="Excluir slide" style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Modal Form */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>
                {editingSlide ? 'Editar Slide da Hero' : 'Novo Slide da Hero'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Seletor de Modo de Resolução */}
              <div>
                <label style={lblStyle}>Modo de Resolução da Imagem *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setResolutionMode('SINGLE')}
                    style={{
                      padding: '0.85rem', borderRadius: '12px', border: `2px solid ${resolutionMode === 'SINGLE' ? 'var(--navy)' : 'var(--border)'}`,
                      background: resolutionMode === 'SINGLE' ? '#f0f7ff' : '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.88rem' }}>📐 Resolução Única</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>1 imagem centralizada com ajuste e corte automático em qualquer tela.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionMode('MULTI')}
                    style={{
                      padding: '0.85rem', borderRadius: '12px', border: `2px solid ${resolutionMode === 'MULTI' ? 'var(--navy)' : 'var(--border)'}`,
                      background: resolutionMode === 'MULTI' ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.88rem' }}>✨ Resoluções Diversas</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Envie imagens específicas em pixels para Ultra Wide, Full HD, Notebook, Tablet e Mobile.</div>
                  </button>
                </div>
              </div>

              {/* Inputs de Upload conforme Modo */}
              {resolutionMode === 'SINGLE' ? (
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <label style={lblStyle}>Imagem Principal (Resolução Única)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="Ex: /foto-hero.jpeg ou URL" style={inpStyle} />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.65rem 1rem', background: 'var(--navy)', color: '#fff', borderRadius: '10px', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <Upload size={14} /> {uploadingField === 'image' ? 'Enviando...' : 'Upload Imagem'}
                      <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
                    Upload de Imagens por Dispositivo (Resoluções em Pixels)
                  </p>

                  {RESOLUTION_GUIDE.map(g => {
                    const val = g.field === 'imageUltrawide' ? imageUltrawide :
                                g.field === 'imageFullhd' ? imageFullhd :
                                g.field === 'imageNotebook' ? imageNotebook :
                                g.field === 'imageTablet' ? imageTablet : imageMobile

                    const setter = g.field === 'imageUltrawide' ? setImageUltrawide :
                                   g.field === 'imageFullhd' ? setImageFullhd :
                                   g.field === 'imageNotebook' ? setImageNotebook :
                                   g.field === 'imageTablet' ? setImageTablet : setImageMobile

                    return (
                      <div key={g.field} style={{ background: '#fff', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--navy)' }}>{g.device}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 600 }}>{g.res}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <input type="text" value={val} onChange={e => setter(e.target.value)} placeholder={`URL da imagem ${g.res}`} style={inpStyle} />
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.65rem 0.85rem', background: 'var(--navy)', color: '#fff', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <Upload size={13} /> {uploadingField === g.field ? '...' : 'Upload'}
                            <input type="file" accept="image/*" onChange={e => handleUpload(e, g.field)} style={{ display: 'none' }} />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Textos do Slide */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={lblStyle}>Selo / Categoria (Topo)</label>
                  <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Cosmética Avançada" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Título Linha 1</label>
                  <input type="text" value={titleLine1} onChange={e => setTitleLine1(e.target.value)} placeholder="Ex: Beleza que se sente" style={inpStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={lblStyle}>Título Linha 2 (Destaque)</label>
                  <input type="text" value={titleLine2} onChange={e => setTitleLine2(e.target.value)} placeholder="Ex: no toque" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Descrição Breve</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Fórmulas exclusivas para..." style={inpStyle} />
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={lblStyle}>Botão Principal (Texto)</label>
                  <input type="text" value={primaryCtaText} onChange={e => setPrimaryCtaText(e.target.value)} placeholder="Ex: Explorar Coleção" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Botão Principal (Link)</label>
                  <input type="text" value={primaryCtaLink} onChange={e => setPrimaryCtaLink(e.target.value)} placeholder="Ex: /catalogo" style={inpStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={lblStyle}>Botão Secundário (Texto)</label>
                  <input type="text" value={secondaryCtaText} onChange={e => setSecondaryCtaText(e.target.value)} placeholder="Ex: Cadastro Pro" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Botão Secundário (Link)</label>
                  <input type="text" value={secondaryCtaLink} onChange={e => setSecondaryCtaLink(e.target.value)} placeholder="Ex: /cadastro" style={inpStyle} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%', padding: '0.85rem', background: 'var(--navy)', color: '#fff', border: 'none',
                  borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem',
                }}
              >
                {saving ? <><RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Salvando Slide...</> : 'Salvar Slide da Hero'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
