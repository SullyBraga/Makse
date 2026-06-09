import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/addresses — List all saved addresses for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { addresses: { orderBy: { createdAt: 'desc' } as any } }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(user.addresses)
  } catch (err) {
    console.error('[addresses GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST /api/addresses — Create a new address for the logged-in user
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { street, number, complement, city, state, zipCode, country } = body

    if (!street || !number || !city || !state || !zipCode) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        street,
        number,
        complement: complement || null,
        city,
        state,
        zipCode,
        country: country || 'Brasil',
      }
    })

    return NextResponse.json(newAddress, { status: 201 })
  } catch (err) {
    console.error('[addresses POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
