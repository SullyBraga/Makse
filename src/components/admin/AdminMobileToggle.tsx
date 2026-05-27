'use client'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function AdminMobileToggle() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleClose = () => {
      setOpen(false)
    }
    window.addEventListener('close-admin-sidebar', handleClose)
    return () => window.removeEventListener('close-admin-sidebar', handleClose)
  }, [])

  const toggle = () => {
    const sidebar = document.getElementById('admin-sidebar')
    const overlay = document.querySelector('.admin-overlay') as HTMLElement | null
    if (!sidebar) return
    
    // We check actual class existence to prevent state desync
    const isCurrentlyOpen = sidebar.classList.contains('open')
    
    if (isCurrentlyOpen) {
      sidebar.classList.remove('open')
      overlay?.classList.remove('show')
      setOpen(false)
    } else {
      sidebar.classList.add('open')
      overlay?.classList.add('show')
      setOpen(true)
    }
  }

  return (
    <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: '0.25rem' }}>
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
  )
}
