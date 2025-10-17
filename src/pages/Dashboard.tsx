import { useEffect, useState } from 'react'
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
} from 'recharts'
import { LoaderCard } from '../components/common'
import { formatCurrency } from '../utils/currency'
import { fetchDashboardData, type DashboardSummary } from '../services/dashboard'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    
    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchDashboardData({ signal: controller.signal })
        if (!isMounted) return
        setDashboardData(data)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        if (!isMounted) return
        setError(e.message || 'Error loading dashboard data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    load()
    
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const categoryColors = [
    '#6366F1',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#14B8A6',
    '#F97316',
    '#EC4899',
    '#06B6D4',
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

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  const { totalIncome, totalExpense, balance, transactionCount, categoryCount, monthlyData, categoryData, recentTransactions, budgets } = dashboardData

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Budget</div>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(totalIncome)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total allocated</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Spent</div>
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-rose-700 dark:text-rose-400 truncate">{formatCurrency(totalExpense)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">From budgets</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Balance</div>
            <svg className={`w-5 h-5 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={`mt-1 sm:mt-2 text-lg sm:text-xl font-semibold truncate ${balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(balance)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Remaining budget</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Transactions</div>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{transactionCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{categoryCount} categories</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Income vs Expenses (Last 6 Months)</h2>
          {monthlyData.length > 0 ? (
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <YAxis style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <Tooltip 
                    formatter={(v: any) => formatCurrency(Number(v))} 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No transaction data available</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Expense Distribution by Category</h2>
          {categoryData.length > 0 ? (
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 90}
                    label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => formatCurrency(Number(v))} 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link 
              to="/transactions" 
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      transaction.amount > 0 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {transaction.category}
                    </span>
                    {transaction.notes && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{transaction.notes}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={`text-sm font-semibold ml-4 ${
                  transaction.amount > 0 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {budgets.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Budget Overview</h2>
            <Link 
              to="/budgets" 
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Budgets
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 5).map((budget) => {
              const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0
              const isOverBudget = percentage > 100
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{budget.category}</span>
                    <span className={`font-semibold ${
                      isOverBudget 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget 
                          ? 'bg-rose-500' 
                          : percentage > 80 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {percentage.toFixed(1)}% used
                    {isOverBudget && <span className="text-rose-600 dark:text-rose-400 ml-2">Over budget!</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
