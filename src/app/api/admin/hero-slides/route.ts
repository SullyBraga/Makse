import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureDefaultHeroSlides } from '@/lib/hero-slides'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/hero-slides
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  await ensureDefaultHeroSlides()

  const slides = await prisma.heroSlide.findMany({
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(slides)
}

// POST /api/admin/hero-slides
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      resolutionMode,
      image,
      imageUltrawide,
      imageFullhd,
      imageNotebook,
      imageTablet,
      imageMobile,
      label,
      titleLine1,
      titleLine2,
      description,
      primaryCtaText,
      primaryCtaLink,
      secondaryCtaText,
      secondaryCtaLink,
      active,
    } = body

    const count = await prisma.heroSlide.count()

    const slide = await prisma.heroSlide.create({
      data: {
        order: count,
        resolutionMode: resolutionMode || 'SINGLE',
        image: image || null,
        imageUltrawide: imageUltrawide || null,
        imageFullhd: imageFullhd || null,
        imageNotebook: imageNotebook || null,
        imageTablet: imageTablet || null,
        imageMobile: imageMobile || null,
        label: label || null,
        titleLine1: titleLine1 || null,
        titleLine2: titleLine2 || null,
        description: description || null,
        primaryCtaText: primaryCtaText || null,
        primaryCtaLink: primaryCtaLink || null,
        secondaryCtaText: secondaryCtaText || null,
        secondaryCtaLink: secondaryCtaLink || null,
        active: active !== false,
      },
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (err) {
    console.error('[hero-slides POST]', err)
    return NextResponse.json({ error: 'Erro ao criar slide do hero' }, { status: 500 })
  }
}

// PATCH /api/admin/hero-slides
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do slide é obrigatório' }, { status: 400 })
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(slide)
  } catch (err) {
    console.error('[hero-slides PATCH]', err)
    return NextResponse.json({ error: 'Erro ao atualizar slide' }, { status: 500 })
  }
}

// DELETE /api/admin/hero-slides
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID do slide é obrigatório' }, { status: 400 })

    await prisma.heroSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[hero-slides DELETE]', err)
    return NextResponse.json({ error: 'Erro ao excluir slide' }, { status: 500 })
  }
}
