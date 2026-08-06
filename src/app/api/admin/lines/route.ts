import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const lines = await prisma.productLine.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(lines)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  try {
    const { name, description } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome da linha é obrigatório' }, { status: 400 })
    }
    const cleanName = name.trim()
    const slug = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const newLine = await prisma.productLine.create({
      data: {
        name: cleanName,
        slug,
        description: description || `Produtos da linha ${cleanName}`,
      },
    })
    return NextResponse.json(newLine, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma linha com este nome' }, { status: 409 })
    }
    console.error('[lines POST]', err)
    return NextResponse.json({ error: 'Erro interno ao criar linha' }, { status: 500 })
  }
}

