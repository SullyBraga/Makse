'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
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
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length)
    }, 6000) // auto-play every 6 seconds
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % SLIDES.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length)
  }

  return (
    <section className="hero-section">
      {/* Slides Background Container */}
      <div className="hero-slides-container">
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ))}
        {/* Soft overlay gradient */}
        <div className="hero-overlay" />
      </div>

      {/* Main Content Container */}
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

          <span className="section-label animate-fade">{SLIDES[currentSlide].label}</span>
          <h1 className="hero-title animate-up">
            <span className="hero-title-line-1">{SLIDES[currentSlide].titleLine1}</span>
            <span className="hero-title-line-2">{SLIDES[currentSlide].titleLine2}</span>
          </h1>
          <p className="hero-description animate-up">
            {SLIDES[currentSlide].description}
          </p>
          <div className="hero-buttons animate-up">
            <Link href={SLIDES[currentSlide].primaryCtaLink} className="btn-primary">
              {SLIDES[currentSlide].primaryCtaText}
            </Link>
            <Link href={SLIDES[currentSlide].secondaryCtaLink} className="btn-outline">
              {SLIDES[currentSlide].secondaryCtaText}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <button onClick={prevSlide} className="hero-arrow-btn prev" aria-label="Slide anterior">
        <ChevronLeft size={20} />
      </button>
      <button onClick={nextSlide} className="hero-arrow-btn next" aria-label="Próximo slide">
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="hero-dots">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
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

        /* ── RESPONSIVE MOBILE STYLING ── */
        @media (max-width: 768px) {
          .hero-section {
            min-height: 520px;
            height: 520px;
            padding-top: 60px;
            padding-bottom: 20px;
            align-items: flex-start; /* Shift content up */
          }

          .hero-slide {
            background-position: center bottom !important; /* Ensure products at bottom are visible */
          }

          .hero-overlay {
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.15) 100%);
            z-index: 2;
          }

          .hero-main-container {
            margin-top: 1.5rem; /* Space from header */
          }

          .hero-box {
            background: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 1rem 0.5rem !important;
            max-width: 100%;
          }

          .hero-title {
            font-size: 2.1rem;
            margin: 0.25rem auto 0.75rem;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
          }

          .hero-title-line-2 {
            margin-top: 0.05rem;
          }

          .hero-description {
            font-size: 0.82rem;
            line-height: 1.5;
            margin-bottom: 1.25rem;
            text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
            color: var(--navy); /* Make text darker for readability on white/green bg */
            font-weight: 500;
          }

          .hero-arrow-btn {
            width: 38px;
            height: 38px;
            opacity: 0.8;
          }

          .hero-arrow-btn.prev {
            left: 0.5rem;
          }

          .hero-arrow-btn.next {
            right: 0.5rem;
          }

          .hero-dots {
            bottom: 1rem;
          }

          .hero-buttons {
            gap: 0.5rem;
          }

          .hero-buttons a {
            padding: 0.5rem 1.25rem !important;
            font-size: 0.78rem !important;
          }

          .hero-minimize-btn {
            display: none; /* Hide minimize/maximize since we don't have block cards */
          }
        }
      `}</style>
    </section>
  )
}
