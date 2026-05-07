import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

// POST: upload image for a product
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file || !productId) return NextResponse.json({ error: 'Arquivo e productId são obrigatórios' }, { status: 400 })

    const product = await prisma.product.findFirst({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    // Save file to public/uploads/products/{productId}/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId)
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${Date.now()}.${ext}`
    const filepath = path.join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/products/${productId}/${filename}`

    // Add to product images array
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { images: [...(Array.isArray(product.images) ? product.images as string[] : []), imageUrl] },
    })

    return NextResponse.json({ url: imageUrl, images: updated.images })
  } catch (err) {
    console.error('[images POST]', err)
    return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
  }
}

// DELETE: remove image from product
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { productId, imageUrl } = await req.json()
    if (!productId || !imageUrl) return NextResponse.json({ error: 'productId e imageUrl são obrigatórios' }, { status: 400 })

    const product = await prisma.product.findFirst({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    // Remove file from disk
    try {
      const filepath = path.join(process.cwd(), 'public', imageUrl)
      await unlink(filepath)
    } catch {
      // File may not exist, ignore
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { images: (Array.isArray(product.images) ? product.images as string[] : []).filter(img => img !== imageUrl) },
    })

    return NextResponse.json({ images: updated.images })
  } catch (err) {
    console.error('[images DELETE]', err)
    return NextResponse.json({ error: 'Erro ao remover imagem' }, { status: 500 })
  }
}

// PATCH: reorder images
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { productId, images } = await req.json()
    if (!productId || !Array.isArray(images)) return NextResponse.json({ error: 'productId e images são obrigatórios' }, { status: 400 })

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { images },
    })

    return NextResponse.json({ images: updated.images })
  } catch (err) {
    console.error('[images PATCH]', err)
    return NextResponse.json({ error: 'Erro ao reordenar imagens' }, { status: 500 })
  }
}
