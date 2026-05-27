import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminMobileToggle from '@/components/admin/AdminMobileToggle'
import AdminContainer from '@/components/admin/AdminContainer'

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
          <Link href="/admin" style={{ display: 'block', textDecoration: 'none' }}>
            <Image src="/logo-makse.png" alt="Makse" width={110} height={35} style={{ objectFit: 'contain', height: 'auto', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <AdminMobileToggle />
        </div>
      </header>

      <AdminContainer role={role} adminName={adminName} adminInitial={adminInitial}>
        {children}
      </AdminContainer>
    </div>
  )
}
