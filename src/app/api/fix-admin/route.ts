import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const email = 'bragasullivan@icloud.com'

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const t0 = Date.now()
    const matchPassword = await bcrypt.compare('12018181Aa@', user.passwordHash)
    const elapsed = Date.now() - t0

    const hashPreview = user.passwordHash.substring(0, 20) + '...' + user.passwordHash.slice(-4)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      hashPreview,
      bcryptRounds: user.passwordHash.split('$')[2] ?? 'desconhecido',
      passwordMatches: matchPassword,
      bcryptTimeMs: elapsed,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const targetEmail: string = body.email ?? 'bragasullivan@icloud.com'
  const newPassword: string = body.password ?? '12018181Aa@'
  const secret: string = body.secret ?? ''

  if (secret !== 'reset-makse-admin') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const hash = await bcrypt.hash(newPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {
      passwordHash: hash,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador Makse',
      email: targetEmail,
      passwordHash: hash,
      role: 'ADMIN',
    },
  })

  return NextResponse.json({
    success: true,
    message: `Usuário Admin ${adminUser.email} configurado com sucesso!`,
  })
}
