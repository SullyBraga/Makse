import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Next-Auth v5: usar `auth()` como proxy para ler o cookie correto.
// getToken() é API v4 e procura 'next-auth.session-token';
// auth.js v5 usa 'authjs.session-token' — daí o token sempre era null.
export const proxy = auth(function (req) {
  const session = req.auth
  const { pathname } = req.nextUrl

  // ── Proteger /admin ───────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL('/login', req.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const role = (session.user as { role?: string })?.role

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

  // ── Proteger /conta ───────────────────────────────────────────────────
  if (pathname.startsWith('/conta')) {
    if (!session) {
      const url = new URL('/login', req.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // ── Headers anti-cache ────────────────────────────────────────────────
  const response = NextResponse.next()
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
})

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*', '/login/:path*', '/api/auth/:path*'],
}
