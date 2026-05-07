import Link from 'next/link'
import { ArrowRight, Leaf, Star, Shield } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/shop/ProductCard'

const S = {
  container: { maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' } as React.CSSProperties,
  section: (bg = '#fff') => ({ padding: 'clamp(3rem,6vw,5rem) 0', backgroundColor: bg }) as React.CSSProperties,
} as const

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: { line: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return (
    <div>

      {/* ── HERO ── */}
      <section style={{ minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', backgroundColor: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,183,184,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,183,184,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ ...S.container, width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px', padding: 'clamp(3rem,8vw,5rem) 0', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="section-label animate-fade" style={{ animationDelay: '0.05s' }}>Cosmética Avançada</span>
            <h1
              className="animate-up"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 'clamp(2.75rem,7vw,5rem)', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.06, margin: '0.5rem auto 1.25rem', textAlign: 'center', animationDelay: '0.15s' }}
            >
              <span style={{ display: 'block' }}>Beleza que se sente</span>
              <span style={{ display: 'block', fontWeight: 400, fontStyle: 'italic', fontSize: '0.92em', color: 'var(--gold)', letterSpacing: '0.03em', marginTop: '0.1rem' }}>no toque</span>
            </h1>
            <p className="animate-up" style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2.25rem', maxWidth: '440px', animationDelay: '0.28s' }}>
              Fórmulas exclusivas desenvolvidas para profissionais que exigem performance e clientes que buscam transformação real.
            </p>
            <div className="animate-up" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.4s' }}>
              <Link href="/catalogo" className="btn-primary">Explorar Coleção</Link>
              <Link href="/cadastro" className="btn-outline">Cadastro Pro</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section style={S.section('#fff')}>
        <div style={S.container}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="section-label">Por que Makse</span>
          </div>
          {/* Each card has its own data-reveal + delay */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem' }}>
            {[
              { icon: <Leaf size={22} />, title: 'Ativos Naturais', desc: 'Biotecnologia com o poder da natureza para resultados saudáveis e duradouros.', delay: '0' },
              { icon: <Star size={22} />, title: 'Performance Pro', desc: 'Aprovados pelos maiores coloristas e salões profissionais do Brasil.', delay: '0.1' },
              { icon: <Shield size={22} />, title: 'Tecnologia Plex', desc: 'Proteção máxima da fibra capilar mesmo durante os processos mais intensos.', delay: '0.2' },
            ].map(item => (
              <div
                key={item.title}
                data-reveal
                data-reveal-delay={item.delay}
                className="hover-lift"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem', border: '1px solid var(--cream)', borderRadius: '20px', background: '#fff' }}
              >
                <div style={{ color: 'var(--gold)', marginBottom: '1rem', padding: '0.875rem', background: 'var(--cream)', borderRadius: '50%' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.5rem', fontFamily: 'var(--font-dm-sans),sans-serif' }}>{item.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section style={S.section('#fafafa')}>
        <div style={S.container}>
          <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-label">Favoritos do Salão</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant),Georgia,serif', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 400, color: 'var(--navy)', lineHeight: 1.1, margin: 0 }}>
                Os Mais Escolhidos
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="arrow-link"
              style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}
            >
              Ver Todos <span className="arrow-icon"><ArrowRight size={13} /></span>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '20px', border: '1px dashed var(--cream-dark)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Nenhum produto em destaque ainda.{' '}
                <Link href="/admin/produtos" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Marcar destaques no Admin →</Link>
              </p>
            </div>
          ) : (
            /* Cards are auto-detected by ScrollReveal (.card-product selector) */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {featuredProducts.map(p => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  lineName={p.line?.name ?? null}
                  images={p.images as string[]}
                  proOnly={p.proOnly}
                  featured
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── COMPROMISSO ── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 1.5rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div
            data-reveal
            data-reveal-scale
            style={{ background: 'var(--navy)', borderRadius: '24px', padding: 'clamp(2.5rem,5vw,4rem) clamp(1.5rem,4vw,3rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,183,184,0.1)', pointerEvents: 'none' }} />
            <Shield size={32} style={{ color: 'var(--gold)', margin: '0 auto 1.25rem', display: 'block' }} />
            <h2 style={{ fontFamily: 'var(--font-cormorant),Georgia,serif', fontSize: 'clamp(1.9rem,4vw,2.75rem)', fontWeight: 400, color: '#fff', marginBottom: '1rem' }}>
              Compromisso Makse
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 2rem' }}>
              Garantimos a qualidade de cada produto que sai da nossa linha. Fórmulas testadas, resultados comprovados e suporte técnico para profissionais.
            </p>
            <Link href="/sobre" className="btn-gold">Conheça Nossa História</Link>
          </div>
        </div>
      </section>

      {/* ── CTA PRO ── */}
      <section style={{ ...S.section('#fafafa'), textAlign: 'center' }}>
        <div data-reveal style={{ ...S.container, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="section-label">Pronto para transformar?</span>
          <h2 style={{ fontFamily: 'var(--font-cormorant),Georgia,serif', fontSize: 'clamp(2rem,4.5vw,3.25rem)', fontWeight: 400, color: 'var(--navy)', margin: '0.5rem 0 1rem', maxWidth: '580px', lineHeight: 1.15 }}>
            Junte-se a milhares de profissionais que escolheram a Makse.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '460px' }}>
            Cadastre-se como profissional e tenha acesso a produtos exclusivos com descontos especiais.
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/cadastro" className="btn-primary">Cadastro Profissional</Link>
            <Link href="/sobre" className="btn-outline">Conheça a Makse</Link>
          </div>
        </div>
      </section>

    </div>
  )
}