import { NextRequest, NextResponse } from 'next/server'

function parseProductWeight(weightStr: string | null): number {
  if (!weightStr) return 0.5 // Default 500g
  const cleaned = weightStr.toLowerCase().trim()
  const num = parseFloat(cleaned.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return 0.5

  // Se o número for 10 ou mais (ex: 300, 500, 1000), em cosméticos isso SEMPRE representa gramas/ml,
  // mesmo se o usuário tiver digitado "300 Kg" ou "300Kg" por engano na tabela.
  if (num >= 10) {
    return num / 1000
  }

  if (cleaned.includes('kg') || cleaned.includes('l')) {
    return num
  }
  if (cleaned.includes('g') || cleaned.includes('ml')) {
    return num / 1000
  }
  return num
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { zipCode, country, items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Itens do carrinho vazios' }, { status: 400 })
    }

    // Calcula o peso total do pedido em Kg
    const totalWeight = items.reduce((sum: number, item: any) => {
      const w = parseProductWeight(item.weight)
      return sum + (w * (item.quantity || 1))
    }, 0)

    console.log(`[shipping API] Calculando frete para o CEP ${zipCode}. Itens recebidos:`, JSON.stringify(items), `| Peso total calculado: ${totalWeight} Kg`)

    const isInternational = country && country.toLowerCase().trim() !== 'brasil'

    if (isInternational) {
      // Cálculo Internacional via Correios (EMS, Leve Internacional, Econômica)
      const cleanCountry = country.trim()
      
      const emsPrice = 120.0 + totalWeight * 40.0
      const levePrice = 65.0 + totalWeight * 22.0
      const econPrice = 45.0 + totalWeight * 15.0

      return NextResponse.json([
        {
          name: 'Correios EMS (Expresso Internacional)',
          price: parseFloat(emsPrice.toFixed(2)),
          deliveryTime: '5 a 10 dias úteis',
          serviceCode: 'EMS'
        },
        {
          name: 'Correios Leve Internacional',
          price: parseFloat(levePrice.toFixed(2)),
          deliveryTime: '10 a 20 dias úteis',
          serviceCode: 'LEVE'
        },
        {
          name: 'Correios Mercadoria Econômica',
          price: parseFloat(econPrice.toFixed(2)),
          deliveryTime: '15 a 30 dias úteis',
          serviceCode: 'ECON'
        }
      ])
    } else {
      // Cálculo Nacional via Correios (SEDEX e PAC)
      if (!zipCode) {
        return NextResponse.json({ error: 'CEP obrigatório para envio nacional' }, { status: 400 })
      }

      const cleanZip = zipCode.replace(/\D/g, '')
      if (cleanZip.length !== 8) {
        return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
      }

      let state = 'SP' // Fallback default
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`, { signal: AbortSignal.timeout(3000) })
        if (viaCepRes.ok) {
          const data = await viaCepRes.json()
          if (data.uf) {
            state = data.uf.toUpperCase()
          }
        }
      } catch (err) {
        console.warn('[shipping API] ViaCEP timeout/erro, usando SP como padrão', err)
      }

      let pacBase = 22.9
      let pacPerKg = 4.0
      let pacDays = '5 a 8 dias úteis'
      let sedexDays = '1 a 3 dias úteis'

      // Preços e prazos reais estimados por região do CEP (Origem: SP)
      if (state === 'SP') {
        pacBase = 13.9
        pacPerKg = 1.80
        pacDays = '3 a 5 dias úteis'
        sedexDays = '1 a 2 dias úteis'
      } else if (['RJ', 'MG', 'ES'].includes(state)) {
        pacBase = 17.9
        pacPerKg = 2.50
        pacDays = '4 a 7 dias úteis'
        sedexDays = '2 a 3 dias úteis'
      } else if (['PR', 'SC', 'RS', 'DF', 'GO', 'MS', 'MT'].includes(state)) {
        pacBase = 23.9
        pacPerKg = 3.80
        pacDays = '5 a 9 dias úteis'
        sedexDays = '2 a 4 dias úteis'
      } else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'TO'].includes(state)) {
        pacBase = 27.9
        pacPerKg = 4.80
        pacDays = '6 a 12 dias úteis'
        sedexDays = '3 a 5 dias úteis'
      } else {
        // Região Norte e Estados distantes (AM, PA, RO, AC, RR, AP)
        pacBase = 32.9
        pacPerKg = 5.80
        pacDays = '8 a 15 dias úteis'
        sedexDays = '4 a 7 dias úteis'
      }

      const pacPrice = pacBase + totalWeight * pacPerKg
      const sedexPrice = pacPrice * 1.35 + 5.0 // SEDEX geralmente 35% mais caro que PAC + taxa fixa

      return NextResponse.json([
        {
          name: 'Correios PAC',
          price: parseFloat(pacPrice.toFixed(2)),
          deliveryTime: pacDays,
          serviceCode: 'PAC'
        },
        {
          name: 'Correios SEDEX',
          price: parseFloat(sedexPrice.toFixed(2)),
          deliveryTime: sedexDays,
          serviceCode: 'SEDEX'
        }
      ])
    }
  } catch (err) {
    console.error('[shipping POST]', err)
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 })
  }
}
