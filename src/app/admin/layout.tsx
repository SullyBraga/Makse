import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminMobileToggle from '@/components/admin/AdminMobileToggle'
import AdminContainer from '@/components/admin/AdminContainer'

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
      <header className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1.25rem', background: 'var(--navy)', height: '100%', boxSizing: 'border-box' }}>
          <Link href="/admin" style={{ display: 'block', textDecoration: 'none' }}>
            <Image src="/logo-makse.png" alt="Makse" width={110} height={35} style={{ objectFit: 'contain', height: 'auto', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <AdminMobileToggle />
        </div>
      </header>

      <AdminContainer role={role} adminName={adminName} adminInitial={adminInitial}>
        {children}
      </AdminContainer>

      <style>{`
        .admin-mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          z-index: 45;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .admin-mobile-header {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}
