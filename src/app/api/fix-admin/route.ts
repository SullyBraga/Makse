import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const email = 'admin@makse.com.br'

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Testar se 'admin123' bate com o hash atual
    const t0 = Date.now()
    const matchAdmin123 = await bcrypt.compare('admin123', user.passwordHash)
    const elapsed = Date.now() - t0

    // Primeiros e últimos chars do hash (para identificar sem expor)
    const hashPreview = user.passwordHash.substring(0, 20) + '...' + user.passwordHash.slice(-4)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      hashPreview,
      bcryptRounds: user.passwordHash.split('$')[2] ?? 'desconhecido',
      passwordIsAdmin123: matchAdmin123,
      bcryptTimeMs: elapsed,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Resetar a senha do admin para um valor conhecido
  const body = await request.json().catch(() => ({}))
  const newPassword: string = body.password ?? 'Makse2026!'
  const secret: string = body.secret ?? ''

  // Proteção simples: exige um "token" para não expor como endpoint aberto
  if (secret !== 'reset-makse-admin') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: 'admin@makse.com.br' },
    data: { passwordHash: hash },
  })

  return NextResponse.json({
    success: true,
    message: `Senha do admin atualizada para: ${newPassword}`,
  })
}
