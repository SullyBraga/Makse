'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Scroll-reveal system.
 *
 * Explicit (via data-* attributes on any element):
 *   data-reveal              → fade + slide-up on the element itself
 *   data-reveal-scale        → fade + scale-up on the element itself
 *   data-reveal-delay="0.2"  → extra delay in seconds before revealing
 *
 * Auto (no attributes needed):
 *   .card-product elements are automatically observed and revealed
 *   with a gentle sequential fade as they enter the viewport.
 *
 * Re-runs on every pathname change (Next.js client navigation).
 */

export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    const prepared = new WeakSet<Element>()

    /* ─── Explicit [data-reveal] ─── */
    // threshold:0 + generous rootMargin ensures elements visible when observed also fire
    const explicitObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const delay = el.dataset.revealDelay
            ? parseFloat(el.dataset.revealDelay) * 1000
            : 0
          setTimeout(() => el.classList.add('visible'), delay)
          explicitObs.unobserve(el)
        })
      },
      { threshold: 0, rootMargin: '80px 0px' }   // fires even slightly before entering viewport
    )

    function observeExplicit() {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (prepared.has(el)) return
        prepared.add(el)
        el.classList.add(el.dataset.revealScale !== undefined ? 'reveal-scale' : 'reveal')
        explicitObs.observe(el)
      })
    }

    /* ─── Auto-reveal for .card-product ─── */
    // threshold:0, rootMargin expanded by 80px → fires as soon as ANY pixel enters
    // (also immediately fires for elements already in viewport when observed)
    const autoObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('visible')
          autoObs.unobserve(entry.target)
        })
      },
      { threshold: 0, rootMargin: '80px 0px' }
    )

    /* Counter persists across MutationObserver calls so stagger is cumulative */
    let cardCounter = 0

    function observeAuto() {
      document.querySelectorAll<HTMLElement>('.card-product').forEach((el) => {
        if (prepared.has(el)) return
        // Don't double-process cards already inside an explicit [data-reveal] container
        if (el.closest('[data-reveal]') && el !== el.closest('[data-reveal]')) return

        prepared.add(el)
        el.classList.add('reveal')
        el.style.transitionDelay = `${cardCounter * 60}ms`
        cardCounter++
        autoObs.observe(el)
      })
    }

    observeExplicit()
    observeAuto()

    // Catch elements added after hydration (client-side renders, lazy loads)
    const mutObs = new MutationObserver(() => {
      observeExplicit()
      observeAuto()
    })
    mutObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      explicitObs.disconnect()
      autoObs.disconnect()
      mutObs.disconnect()
    }
  }, [pathname])

  return null
}
