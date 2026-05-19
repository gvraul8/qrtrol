'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Inicio',    href: '/employee/dashboard', icon: Home },
  { label: 'Historial', href: '/employee/history',    icon: History },
  { label: 'Perfil',    href: '/employee/profile',    icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-colors active:opacity-70',
              active ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
