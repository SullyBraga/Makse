import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import KitFormEdit from './KitFormEdit'

export default async function EditarKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const kit = await prisma.kit.findFirst({
    where: { id, archived: false },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, images: true } },
        },
      },
    },
  })

  if (!kit) notFound()

  let relatedProductsData: { id: string; name: string; images: string[] }[] = []
  if (Array.isArray(kit.relatedProducts) && kit.relatedProducts.length > 0) {
    const rel = await prisma.product.findMany({
      where: { id: { in: kit.relatedProducts as string[] } },
      select: { id: true, name: true, images: true },
    })
    relatedProductsData = rel.map(p => ({ id: p.id, name: p.name, images: p.images as string[] }))
  }

  const defaultValues = {
    name: kit.name,
    sku: kit.sku ?? '',
    description: kit.description ?? '',
    price: kit.price.toString(),
    pricePro: kit.pricePro?.toString() ?? '',
    priceVendedor: kit.priceVendedor?.toString() ?? '',
    showInCatalog: kit.showInCatalog,
    showAsSuggestion: kit.showAsSuggestion,
    active: kit.active,
    images: kit.images as string[],
    relatedProductsData,
    items: kit.items.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      product: { id: i.product.id, name: i.product.name, sku: i.product.sku, images: i.product.images as string[] },
      variantLabel: 'Padrão',
    })),
  }

  return <KitFormEdit kitId={id} defaultValues={defaultValues} />
}
