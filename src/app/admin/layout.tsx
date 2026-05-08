import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LayoutDashboard, ShoppingBag, Users, Boxes, Package, Scissors, Layers, ShoppingCart } from 'lucide-react'
import AdminSignOut from '@/components/admin/AdminSignOut'
import AdminMobileToggle from '@/components/admin/AdminMobileToggle'

const nav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={15} /> },
  { label: 'Pedidos', href: '/admin/pedidos', icon: <ShoppingBag size={15} /> },
  { label: 'Produtos', href: '/admin/produtos', icon: <Package size={15} /> },
  { label: 'Kits', href: '/admin/kits', icon: <Layers size={15} /> },
  { label: 'Usuários', href: '/admin/usuarios', icon: <Users size={15} /> },
  { label: 'Estoque', href: '/admin/estoque', icon: <Boxes size={15} /> },
  { label: 'Vendas', href: '/admin/vendas', icon: <ShoppingCart size={15} /> },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Se não houver sessão ou papel autorizado, usamos um redirecionamento HTML puro
  // Isso evita o bug de exibir JSON na Hostinger
  if (!session || (role !== 'ADMIN' && role !== 'VENDEDOR')) {
    return (
      <html>
        <head>
          <meta http-equiv="refresh" content={`0; url=/login?redirect=/admin&v=${Date.now()}`} />
        </head>
        <body>
          <p>Redirecionando...</p>
        </body>
      </html>
    )
  }
  // Vendedores só têm acesso à página de vendas
  const isVendedor = role === 'VENDEDOR'

  const adminName = session.user?.name ?? 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>

      {/* Mobile Header */}
      <header style={{ display: 'none' }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--navy)' }}>
          <Link href="/admin" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', gap: '1px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.3rem', fontWeight: 300, letterSpacing: '0.28em', color: '#fff' }}>MAKSE</span>
            <span style={{ fontSize: '6px', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase' }}>— Admin —</span>
          </Link>
          <AdminMobileToggle />
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside id="admin-sidebar" style={{
          width: '210px', flexShrink: 0,
          background: 'var(--navy)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40,
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Logo */}
          <div style={{ padding: '1.75rem 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/admin" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', gap: '1px' }}>
              <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.4rem', fontWeight: 300, letterSpacing: '0.28em', color: '#fff' }}>MAKSE</span>
              <span style={{ fontSize: '7px', letterSpacing: '0.4em', color: 'var(--gold)', textTransform: 'uppercase' }}>— Admin —</span>
            </Link>
          </div>

          <div style={{ padding: '1.25rem 1.5rem 0.5rem' }}>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Gestão</span>
          </div>

          <nav style={{ flex: 1, padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {(isVendedor ? nav.filter(i => i.href === '/admin/vendas') : nav).map(item => (
              <Link key={item.href} href={item.href} className="admin-nav-item" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '10px', fontSize: '0.72rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.15s' }}>
                <span style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ margin: '0 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          <div style={{ padding: '1rem 0.75rem 1.25rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '0.25rem' }}>
              <Scissors size={13} style={{ color: 'var(--gold)' }} /> Ver site
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--cream-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
                {adminInitial}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isVendedor ? 'Vendedor' : 'Admin'}</p>
              </div>
            </div>
            <AdminSignOut />
          </div>
        </aside>

        {/* Overlay for mobile */}
        <div id="admin-overlay" style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 39 }} className="admin-overlay" />

        {/* Content */}
        <main style={{ marginLeft: '210px', flex: 1, padding: 'clamp(1.5rem,3vw,2.5rem)', minHeight: '100vh' }} className="admin-content">
          {children}
        </main>
      </div>

      <style>{`
        .admin-nav-item:hover { background: rgba(255,183,184,0.10); color: #fff !important; }

        @media (max-width: 768px) {
          .admin-mobile-header { display: block !important; }
          #admin-sidebar { transform: translateX(-100%); top: 0; }
          #admin-sidebar.open { transform: translateX(0); }
          .admin-content { margin-left: 0 !important; padding-top: 1.5rem !important; }
          .admin-overlay.show { display: block !important; }
        }
      `}</style>
    </div>
  )
}
