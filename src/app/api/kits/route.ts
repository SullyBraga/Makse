import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/kits — public catalog listing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const catalogOnly = searchParams.get('catalog') === 'true'

  const session = await auth()
  const role = (session?.user as any)?.role ?? 'guest'
  const isPro = role === 'CABELEIREIRA' || role === 'ADMIN'

  const kits = await prisma.kit.findMany({
    where: {
      active: true,
      archived: false,
      ...(catalogOnly && { showInCatalog: true }),
      ...(isPro ? {} : { items: { none: { product: { proOnly: true } } } }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, images: true, price: true, pricePro: true },
          },
        },
      },
    },
  })
  return NextResponse.json(kits)
}
