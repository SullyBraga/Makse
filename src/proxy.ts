import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = req.nextUrl

  // Proteger rotas /admin
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const role = token.role as string

    // VENDEDOR: só tem acesso à página e APIs de vendas, produtos e kits
    if (role === 'VENDEDOR') {
      const allowedForVendedor = [
        '/admin/vendas',
        '/api/admin/sales',
        '/api/admin/users-list',
        '/api/admin/products',
        '/api/admin/kits',
      ]
      const allowed = allowedForVendedor.some(p => pathname.startsWith(p))
      if (!allowed) return NextResponse.redirect(new URL('/admin/vendas', req.url))
    } else if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Proteger rotas /conta — exige autenticação
  if (pathname.startsWith('/conta')) {
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  const response = NextResponse.next()

  // Forçar o servidor a não fazer cache de páginas dinâmicas (Login e Admin)
  // Isso resolve o bug do JSON (RSC Payload) aparecendo na tela na Hostinger
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/auth')
  ) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Vary', 'Accept')
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*', '/login/:path*', '/api/auth/:path*'],
}
