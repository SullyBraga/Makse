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
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const tables = await prisma.discountTable.findMany({ orderBy: { percentage: 'asc' } })
  // Deduplicate by name+percentage in case the DB has duplicate entries
  const seen = new Set<string>()
  const unique = tables.filter(t => {
    const key = `${t.name}|${t.percentage}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return NextResponse.json(unique)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, percentage } = body

    if (!name || percentage === undefined) {
      return NextResponse.json({ error: 'Nome e porcentagem são obrigatórios' }, { status: 400 })
    }

    const numPercentage = parseFloat(percentage)
    if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
      return NextResponse.json({ error: 'A porcentagem deve ser um número entre 0 e 100' }, { status: 400 })
    }

    const cleanName = name.trim()
    if (cleanName.length === 0) {
      return NextResponse.json({ error: 'O nome não pode estar vazio' }, { status: 400 })
    }

    const newTable = await prisma.discountTable.create({
      data: {
        name: cleanName,
        percentage: numPercentage,
      },
    })

    return NextResponse.json(newTable, { status: 201 })
  } catch (err) {
    console.error('[discount-tables POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da tabela é obrigatório' }, { status: 400 })
    }

    // Set users referencing this table to null first
    await prisma.user.updateMany({
      where: { discountTableId: id },
      data: { discountTableId: null },
    })

    // Delete the table
    await prisma.discountTable.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[discount-tables DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

