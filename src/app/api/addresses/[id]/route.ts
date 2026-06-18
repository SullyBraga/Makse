import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Verify address ownership
    const address = await prisma.address.findUnique({
      where: { id }
    })

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Endereço não encontrado ou não autorizado' }, { status: 404 })
    }

    const body = await req.json()
    const { street, number, complement, city, state, zipCode, country } = body

    if (!street || !number || !city || !state || !zipCode) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        street,
        number,
        complement: complement || null,
        city,
        state,
        zipCode,
        country: country || 'Brasil',
      }
    })

    return NextResponse.json(updatedAddress)
  } catch (err) {
    console.error('[address PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Verify address ownership
    const address = await prisma.address.findUnique({
      where: { id }
    })

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Endereço não encontrado ou não autorizado' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[address DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
