import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { saveUploadedFile } from '@/lib/upload'

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || role !== 'ADMIN') return null
  return session
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

    const imageUrl = await saveUploadedFile(file, 'hero', filename)

    return NextResponse.json({ url: imageUrl })
  } catch (error: any) {
    console.error('Erro ao fazer upload da imagem do hero:', error)
    return NextResponse.json({ error: 'Erro interno ao processar upload' }, { status: 500 })
  }
}
