'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  productName: string
}

export default function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const hasImages = images.length > 0

  const go = (idx: number) => {
    setDirection(idx > active ? 'next' : 'prev')
    setActive(idx)
  }
  const prev = () => active > 0 && go(active - 1)
  const next = () => active < images.length - 1 && go(active + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Main container */}
      <div style={{
        position: 'relative', aspectRatio: '1', borderRadius: '20px',
        overflow: 'hidden', background: 'var(--cream)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasImages ? (
          <>
            {/* Crossfade image layer — key forces remount & plays animation */}
            <div key={active} className="gallery-img-enter" style={{ position: 'absolute', inset: 0 }}>
              <Image
                src={images[active]}
                alt={`${productName} — foto ${active + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={active === 0}
              />
            </div>

            {/* Arrow buttons */}
            {images.length > 1 && (
              <>
                {[
                  { dir: 'prev', disabled: active === 0, side: 'left', action: prev },
                  { dir: 'next', disabled: active === images.length - 1, side: 'right', action: next },
                ].map(({ dir, disabled, side, action }) => (
                  <button key={dir} onClick={action} disabled={disabled}
                    style={{
                      position: 'absolute', [side]: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: disabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)',
                      border: 'none', borderRadius: '50%',
                      width: 38, height: 38,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: disabled ? 'default' : 'pointer',
                      opacity: disabled ? 0.35 : 1,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
                      transition: 'transform 0.2s var(--spring), box-shadow 0.2s, background 0.2s',
                      backdropFilter: 'blur(4px)',
                    }}
                    onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.12)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.14)' }}
                  >
                    {dir === 'prev' ? <ChevronLeft size={18} style={{ color: 'var(--navy)' }} /> : <ChevronRight size={18} style={{ color: 'var(--navy)' }} />}
                  </button>
                ))}
              </>
            )}

            {/* Dot indicator */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', bottom: '0.875rem', left: '50%',
                transform: 'translateX(-50%)', zIndex: 10,
                display: 'flex', gap: '0.375rem', alignItems: 'center',
              }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => go(i)} style={{
                    width: i === active ? 20 : 7, height: 7,
                    borderRadius: '99px', border: 'none',
                    background: i === active ? '#fff' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer', padding: 0,
                    transition: 'width 0.3s var(--spring), background 0.25s',
                  }} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Placeholder */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '7rem', fontWeight: 200, color: 'rgba(100,116,139,0.2)', fontFamily: 'var(--font-cormorant),serif', lineHeight: 1, animation: 'floatY 4s ease-in-out infinite' }}>M</span>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,150,152,0.5)' }}>Sem imagem</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {images.map((url, i) => (
            <button key={url} onClick={() => go(i)} style={{
              flexShrink: 0, width: '70px', height: '70px',
              borderRadius: '10px', overflow: 'hidden',
              border: `2.5px solid ${i === active ? 'var(--navy)' : 'transparent'}`,
              background: 'var(--cream)', cursor: 'pointer', padding: 0,
              position: 'relative',
              transition: 'border-color 0.2s var(--smooth), transform 0.2s var(--spring), box-shadow 0.2s',
              transform: i === active ? 'scale(1.05)' : 'scale(1)',
              boxShadow: i === active ? '0 4px 12px rgba(50,50,50,0.15)' : 'none',
            }}>
              <Image src={url} alt={`Miniatura ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="70px" />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
