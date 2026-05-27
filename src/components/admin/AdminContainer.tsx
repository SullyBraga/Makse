'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, ShoppingBag, Users, Boxes, Package, Scissors, Layers, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import AdminSignOut from '@/components/admin/AdminSignOut'

const nav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={15} /> },
  { label: 'Pedidos', href: '/admin/pedidos', icon: <ShoppingBag size={15} /> },
  { label: 'Produtos', href: '/admin/produtos', icon: <Package size={15} /> },
  { label: 'Kits', href: '/admin/kits', icon: <Layers size={15} /> },
  { label: 'Usuários', href: '/admin/usuarios', icon: <Users size={15} /> },
  { label: 'Estoque', href: '/admin/estoque', icon: <Boxes size={15} /> },
  { label: 'Vendas', href: '/admin/vendas', icon: <ShoppingCart size={15} /> },
]

export default function AdminContainer({
  children,
  role,
  adminName,
  adminInitial
}: {
  children: React.ReactNode
  role: string
  adminName: string
  adminInitial: string
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isVendedor = role === 'VENDEDOR'

  // Garante a montagem inicial no cliente e lê o localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
      const saved = localStorage.getItem('admin_sidebar_collapsed')
      if (saved === 'true') {
        setIsCollapsed(true)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('admin_sidebar_collapsed', String(nextState))
  }

  const closeSidebarMobile = () => {
    const sidebar = document.getElementById('admin-sidebar')
    const overlay = document.getElementById('admin-overlay')
    sidebar?.classList.remove('open')
    overlay?.classList.remove('show')
    window.dispatchEvent(new Event('close-admin-sidebar'))
  }

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebarMobile()
    }
  }

  const handleOverlayClick = () => {
    closeSidebarMobile()
  }

  // Evita layout shift na montagem inicial exibindo a sidebar padrão de 210px
  const sidebarWidth = mounted && isCollapsed ? '70px' : '210px'

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside id="admin-sidebar" style={{
        width: sidebarWidth, flexShrink: 0,
        background: 'var(--navy)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40,
        boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
        transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Logo */}
        <div className="sidebar-logo-container" style={{ padding: mounted && isCollapsed ? '1.75rem 0.5rem 1.5rem' : '1.75rem 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '88px' }}>
          {mounted && isCollapsed ? (
            <Link href="/admin" onClick={handleLinkClick} style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.05em' }}>M</Link>
          ) : (
            <Link href="/admin" onClick={handleLinkClick} style={{ display: 'block', textDecoration: 'none' }}>
              <Image src="/logo-makse.png" alt="Makse" width={110} height={35} style={{ objectFit: 'contain', height: 'auto', filter: 'brightness(0) invert(1)' }} />
            </Link>
          )}

          {/* Botão de Toggle */}
          <button
            onClick={toggleCollapse}
            style={{
              position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
              width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gold)', color: '#fff',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 50, transition: 'all 0.2s'
            }}
            className="sidebar-toggle-btn"
          >
            {mounted && isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Gestão Label */}
        <div style={{ padding: mounted && isCollapsed ? '1.25rem 0.5rem 0.5rem' : '1.25rem 1.5rem 0.5rem', textAlign: mounted && isCollapsed ? 'center' : 'left' }}>
          {mounted && isCollapsed ? (
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>•••</span>
          ) : (
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Gestão</span>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {(isVendedor ? nav.filter(i => i.href === '/admin/vendas') : nav).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-nav-item"
              onClick={handleLinkClick}
              title={mounted && isCollapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: mounted && isCollapsed ? 'center' : 'flex-start',
                gap: mounted && isCollapsed ? '0' : '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '10px',
                fontSize: '0.72rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none', transition: 'all 0.15s'
              }}
            >
              <span style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {!(mounted && isCollapsed) && item.label}
            </Link>
          ))}
        </nav>

        <div style={{ margin: '0 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {/* Rodapé da Sidebar */}
        <div style={{ padding: '1rem 0.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: mounted && isCollapsed ? 'center' : 'stretch' }}>
          <Link href="/" onClick={handleLinkClick} title={mounted && isCollapsed ? 'Ver site' : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: mounted && isCollapsed ? 'center' : 'flex-start', gap: mounted && isCollapsed ? '0' : '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            <Scissors size={13} style={{ color: 'var(--gold)' }} />
            {!(mounted && isCollapsed) && 'Ver site'}
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: mounted && isCollapsed ? 'center' : 'flex-start', gap: '0.625rem', padding: '0.5rem 0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--cream-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
              {adminInitial}
            </div>
            {!(mounted && isCollapsed) && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isVendedor ? 'Vendedor' : 'Admin'}</p>
              </div>
            )}
          </div>
          
          <AdminSignOut isCollapsed={mounted && isCollapsed} />
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div id="admin-overlay" onClick={handleOverlayClick} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 39 }} className="admin-overlay" />

      {/* Content */}
      <main style={{ marginLeft: sidebarWidth, flex: 1, padding: 'clamp(1.5rem,3vw,2.5rem)', minHeight: '100vh', transition: 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)' }} className="admin-content">
        {children}
      </main>

      <style>{`
        .admin-nav-item:hover { background: rgba(100,116,139,0.12); color: #fff !important; }
        .sidebar-toggle-btn:hover { background: #cbd5e1 !important; color: var(--navy) !important; transform: translateY(-50%) scale(1.08) !important; }

        @media (max-width: 768px) {
          #admin-sidebar { 
            transform: translateX(-100%) !important; 
            width: 210px !important; 
            top: 56px !important;
          }
          #admin-sidebar.open { transform: translateX(0) !important; }
          .sidebar-logo-container { display: none !important; }
          .admin-content { margin-left: 0 !important; padding-top: calc(56px + 1.5rem) !important; }
          .admin-overlay.show { display: block !important; }
          .sidebar-toggle-btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}
