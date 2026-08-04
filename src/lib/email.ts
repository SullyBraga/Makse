/**
 * Emails transacionais da Makse Profissional
 * Usando Resend (recomendado) ou Nodemailer como fallback
 */

// npm install resend
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // Produção: substituir por resend.emails.send(...)
  // const data = await resend.emails.send({ from: process.env.EMAIL_FROM!, to, subject, html })

  // Dev: logar no console
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email (dev):', { to, subject })
    return
  }
  throw new Error('Configure RESEND_API_KEY e descomente o código acima')
}

export async function sendOrderConfirmationEmail(to: string, order: { id: string; total: number }) {
  await sendEmail({
    to,
    subject: 'Pedido confirmado — Makse Profissional',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0d1b2a;padding:24px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:4px">MAKSE</h1>
          <p style="color:#64748b;font-size:10px;letter-spacing:3px;margin:4px 0 0">PROFISSIONAL</p>
        </div>
        <div style="padding:32px;background:#f8f4ef">
          <h2 style="color:#0d1b2a;font-size:20px;margin:0 0 16px">Pedido confirmado! ✓</h2>
          <p style="color:#6b6b6b;font-size:14px">Seu pedido <strong>#${order.id}</strong> foi confirmado e está sendo preparado.</p>
          <div style="background:#fff;border:1px solid #e2ddd6;padding:16px;margin:20px 0">
            <p style="margin:0;font-size:14px;color:#0d1b2a">Total: <strong>R$ ${order.total.toFixed(2).replace('.',',')}</strong></p>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/conta" style="display:inline-block;background:#0d1b2a;color:#fff;padding:12px 28px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">
            Acompanhar Pedido
          </a>
        </div>
        <div style="padding:16px;text-align:center;background:#0d1b2a">
          <p style="color:#ffffff50;font-size:11px;margin:0">© 2026 Makse Profissional • SS Cosméticos LTDA</p>
        </div>
      </div>
    `
  })
}

export async function sendStatusUpdateEmail(to: string, orderId: string, status: string) {
  const labels: Record<string, string> = {
    EM_SEPARACAO: 'está sendo separado',
    ENVIADO: 'foi enviado',
    ENTREGUE: 'foi entregue',
    CANCELADO: 'foi cancelado',
  }
  const label = labels[status] ?? 'foi atualizado'

  await sendEmail({
    to,
    subject: `Atualização do seu pedido — Makse Profissional`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0d1b2a;padding:24px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:4px">MAKSE</h1>
        </div>
        <div style="padding:32px;background:#f8f4ef">
          <h2 style="color:#0d1b2a;font-size:18px">Seu pedido ${label}!</h2>
          <p style="color:#6b6b6b;font-size:14px">Pedido <strong>#${orderId}</strong></p>
          <a href="${process.env.NEXTAUTH_URL}/conta" style="display:inline-block;background:#0d1b2a;color:#fff;padding:12px 28px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:20px">
            Ver Pedido
          </a>
        </div>
      </div>
    `
  })
}

export async function sendProfessionalApprovalEmail(to: string, name: string) {
  await sendEmail({
    to,
    subject: 'Parceria aprovada! — Makse Profissional',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0d1b2a;padding:24px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:4px">MAKSE</h1>
        </div>
        <div style="padding:32px;background:#f8f4ef">
          <h2 style="color:#0d1b2a">Parabéns, ${name}! ✦</h2>
          <p style="color:#6b6b6b;font-size:14px">Sua conta profissional foi aprovada. Agora você tem acesso ao catálogo completo e aos seus descontos exclusivos.</p>
          <a href="${process.env.NEXTAUTH_URL}/login" style="display:inline-block;background:#1e293b;color:#fff;padding:12px 28px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:20px">
            Acessar Minha Conta
          </a>
        </div>
      </div>
    `
  })
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/redefinir-senha?token=${token}`

  await sendEmail({
    to,
    subject: 'Redefinição de Senha — Makse Profissional',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #e2ddd6;border-radius:12px;overflow:hidden">
        <div style="background:#0d1b2a;padding:24px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:4px">MAKSE</h1>
          <p style="color:#c5a059;font-size:10px;letter-spacing:3px;margin:4px 0 0">PROFISSIONAL</p>
        </div>
        <div style="padding:32px;background:#fff">
          <h2 style="color:#0d1b2a;font-size:18px;margin:0 0 12px">Redefinição de Senha</h2>
          <p style="color:#475569;font-size:14px;line-height:1.5">Recebemos uma solicitação para redefinir a senha da sua conta na Makse Profissional.</p>
          <p style="color:#475569;font-size:14px;line-height:1.5">Clique no botão abaixo para escolher uma nova senha. O link é válido por 1 hora.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetLink}" style="display:inline-block;background:#0d1b2a;color:#c5a059;padding:14px 32px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;border-radius:6px">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px">Se você não solicitou a alteração de senha, ignore este e-mail.</p>
        </div>
        <div style="padding:16px;text-align:center;background:#0d1b2a">
          <p style="color:#ffffff50;font-size:11px;margin:0">© 2026 Makse Profissional • SS Cosméticos LTDA</p>
        </div>
      </div>
    `
  })
}

