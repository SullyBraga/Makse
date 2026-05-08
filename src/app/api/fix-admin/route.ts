import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10)
    const user = await prisma.user.upsert({
      where: { email: 'admin@makse.com.br' },
      update: { 
        passwordHash,
        role: 'ADMIN',
        name: 'Administrador Makse'
      },
      create: {
        id: 'usr_admin_master',
        name: 'Administrador Makse',
        email: 'admin@makse.com.br',
        passwordHash,
        role: 'ADMIN'
      }
    })
    return NextResponse.json({ success: true, message: "Admin user updated/created", userId: user.id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
