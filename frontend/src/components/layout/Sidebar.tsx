'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Brain, Calendar,
  AlertTriangle, Settings, LogOut, Shield,
  Upload, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getFollowUps } from '@/lib/api'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/import', label: 'Import Cards', icon: Upload, badge: 'AI' },
  { href: '/ai-search', label: 'AI Search', icon: Brain, badge: 'AI' },
  { href: '/follow-ups', label: 'Follow-Ups', icon: Calendar },
  { href: '/data-quality', label: 'Data Quality', icon: AlertTriangle },
]

const ADMIN_ITEMS = [
  { href: '/admin/users', label: 'User Management', icon: Shield },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const { data: followupsRes } = useQuery({
    queryKey: ['followups'],
    queryFn: getFollowUps,
    refetchInterval: 60_000,
  })

  const handleLinkClick = () => {
    setMobileOpen(false)
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 sidebar-transition",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0 mr-3">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-200">
                <p className="text-zinc-900 dark:text-white font-semibold text-sm leading-none">ASSOCHAM</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">Contact CRM</p>
              </div>
            )}
          </div>
          
          {/* Desktop Toggle Button */}
          {!collapsed && (
            <button 
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex w-6 h-6 items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          <div>
            <span className={cn(
              "px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2",
              collapsed && "sr-only"
            )}>
              Menu
            </span>
            <div className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                let displayBadge = badge
                if (href === '/follow-ups') {
                  const count = (followupsRes?.data?.overdue?.length || 0) + 
                                (followupsRes?.data?.due_today?.length || 0) + 
                                (followupsRes?.data?.due_this_week?.length || 0)
                  displayBadge = count > 0 ? String(count) : undefined
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleLinkClick}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {displayBadge && !collapsed && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                        {displayBadge}
                      </span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left rounded bg-zinc-900 dark:bg-zinc-800 px-2 py-1 text-xs text-white whitespace-nowrap z-50 shadow-md">
                        {label} {displayBadge && `(${displayBadge})`}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Admin section */}
          {user?.role === 'Admin' && (
            <div>
              <p className={cn(
                "px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2",
                collapsed && "sr-only"
              )}>
                Administration
              </p>
              <div className="space-y-1">
                {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={handleLinkClick}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{label}</span>}

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left rounded bg-zinc-900 dark:bg-zinc-800 px-2 py-1 text-xs text-white whitespace-nowrap z-50 shadow-md">
                          {label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User + Settings + Logout Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-1">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className="group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 truncate">Settings</span>}

            {collapsed && (
              <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left rounded bg-zinc-900 dark:bg-zinc-800 px-2 py-1 text-xs text-white whitespace-nowrap z-50 shadow-md">
                Settings
              </span>
            )}
          </Link>
          
          <button
            onClick={logout}
            className="group relative w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left truncate">Sign out</span>}

            {collapsed && (
              <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left rounded bg-red-600 px-2 py-1 text-xs text-white whitespace-nowrap z-50 shadow-md">
                Sign out
              </span>
            )}
          </button>

          {user && !collapsed && (
            <div className="mt-3 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
              <p className="text-zinc-900 dark:text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px] truncate">{user.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
