import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/upload'
import path from 'path'

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || role !== 'ADMIN') return null
  return session
}

// POST: upload image for a kit
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })

    const kit = await prisma.kit.findUnique({ where: { id } })
    if (!kit) return NextResponse.json({ error: 'Kit não encontrado' }, { status: 404 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${Date.now()}.${ext}`

    // Save image persistently using helper
    const imageUrl = await saveUploadedFile(file, `kits/${id}`, filename)

    const updated = await prisma.kit.update({
      where: { id },
      data: { images: [...(kit.images as string[]), imageUrl] },
    })

    return NextResponse.json({ url: imageUrl, images: updated.images })
  } catch (err) {
    console.error('[kit images POST]', err)
    return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
  }
}

// DELETE: remove image from kit
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params

  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url é obrigatório' }, { status: 400 })

    const kit = await prisma.kit.findUnique({ where: { id } })
    if (!kit) return NextResponse.json({ error: 'Kit não encontrado' }, { status: 404 })

    // Remove file persistently using helper
    await deleteUploadedFile(url)

    const updated = await prisma.kit.update({
      where: { id },
      data: { images: (kit.images as string[]).filter(u => u !== url) },
    })

    return NextResponse.json({ images: updated.images })
  } catch (err) {
    console.error('[kit images DELETE]', err)
    return NextResponse.json({ error: 'Erro ao remover imagem' }, { status: 500 })
  }
}
