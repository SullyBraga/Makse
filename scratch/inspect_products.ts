import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      orderItems: { select: { id: true } },
      kitItems: { select: { id: true } }
    }
  })

  console.log('--- ENCONTRADOS', products.length, 'PRODUTOS ---')
  for (const p of products) {
    console.log(`ID: ${p.id}`)
    console.log(`Nome: ${p.name}`)
    console.log(`Active: ${p.active}`)
    console.log(`Archived: ${(p as any).archived}`)
    console.log(`Images: ${JSON.stringify(p.images)}`)
    console.log(`OrderItems count: ${p.orderItems.length}`)
    console.log(`KitItems count: ${p.kitItems.length}`)
    console.log('-----------------------------------')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
