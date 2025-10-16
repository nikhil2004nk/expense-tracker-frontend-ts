import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  type PieLabelRenderProps,
} from 'recharts'
import { LoaderCard } from '../components/common'
import { formatCurrency } from '../utils/currency'

type MonthItem = { month: string; income: number; expense: number }
type CategoryItem = { name: string; value: number }

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthsData, setMonthsData] = useState<MonthItem[]>([])
  const [categoriesData, setCategoriesData] = useState<CategoryItem[]>([])

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('./data/summary.json')
        if (!res.ok) throw new Error('Failed to load summary data')
        const json = await res.json()
        if (!isMounted) return
        setMonthsData(json.months || [])
        setCategoriesData(json.categories || [])
      } catch (e: any) {
        setError(e.message || 'Error loading data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const totals = useMemo(() => {
    const totalIncome = monthsData.reduce((sum, m) => sum + (m.income || 0), 0)
    const totalExpense = monthsData.reduce((sum, m) => sum + (m.expense || 0), 0)
    const balance = totalIncome - totalExpense
    return { totalIncome, totalExpense, balance }
  }, [monthsData])

  const categoryColors = [
    '#6366F1',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#14B8A6',
    '#F97316',
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <LoaderCard message="Loading dashboard data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading dashboard</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Income</div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(totals.totalIncome || 0)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Expense</div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-rose-700 dark:text-rose-400 truncate">{formatCurrency(totals.totalExpense || 0)}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Balance</div>
          <div className={`mt-1 sm:mt-2 text-lg sm:text-xl font-semibold truncate ${totals.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(totals.balance || 0)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Categories</div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{categoriesData.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Income vs Expenses (Monthly)</h2>
          <div className="h-56 sm:h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: '0.75rem' }} />
                <YAxis style={{ fontSize: '0.75rem' }} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Expense Distribution by Category</h2>
          <div className="h-56 sm:h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 90}
                >
                  {categoriesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
