const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      updatedAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 10
  });

  console.log('--- ULTIMOS 10 PRODUTOS ATUALIZADOS/CRIADOS ---');
  for (const p of products) {
    console.log(`Produto: ${p.name} (SKU: ${p.sku})`);
    console.log(`ID: ${p.id}`);
    console.log(`Imagens:`, p.images);
    console.log(`Atualizado em: ${p.updatedAt}`);
    console.log('------------------------------------------------');
  }
}

main().finally(() => prisma.$disconnect());
