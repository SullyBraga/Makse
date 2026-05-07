import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function slug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // ── Tabelas de Desconto ──────────────────────────────────────────────
  const [bronze, prata, ouro] = await Promise.all([
    prisma.discountTable.upsert({ where: { id: 'dt-bronze' }, update: {}, create: { id: 'dt-bronze', name: 'Bronze', percentage: 15 } }),
    prisma.discountTable.upsert({ where: { id: 'dt-prata' },  update: {}, create: { id: 'dt-prata',  name: 'Prata',  percentage: 20 } }),
    prisma.discountTable.upsert({ where: { id: 'dt-ouro' },   update: {}, create: { id: 'dt-ouro',   name: 'Ouro',   percentage: 30 } }),
  ])
  console.log('✅ Tabelas de desconto criadas: Bronze (15%), Prata (20%), Ouro (30%)')

  // ── Admin padrão ─────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@makse.com.br' },
    update: {},
    create: {
      name: 'Administrador Makse',
      email: 'admin@makse.com.br',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })
  console.log(`✅ Admin criado: admin@makse.com.br / admin123`)

  // ── Promover primeiro usuário para ADMIN (se não for o admin padrão) ─
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (firstUser && firstUser.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: firstUser.id }, data: { role: 'ADMIN' } })
    console.log(`✅ Usuário ${firstUser.email} promovido para ADMIN!`)
  }

  // ── Linhas de Produto ─────────────────────────────────────────────────
  const linhas = [
    { id: 'line-crystal',      name: 'Linha Crystal',   slug: 'crystal',      description: 'Tecnologia de descoloração avançada para resultados brancos e uniformes.', order: 1 },
    { id: 'line-diamond',      name: 'Linha Diamond',   slug: 'diamond',      description: 'Tratamentos profissionais exclusivos para salões de alto padrão.', order: 2 },
    { id: 'line-perfect',      name: 'Perfect Repair',  slug: 'perfect-repair', description: 'Linha restauradora de fios danificados por processos químicos.', order: 3 },
    { id: 'line-ox',           name: 'Makse Ox',        slug: 'makse-ox',     description: 'Oxigenadas profissionais para ativação de coloração e descoloração.', order: 4 },
    { id: 'line-mrdetox',      name: 'Mr. Detox',       slug: 'mr-detox',     description: 'Limpeza profunda com ativos detox para couro cabeludo saudável.', order: 5 },
    { id: 'line-cachos',       name: 'Meus Cachos',     slug: 'meus-cachos',  description: 'Definição e hidratação especial para cabelos cacheados e crespos.', order: 6 },
  ]
  for (const l of linhas) {
    await prisma.productLine.upsert({ where: { slug: l.slug }, update: {}, create: l })
  }
  console.log(`✅ ${linhas.length} linhas de produto criadas`)

  // ── Produtos de Demonstração ─────────────────────────────────────────
  const produtos = [
    {
      id: 'prod-001', sku: 'MKS-001',
      name: 'Pó Descolorante Crystal White 500g',
      slug: 'po-descolorante-crystal-white-500g',
      description: 'Pó descolorante de alta performance com tecnologia anti-amarelamento. Clareamento de até 9 tons com baixo ressecamento.',
      ingredients: 'Persulfato de sódio, persulfato de potássio, caulim, sulfato de magnésio.',
      howToUse: 'Misture 1 parte de pó para 2 partes de OX. Aplique nos fios e aguarde o tempo necessário (15 a 40 minutos).',
      usage: 'Indicado para descoloração total ou mechas em cabelos naturais ou tingidos.',
      productType: 'Pó Descolorante', weight: '500g', price: 129.90,
      lineSlug: 'crystal', proOnly: false, featured: true,
      stock: 50, variantLabel: 'Padrão',
    },
    {
      id: 'prod-002', sku: 'MKS-002',
      name: 'Pó Descolorante Crystal Blue 500g',
      slug: 'po-descolorante-crystal-blue-500g',
      description: 'Pó azul desamarelador com aktivos de proteção para descoloração de cabelos resistentes. Exclusivo para profissionais.',
      ingredients: 'Persulfato de amônio, pigmento azul, caulim, proteína de trigo.',
      howToUse: 'Misture 1:2 com OX de 20 a 40 volumes. Aplique e aguarde até 50 minutos.',
      usage: 'Ideal para cabelos tingidos e resistentes. Uso profissional obrigatório.',
      productType: 'Pó Descolorante', weight: '500g', price: 149.90,
      lineSlug: 'crystal', proOnly: true, featured: false,
      stock: 30, variantLabel: 'Padrão',
    },
    {
      id: 'prod-003', sku: 'MKS-003',
      name: 'Kit Progressiva Diamond Liso',
      slug: 'kit-progressiva-diamond-liso',
      description: 'Kit completo de progressiva profissional com ativos de queratina e ácido hialurônico para liso perfeito com brilho intenso.',
      ingredients: 'Queratina hidrolisada, ácido hialurônico, aminoácidos, aloe vera.',
      howToUse: 'Lave o cabelo com shampoo antirresíduo, seque parcialmente e aplique a progressiva. Seque e pranchie em mechas finas.',
      usage: 'Exclusivo para cabeleireiros formados. Não aplicar em cabelos com menos de 3cm.',
      productType: 'Kit', weight: '1Kg',  price: 299.90,
      lineSlug: 'diamond', proOnly: true, featured: true,
      stock: 15, variantLabel: 'Kit Completo',
    },
    {
      id: 'prod-004', sku: 'MKS-004',
      name: 'Shampoo Perfect Repair 1L',
      slug: 'shampoo-perfect-repair-1l',
      description: 'Shampoo restaurador para fios danificados por processos químicos. Hidratação profunda com proteínas da seda.',
      ingredients: 'Aqua, lauril sulfato de sódio, proteína de seda, pantenol, queratina.',
      howToUse: 'Aplique nos fios molhados, massageie e enxágue. Repita se necessário.',
      usage: 'Cabelos danificados, com química, secos e ressecados.',
      productType: 'Shampoo', weight: '1L', price: 79.90,
      lineSlug: 'perfect-repair', proOnly: false, featured: true,
      stock: 80, variantLabel: 'Padrão',
    },
    {
      id: 'prod-005', sku: 'MKS-005',
      name: 'Máscara Perfect Repair 1Kg',
      slug: 'mascara-perfect-repair-1kg',
      description: 'Máscara de tratamento intensivo para reconstrução de fios fragilizados. Ativa em apenas 20 minutos.',
      ingredients: 'Aqua, álcool cetearílico, queratina hidrolisada, óleo de argan, ceramidas.',
      howToUse: 'Após shampoo, aplique nos fios, deixe agir por 20 min e enxágue.',
      usage: 'Todos os tipos de cabelo. Ideal para pós-química.',
      productType: 'Máscara', weight: '1Kg', price: 119.90,
      lineSlug: 'perfect-repair', proOnly: false, featured: false,
      stock: 60, variantLabel: 'Padrão',
    },
    {
      id: 'prod-006', sku: 'MKS-006',
      name: 'Máscara Matizadora Crystal Blond 1Kg',
      slug: 'mascara-matizadora-crystal-blond-1kg',
      description: 'Máscara matizadora roxa de alta deposição para neutralização de tons indesejados em cabelos descoloridos.',
      ingredients: 'Aqua, pigmento violeta, proteínas da seda, ceramidas, óleo de jojoba.',
      howToUse: 'Aplique nos fios úmidos pós shampoo. Aguarde 5 a 30 minutos conforme intensidade desejada.',
      usage: 'Cabelos descoloridos, loiros e grisalhos com tons amarelados.',
      productType: 'Máscara', weight: '1Kg', price: 99.90,
      lineSlug: 'crystal', proOnly: false, featured: true,
      stock: 45, variantLabel: 'Padrão',
    },
    {
      id: 'prod-007', sku: 'MKS-007',
      name: 'OX 30 Volumes Makse 900ml',
      slug: 'ox-30-volumes-makse-900ml',
      description: 'Água oxigenada profissional 30 volumes para descoloração e coloração. Alta estabilidade e rendimento.',
      ingredients: 'Agua oxigenada 9%, creme estabilizante, ácido fosfórico.',
      howToUse: 'Misture com o pó descolorante ou coloração na proporção indicada pelo fabricante.',
      usage: 'Profissionais e uso em salões. Não aplicar diretamente no couro cabeludo.',
      productType: 'OX', weight: '900ml', price: 39.90,
      lineSlug: 'makse-ox', proOnly: false, featured: false,
      stock: 120, variantLabel: '30 Vol',
    },
    {
      id: 'prod-008', sku: 'MKS-008',
      name: 'Shampoo Mr. Detox Purificante 1L',
      slug: 'shampoo-mr-detox-purificante-1l',
      description: 'Shampoo de limpeza profunda com carvão ativado e argila branca para couro cabeludo oleoso e com impurezas.',
      ingredients: 'Aqua, carvão ativado, argila branca, ácido salicílico, aloe vera.',
      howToUse: 'Aplique nos fios e couro cabeludo molhados. Massageie por 2 min e enxágue.',
      usage: 'Couro cabeludo oleoso, com caspa ou impurezas. Uso semanal.',
      productType: 'Shampoo', weight: '1L', price: 69.90,
      lineSlug: 'mr-detox', proOnly: false, featured: false,
      stock: 70, variantLabel: 'Padrão',
    },
    {
      id: 'prod-009', sku: 'MKS-009',
      name: 'Creme de Cachos Meus Cachos 1Kg',
      slug: 'creme-de-cachos-meus-cachos-1kg',
      description: 'Creme hidratante e definidor para cachos e crespos. Mantém a definição por até 3 dias sem ressecamento.',
      ingredients: 'Aqua, manteiga de karité, óleo de coco, glicerina, extrato de linhaça.',
      howToUse: 'Aplique nos fios úmidos, modele os cachos e seque naturalmente ou difusor.',
      usage: 'Cabelos cacheados, crespos e ondulados.',
      productType: 'Creme', weight: '1Kg', price: 89.90,
      lineSlug: 'meus-cachos', proOnly: false, featured: false,
      stock: 55, variantLabel: 'Padrão',
    },
    {
      id: 'prod-010', sku: 'MKS-010',
      name: 'OX 20 Volumes Makse 900ml',
      slug: 'ox-20-volumes-makse-900ml',
      description: 'Água oxigenada profissional 20 volumes para coloração e descoloração suave.',
      ingredients: 'Agua oxigenada 6%, creme estabilizante.',
      howToUse: 'Misture conforme indicação da coloração ou pó descolorante.',
      usage: 'Para coloração e descoloração suave. Não aplicar puro na pele.',
      productType: 'OX', weight: '900ml', price: 35.90,
      lineSlug: 'makse-ox', proOnly: false, featured: false,
      stock: 130, variantLabel: '20 Vol',
    },
  ]

  for (const p of produtos) {
    const line = await prisma.productLine.findUnique({ where: { slug: p.lineSlug } })
    const { stock, variantLabel, lineSlug, ...data } = p

    await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        images: [],
        lineId: line?.id,
        variants: {
          create: [{ label: variantLabel, price: data.price, stock }]
        },
      },
    })
  }
  console.log(`✅ ${produtos.length} produtos de demonstração criados!`)

  console.log('\n🎉 Seed concluído! Acesse /admin com as suas credenciais.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
