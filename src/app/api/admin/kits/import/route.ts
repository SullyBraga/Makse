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
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseBool(val: any, defaultVal = true): boolean {
  if (val === undefined || val === null || val === '') return defaultVal
  return !['não', 'nao', 'no', 'false', '0', 'n'].includes(String(val).toLowerCase().trim())
}

function parsePrice(val: any): number | null {
  if (!val) return null
  const n = parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

// GET — download template
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const headers = ['nome', 'sku', 'descricao', 'preco', 'preco_pro', 'preco_vendedor',
    'skus_componentes', 'quantidades', 'exibir_catalogo', 'exibir_sugestoes']
  const example = ['Kit Nutrição Completa', 'KIT-NUT-001', 'Kit para cabelos ressecados',
    '299,90', '259,90', '229,90', 'NUT-SH-1L;NUT-MASK-1KG;NUT-FINALIZADOR-250G',
    '1;1;1', 'Não', 'Sim']

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map(() => ({ wch: 22 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kits')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="makse_template_kits.xlsx"',
    },
  })
}

// POST — import kits from spreadsheet
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const isPreview = formData.get('preview') === 'true'
    const overwrite = formData.get('overwrite') === 'true'

    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })
    }

    // Collect all component SKUs to look them up
    const allSkus = new Set<string>()
    for (const row of rawRows) {
      const skuList = String(row['skus_componentes'] || '').split(';').map((s: string) => s.trim()).filter(Boolean)
      skuList.forEach(s => allSkus.add(s))
    }

    // Fetch products by SKU
    const products = await prisma.product.findMany({
      where: { sku: { in: Array.from(allSkus) } },
      include: { variants: { orderBy: { price: 'asc' }, take: 1 } },
    })
    const productBySku = new Map(products.map(p => [p.sku!, p]))

    const missingSKUs = Array.from(allSkus).filter(s => !productBySku.has(s))

    // Parse rows
    type PreviewRow = {
      row: number; name: string; sku: string | null; price: number | null;
      pricePro: number | null; priceVendedor: number | null;
      skuComponents: string[]; quantities: number[];
      showInCatalog: boolean; showAsSuggestion: boolean;
      isDuplicate: boolean; missingSkus: string[]; error: string | null
    }

    const existingKits = await prisma.kit.findMany({ select: { sku: true, name: true } })
    const existingKitSkus = new Set(existingKits.map(k => k.sku).filter(Boolean))
    const existingKitNames = new Set(existingKits.map(k => k.name.toLowerCase()))

    const rows: PreviewRow[] = rawRows.map((raw, idx) => {
      const name = String(raw['nome'] || '').trim()
      const sku = String(raw['sku'] || '').trim() || null
      const price = parsePrice(raw['preco'])
      const pricePro = parsePrice(raw['preco_pro'])
      const priceVendedor = parsePrice(raw['preco_vendedor'])
      const skuComponents = String(raw['skus_componentes'] || '').split(';').map((s: string) => s.trim()).filter(Boolean)
      const quantitiesRaw = String(raw['quantidades'] || '1').split(';').map((s: string) => parseInt(s.trim()) || 1)
      const quantities = skuComponents.map((_, i) => quantitiesRaw[i] ?? 1)
      const showInCatalog = parseBool(raw['exibir_catalogo'], false)
      const showAsSuggestion = parseBool(raw['exibir_sugestoes'], true)

      const rowMissingSkus = skuComponents.filter(s => !productBySku.has(s))
      const isDuplicate = !!(sku && existingKitSkus.has(sku)) || existingKitNames.has(name.toLowerCase())

      let error: string | null = null
      if (!name) error = 'Nome obrigatório'
      else if (price == null) error = 'Preço inválido'

      return { row: idx + 2, name, sku, price, pricePro, priceVendedor, skuComponents, quantities, showInCatalog, showAsSuggestion, isDuplicate, missingSkus: rowMissingSkus, error }
    })

    if (isPreview) {
      return NextResponse.json({ rows, missingSKUs })
    }

    // Import
    let created = 0, updated = 0, skipped = 0, errors = 0

    for (const row of rows) {
      if (row.error) { errors++; continue }
      if (row.missingSkus.length > 0 && !overwrite) { skipped++; continue }

      try {
        const slug = toSlug(row.name)
        const kitItems = row.skuComponents
          .map((sku, i) => {
            const prod = productBySku.get(sku)
            if (!prod) return null
            return {
              productId: prod.id,
              variantId: prod.variants[0]?.id || null,
              quantity: row.quantities[i],
            }
          })
          .filter(Boolean) as any[]

        const existing = row.sku
          ? await prisma.kit.findUnique({ where: { sku: row.sku } })
          : await prisma.kit.findUnique({ where: { slug } })

        if (existing && !overwrite) { skipped++; continue }

        if (existing && overwrite) {
          await prisma.kitItem.deleteMany({ where: { kitId: existing.id } })
          await prisma.kit.update({
            where: { id: existing.id },
            data: {
              name: row.name, slug, price: row.price!, pricePro: row.pricePro,
              priceVendedor: row.priceVendedor, showInCatalog: row.showInCatalog,
              showAsSuggestion: row.showAsSuggestion,
              items: { create: kitItems },
            },
          })
          updated++
        } else {
          await prisma.kit.create({
            data: {
              name: row.name, slug, sku: row.sku,
              price: row.price!, pricePro: row.pricePro, priceVendedor: row.priceVendedor,
              showInCatalog: row.showInCatalog, showAsSuggestion: row.showAsSuggestion,
              images: [],
              items: { create: kitItems },
            },
          })
          created++
        }
      } catch {
        errors++
      }
    }

    return NextResponse.json({ created, updated, skipped, errors })
  } catch (err) {
    console.error('[kits import]', err)
    return NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 500 })
  }
}
