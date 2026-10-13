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
  const roleParam = searchParams.get('role')?.trim()
  const limitParam = searchParams.get('limit')?.trim()
  const limit = limitParam ? parseInt(limitParam) : undefined

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { professionalReq: { salonName: { contains: search } } },
      { professionalReq: { phone: { contains: search } } },
      { professionalReq: { cnpj: { contains: search } } },
    ]
  }

  if (roleParam && roleParam !== 'ALL') {
    where.role = roleParam
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      discountTable: {
        select: {
          id: true,
          name: true,
          percentage: true,
        }
      },
      professionalReq: {
        select: {
          salonName: true,
          city: true,
          phone: true,
          instagram: true,
          cnpj: true,
          salonAddress: true,
        }
      },
      addresses: {
        select: {
          id: true,
          street: true,
          number: true,
          complement: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          isDefault: true,
        }
      }
    },
    ...(limit ? { take: limit } : {}),
  })

  return NextResponse.json(users)
}
