import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id?: string
  productId: string
  variantId?: string
  name: string
  variantLabel?: string
  price: number
  image: string
  quantity: number
  proOnly?: boolean
}

type CartStore = {
  items: CartItem[]
  drawerOpen: boolean
  lastAdded: number   // timestamp — increments on each add, triggers badge animation
  toggleDrawer: () => void
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      lastAdded: 0,
      toggleDrawer: () => set(s => ({ drawerOpen: !s.drawerOpen })),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      addItem: (item) => {
        const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId
        set(s => {
          const existing = s.items.find(i => i.id === key)
          if (existing) {
            return {
              items: s.items.map(i => i.id === key ? { ...i, quantity: i.quantity + 1 } : i),
              lastAdded: Date.now(),
            }
          }
          return { items: [...s.items, { ...item, id: key, quantity: 1 }], lastAdded: Date.now() }
        })
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) { get().removeItem(id); return }
        set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity } : i) }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((t, i) => t + i.price * i.quantity, 0),
      count: () => get().items.reduce((t, i) => t + i.quantity, 0),
    }),
    { name: 'makse-cart' }
  )
)
