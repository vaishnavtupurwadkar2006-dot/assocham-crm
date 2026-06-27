'use client'

import { usePathname } from 'next/navigation'
import { Bell, Sun, Moon, Menu, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contacts': 'Contacts',
  '/import': 'Import Business Cards',
  '/import/business-card': 'Business Card Scanner',
  '/import/bulk': 'Bulk Import',
  '/ai-search': 'AI Search',
  '/follow-ups': 'Follow-Up Manager',
  '/data-quality': 'Data Quality',
  '/admin/users': 'User Management',
  '/settings': 'Settings',
}

interface HeaderProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  setMobileOpen: (open: boolean) => void
}

export default function Header({ collapsed, setCollapsed, setMobileOpen }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  
  const title = PAGE_TITLES[pathname] || 'ASSOCHAM CRM'

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex lg:hidden w-9 h-9 items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle when Collapsed */}
        {collapsed && (
          <button 
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex w-7 h-7 items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <h1 className="text-zinc-900 dark:text-white font-semibold text-sm md:text-base">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Light/Dark Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}
        </button>

        {/* Notifications */}
        <button 
          className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* User Profile Info */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}
