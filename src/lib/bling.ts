/**
 * Integração com Bling ERP API v3
 * Documentação: https://developer.bling.com.br
 */

const BLING_BASE = 'https://www.bling.com.br/Api/v3'

async function blingRequest(path: string, method = 'GET', body?: any) {
  const res = await fetch(`${BLING_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.BLING_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (!res.ok) throw new Error(`Bling API error: ${res.status} ${await res.text()}`)
  return res.json()
}

/**
 * Dá baixa no estoque de um produto no Bling após venda confirmada
 */
export async function decrementBlingStock(blingId: string, quantity: number) {
  return blingRequest(`/produtos/${blingId}/estoque`, 'PATCH', {
    operacao: 'S', // S = Saída
    quantidade: quantity,
    observacoes: 'Venda via e-commerce Makse'
  })
}

/**
 * Busca estoque atual de um produto
 */
export async function getBlingStock(blingId: string) {
  const data = await blingRequest(`/produtos/${blingId}`)
  return data?.data?.estoque ?? 0
}

/**
 * Sincroniza o estoque de todos os produtos com Bling
 * Chamada pela rota /admin/estoque
 */
export async function syncAllStock(products: { id: string; blingId: string }[]) {
  const results = await Promise.allSettled(
    products.map(async (p) => {
      const stock = await getBlingStock(p.blingId)
      return { id: p.id, stock }
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<{ id: string; stock: number }> => r.status === 'fulfilled')
    .map(r => r.value)
}

/**
 * Processa baixa de estoque para todos os itens de um pedido
 */
export async function processSaleStock(items: { blingId: string; quantity: number }[]) {
  await Promise.allSettled(
    items.map(item => decrementBlingStock(item.blingId, item.quantity))
  )
}
