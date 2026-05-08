import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Forçar o servidor a não fazer cache de páginas dinâmicas (Login e Admin)
  // Isso resolve o bug do JSON (RSC Payload) aparecendo na tela na Hostinger
  if (
    request.nextUrl.pathname.startsWith('/login') || 
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    // O header 'Vary: Accept' é crucial para a Hostinger não misturar HTML com JSON
    response.headers.set('Vary', 'Accept')
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/login/:path*', '/api/auth/:path*'],
}
