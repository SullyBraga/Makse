import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import KitPageClient from './KitPageClient'

export const dynamic = 'force-dynamic'

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const role = (session?.user as any)?.role ?? 'guest'
  const isPro = role === 'CABELEIREIRA' || role === 'ADMIN'
  const isVendedor = role === 'VENDEDOR'

  const kit = await prisma.kit.findUnique({
    where: { slug, active: true },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: { select: { id: true, label: true, price: true, pricePro: true, priceVendedor: true, stock: true } },
            },
          },
        },
      },
    },
  })

  if (!kit) notFound()

  // Verify access for pro-only kits
  const hasProOnlyProduct = kit.items.some(item => item.product.proOnly)
  if (hasProOnlyProduct && !isPro) {
    notFound()
  }

  // Compute price for session role
  const price = isVendedor && kit.priceVendedor
    ? kit.priceVendedor
    : isPro && kit.pricePro
    ? kit.pricePro
    : kit.price

  return (
    <KitPageClient
      kit={{
        id: kit.id,
        name: kit.name,
        slug: kit.slug,
        sku: kit.sku,
        description: kit.description,
        images: kit.images as string[],
        price,
        pricePublic: kit.price,
        items: kit.items.map(item => ({
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            images: item.product.images as string[],
          },
        })),
      }}
      isPro={isPro}
    />
  )
}
