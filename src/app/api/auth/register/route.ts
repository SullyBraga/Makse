import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, type,
            // cliente
            street, number, complement, state, zipCode,
            // profissional or both
            salonName, city, cnpj, salonAddress, instagram } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    if (type === 'professional') {
      if (!salonName || !city || !instagram) {
        return NextResponse.json({ error: 'Nome do salão, cidade e rede social são obrigatórios.' }, { status: 400 })
      }

      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'PENDENTE' },
      })

      await prisma.professionalRequest.create({
        data: {
          userId:      user.id,
          salonName,
          city,
          phone:       phone || '',
          cnpj:        cnpj || null,
          salonAddress: salonAddress || null,
          instagram:   instagram || null,
        },
      })

      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, type: 'professional' },
        { status: 201 }
      )
    } else {
      // Cliente final
      const user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'CLIENTE_FINAL' },
      })

      // Salvar endereço se fornecido
      if (street || city || state || zipCode) {
        await prisma.address.create({
          data: {
            userId:  user.id,
            street:  street || '',
            number:  number || '',
            complement: complement || null,
            city:    city || '',
            state:   state || '',
            zipCode: zipCode || '',
          },
        })
      }

      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, type: 'client' },
        { status: 201 }
      )
    }
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
