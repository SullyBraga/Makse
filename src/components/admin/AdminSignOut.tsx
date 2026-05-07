'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.75rem', borderRadius: '10px',
        fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
        background: 'none', border: 'none', cursor: 'pointer', width: '100%',
        letterSpacing: '0.05em',
      }}
    >
      <LogOut size={13} /> Sair
    </button>
  )
}
