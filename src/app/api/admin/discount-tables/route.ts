import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const tables = await prisma.discountTable.findMany({ orderBy: { percentage: 'asc' } })
  // Deduplicate by name+percentage in case the DB has duplicate entries
  const seen = new Set<string>()
  const unique = tables.filter(t => {
    const key = `${t.name}|${t.percentage}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return NextResponse.json(unique)
}
