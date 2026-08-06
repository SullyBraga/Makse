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
    const products = await prisma.product.findMany({
      where: { archived: false },
      include: {
        line: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch related products names if needed
    const allProducts = await prisma.product.findMany({ select: { id: true, name: true } })
    const productMap = new Map(allProducts.map(p => [p.id, p.name]))

    const rows = products.map(p => {
      const firstVariant = p.variants[0]
      const totalStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
      
      const relatedNames = Array.isArray(p.relatedProducts)
        ? (p.relatedProducts as string[])
            .map(id => productMap.get(id) || id)
            .join(', ')
        : ''

      return {
        'Linha': p.line?.name ?? '',
        'Nome do Produto': p.name,
        'SKU': p.sku ?? '',
        'Quantidade': p.weight ?? '',
        'Ativos': p.ingredients ?? '',
        'Tipo de Produto': p.productType ?? '',
        'Indicação de uso': p.usage ?? '',
        'Descrição': p.description ?? '',
        'Produtos Relacionados': relatedNames,
        'Quantidade em Estoque': totalStock,
        'Preço Para Cliente Final': p.price,
        'Preço De (Original)': p.originalPrice ?? firstVariant?.originalPrice ?? '',
        'Preço Para Profissional': p.pricePro ?? firstVariant?.pricePro ?? '',
        'Preço para Vendedor/Representante/Distribuidor': p.priceVendedor ?? firstVariant?.priceVendedor ?? '',
        'Exclusivo Profissional': p.proOnly ? 'Sim' : 'Não',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="produtos-makse-${Date.now()}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('[products/export]', err)
    return NextResponse.json({ error: 'Erro ao exportar produtos' }, { status: 500 })
  }
}
