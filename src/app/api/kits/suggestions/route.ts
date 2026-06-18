import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/kits/suggestions?productId=xxx
// Returns kits that include the given product and have showAsSuggestion: true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 })
  }

  const session = await auth()
  const role = (session?.user as any)?.role ?? 'guest'
  const isPro = role === 'CABELEIREIRA' || role === 'ADMIN'

  const kits = await prisma.kit.findMany({
    where: {
      active: true,
      archived: false,
      showAsSuggestion: true,
      AND: [
        { items: { some: { productId } } },
        isPro ? {} : { items: { none: { product: { proOnly: true } } } }
      ]
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, images: true, price: true, pricePro: true },
          },
        },
      },
    },
    take: 4,
  })

  return NextResponse.json(kits)
}
