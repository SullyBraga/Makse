import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })

    // Always return success response to prevent account enumeration
    if (user) {
      // Delete any existing reset tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email: cleanEmail } })

      // Generate a secure random 64-char token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          email: cleanEmail,
          token,
          expiresAt,
        },
      })

      // Trigger transactional email
      try {
        await sendPasswordResetEmail(cleanEmail, token)
      } catch (emailErr) {
        console.error('[forgot-password sendEmail error]', emailErr)
      }
    }

    return NextResponse.json({
      message: 'Se o e-mail estiver cadastrado em nosso sistema, você receberá um link para redefinir sua senha em instantes.',
    })
  } catch (err) {
    console.error('[forgot-password error]', err)
    return NextResponse.json({ error: 'Erro interno ao processar solicitação' }, { status: 500 })
  }
}
