import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

// Simple regex-based XML parser for NFe structure
function parseNfeXml(xmlString: string) {
  const items: { cProd: string; xProd: string; qCom: number; vUnCom: number; cEAN: string }[] = []

  // Extract <det> blocks
  const detMatches = xmlString.match(/<det[\s\S]*?<\/det>/gi) || []

  for (const det of detMatches) {
    const cProdMatch = det.match(/<cProd>(.*?)<\/cProd>/i)
    const xProdMatch = det.match(/<xProd>(.*?)<\/xProd>/i)
    const qComMatch = det.match(/<qCom>(.*?)<\/qCom>/i)
    const vUnComMatch = det.match(/<vUnCom>(.*?)<\/vUnCom>/i)
    const cEANMatch = det.match(/<cEAN>(.*?)<\/cEAN>/i)

    const cProd = cProdMatch ? cProdMatch[1].trim() : ''
    const xProd = xProdMatch ? xProdMatch[1].trim() : ''
    const qCom = qComMatch ? parseFloat(qComMatch[1].trim()) : 0
    const vUnCom = vUnComMatch ? parseFloat(vUnComMatch[1].trim()) : 0
    const cEAN = cEANMatch ? cEANMatch[1].trim() : ''

    if (xProd && qCom > 0) {
      items.push({ cProd, xProd, qCom, vUnCom, cEAN })
    }
  }

  // Extract NF-e Info (nNF, dhEmi, xNome emitente)
  const nNFMatch = xmlString.match(/<nNF>(.*?)<\/nNF>/i)
  const xNomeMatch = xmlString.match(/<emit>[\s\S]*?<xNome>(.*?)<\/xNome>/i)

  return {
    number: nNFMatch ? nNFMatch[1].trim() : 'N/A',
    issuer: xNomeMatch ? xNomeMatch[1].trim() : 'Fornecedor N/A',
    items,
  }
}

// POST /api/admin/stock/import-xml
// Body mode 1: preview ({ xmlContent })
// Body mode 2: apply ({ updates: [{ variantId, addedStock }] })
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const body = await req.json()

    // Mode 2: Apply updates to DB
    if (body.apply && Array.isArray(body.updates)) {
      let updatedCount = 0
      for (const update of body.updates) {
        if (update.variantId && typeof update.addedStock === 'number') {
          await prisma.productVariant.update({
            where: { id: update.variantId },
            data: { stock: { increment: Math.max(0, Math.round(update.addedStock)) } },
          })
          updatedCount++
        }
      }
      return NextResponse.json({ success: true, updatedCount })
    }

    // Mode 1: Parse and preview
    const { xmlContent } = body
    if (!xmlContent || typeof xmlContent !== 'string') {
      return NextResponse.json({ error: 'Conteúdo do XML é obrigatório' }, { status: 400 })
    }

    const parsed = parseNfeXml(xmlContent)
    if (parsed.items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido de produto foi encontrado no arquivo XML' }, { status: 400 })
    }

    // Fetch all active products and variants for matching
    const products = await prisma.product.findMany({
      where: { archived: false },
      include: { variants: true },
    })

    // Match XML items to database variants by SKU or Product Name
    const matchedItems = parsed.items.map(xmlItem => {
      let matchedVariant: any = null
      let matchedProduct: any = null

      // 1. Try matching by SKU
      for (const prod of products) {
        if (prod.sku && xmlItem.cProd && prod.sku.toLowerCase() === xmlItem.cProd.toLowerCase()) {
          matchedProduct = prod
          matchedVariant = prod.variants[0] || null
          break
        }
        for (const v of prod.variants) {
          if (v.label && xmlItem.cProd && v.label.toLowerCase() === xmlItem.cProd.toLowerCase()) {
            matchedProduct = prod
            matchedVariant = v
            break
          }
        }
        if (matchedProduct) break
      }

      // 2. Fallback: match by product name fuzzy search
      if (!matchedProduct) {
        const cleanXmlName = xmlItem.xProd.toLowerCase().replace(/[^a-z0-9]/g, ' ')
        for (const prod of products) {
          const cleanDbName = prod.name.toLowerCase().replace(/[^a-z0-9]/g, ' ')
          if (cleanXmlName.includes(cleanDbName) || cleanDbName.includes(cleanXmlName)) {
            matchedProduct = prod
            matchedVariant = prod.variants[0] || null
            break
          }
        }
      }

      return {
        xmlCode: xmlItem.cProd,
        xmlName: xmlItem.xProd,
        xmlQuantity: xmlItem.qCom,
        xmlPrice: xmlItem.vUnCom,
        matched: !!matchedVariant,
        productId: matchedProduct?.id || null,
        productName: matchedProduct?.name || null,
        variantId: matchedVariant?.id || null,
        variantLabel: matchedVariant?.label || null,
        currentStock: matchedVariant?.stock ?? 0,
        newStock: (matchedVariant?.stock ?? 0) + Math.round(xmlItem.qCom),
      }
    })

    return NextResponse.json({
      nfNumber: parsed.number,
      issuer: parsed.issuer,
      totalItems: parsed.items.length,
      matchedCount: matchedItems.filter(i => i.matched).length,
      items: matchedItems,
    })
  } catch (err) {
    console.error('[import-xml POST]', err)
    return NextResponse.json({ error: 'Erro ao processar o arquivo XML da Nota Fiscal' }, { status: 500 })
  }
}
