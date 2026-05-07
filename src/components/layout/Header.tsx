'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, User, Menu, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session, status } = useSession()
  const role = (session?.user as any)?.role
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { items, toggleDrawer, lastAdded } = useCartStore()
  const cartCount = items.reduce((t, i) => t + i.quantity, 0)

  // Badge bounce fires on every new add (lastAdded changes)
  const [cartBounce, setCartBounce] = useState(false)
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (lastAdded === 0) return
    setCartBounce(true)
    const t = setTimeout(() => setCartBounce(false), 800)
    return () => clearTimeout(t)
  }, [lastAdded])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMenuOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const navLinks = [['Início', '/'], ['Linhas', '/linhas'], ['Catálogo', '/catalogo'], ['Sobre', '/sobre']]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'background 0.4s ease, box-shadow 0.4s ease',
      background: 'rgba(255,255,255,0.97)',
      boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.07)' : 'none',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
    }}>
      {/* Topbar */}
      <div style={{ background: 'var(--navy)', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', margin: 0 }}>
          Frete grátis acima de R$&nbsp;299 • Parcelamento em até 12x
        </p>
      </div>

      {/* Main nav */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image src="/logo-makse.png" alt="Makse Profissional" width={120} height={35} style={{ objectFit: 'contain', height: 'auto' }} />
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }}>
          {navLinks.map(([l, h]) => (
            <Link key={h} href={h} style={{
              position: 'relative',
              fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--navy)', textDecoration: 'none', fontWeight: 500,
              transition: 'color 0.3s ease',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--text-muted)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--navy)' }}
            >{l}</Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {status === 'authenticated' ? (
              <>
                <Link href={role === 'ADMIN' ? '/admin' : '/conta'} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--navy)', textDecoration: 'none',
                  transition: 'opacity 0.25s ease',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <User size={14} /> {session.user?.name?.split(' ')[0]}
                </Link>
                <button onClick={() => signOut()} style={{
                  background: 'none', border: 'none',
                  fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  transition: 'color 0.25s ease, opacity 0.25s ease',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >Sair</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--navy)', textDecoration: 'none',
                  transition: 'opacity 0.25s ease',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <User size={14} /> Login
                </Link>
                <Link href="/cadastro" className="btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.65rem' }}>
                  Inscreva-se
                </Link>
              </>
            )}
          </div>

          {/* Cart — badge reage ao lastAdded, sem abrir o drawer */}
          <button
            onClick={toggleDrawer}
            style={{
              position: 'relative', padding: '0.5rem',
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--navy)',
              display: 'flex', borderRadius: '10px',
              transition: 'background 0.3s ease, color 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          >
            <ShoppingBag size={20} />

            {cartCount > 0 && (
              <span
                key={lastAdded}  /* força re-mount para restartar animação */
                style={{
                  position: 'absolute', top: '1px', right: '1px',
                  background: cartBounce ? '#16a34a' : 'var(--navy)',
                  color: '#fff',
                  fontSize: '8px', fontWeight: 800,
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #fff',
                  lineHeight: 1,
                  transition: 'background 0.5s ease',
                  animation: cartBounce ? 'badgePop 0.7s cubic-bezier(0.34,1.2,0.64,1) both' : 'none',
                }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}

            {/* Anel de pulso dourado — só aparece no add */}
            {cartBounce && (
              <span style={{
                position: 'absolute', inset: 0,
                borderRadius: '10px',
                border: '1.5px solid var(--gold)',
                animation: 'ringPulse 0.8s ease-out forwards',
                pointerEvents: 'none',
              }} />
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--navy)', padding: '0.35rem',
              borderRadius: '8px', transition: 'background 0.25s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--cream)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
          >
            <div style={{ transition: 'transform 0.3s ease', transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile drawer — slide suave */}
      <div style={{
        overflow: 'hidden',
        maxHeight: menuOpen ? '500px' : '0',
        transition: 'max-height 0.45s ease',
      }}>
        <div style={{ background: '#fff', borderTop: '1px solid var(--cream)', padding: '1.25rem 1.5rem 2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {navLinks.map(([l, h]) => (
              <Link key={h} href={h} onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: '0.82rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--navy)', textDecoration: 'none', fontWeight: 500,
                  padding: '0.9rem 0', borderBottom: '1px solid var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'color 0.25s ease, opacity 0.25s ease',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                {l} <span style={{ opacity: 0.3 }}>›</span>
              </Link>
            ))}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {status === 'authenticated' ? (
                <>
                  <Link href={role === 'ADMIN' ? '/admin' : '/conta'} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--navy)', textDecoration: 'none' }}>
                    <User size={15} /> Minha Conta
                  </Link>
                  <button onClick={() => { signOut(); setMenuOpen(false) }} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--navy)', textDecoration: 'none' }}>
                    <User size={15} /> Entrar
                  </Link>
                  <Link href="/cadastro" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0.6rem 1.25rem' }}>
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav      { display: none !important; }
          .mobile-menu-btn  { display: flex !important; }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.6); }
          45%  { transform: scale(1.35); }
          70%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2);   opacity: 0; }
        }
      `}</style>
    </header>
  )
}