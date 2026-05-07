import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function VendasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) {
    redirect('/login?redirect=/vendas')
  }
  return <>{children}</>
}
