'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { isValidImageUrl } from '@/lib/hero-slides'

const DEFAULT_SLIDES = [
  {
    image: '/foto-hero.jpeg',
    label: 'Cosmética Avançada',
    titleLine1: 'Beleza que se sente',
    titleLine2: 'no toque',
    description: 'Fórmulas exclusivas desenvolvidas para profissionais que exigem performance e clientes que buscam transformação real.',
    primaryCtaText: 'Explorar Coleção',
    primaryCtaLink: '/catalogo',
    secondaryCtaText: 'Cadastro Pro',
    secondaryCtaLink: '/cadastro',
    resolutionMode: 'SINGLE',
  },
  {
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop',
    label: 'Exclusivo Profissionais',
    titleLine1: 'Performance Máxima',
    titleLine2: 'no salão',
    description: 'Cadastre seu salão de beleza e aproveite descontos exclusivos e produtos desenvolvidos por especialistas.',
    primaryCtaText: 'Seja Parceiro',
    primaryCtaLink: '/cadastro',
    secondaryCtaText: 'Ver Linhas',
    secondaryCtaLink: '/linhas',
    resolutionMode: 'SINGLE',
  },
  {
    image: 'https://images.unsplash.com/photo-1527799863830-55c97d627fb2?q=80&w=1200&auto=format&fit=crop',
    label: 'Linhas Premium',
    titleLine1: 'Tecnologia CuraBond',
    titleLine2: 'avançada',
    description: 'Tratamento de alto padrão com ativos inteligentes para proteção e regeneração profunda da fibra capilar.',
    primaryCtaText: 'Ver Favoritos',
    primaryCtaLink: '/catalogo',
    secondaryCtaText: 'Sobre Nós',
    secondaryCtaLink: '/sobre',
    resolutionMode: 'SINGLE',
  }
]

