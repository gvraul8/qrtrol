'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { UserProfile } from '@/types/auth.types'

interface Props {
  profile: UserProfile
  title: string
}

export function Header({ profile, title }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 md:px-6 dark:border-zinc-800 dark:bg-zinc-950/80">
      {/* Mobile: logo or app name; Desktop: just the title text */}
      <div className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="QRtrol"
          className="h-20 w-20 rounded-xl object-contain md:hidden"
        />
        <h1 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Cambiar tema"
          suppressHydrationWarning
        >
          {mounted && (theme === 'dark'
            ? <Sun className="h-4 w-4 text-zinc-400" />
            : <Moon className="h-4 w-4 text-zinc-600" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors outline-none">
              <Avatar className="h-7 w-7">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                <AvatarFallback className="text-[10px]">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-600 dark:text-zinc-300 hidden sm:block">{profile.full_name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{profile.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/employee/profile')}>
              <User className="h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
