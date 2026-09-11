import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureDefaultHeroSlides } from '@/lib/hero-slides'

// GET /api/hero-slides (Public)
export async function GET() {
  try {
    await ensureDefaultHeroSlides()

    const slides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(slides)
  } catch (err) {
    console.error('[hero-slides public GET]', err)
    return NextResponse.json([])
  }
}
