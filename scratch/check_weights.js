const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function parseProductWeight(weightStr) {
  if (!weightStr) return 0.5 // Default 500g
  const cleaned = weightStr.toLowerCase().trim()
  const num = parseFloat(cleaned.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return 0.5
  if (cleaned.includes('kg') || cleaned.includes('l')) {
    return num
  }
  if (cleaned.includes('g') || cleaned.includes('ml')) {
    return num / 1000
  }
  if (num >= 10) {
    return num / 1000
  }
  return num
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, weight: true }
  })
  console.log('--- PRODUCT WEIGHTS AND PARSED RESULTS ---')
  for (const p of products) {
    const parsed = parseProductWeight(p.weight)
    console.log(`Product: "${p.name}"\n  - DB Weight: "${p.weight}"\n  - Parsed Weight: ${parsed} Kg\n`)
  }
}

main().finally(() => prisma.$disconnect())
