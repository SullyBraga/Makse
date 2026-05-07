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

// GET /api/admin/kits
export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  const limit = parseInt(searchParams.get('limit') ?? '200')

  const kits = await prisma.kit.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, images: true } },
        },
      },
    },
  })
  return NextResponse.json(kits)
}

// POST /api/admin/kits
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      name, sku, description, images,
      price, pricePro, priceVendedor,
      showInCatalog, showAsSuggestion, active,
      items, // [{ productId, variantId?, quantity }]
    } = body

    if (!name || price == null) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })
    }

    const slug = toSlug(name)

    const kit = await prisma.kit.create({
      data: {
        name,
        slug,
        sku: sku || null,
        description: description || null,
        images: images || [],
        price: parseFloat(price),
        pricePro: pricePro ? parseFloat(pricePro) : null,
        priceVendedor: priceVendedor ? parseFloat(priceVendedor) : null,
        showInCatalog: !!showInCatalog,
        showAsSuggestion: showAsSuggestion !== false,
        active: active !== false,
        items: {
          create: (items || []).map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            quantity: parseInt(i.quantity) || 1,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(kit, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Nome ou SKU já cadastrado' }, { status: 409 })
    console.error('[kits POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH /api/admin/kits
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id, items, relatedProducts, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    if (updates.price) updates.price = parseFloat(updates.price)
    if (updates.pricePro) updates.pricePro = parseFloat(updates.pricePro)
    if (updates.priceVendedor) updates.priceVendedor = parseFloat(updates.priceVendedor)
    if (updates.name) updates.slug = toSlug(updates.name)
    if (relatedProducts !== undefined) updates.relatedProducts = Array.isArray(relatedProducts) ? relatedProducts : []

    const kit = await prisma.kit.update({
      where: { id },
      data: {
        ...updates,
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((i: any) => ({
              productId: i.productId,
              variantId: i.variantId || null,
              quantity: parseInt(i.quantity) || 1,
            })),
          },
        }),
      },
      include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } },
    })

    return NextResponse.json(kit)
  } catch (err) {
    console.error('[kits PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/admin/kits
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    await prisma.kitItem.deleteMany({ where: { kitId: id } })
    await prisma.kit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[kits DELETE]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
