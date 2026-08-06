import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const kits = await prisma.kit.findMany({
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const rows = kits.map((k: any) => {
      const itemsList = (k.items || [])
        .map((i: any) => `${i.quantity}x ${i.product.name}${i.product.sku ? ` (${i.product.sku})` : ''}`)
        .join('; ')

      return {
        'Nome do Kit': k.name,
        'SKU': k.sku ?? '',
        'Itens do Kit': itemsList,
        'Preço Cliente Final': k.price,
        'Preço De (Original)': k.originalPrice ?? '',
        'Preço Profissional': k.pricePro ?? '',
        'Preço Vendedor': k.priceVendedor ?? '',
        'Exibir no Catálogo': k.showInCatalog ? 'Sim' : 'Não',
        'Exibir como Sugestão': k.showAsSuggestion ? 'Sim' : 'Não',
        'Status': k.active ? 'Ativo' : 'Inativo',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kits')

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="kits-makse-${Date.now()}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('[kits/export]', err)
    return NextResponse.json({ error: 'Erro ao exportar kits' }, { status: 500 })
  }
}
