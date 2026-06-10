'use client'
import { useState, useRef } from 'react'
import { Upload, Trash2, ArrowLeft, ArrowRight, Star, RefreshCw, ImageOff } from 'lucide-react'
import { compressImage } from '@/lib/compress'

type Props = {
  productId: string
  initialImages: string[]
}

export default function ProductImageManager({ productId, initialImages }: Props) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true); setError('')

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { setError('Apenas imagens são permitidas.'); continue }
      if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande (máx 5MB).'); continue }

      let uploadBlob: Blob = file
      try {
        uploadBlob = await compressImage(file)
      } catch (err) {
        console.error('[ProductImageManager] Erro ao comprimir imagem:', err)
      }

      const fd = new FormData()
      fd.append('file', uploadBlob, 'image.jpg')
      fd.append('productId', productId)

      const res = await fetch('/api/admin/products/images', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) setImages(data.images)
      else setError(data.error || 'Erro ao enviar imagem')
    }
    setUploading(false)
  }

  const handleDelete = async (url: string) => {
    if (!confirm('Remover esta imagem?')) return
    const res = await fetch('/api/admin/products/images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, imageUrl: url }),
    })
    const data = await res.json()
    if (res.ok) setImages(data.images)
    else setError(data.error)
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const newImages = [...images]
    const target = idx + dir
    if (target < 0 || target >= newImages.length) return
    ;[newImages[idx], newImages[target]] = [newImages[target], newImages[idx]]
    setImages(newImages)
    await fetch('/api/admin/products/images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, images: newImages }),
    })
  }

  const dropStyle: React.CSSProperties = {
    border: `2px dashed ${uploading ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: '12px', padding: '2rem',
    textAlign: 'center', cursor: 'pointer',
    background: uploading ? 'var(--cream)' : '#fafafa',
    transition: 'all 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div style={dropStyle} onClick={() => fileRef.current?.click()}>
        {uploading ? (
          <RefreshCw size={20} style={{ color: 'var(--gold)', margin: '0 auto', display: 'block', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <Upload size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem', display: 'block' }} />
        )}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {uploading ? 'Enviando...' : 'Clique ou arraste imagens aqui'}
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--border)', marginTop: '0.25rem' }}>JPG, PNG, WEBP · Máx 5MB cada</p>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Images grid */}
      {images.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <ImageOff size={14} /> Nenhuma imagem ainda. A primeira imagem será a capa do produto.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
          {images.map((url, i) => (
            <div key={url} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--border)', background: '#fafafa' }}>
              {/* Cover badge */}
              {i === 0 && (
                <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--gold)', color: '#fff', fontSize: '0.5rem', padding: '1px 5px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2 }}>
                  <Star size={7} fill="#fff" /> Capa
                </div>
              )}
              <img src={url} alt={`Imagem ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', padding: '4px', background: 'rgba(255,255,255,0.95)' }}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  style={{ padding: '3px', border: 'none', background: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, color: 'var(--navy)', display: 'flex' }}>
                  <ArrowLeft size={11} />
                </button>
                <button type="button" onClick={() => handleDelete(url)}
                  style={{ padding: '3px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                  <Trash2 size={11} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  style={{ padding: '3px', border: 'none', background: 'none', cursor: i === images.length - 1 ? 'default' : 'pointer', opacity: i === images.length - 1 ? 0.3 : 1, color: 'var(--navy)', display: 'flex' }}>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
