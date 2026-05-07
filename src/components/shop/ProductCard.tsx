import Link from 'next/link'
import Image from 'next/image'
import { Scissors } from 'lucide-react'

type Props = {
  id: string
  name: string
  slug: string        // full path passed in (e.g. kit/my-slug or just my-slug)
  price: number
  discountedPrice?: number | null
  discountPct?: number
  lineName?: string | null
  productType?: string | null
  images: string[]
  proOnly?: boolean
  outOfStock?: boolean
  featured?: boolean
  badgeLabel?: string   // custom badge (e.g. "Kit")
  badgeColor?: string   // custom badge background color
}

export default function ProductCard({
  name, slug, price, discountedPrice, discountPct, lineName, productType,
  images, proOnly, outOfStock, badgeLabel, badgeColor,
}: Props) {
  const coverImage = images?.[0] ?? null
  const displayPrice = discountedPrice ?? price
  // slug may be a full relative path like "kit/my-slug" or just "my-slug"
  const href = slug.startsWith('kit/') || slug.startsWith('/') ? `/${slug}` : `/produto/${slug}`

  return (
    <div className="card-product" style={{ position: 'relative' }}>
      {/* Image area */}
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>
        <div className="card-product-img" style={{ aspectRatio: '1' }}>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="card-placeholder" style={{ aspectRatio: '1' }}>
              <span className="card-placeholder-letter">M</span>
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', zIndex: 2 }}>
            {badgeLabel && (
              <span style={{ background: badgeColor ?? 'var(--navy)', color: '#fff', fontSize: '0.5rem', padding: '0.25rem 0.6rem', borderRadius: '999px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                {badgeLabel}
              </span>
            )}
            {proOnly && (
              <span style={{ background: 'var(--navy)', color: 'var(--gold)', fontSize: '0.5rem', padding: '0.25rem 0.6rem', borderRadius: '999px', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Scissors size={7} /> Pro
              </span>
            )}
            {discountPct && discountPct > 0 ? (
              <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.52rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontWeight: 700, letterSpacing: '0.05em' }}>
                -{discountPct}%
              </span>
            ) : null}
            {outOfStock && (
              <span style={{ background: 'rgba(220,38,38,0.9)', color: '#fff', fontSize: '0.52rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontWeight: 600 }}>
                Esgotado
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="card-add-overlay">
            <span>Adicionar ao Carrinho</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '0.875rem 1rem 1rem' }}>
        {(lineName || productType) && (
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: badgeColor ?? 'var(--gold)', marginBottom: '0.3rem', fontWeight: 600 }}>
            {lineName ?? productType}
          </p>
        )}
        <Link href={href} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontSize: '0.875rem', fontWeight: 500, color: 'var(--navy)',
            lineHeight: 1.4, marginBottom: '0.625rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {name}
          </h3>
        </Link>

        {/* Price */}
        {discountedPrice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
              R$ {discountedPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>
            R$ {displayPrice.toFixed(2).replace('.', ',')}
          </p>
        )}
      </div>
    </div>
  )
}
