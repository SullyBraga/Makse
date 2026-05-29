'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Minus, Plus } from 'lucide-react'

export default function HeroSection() {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: 'var(--cream)', position: 'relative', overflow: 'hidden', paddingTop: '80px', paddingBottom: '40px' }}>
      {/* Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 1 }}>
        <img
          src="/foto-hero.jpeg"
          alt="Makse Cosmética Avançada"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 1, filter: 'none' }}
        />
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', width: '100%', position: 'relative', zIndex: 2 }}>
        <div
          className={`hero-box ${isMinimized ? 'minimized' : ''}`}
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px) saturate(120%)',
            WebkitBackdropFilter: 'blur(16px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '28px',
            boxShadow: '0 30px 60px -15px rgba(30, 41, 59, 0.08)',
            position: 'relative',
          }}
        >
          {/* Minimize Button (-) */}
          <button
            onClick={() => setIsMinimized(true)}
            className="hero-minimize-btn"
            aria-label="Minimizar conteúdo"
            title="Minimizar conteúdo"
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>

          <span className="section-label animate-fade" style={{ animationDelay: '0.15s' }}>Cosmética Avançada</span>
          <h1
            className="animate-up"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 'clamp(2.25rem,5.5vw,3.75rem)', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.06, margin: '0.5rem auto 1.25rem', textAlign: 'center', animationDelay: '0.25s' }}
          >
            <span style={{ display: 'block' }}>Beleza que se sente</span>
            <span style={{ display: 'block', fontWeight: 400, fontStyle: 'italic', fontSize: '0.92em', color: 'var(--gold)', letterSpacing: '0.03em', marginTop: '0.1rem' }}>no toque</span>
          </h1>
          <p className="animate-up" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: '480px', animationDelay: '0.35s' }}>
            Fórmulas exclusivas desenvolvidas para profissionais que exigem performance e clientes que buscam transformação real.
          </p>
          <div className="animate-up" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.45s' }}>
            <Link href="/catalogo" className="btn-primary">Explorar Coleção</Link>
            <Link href="/cadastro" className="btn-outline">Cadastro Pro</Link>
          </div>
        </div>
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
        .hero-box {
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
          transition: 
            opacity 0.4s ease, 
            transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), 
            max-height 0.4s ease, 
            padding 0.4s ease,
            margin 0.4s ease;
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
        .hero-minimize-btn:active {
          transform: scale(0.95);
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
        .hero-maximize-tab:active {
          transform: translate(-50%, 0) scale(0.98);
        }
      `}</style>
    </section>
  )
}
