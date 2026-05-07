import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const ALL_COLS = ['nome', 'sku', 'tipo', 'gramatura', 'linha', 'descricao', 'ingredientes',
  'modo_de_uso', 'indicacao', 'preco', 'preco_pro', 'preco_vendedor', 'estoque',
  'exclusivo_pro', 'destaque', 'ativo']

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const previewOnly = formData.get('preview') === 'true'
    const overwrite = formData.get('overwrite') === 'true'

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })

    // Normalize column keys
    const normalized = rows.map(row => {
      const out: Record<string, any> = {}
      for (const [key, val] of Object.entries(row)) {
        const k = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
        out[k] = val
      }
      return out
    })

    const firstRow = normalized[0]
    if (!('nome' in firstRow) || !('preco' in firstRow)) {
      return NextResponse.json({ error: 'Colunas obrigatórias faltando: nome, preco' }, { status: 400 })
    }

    const lines = await prisma.productLine.findMany()
    const lineMap: Record<string, string> = {}
    for (const l of lines) lineMap[l.name.toLowerCase()] = l.id

    function parsePrice(val: any): number | null {
      if (!val && val !== 0) return null
      const n = parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''))
      return isNaN(n) ? null : n
    }

    const parsed = normalized.map((row, i) => {
      const price = parsePrice(row.preco)
      return {
        row: i + 2,
        name: String(row.nome || '').trim(),
        sku: String(row.sku || '').trim() || null,
        productType: String(row.tipo || '').trim() || null,
        weight: String(row.gramatura || '').trim() || null,
        lineName: String(row.linha || '').trim() || null,
        lineId: lineMap[String(row.linha || '').toLowerCase().trim()] ?? null,
        description: String(row.descricao || '').trim(),
        ingredients: String(row.ingredientes || '').trim() || null,
        howToUse: String(row.modo_de_uso || '').trim() || null,
        usage: String(row.indicacao || '').trim() || null,
        price,
        pricePro: parsePrice(row.preco_pro),
        priceVendedor: parsePrice(row.preco_vendedor),
        stock: parseInt(String(row.estoque || '0')) || 0,
        proOnly: ['sim', 'yes', '1', 'true'].includes(String(row.exclusivo_pro || '').toLowerCase()),
        featured: ['sim', 'yes', '1', 'true'].includes(String(row.destaque || '').toLowerCase()),
        active: !['nao', 'no', '0', 'false'].includes(String(row.ativo || '').toLowerCase()),
        error: !String(row.nome || '').trim() ? 'Nome obrigatório' : price == null ? 'Preço inválido' : null,
      }
    })

    if (previewOnly) {
      // Flag duplicates
      const slugs = parsed.filter(r => !r.error).map(r => toSlug(r.name))
      const skusToCheck = parsed.filter(r => r.sku).map(r => r.sku!)

      const existingBySlug = await prisma.product.findMany({
        where: { slug: { in: slugs } },
        select: { name: true, slug: true, sku: true },
      })
      const existingBySku = await prisma.product.findMany({
        where: { sku: { in: skusToCheck } },
        select: { name: true, slug: true, sku: true },
      })

      const existingSlugs = new Set(existingBySlug.map(p => p.slug))
      const existingSkus = new Set(existingBySku.map(p => p.sku).filter(Boolean))

      const rowsWithDuplicateFlag = parsed.map(r => ({
        ...r,
        isDuplicate: !r.error && (
          existingSlugs.has(toSlug(r.name)) ||
          (!!r.sku && existingSkus.has(r.sku))
        ),
      }))

      const duplicateCount = rowsWithDuplicateFlag.filter(r => r.isDuplicate).length

      return NextResponse.json({
        rows: rowsWithDuplicateFlag,
        total: parsed.length,
        errors: parsed.filter(r => r.error).length,
        duplicates: duplicateCount,
      })
    }

    // Import
    const valid = parsed.filter(r => !r.error && r.name)
    let created = 0, updated = 0, skipped = 0, errors = 0

    for (const p of valid) {
      const slug = toSlug(p.name)
      try {
        const existing = await prisma.product.findFirst({
          where: { OR: [{ slug }, ...(p.sku ? [{ sku: p.sku }] : [])] },
          include: { variants: true },
        })

        if (existing && !overwrite) { skipped++; continue }

        if (existing && overwrite) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: p.name, slug, sku: p.sku,
              description: p.description || p.name,
              ingredients: p.ingredients, howToUse: p.howToUse,
              usage: p.usage, productType: p.productType, weight: p.weight,
              price: p.price!, pricePro: p.pricePro, priceVendedor: p.priceVendedor,
              proOnly: p.proOnly, featured: p.featured, active: p.active,
            },
          })
          // Update default variant price if only one
          if (existing.variants.length === 1) {
            await prisma.productVariant.update({
              where: { id: existing.variants[0].id },
              data: { price: p.price!, pricePro: p.pricePro, priceVendedor: p.priceVendedor, stock: p.stock },
            })
          }
          updated++
        } else {
          await prisma.product.create({
            data: {
              name: p.name, slug, sku: p.sku,
              description: p.description || p.name,
              ingredients: p.ingredients, howToUse: p.howToUse,
              usage: p.usage, productType: p.productType, weight: p.weight,
              price: p.price!, pricePro: p.pricePro, priceVendedor: p.priceVendedor,
              lineId: p.lineId, proOnly: p.proOnly, featured: p.featured, active: p.active,
              images: [],
              variants: { create: [{ label: 'Padrão', price: p.price!, pricePro: p.pricePro, priceVendedor: p.priceVendedor, stock: p.stock }] },
            },
          })
          created++
        }
      } catch {
        errors++
      }
    }

    return NextResponse.json({ success: true, created, updated, skipped, errors: errors + parsed.filter(r => r.error).length })
  } catch (err) {
    console.error('[products/import POST]', err)
    return NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 500 })
  }
}

// GET — download template
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const headers = ALL_COLS.map(c => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' '))
  const example = ['Shampoo Perfect Repair 1L', 'MKS-001', 'Shampoo', '1L', 'Perfect Repair',
    'Descrição do produto', 'Aqua, lauril...', 'Aplique nos fios...', 'Cabelos danificados',
    '79,90', '69,90', '59,90', '50', 'Sim', 'Não', 'Sim']

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = ALL_COLS.map(() => ({ wch: 22 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="makse_template_produtos.xlsx"',
    },
  })
}
