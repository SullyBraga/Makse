import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_HOST: process.env.DATABASE_URL
        ? (() => {
            try {
              const url = new URL(process.env.DATABASE_URL!)
              return `${url.hostname}:${url.port} (db: ${url.pathname.slice(1)})`
            } catch {
              return 'INVALID URL FORMAT'
            }
          })()
        : 'NOT SET',
      AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
  }

  try {
    // Testa com timeout explícito de 5s
    const result = await Promise.race([
      prisma.$queryRaw<[{ result: number }]>`SELECT 1 AS result`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT after 5000ms')), 5000)
      ),
    ])

    return NextResponse.json({
      ...info,
      db: { status: 'OK', result },
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    return NextResponse.json(
      {
        ...info,
        db: {
          status: 'ERROR',
          message: error.message,
          code: (error as NodeJS.ErrnoException).code ?? null,
          // Prisma error details
          prismaCode: (error as { code?: string }).code ?? null,
          clientVersion: (error as { clientVersion?: string }).clientVersion ?? null,
        },
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
