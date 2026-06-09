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

function parseBoolean(val: any): boolean {
  if (!val) return false
  const s = String(val).toLowerCase().trim()
  return s === 'true' || s === 'sim' || s === 'yes' || s === '1' || s === 's' || s === 'x'
}

// Nomes EXATOS das colunas da planilha do cliente
// A normalização converte acentos + espaços para snake_case para o lookup
const EXACT_HEADERS = [
  'Linha',
  'Nome do Produto',
  'SKU',
  'Quantidade',
  'Ativos',
  'Tipo de Produto',
  'Indicação de uso',
  'Descrição',
  'Produtos Relacionados',
  'Quantidade em Estoque',
  'Preço Para Cliente Final',
  'Preço Para Profissional',
  'Preço de Desconto para Profissional',
  'Preço para Vendedor/Representante/Distribuidor',
  'Exclusivo Profissional',
 ]
 
 // Mapeamento: chave normalizada → campo interno
 const COL_MAP: Record<string, string> = {
   'linha':                                         'linha',
   'nome_do_produto':                               'nome',
   'sku':                                           'sku',
   'quantidade':                                    'gramatura',      // peso/volume (500g, 1L)
   'ativos':                                        'ingredientes',
   'tipo_de_produto':                               'tipo',
   'indicacao_de_uso':                              'indicacao',
   'descricao':                                     'descricao',
   'produtos_relacionados':                         'produtos_relacionados',
   'quantidade_em_estoque':                         'estoque',
   'preco_para_cliente_final':                      'preco',
   'preco_para_profissional':                       'preco_pro',
   'preco_de_desconto_para_profissional':           'preco_pro_desc',
   'preco_para_vendedor/representante/distribuidor':'preco_vendedor',
   'exclusivo_profissional':                        'proOnly',
   'profissional':                                  'proOnly',
   'exclusivo_para_profissionais':                  'proOnly',
 }

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const contentType = req.headers.get('content-type') || ''
    let parsed: any[] = []
    let previewOnly = false
    let overwrite = false
    let zeroMissingPrices = false

    if (contentType.includes('application/json')) {
      const body = await req.json()
      const productsPayload = body.products || []
      overwrite = body.overwrite === true
      
      const lines = await prisma.productLine.findMany()
      const lineMap: Record<string, string> = {}
      for (const l of lines) lineMap[l.name.toLowerCase()] = l.id

      parsed = productsPayload.map((p: any, i: number) => {
        const relRaw = Array.isArray(p.relatedProducts)
          ? p.relatedProducts
          : String(p.relatedProducts || '').trim()
            ? String(p.relatedProducts).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
            : []

        let price = p.price != null && !isNaN(parseFloat(String(p.price))) ? parseFloat(String(p.price)) : null
        const pricePro = p.pricePro != null && !isNaN(parseFloat(String(p.pricePro))) ? parseFloat(String(p.pricePro)) : null
        const priceProDesc = p.priceProDesc != null && !isNaN(parseFloat(String(p.priceProDesc))) ? parseFloat(String(p.priceProDesc)) : null
        const priceVendedor = p.priceVendedor != null && !isNaN(parseFloat(String(p.priceVendedor))) ? parseFloat(String(p.priceVendedor)) : null

        let proOnly = parseBoolean(p.proOnly)
        if (price === null && pricePro !== null) {
          proOnly = true
        }

        if (proOnly && price === null) {
          price = 0
        }

        return {
          row: p.row || (i + 2),
          name: String(p.name || '').trim(),
          sku: String(p.sku || '').trim() || null,
          productType: String(p.productType || '').trim() || null,
          weight: String(p.weight || '').trim() || null,
          lineName: String(p.lineName || '').trim() || null,
          lineId: p.lineId || (p.lineName ? (lineMap[p.lineName.toLowerCase().trim()] || null) : null),
          description: String(p.description || '').trim(),
          ingredients: p.ingredients || null,
          usage: p.usage || null,
          relatedProducts: relRaw,
          price,
          pricePro,
          priceProDesc,
          priceVendedor,
          stock: parseInt(String(p.stock || '0')) || 0,
          proOnly,
          featured: p.featured === true,
          active: p.active !== false,
          isDuplicate: false,
          error: !String(p.name || '').trim()
            ? 'Nome obrigatório'
            : (price === null && !proOnly)
            ? 'Preço (Cliente Final) inválido'
            : null,
        }
      })
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      previewOnly = formData.get('preview') === 'true'
      overwrite = formData.get('overwrite') === 'true'
      zeroMissingPrices = formData.get('zeroMissingPrices') === 'true'

      if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (rows.length === 0) return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })

      // Normaliza as chaves usando o COL_MAP
      const normalized = rows.map(row => {
        const out: Record<string, any> = {}
        for (const [key, val] of Object.entries(row)) {
          const normKey = normalizeKey(key)
          const mappedKey = COL_MAP[normKey] ?? normKey // usa mapeamento ou mantém normalizado
          out[mappedKey] = val
        }
        return out
      })

      const firstRow = normalized[0]
      const hasName = 'nome' in firstRow
      const hasPrice = 'preco' in firstRow
      if (!hasName || !hasPrice) {
        return NextResponse.json({
          error: `Colunas obrigatórias não encontradas. Esperado: "Nome do Produto" e "Preço Para Cliente Final". Encontrado: ${Object.keys(firstRow).join(', ')}`,
        }, { status: 400 })
      }

      const lines = await prisma.productLine.findMany()
      const lineMap: Record<string, string> = {}
      for (const l of lines) lineMap[l.name.toLowerCase()] = l.id

      function parsePrice(val: any): number | null {
        if (!val && val !== 0) return null
        const n = parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''))
        return isNaN(n) ? null : n
      }

      parsed = normalized.map((row, i) => {
        let price = parsePrice(row.preco)
        if (zeroMissingPrices && price === null) {
          price = 0
        }

        const relRaw = String(row.produtos_relacionados || '').trim()
        const relatedProducts = relRaw
          ? relRaw.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
          : []

        const pricePro = parsePrice(row.preco_pro)
        const priceProDesc = parsePrice(row.preco_pro_desc)
        const priceVendedor = parsePrice(row.preco_vendedor)

        // Automatically set proOnly to true if price is null/empty but pricePro is present!
        let proOnly = parseBoolean(row.proOnly)
        if (price === null && pricePro !== null) {
          proOnly = true
        }

        // If it is professional-only and final price is not defined, default to 0 to satisfy DB schema
        if (proOnly && price === null) {
          price = 0
        }

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
          usage: String(row.indicacao || '').trim() || null,
          relatedProducts,
          price,
          pricePro,
          priceProDesc,
          priceVendedor,
          stock: parseInt(String(row.estoque || '0')) || 0,
          proOnly,
          featured: false,
          active: true,
          isDuplicate: false,
          error: !String(row.nome || '').trim()
            ? 'Nome obrigatório'
            : (price === null && !proOnly) // final price is mandatory only if NOT proOnly
            ? 'Preço (Cliente Final) inválido'
            : null,
        }
      })
    }

    if (previewOnly) {
      const slugs = parsed.filter(r => !r.error).map(r => toSlug(r.name))
      const skusToCheck = parsed.filter(r => r.sku).map(r => r.sku!)

      const existingBySlug = await prisma.product.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, sku: true },
      })
      const existingBySku = skusToCheck.length > 0
        ? await prisma.product.findMany({
            where: { sku: { in: skusToCheck } },
            select: { slug: true, sku: true },
          })
        : []

      const existingSlugs = new Set(existingBySlug.map(p => p.slug))
      const existingSkus = new Set(existingBySku.map(p => p.sku).filter(Boolean))

      const rowsWithFlags = parsed.map(r => ({
        ...r,
        isDuplicate: !r.error && (
          existingSlugs.has(toSlug(r.name)) ||
          (!!r.sku && existingSkus.has(r.sku))
        ),
      }))

      return NextResponse.json({
        rows: rowsWithFlags,
        total: parsed.length,
        errors: parsed.filter(r => r.error).length,
        duplicates: rowsWithFlags.filter(r => r.isDuplicate).length,
      })
    }

    // Import
    const valid = parsed.filter(r => !r.error && r.name)
    let created = 0, updated = 0, skipped = 0, errors = 0

    if (valid.length > 0) {
      // 1. Criar linhas de produtos automaticamente se não existirem
      const uniqueLineNames = Array.from(new Set(
        valid
          .map(p => p.lineName)
          .filter((name): name is string => !!name && name.trim() !== '')
      ))

      if (uniqueLineNames.length > 0) {
        const existingLines = await prisma.productLine.findMany()
        const existingLinesLower = new Set(existingLines.map(l => l.name.toLowerCase().trim()))

        for (const lineName of uniqueLineNames) {
          const trimmed = lineName.trim()
          if (!existingLinesLower.has(trimmed.toLowerCase())) {
            try {
              await prisma.productLine.create({
                data: {
                  name: trimmed,
                  slug: toSlug(trimmed),
                  description: `Produtos da linha ${trimmed}`,
                }
              })
            } catch (errLine) {
              console.error(`[products/import] Erro ao criar linha automaticamente: ${trimmed}`, errLine)
            }
          }
        }
      }

      // 2. Recarregar o lineMap com as novas linhas criadas
      const currentLines = await prisma.productLine.findMany()
      const lineMap: Record<string, string> = {}
      for (const l of currentLines) {
        lineMap[l.name.toLowerCase().trim()] = l.id
      }

      // 3. Atualizar o lineId de cada produto no array valid de acordo com o novo lineMap
      for (const p of valid) {
        if (p.lineName) {
          p.lineId = lineMap[p.lineName.toLowerCase().trim()] || null
        }
      }

      const slugs = valid.map(p => toSlug(p.name))
      const skus = valid.map(p => p.sku).filter(Boolean) as string[]

      // Busca todos os produtos existentes de uma única vez (reduz conexão de rede)
      const existingProducts = await prisma.product.findMany({
        where: {
          OR: [
            { slug: { in: slugs } },
            ...(skus.length > 0 ? [{ sku: { in: skus } }] : [])
          ]
        },
        include: {
          variants: true
        }
      })

      const existingMapBySlug = new Map(existingProducts.map(p => [p.slug, p]))
      const existingMapBySku = new Map(existingProducts.filter(p => p.sku).map(p => [p.sku!, p]))

      const operations: any[] = []

      for (const p of valid) {
        const slug = toSlug(p.name)
        const existing = existingMapBySlug.get(slug) || (p.sku ? existingMapBySku.get(p.sku) : undefined)

        if (existing && !overwrite) {
          skipped++
          continue
        }

        const productData = {
          name: p.name,
          slug,
          sku: p.sku,
          description: p.description || p.name,
          ingredients: p.ingredients,
          usage: p.usage,
          productType: p.productType,
          weight: p.weight,
          price: p.price!,
          pricePro: p.pricePro,
          priceProDesc: p.priceProDesc,
          priceVendedor: p.priceVendedor,
          relatedProducts: p.relatedProducts,
          proOnly: p.proOnly,
          featured: p.featured,
          active: p.active,
          archived: false,
          lineId: p.lineId,
        }

        if (existing && overwrite) {
          operations.push(
            prisma.product.update({
              where: { id: existing.id },
              data: productData,
            })
          )
          if (existing.variants.length === 1) {
            operations.push(
              prisma.productVariant.update({
                where: { id: existing.variants[0].id },
                data: {
                  price: p.price!,
                  pricePro: p.pricePro,
                  priceVendedor: p.priceVendedor,
                  stock: p.stock,
                },
              })
            )
          }
          updated++
        } else if (!existing) {
          operations.push(
            prisma.product.create({
              data: {
                ...productData,
                lineId: p.lineId,
                images: [],
                variants: {
                  create: [{
                    label: 'Padrão',
                    price: p.price!,
                    pricePro: p.pricePro,
                    priceVendedor: p.priceVendedor,
                    stock: p.stock,
                  }],
                },
              },
            })
          )
          created++
        }
      }

      // Executa tudo em lote atômico único ultra-rápido
      if (operations.length > 0) {
        try {
          await prisma.$transaction(operations)
        } catch (transactionError) {
          console.error('[products/import] Falha na transação em lote, usando fallback item por item:', transactionError)
          
          // Fallback resiliente individual em caso de conflitos de chave única no lote
          created = 0
          updated = 0
          errors = 0

          for (const p of valid) {
            const slug = toSlug(p.name)
            const existing = existingMapBySlug.get(slug) || (p.sku ? existingMapBySku.get(p.sku) : undefined)

            if (existing && !overwrite) {
              continue
            }

            const productData = {
              name: p.name,
              slug,
              sku: p.sku,
              description: p.description || p.name,
              ingredients: p.ingredients,
              usage: p.usage,
              productType: p.productType,
              weight: p.weight,
              price: p.price!,
              pricePro: p.pricePro,
              priceProDesc: p.priceProDesc,
              priceVendedor: p.priceVendedor,
              relatedProducts: p.relatedProducts,
              proOnly: p.proOnly,
              featured: p.featured,
              active: p.active,
              archived: false,
              lineId: p.lineId,
            }

            try {
              if (existing && overwrite) {
                await prisma.product.update({
                  where: { id: existing.id },
                  data: productData,
                })
                if (existing.variants.length === 1) {
                  await prisma.productVariant.update({
                    where: { id: existing.variants[0].id },
                    data: {
                      price: p.price!,
                      pricePro: p.pricePro,
                      priceVendedor: p.priceVendedor,
                      stock: p.stock,
                    },
                  })
                }
                updated++
              } else if (!existing) {
                await prisma.product.create({
                  data: {
                    ...productData,
                    lineId: p.lineId,
                    images: [],
                    variants: {
                      create: [{
                        label: 'Padrão',
                        price: p.price!,
                        pricePro: p.pricePro,
                        priceVendedor: p.priceVendedor,
                        stock: p.stock,
                      }],
                    },
                  },
                })
                created++
              }
            } catch (errItem) {
              console.error(`[products/import] Erro ao importar produto individual: ${p.name}`, errItem)
              errors++
            }
          }
        }
      }
    }

    let importedProducts: { id: string; name: string; slug: string; sku: string | null }[] = []
    if (valid.length > 0) {
      // 1. Buscar todos os produtos do banco (incluindo os recém-criados) para obter o mapeamento Nome/SKU -> ID
      const allDbProducts = await prisma.product.findMany({
        select: { id: true, name: true, sku: true }
      })

      const nameToId: Record<string, string> = {}
      const skuToId: Record<string, string> = {}

      for (const p of allDbProducts) {
        nameToId[p.name.toLowerCase().trim()] = p.id
        if (p.sku) {
          skuToId[p.sku.toLowerCase().trim()] = p.id
        }
      }

      // 2. Para cada produto importado que possua relacionados, resolver para IDs e atualizar no banco
      const updatePromises = []
      for (const p of valid) {
        if (p.relatedProducts && p.relatedProducts.length > 0) {
          const resolvedIds = p.relatedProducts
            .map((nameOrSku: string) => {
              const clean = nameOrSku.toLowerCase().trim()
              return skuToId[clean] || nameToId[clean] || null
            })
            .filter((id: string | null): id is string => !!id)

          if (resolvedIds.length > 0) {
            // Encontra o ID do produto que foi criado/atualizado
            const cleanName = p.name.toLowerCase().trim()
            const productId = p.sku 
              ? (skuToId[p.sku.toLowerCase().trim()] || nameToId[cleanName])
              : nameToId[cleanName]

            if (productId) {
              updatePromises.push(
                prisma.product.update({
                  where: { id: productId },
                  data: { relatedProducts: resolvedIds }
                })
              )
            }
          }
        }
      }

      if (updatePromises.length > 0) {
        try {
          await Promise.all(updatePromises)
          console.log(`[products/import] Sucesso ao resolver e associar ${updatePromises.length} produtos relacionados!`)
        } catch (errResolve) {
          console.error('[products/import] Erro ao resolver produtos relacionados:', errResolve)
        }
      }

      const slugs = valid.map(p => toSlug(p.name))
      const skus = valid.map(p => p.sku).filter(Boolean) as string[]
      importedProducts = await prisma.product.findMany({
        where: {
          OR: [
            { slug: { in: slugs } },
            ...(skus.length > 0 ? [{ sku: { in: skus } }] : [])
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
        }
      })
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors: errors + parsed.filter(r => r.error).length,
      products: importedProducts,
    })
  } catch (err) {
    console.error('[products/import POST]', err)
    return NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 500 })
  }
}

// GET — download template com os nomes EXATOS das colunas do cliente
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const example = [
    'Linha Crystal',
    'Shampoo Perfect Repair 1L',
    'MKS-001',
    '1L',
    'Aqua, lauril sulfato de sódio, proteína de seda',
    'Shampoo',
    'Cabelos danificados, com química, secos e ressecados',
    'Shampoo restaurador para fios danificados.',
    'Kit Perfect Repair',
    '50',
    '79,90',
    '69,90',
    '59,90',
    '49,90',
  ]

  const ws = XLSX.utils.aoa_to_sheet([EXACT_HEADERS, example])
  ws['!cols'] = EXACT_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 20) }))
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
