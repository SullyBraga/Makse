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
    const { street, number, complement, city, state, zipCode, country, isDefault } = body

    const dataUpdate: any = {}
    if (street !== undefined) dataUpdate.street = street
    if (number !== undefined) dataUpdate.number = number
    if (complement !== undefined) dataUpdate.complement = complement || null
    if (city !== undefined) dataUpdate.city = city
    if (state !== undefined) dataUpdate.state = state
    if (zipCode !== undefined) dataUpdate.zipCode = zipCode
    if (country !== undefined) dataUpdate.country = country || 'Brasil'
    if (isDefault !== undefined) dataUpdate.isDefault = !!isDefault

    if (isDefault === undefined || street !== undefined) {
      if (!street || !number || !city || !state || !zipCode) {
        return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
      }
    }

    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false }
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: dataUpdate,
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
