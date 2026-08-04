import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token de redefinição inválido ou ausente' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Token inválido ou expirado. Solicite uma nova redefinição de senha.' }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'Este link de redefinição expirou. Solicite um novo link.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update user password and delete used token
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      }),
    ])

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' })
  } catch (err) {
    console.error('[reset-password error]', err)
    return NextResponse.json({ error: 'Erro interno ao redefinir a senha' }, { status: 500 })
  }
}
