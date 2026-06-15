import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(coupons)
  } catch (err) {
    console.error('[coupons GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const { code, discountType, value, minOrderValue, expiresAt, usageLimit } = body

    if (!code || !discountType || value === undefined) {
      return NextResponse.json({ error: 'Código, tipo de desconto e valor são obrigatórios' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()
    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      return NextResponse.json({ error: 'Tipo de desconto inválido' }, { status: 400 })
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json({ error: 'O valor do desconto deve ser maior que zero' }, { status: 400 })
    }

    // Check unique code
    const existing = await prisma.coupon.findUnique({ where: { code: cleanCode } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe um cupom com este código' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType,
        value: numValue,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (err) {
    console.error('[coupons POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[coupons DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
