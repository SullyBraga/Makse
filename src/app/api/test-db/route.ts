import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') ?? 'admin@makse.com.br'

  const results: Record<string, unknown> = {}

  // Teste 1: Contar todos os usuários
  try {
    const count = await Promise.race([
      prisma.user.count(),
      new Promise<never>((_, r) => setTimeout(() => r(new Error('TIMEOUT 5s')), 5000)),
    ])
    results.userCount = count
  } catch (e) {
    results.userCount = `ERROR: ${(e as Error).message}`
  }

  // Teste 2: findUnique SEM include (só o user)
  try {
    const user = await Promise.race([
      prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } }),
      new Promise<never>((_, r) => setTimeout(() => r(new Error('TIMEOUT 5s')), 5000)),
    ])
    results.findUniqueBasic = user
      ? { found: true, id: user.id, role: user.role }
      : { found: false }
  } catch (e) {
    results.findUniqueBasic = `ERROR: ${(e as Error).message}`
  }

  // Teste 3: findUnique COM include discountTable (exatamente como o authorize() faz)
  try {
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { email },
        include: { discountTable: true },
      }),
      new Promise<never>((_, r) => setTimeout(() => r(new Error('TIMEOUT 5s')), 5000)),
    ])
    results.findUniqueWithInclude = user
      ? { found: true, hasDiscountTable: !!user.discountTable }
      : { found: false }
  } catch (e) {
    results.findUniqueWithInclude = `ERROR: ${(e as Error).message}`
  }

  // Teste 4: Verificar se a tabela DiscountTable existe
  try {
    const dtCount = await Promise.race([
      prisma.discountTable.count(),
      new Promise<never>((_, r) => setTimeout(() => r(new Error('TIMEOUT 5s')), 5000)),
    ])
    results.discountTableCount = dtCount
  } catch (e) {
    results.discountTableCount = `ERROR: ${(e as Error).message}`
  }

  return NextResponse.json(results)
}
