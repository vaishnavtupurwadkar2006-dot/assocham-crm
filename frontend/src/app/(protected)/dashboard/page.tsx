'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users, Building2, Globe, Layers, TrendingUp, Star, CreditCard, Calendar, Loader2
} from 'lucide-react'
import Link from 'next/link'
import StatCard from '@/components/dashboard/StatCard'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import RecentActivity from '@/components/dashboard/RecentActivity'
import FollowUpWidget from '@/components/dashboard/FollowUpWidget'
import {
  getDashboardStats, getDashboardCharts,
  getRecentActivity, getFollowUps,
} from '@/lib/api'

export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60_000,
  })
  const { data: chartsRes, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: getDashboardCharts,
    refetchInterval: 120_000,
  })
  const { data: recentRes, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => getRecentActivity(10),
    refetchInterval: 60_000,
  })
  const { data: followupsRes, isLoading: followupsLoading } = useQuery({
    queryKey: ['dashboard-followups'],
    queryFn: getFollowUps,
    refetchInterval: 60_000,
  })

  const stats = statsRes?.data
  const charts = chartsRes?.data
  const recent = recentRes?.data || []
  const followups = followupsRes?.data

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/import/business-card"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          Scan Business Card
        </Link>
        <Link
          href="/contacts/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 transition shadow-sm"
        >
          <Users className="w-4 h-4 text-zinc-400" />
          Add Contact
        </Link>
        <Link
          href="/ai-search"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 transition shadow-sm"
        >
          <Layers className="w-4 h-4 text-zinc-400" />
          AI Search
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={statsLoading ? '—' : stats?.total_contacts ?? 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          trend={stats ? { value: stats.new_this_month, label: 'this month' } : undefined}
        />
        <StatCard
          title="Organizations"
          value={statsLoading ? '—' : stats?.total_organizations ?? 0}
          icon={<Building2 className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="States Covered"
          value={statsLoading ? '—' : stats?.total_states ?? 0}
          icon={<Globe className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Sectors"
          value={statsLoading ? '—' : stats?.total_sectors ?? 0}
          icon={<Layers className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="New This Month"
          value={statsLoading ? '—' : stats?.new_this_month ?? 0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="High Priority"
          value={statsLoading ? '—' : stats?.high_priority_count ?? 0}
          icon={<Star className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Follow-Ups Due"
          value={statsLoading ? '—' : stats?.upcoming_followups ?? 0}
          subtitle="Next 30 days"
          icon={<Calendar className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Card Imports"
          value={statsLoading ? '—' : stats?.business_card_imports ?? 0}
          subtitle="Via Gemini Vision"
          icon={<CreditCard className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Charts */}
      {chartsLoading ? (
        <div className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        charts && <DashboardCharts data={charts} />
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full">
          <RecentActivity items={recent} isLoading={recentLoading} />
        </div>
        <div className="h-full">
          <FollowUpWidget data={followups} isLoading={followupsLoading} />
        </div>
      </div>
    </div>
  )
}
