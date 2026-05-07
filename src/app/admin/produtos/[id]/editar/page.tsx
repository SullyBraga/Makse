import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { id },
    include: { variants: true },
  })
  if (!product) notFound()

  // Fetch related products data so ProductForm can show them by name
  let relatedProductsData: { id: string; name: string; images: string[] }[] = []
  if (Array.isArray(product.relatedProducts) && product.relatedProducts.length > 0) {
    const relatedProds = await prisma.product.findMany({
      where: { id: { in: product.relatedProducts as string[] } },
      select: { id: true, name: true, images: true },
    })
    relatedProductsData = relatedProds.map(p => ({ id: p.id, name: p.name, images: p.images as string[] }))
  }

  return <ProductForm mode="edit" initialData={{ ...product, relatedProductsData }} />
}
