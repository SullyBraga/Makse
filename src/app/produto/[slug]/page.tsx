import { notFound } from 'next/navigation'
import { ArrowLeft, Scissors, Beaker, CheckCircle2, Ruler } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import ProductGallery from '@/components/shop/ProductGallery'
import ProductActions from '@/components/shop/ProductActions'
import KitSuggestions from '@/components/shop/KitSuggestions'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const role = (session?.user as any)?.role ?? 'guest'
  const discountPct: number = (session?.user as any)?.discountPct ?? 0
  const isPro = role === 'CABELEIREIRA' || role === 'ADMIN'

  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      line: true,
      variants: { orderBy: { price: 'asc' } },
    },
  })

  if (!product) notFound()

  // Related products from same line
  const related = product.lineId
    ? await prisma.product.findMany({
        where: {
          lineId: product.lineId,
          id: { not: product.id },
          active: true,
          ...(isPro ? {} : { proOnly: false }),
        },
        include: { line: { select: { name: true } } },
        take: 6,
      })
    : []

  // Kit suggestions
  const kitSuggestions = await prisma.kit.findMany({
    where: {
      active: true,
      showAsSuggestion: true,
      items: { some: { productId: product.id } },
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, images: true, price: true, pricePro: true } },
        },
      },
    },
    take: 3,
  })

  const totalStock = product.variants.reduce((t, v) => t + v.stock, 0)

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Top nav bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--cream)', padding: '0.875rem 0' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>
          <Link href="/catalogo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={13} /> Voltar ao Catálogo
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: 'clamp(1.5rem,3vw,3rem) 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(2rem,5vw,5rem)', alignItems: 'start' }}>

          {/* LEFT — Gallery */}
          <div className="animate-up">
            <ProductGallery images={product.images as string[]} productName={product.name} />
          </div>

          {/* RIGHT — Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-up">
            {/* Line badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              {product.line && (
                <span style={{ background: 'var(--cream)', color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.3rem 0.875rem', borderRadius: '999px', fontWeight: 500 }}>
                  Linha {product.line.name}
                </span>
              )}
              {product.proOnly && (
                <span style={{ background: 'var(--navy)', color: 'var(--gold)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.3rem 0.875rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Scissors size={9} /> Exclusivo Pro
                </span>
              )}
              {totalStock === 0 && (
                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.875rem', borderRadius: '999px', fontWeight: 600 }}>
                  Esgotado
                </span>
              )}
            </div>

            {/* Product name */}
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(1.9rem,4vw,2.75rem)', fontWeight: 400, color: 'var(--navy)', lineHeight: 1.15, margin: 0 }}>
              {product.name}
            </h1>

            {/* Short description */}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              {product.description}
            </p>

            {/* Actions (price, variants, add, shipping) */}
            {(product.proOnly || product.price <= 0) && !isPro ? (
              <div style={{
                background: 'var(--cream)',
                border: '1.5px solid var(--cream-dark)',
                borderRadius: '20px',
                padding: '1.75rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
              }}>
                <Scissors size={28} style={{ color: 'var(--gold)' }} />
                <div>
                  <h4 style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--navy)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: '0 0 0.5rem'
                  }}>
                    Uso Exclusivo Profissional
                  </h4>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: '340px'
                  }}>
                    Este produto é formulado para alta performance técnica e possui venda restrita a cabeleireiras e profissionais cadastrados.
                  </p>
                </div>
                
                <div style={{ width: '100%', height: '1px', background: 'var(--cream-dark)', opacity: 0.5 }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 500, margin: 0 }}>
                    Para ver os preços e comprar:
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link href={`/login?redirect=/produto/${product.slug}`} className="btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.68rem', flex: 1, minWidth: '140px' }}>
                      Fazer Login
                    </Link>
                    <Link href="/cadastro" className="btn-outline" style={{ padding: '0.65rem 1.5rem', fontSize: '0.68rem', flex: 1, minWidth: '140px' }}>
                      Criar Conta Pro
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <ProductActions
                product={{ id: product.id, name: product.name, slug: product.slug, proOnly: product.proOnly }}
                variants={product.variants}
                basePrice={product.price}
                discountPct={discountPct}
                isPro={isPro}
              />
            )}

            {/* Key specs */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--cream)', overflow: 'hidden' }}>
              {product.ingredients && (
                <div style={{ display: 'flex', gap: '0.875rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--cream)' }}>
                  <Beaker size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Ativos Principais</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.5 }}>{product.ingredients}</p>
                  </div>
                </div>
              )}
              {product.usage && (
                <div style={{ display: 'flex', gap: '0.875rem', padding: '1rem 1.25rem', borderBottom: product.weight ? '1px solid var(--cream)' : 'none' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Indicação</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.5 }}>{product.usage}</p>
                  </div>
                </div>
              )}
              {(product.weight || product.productType) && (
                <div style={{ display: 'flex', gap: '0.875rem', padding: '1rem 1.25rem' }}>
                  <Ruler size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Especificações</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.5 }}>
                      {[product.weight && `Volume: ${product.weight}`, product.productType && `Tipo: ${product.productType}`].filter(Boolean).join(' | ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full How To Use section */}
        {product.howToUse && (
          <div style={{ marginTop: 'clamp(2rem,5vw,4rem)', background: '#fff', borderRadius: '20px', border: '1px solid var(--cream)', padding: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <span className="section-label">Modo de Usar</span>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.9, marginTop: '0.5rem' }}>{product.howToUse}</p>
          </div>
        )}

        {/* Kit suggestions — Compre Junto */}
        {kitSuggestions.length > 0 && (
          <KitSuggestions kits={kitSuggestions as any} isPro={isPro} discountPct={discountPct} />
        )}

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ marginTop: 'clamp(2.5rem,6vw,5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>Complete o Tratamento</span>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 400, color: 'var(--navy)', margin: 0 }}>
                  Também da {product.line?.name ?? 'Linha'}
                </h2>
              </div>
              {product.line && (
                <Link href={`/catalogo?linha=${product.line.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}>
                  Ver toda linha →
                </Link>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {related.map(r => {
                const rPrice = (isPro && r.pricePro) ? r.pricePro : (r.price > 0 ? r.price : (r.pricePro ?? r.price))
                return (
                  <Link key={r.id} href={`/produto/${r.slug}`} style={{ textDecoration: 'none', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--cream)', transition: 'box-shadow 0.2s, transform 0.2s' }} className="hover-lift">
                    <div style={{ aspectRatio: '1', background: 'var(--cream)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(r.images as string[])?.[0] ? (
                        <img src={(r.images as string[])[0]} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '3rem', fontWeight: 200, color: 'rgba(100,116,139,0.2)', fontFamily: 'var(--font-cormorant),serif' }}>M</span>
                      )}
                    </div>
                    <div style={{ padding: '0.875rem' }}>
                      {r.line && <p style={{ fontSize: '0.57rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.25rem' }}>{r.productType ?? r.line.name}</p>}
                      <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--navy)', lineHeight: 1.35, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                          R$ {rPrice.toFixed(2).replace('.', ',')}
                        </p>
                        {r.proOnly && (
                          <span style={{ fontSize: '0.55rem', color: 'var(--gold)', background: 'var(--navy)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PRO</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}