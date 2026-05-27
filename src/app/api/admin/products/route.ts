import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

async function requireAdminOrSeller() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) return null
  return session
}

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  const session = await requireAdminOrSeller()  // VENDEDOR pode buscar produtos
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  const limit = parseInt(searchParams.get('limit') ?? '200')

  const products = await prisma.product.findMany({
    where: search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { line: { select: { name: true } }, variants: true },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, sku, description, ingredients, howToUse, usage, productType, weight,
      price, pricePro, priceVendedor, lineId, proOnly, featured, active, variants, relatedProducts } = body

    if (!name || !price) return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })

    const slug = toSlug(name)

    const product = await prisma.product.create({
      data: {
        name, slug, sku: sku || null,
        description: description || '',
        ingredients: ingredients || null,
        howToUse: howToUse || null,
        usage: usage || null,
        productType: productType || null,
        weight: weight || null,
        price: parseFloat(price),
        pricePro: pricePro ? parseFloat(pricePro) : null,
        priceVendedor: priceVendedor ? parseFloat(priceVendedor) : null,
        lineId: lineId || null,
        proOnly: !!proOnly,
        featured: !!featured,
        active: active !== false,
        images: [],
        relatedProducts: Array.isArray(relatedProducts) ? relatedProducts : [],
        variants: variants?.length > 0 ? {
          create: variants.map((v: any) => ({
            label: v.label,
            price: parseFloat(v.price) || parseFloat(price),
            pricePro: v.pricePro ? parseFloat(v.pricePro) : null,
            priceVendedor: v.priceVendedor ? parseFloat(v.priceVendedor) : null,
            stock: parseInt(v.stock) || 0,
          }))
        } : {
          create: [{ label: 'Padrão', price: parseFloat(price),
            pricePro: pricePro ? parseFloat(pricePro) : null,
            priceVendedor: priceVendedor ? parseFloat(priceVendedor) : null,
            stock: 0 }]
        },
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Nome ou SKU já cadastrado' }, { status: 409 })
    console.error('[products POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id, variants, relatedProducts, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    if (updates.price != null) updates.price = parseFloat(updates.price)
    if (updates.pricePro != null) updates.pricePro = updates.pricePro ? parseFloat(updates.pricePro) : null
    if (updates.priceVendedor != null) updates.priceVendedor = updates.priceVendedor ? parseFloat(updates.priceVendedor) : null
    if (updates.name) updates.slug = toSlug(updates.name)
    if (relatedProducts !== undefined) updates.relatedProducts = Array.isArray(relatedProducts) ? relatedProducts : []

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: updates,
      })

      // Replace variants if provided
      if (Array.isArray(variants)) {
        // Get existing variants to match by position/label
        const existing = await tx.productVariant.findMany({ where: { productId: id }, orderBy: { id: 'asc' } })

        for (let i = 0; i < variants.length; i++) {
          const v = variants[i]
          const vData = {
            label: v.label,
            price: parseFloat(v.price) || 0,
            pricePro: v.pricePro ? parseFloat(v.pricePro) : null,
            priceVendedor: v.priceVendedor ? parseFloat(v.priceVendedor) : null,
            stock: parseInt(v.stock) || 0,
          }
          if (existing[i]) {
            await tx.productVariant.update({ where: { id: existing[i].id }, data: vData })
          } else {
            await tx.productVariant.create({ data: { productId: id, ...vData } })
          }
        }
        // Remove extra variants
        if (existing.length > variants.length) {
          const toDelete = existing.slice(variants.length).map(v => v.id)
          await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } })
        }
      }

      return updated
    })

    return NextResponse.json(product)
  } catch (err) {
    console.error('[products PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const { id, ids } = body

    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ error: 'ID ou IDs obrigatórios' }, { status: 400 })
    }

    const idList = ids && Array.isArray(ids) ? ids : [id]

    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: { in: idList } } })
      await tx.product.deleteMany({ where: { id: { in: idList } } })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[products DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
