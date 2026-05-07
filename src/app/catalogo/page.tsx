import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import CatalogoClient from './CatalogoClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  const session = await auth()
  const role = (session?.user as any)?.role ?? 'guest'
  const discountPct: number = (session?.user as any)?.discountPct ?? 0
  const isPro = role === 'CABELEIREIRA' || role === 'ADMIN'

  const [products, lines, kits] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(isPro ? {} : { proOnly: false }),
      },
      include: {
        line: { select: { name: true, slug: true } },
        variants: { select: { stock: true, pricePro: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.productLine.findMany({ orderBy: { order: 'asc' } }),
    prisma.kit.findMany({
      where: { showInCatalog: true, active: true },
      include: {
        items: {
          include: { product: { select: { id: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serializedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: isPro && p.pricePro ? p.pricePro : p.price,
    productType: p.productType,
    weight: p.weight,
    proOnly: p.proOnly,
    featured: p.featured,
    images: p.images as string[],
    lineName: p.line?.name ?? null,
    lineSlug: p.line?.slug ?? null,
    totalStock: p.variants.reduce((t, v) => t + v.stock, 0),
    isKit: false as const,
  }))

  const serializedKits = kits.map(k => ({
    id: k.id,
    name: k.name,
    slug: k.slug,
    price: isPro && k.pricePro ? k.pricePro : k.price,
    productType: 'Kit' as string | null,
    weight: null,
    proOnly: false,
    featured: false,
    images: k.images as string[],
    lineName: null,
    lineSlug: null,
    totalStock: 99, // kits are virtual — no direct stock check here
    isKit: true as const,
  }))

  return (
    <CatalogoClient
      products={[...serializedProducts, ...serializedKits]}
      lines={lines}
      discountPct={discountPct}
      isPro={isPro}
      role={role}
    />
  )
}