'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, QrCode, Users, Settings, FileText,
  Home, History, User, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database.types'

interface NavItem { label: string; href: string; icon: React.ReactNode }

const adminNav: NavItem[] = [
  { label: 'Inicio',     href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Empleados',  href: '/admin/employees',  icon: <Users className="h-4 w-4" /> },
  { label: 'Informes',   href: '/admin/reports',    icon: <FileText className="h-4 w-4" /> },
  { label: 'Ajustes',    href: '/admin/settings',   icon: <Settings className="h-4 w-4" /> },
]

const employeeNav: NavItem[] = [
  { label: 'Inicio',    href: '/employee/dashboard', icon: <Home className="h-4 w-4" /> },
  { label: 'Historial', href: '/employee/history',    icon: <History className="h-4 w-4" /> },
  { label: 'Perfil',    href: '/employee/profile',    icon: <User className="h-4 w-4" /> },
]

interface Props { role: UserRole; companyName: string }

export function Sidebar({ role, companyName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const nav = role === 'admin' ? adminNav : employeeNav

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex h-full w-56 flex-col border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Brand */}
      <div className="px-3 py-4 border-b border-gray-200 dark:border-zinc-800">
        <Image
          src="/logo.jpg"
          alt="QRtrol"
          width={200}
          height={200}
          priority
          className="rounded-2xl object-contain w-full h-auto"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'text-zinc-950 bg-gray-100 dark:text-zinc-50 dark:bg-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-lg bg-gray-100 dark:bg-zinc-800"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-200 dark:border-zinc-800 p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
