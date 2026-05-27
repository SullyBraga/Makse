'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function AdminSignOut({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      title={isCollapsed ? 'Sair' : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: isCollapsed ? '0' : '0.5rem',
        padding: '0.5rem 0.75rem', borderRadius: '10px',
        fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
        background: 'none', border: 'none', cursor: 'pointer', width: isCollapsed ? 'auto' : '100%',
        letterSpacing: '0.05em',
      }}
    >
      <LogOut size={13} /> {!isCollapsed && 'Sair'}
    </button>
  )
}
