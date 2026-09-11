import { prisma } from '@/lib/prisma'

export const DEFAULT_HERO_SLIDES = [
  {
    order: 0,
    active: true,
    resolutionMode: 'SINGLE' as const,
    image: '/foto-hero.jpeg',
    label: 'Cosmética Avançada',
    titleLine1: 'Beleza que se sente',
    titleLine2: 'no toque',
    description: 'Fórmulas exclusivas desenvolvidas para profissionais que exigem performance e clientes que buscam transformação real.',
    primaryCtaText: 'Explorar Coleção',
    primaryCtaLink: '/catalogo',
    secondaryCtaText: 'Cadastro Pro',
    secondaryCtaLink: '/cadastro',
  },
  {
    order: 1,
    active: true,
    resolutionMode: 'SINGLE' as const,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1200&auto=format&fit=crop',
    label: 'Exclusivo Profissionais',
    titleLine1: 'Performance Máxima',
    titleLine2: 'no salão',
    description: 'Cadastre seu salão de beleza e aproveite descontos exclusivos e produtos desenvolvidos por especialistas.',
    primaryCtaText: 'Seja Parceiro',
    primaryCtaLink: '/cadastro',
    secondaryCtaText: 'Ver Linhas',
    secondaryCtaLink: '/linhas',
  },
  {
    order: 2,
    active: true,
    resolutionMode: 'SINGLE' as const,
    image: 'https://images.unsplash.com/photo-1527799863830-55c97d627fb2?q=80&w=1200&auto=format&fit=crop',
    label: 'Linhas Premium',
    titleLine1: 'Tecnologia CuraBond',
    titleLine2: 'avançada',
    description: 'Tratamento de alto padrão com ativos inteligentes para proteção e regeneração profunda da fibra capilar.',
    primaryCtaText: 'Ver Favoritos',
    primaryCtaLink: '/catalogo',
    secondaryCtaText: 'Sobre Nós',
    secondaryCtaLink: '/sobre',
  },
]

export async function ensureDefaultHeroSlides() {
  const count = await prisma.heroSlide.count()
  if (count === 0) {
    for (const slide of DEFAULT_HERO_SLIDES) {
      await prisma.heroSlide.create({ data: slide })
    }
  }
}
