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

  // 1. Buscar usuários cadastrados
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

  // 2. Buscar clientes de pedidos/vendas anteriores para facilitar re-seleção
  const shouldIncludeOrderCustomers = !roleParam || roleParam === 'ALL' || roleParam === 'CLIENTE'
  let orderCustomers: any[] = []

  if (shouldIncludeOrderCustomers) {
    const orderWhere: any = {
      customerName: { not: null },
    }

    if (search) {
      orderWhere.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerCpf: { contains: search } },
        { customerAddress: { contains: search } },
      ]
    }

    const pastOrders = await prisma.order.findMany({
      where: orderWhere,
      orderBy: { createdAt: 'desc' },
      take: search ? 50 : 80,
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        customerCpf: true,
        customerAddress: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            discountTable: {
              select: {
                id: true,
                name: true,
                percentage: true,
              }
            }
          }
        }
      }
    })

    const seenNames = new Set<string>()
    const seenPhones = new Set<string>()

    for (const u of users) {
      if (u.name) seenNames.add(u.name.trim().toLowerCase())
      if (u.professionalReq?.phone) {
        const clean = u.professionalReq.phone.replace(/\D/g, '')
        if (clean) seenPhones.add(clean)
      }
    }

    for (const o of pastOrders) {
      if (!o.customerName || !o.customerName.trim()) continue
      const normName = o.customerName.trim().toLowerCase()
      const cleanPhone = o.customerPhone ? o.customerPhone.replace(/\D/g, '') : ''

      // Se já listado nos cadastros ou em pedido mais recente, ignora duplicata
      if (seenNames.has(normName) || (cleanPhone && cleanPhone.length >= 8 && seenPhones.has(cleanPhone))) {
        continue
      }

      seenNames.add(normName)
      if (cleanPhone && cleanPhone.length >= 8) seenPhones.add(cleanPhone)

      orderCustomers.push({
        id: `order-client-${o.id}`,
        name: o.customerName.trim(),
        email: o.customerPhone ? `Tel: ${o.customerPhone}` : 'Cliente Recente',
        role: 'CLIENTE',
        isPastOrderCustomer: true,
        createdAt: o.createdAt,
        discountTable: o.user?.discountTable || null,
        professionalReq: {
          salonName: o.customerName.trim(),
          city: '',
          phone: o.customerPhone || '',
          instagram: null,
          cnpj: o.customerCpf || null,
          salonAddress: o.customerAddress || null,
        },
        addresses: o.customerAddress ? [{
          id: `addr-${o.id}`,
          street: o.customerAddress,
          number: '',
          complement: null,
          city: '',
          state: '',
          zipCode: '',
          country: 'Brasil',
          isDefault: true,
        }] : [],
        rawAddress: o.customerAddress,
        rawPhone: o.customerPhone,
        rawCpf: o.customerCpf,
      })
    }
  }

  const combined = [...users, ...orderCustomers]
  const finalResults = limit ? combined.slice(0, limit) : combined

  return NextResponse.json(finalResults)
}
