'use client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function AdminMobileToggle() {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    const sidebar = document.getElementById('admin-sidebar')
    const overlay = document.querySelector('.admin-overlay') as HTMLElement | null
    if (!sidebar) return
    if (open) {
      sidebar.classList.remove('open')
      overlay?.classList.remove('show')
    } else {
      sidebar.classList.add('open')
      overlay?.classList.add('show')
    }
    setOpen(!open)
  }

  return (
    <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: '0.25rem' }}>
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
  )
}
