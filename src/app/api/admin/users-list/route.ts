import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'VENDEDOR'].includes(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()

  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true },
    take: 20,
  })
  return NextResponse.json(users)
}