export default function HeroSection({ initialSlides }: { initialSlides?: any[] }) {
  const [slides, setSlides] = useState<any[]>(
    Array.isArray(initialSlides) && initialSlides.length > 0 ? initialSlides : DEFAULT_SLIDES
  )
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data)
        }
      })
      .catch(err => console.error('Error fetching hero slides:', err))
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  const active = slides[currentSlide] || DEFAULT_SLIDES[0]
  const hasContent = Boolean(
    active && (
      active.label ||
      active.titleLine1 ||
      active.titleLine2 ||
      active.description ||
      active.primaryCtaText ||
      active.secondaryCtaText
    )
  )

  return (
    <section className="hero-section">
      {/* Slides Background Container */}
      <div className="hero-slides-container">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide
          const isMulti = slide.resolutionMode === 'MULTI'

          const validImg = (url: string | null | undefined) => isValidImageUrl(url) ? url : null
          const imgUltrawide = validImg(slide.imageUltrawide)
          const imgFullhd = validImg(slide.imageFullhd)
          const imgNotebook = validImg(slide.imageNotebook)
          const imgTablet = validImg(slide.imageTablet)
          const imgMobile = validImg(slide.imageMobile)
          const imgSingle = validImg(slide.image)

          const mainImg = imgSingle || imgFullhd || imgUltrawide || imgNotebook || imgTablet || imgMobile || '/foto-hero.jpeg'
          const targetLink = slide.primaryCtaLink || slide.secondaryCtaLink || null

          const slideInner = (
            <div
              key={slide.id || idx}
              className={`hero-slide ${isActive ? 'active' : ''}`}
              style={{
                backgroundImage: isMulti ? 'none' : `url(${mainImg})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                cursor: targetLink ? 'pointer' : 'default',
              }}
            >
              {isMulti ? (
                <picture style={{ width: '100%', height: '100%', display: 'block' }}>
                  {imgUltrawide && <source media="(min-width: 1921px)" srcSet={imgUltrawide} />}
                  {imgFullhd && <source media="(min-width: 1367px)" srcSet={imgFullhd} />}
                  {imgNotebook && <source media="(min-width: 1025px)" srcSet={imgNotebook} />}
                  {imgTablet && <source media="(min-width: 641px)" srcSet={imgTablet} />}
                  {imgMobile && <source media="(max-width: 640px)" srcSet={imgMobile} />}
                  <img
                    src={mainImg}
                    alt={slide.titleLine1 || 'Makse Hero'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </picture>
              ) : (
                /* Imagem responsiva direta para o modo Single */
                <img
                  src={mainImg}
                  alt={slide.titleLine1 || 'Makse Hero'}
                  className="hero-single-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'none' }}
                />
              )}
            </div>
          )

          return targetLink ? (
            <Link key={slide.id || idx} href={targetLink} style={{ display: 'block', textDecoration: 'none' }}>
              {slideInner}
            </Link>
          ) : slideInner
        })}
        {/* Soft overlay gradient */}
        <div className="hero-overlay" />
      </div>

      {/* Main Content Container */}
      {hasContent && (
        <div className="hero-main-container">
          <div className={`hero-box ${isMinimized ? 'minimized' : ''}`}>
            {/* Minimize Button (-) */}
            <button
              onClick={() => setIsMinimized(true)}
              className="hero-minimize-btn"
              aria-label="Minimizar conteúdo"
              title="Minimizar conteúdo"
            >
              <Minus size={15} strokeWidth={2.5} />
            </button>

            {active.label && <span className="section-label animate-fade">{active.label}</span>}
            <h1 className="hero-title animate-up">
              {active.titleLine1 && <span className="hero-title-line-1">{active.titleLine1}</span>}
              {active.titleLine2 && <span className="hero-title-line-2">{active.titleLine2}</span>}
            </h1>
            {active.description && (
              <p className="hero-description animate-up">
                {active.description}
              </p>
            )}
            <div className="hero-buttons animate-up">
              {active.primaryCtaText && (
                <Link href={active.primaryCtaLink || '/catalogo'} className="btn-primary">
                  {active.primaryCtaText}
                </Link>
              )}
              {active.secondaryCtaText && (
                <Link href={active.secondaryCtaLink || '/cadastro'} className="btn-outline">
                  {active.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide Navigation Arrows */}
      <button onClick={prevSlide} className="hero-arrow-btn prev" aria-label="Slide anterior">
        <ChevronLeft size={20} />
      </button>
      <button onClick={nextSlide} className="hero-arrow-btn next" aria-label="Próximo slide">
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="hero-dots">
        {slides.map((_, idx: number) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSlide(idx)
            }}
            className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
            aria-label={`Ir para slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Minimized Bottom Tab Button */}
      <button
        onClick={() => setIsMinimized(false)}
        className={`hero-maximize-tab ${isMinimized ? 'visible' : ''}`}
        aria-label="Expandir conteúdo"
      >
        <span style={{ marginRight: '0.5rem' }}>MAKSE • ABRIR CONTEÚDO</span>
        <Plus size={12} strokeWidth={2.5} />
      </button>

      <style>{`
        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          background-color: var(--cream);
          position: relative;
          overflow: hidden;
          padding-top: 80px;
          padding-bottom: 40px;
          width: 100%;
        }

        .hero-slides-container {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.2s ease-in-out;
          z-index: 0;
        }

        .hero-slide.active {
          opacity: 1;
          z-index: 1;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.4) 100%);
          z-index: 2;
          pointer-events: none;
        }

        .hero-main-container {
          max-width: 72rem;
          margin: 0 auto;
          padding: 0 1.5rem;
          width: 100%;
          position: relative;
          z-index: 3;
        }

        .hero-box {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px) saturate(120%);
          -webkit-backdrop-filter: blur(16px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 28px;
          box-shadow: 0 30px 60px -15px rgba(30, 41, 59, 0.08);
          position: relative;
          padding: clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.75rem);
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
          max-height: 800px;
          transition:
            opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
            max-height 0.5s ease,
            padding 0.5s ease,
            margin 0.5s ease;
          overflow: visible;
        }

        .hero-box.minimized {
          opacity: 0;
          transform: scale(0.8) translateY(100px);
          pointer-events: none;
          max-height: 0px;
          padding: 0px !important;
          margin: 0px auto !important;
          border-color: transparent !important;
          box-shadow: none !important;
          overflow: hidden;
        }

        .hero-minimize-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 10;
          padding: 0;
          outline: none;
        }

        .hero-minimize-btn:hover {
          background: var(--navy);
          border-color: var(--navy);
          color: #fff;
          transform: scale(1.08);
        }

        .hero-title {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(2.25rem, 5.5vw, 3.75rem);
          font-weight: 600;
          color: var(--navy);
          line-height: 1.06;
          margin: 0.5rem auto 1.25rem;
          text-align: center;
        }

        .hero-title-line-1 {
          display: block;
        }

        .hero-title-line-2 {
          display: block;
          font-weight: 400;
          font-style: italic;
          font-size: 0.92em;
          color: var(--gold);
          letter-spacing: 0.03em;
          margin-top: 0.1rem;
        }

        .hero-description {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.75;
          margin-bottom: 2rem;
          max-width: 480px;
        }

        .hero-buttons {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Arrows navigation styling */
        .hero-arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          z-index: 5;
          opacity: 0;
        }

        .hero-section:hover .hero-arrow-btn {
          opacity: 1;
        }

        .hero-arrow-btn.prev {
          left: 1.5rem;
        }

        .hero-arrow-btn.next {
          right: 1.5rem;
        }

        .hero-arrow-btn:hover {
          background: var(--navy);
          color: #fff;
          border-color: var(--navy);
          transform: translateY(-50%) scale(1.05);
        }

        /* Dots indicator styling */
        .hero-dots {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.6rem;
          z-index: 5;
        }

        .hero-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.15);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .hero-dot.active {
          background: var(--gold);
          transform: scale(1.3);
          width: 18px;
          border-radius: 4px;
        }

        .hero-maximize-tab {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translate(-50%, 40px);
          z-index: 10;
          opacity: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 1.5rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--cream-dark);
          border-radius: 99px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          color: var(--navy);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          outline: none;
          transition:
            opacity 0.4s ease,
            transform 0.4s cubic-bezier(0.25, 1, 0.5, 1),
            background 0.25s ease,
            border-color 0.25s ease;
        }

        .hero-maximize-tab.visible {
          opacity: 1;
          transform: translate(-50%, 0);
          pointer-events: auto;
          transition:
            opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hero-maximize-tab:hover {
          background: #ffffff;
          border-color: var(--navy);
          transform: translate(-50%, -2px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
        }

        /* ── RESPONSIVE MOBILE STYLING (Zero-crop responsive banner) ── */
        @media (max-width: 768px) {
          .hero-section {
            min-height: auto !important;
            height: auto !important;
            padding-top: 70px !important;
            padding-bottom: 0 !important;
            align-items: stretch !important;
            display: flex;
            flex-direction: column;
          }

          .hero-slides-container {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
          }

          .hero-slide {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transition: opacity 0.6s ease-in-out !important;
            z-index: 0 !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            background-position: center top !important;
          }

          .hero-slide.active {
            position: relative !important;
            opacity: 1 !important;
            z-index: 1 !important;
            height: auto !important;
          }

          .hero-slide picture,
          .hero-slide img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
            object-fit: contain !important;
          }

          .hero-single-img {
            display: block !important;
          }

          .hero-overlay {
            display: none !important; /* Visualização 100% nítida sem sombra no mobile */
          }

          .hero-main-container {
            margin-top: 0.5rem;
            position: relative;
            z-index: 4;
            padding: 0 1rem;
          }

          .hero-box {
            background: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0.75rem 0.5rem !important;
            max-width: 100%;
          }

          .hero-title {
            font-size: 1.8rem;
            margin: 0.25rem auto 0.5rem;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          }

          .hero-title-line-2 {
            margin-top: 0.05rem;
          }

          .hero-description {
            font-size: 0.8rem;
            line-height: 1.4;
            margin-bottom: 1rem;
            color: var(--navy);
            font-weight: 500;
          }

          .hero-arrow-btn {
            width: 34px;
            height: 34px;
            opacity: 0.85;
          }

          .hero-arrow-btn.prev {
            left: 0.25rem;
          }

          .hero-arrow-btn.next {
            right: 0.25rem;
          }

          .hero-dots {
            bottom: 0.5rem;
          }

          .hero-buttons {
            gap: 0.5rem;
          }

          .hero-buttons a {
            padding: 0.45rem 1.1rem !important;
            font-size: 0.75rem !important;
          }

          .hero-minimize-btn {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}
