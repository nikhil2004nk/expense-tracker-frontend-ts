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
import { useCurrency } from '../contexts/CurrencyContext'
import { fetchDashboardData, type DashboardSummary } from '../services/dashboard'
import { Link } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'
import { formatDate } from '../utils/date'
import { useI18n } from '../contexts/I18nContext'
import { fetchCategories, type Category } from '../services/categories'

export default function Dashboard() {
  const { fc } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const { settings } = useSettings()
  const { t } = useI18n()
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const [categories, setCategories] = useState<Category[]>([])

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

  // Load categories for localization mapping
  useEffect(() => {
    let active = true
    fetchCategories()
      .then((cats) => { if (active) setCategories(cats) })
      .catch(() => {})
    return () => { active = false }
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')}</h1>
        <LoaderCard message={t('loading_dashboard')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')}</h1>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">{t('error_loading_dashboard')}</h3>
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')}</h1>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">{t('no_data')}</p>
        </div>
      </div>
    )
  }

  const { totalIncome, totalExpense, balance, transactionCount, categoryCount, monthlyData, categoryData, recentTransactions, budgets } = dashboardData

  const getCatName = (cat?: any) => {
    if (!cat) return t('uncategorized')
    const localized = cat?.[`name_${locale}`]
    if (localized) return localized
    // Try mapping via categories list if embedded cat lacks localized fields
    const match = categories.find(c => {
      const names = [c.name, c.name_en, c.name_hi, c.name_mr].filter(Boolean) as string[]
      return names.includes(cat.name)
    })
    if (match) return (match as any)[`name_${locale}`] || match.name
    return cat?.name || t('uncategorized')
  }
  const matchesName = (cat: any, name: string) => {
    if (!cat) return false
    const names = [cat.name, cat.name_en, cat.name_hi, cat.name_mr].filter(Boolean)
    return names.includes(name)
  }

  const findLocalizedNameByAny = (name: string) => {
    const c = categories.find(cat => [cat.name, cat.name_en, cat.name_hi, cat.name_mr].filter(Boolean).includes(name))
    return c ? ((c as any)[`name_${locale}`] || c.name) : name
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('total_budget')}</div>
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-400 truncate">{fc(totalIncome)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('total_allocated')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('total_spent')}</div>
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-rose-700 dark:text-rose-400 truncate">{fc(totalExpense)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('from_budgets')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('balance')}</div>
            <svg className={`w-5 h-5 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={`mt-1 sm:mt-2 text-lg sm:text-xl font-semibold truncate ${balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {fc(balance)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('remaining_budget')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('transactions_count')}</div>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{transactionCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{categoryCount} {t('categories_count_suffix')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('budgets_title')}</div>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{budgets.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {budgets.filter(b => b.budget === 0).length > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">{budgets.filter(b => b.budget === 0).length} {t('pending_setup')}</span>
            ) : (
              <span>{t('all_configured')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('monthly_expenses')}</h2>
          {monthlyData.length > 0 ? (
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <YAxis style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <Tooltip 
                    formatter={(v: any) => fc(Number(v))} 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="expense" name={t('total_spent')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">{t('no_txn_data')}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('expense_dist')}</h2>
          {categoryData.length > 0 ? (
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.map((e) => ({ ...e, name: findLocalizedNameByAny(e.name) }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 90}
                    label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => {
                      // Try to find matching budget to get category color (match against any localized name)
                      const matchingBudget = budgets.find(b => matchesName(b.category, entry.name))
                      const color = matchingBudget?.category?.color || categoryColors[index % categoryColors.length]
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => fc(Number(v))} 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">{t('no_expense_data')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('recent_transactions')}</h2>
            <Link 
              to="/transactions" 
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('view_all')}
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
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={transaction.category?.color ? {
                        backgroundColor: `${transaction.category.color}15`,
                        color: transaction.category.color,
                        borderLeft: `3px solid ${transaction.category.color}`
                      } : {
                        backgroundColor: 'rgb(243 244 246)',
                        color: 'rgb(75 85 99)'
                      }}
                    >
                      {transaction.category?.icon && <span className="mr-1">{transaction.category.icon}</span>}
                      {getCatName(transaction.category)}
                    </span>
                    {transaction.notes && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{transaction.notes}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(transaction.date, settings.dateFormat)}
                  </div>
                </div>
                <div className="text-sm font-semibold ml-4 text-rose-700 dark:text-rose-400">
                  -{fc(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budgets Pending Setup */}
      {budgets.filter(b => b.budget === 0).length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-sm sm:text-base font-medium text-amber-900 dark:text-amber-200">{t('budgets_pending_setup')}</h2>
            </div>
            <Link 
              to="/budgets" 
              className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 hover:underline font-medium"
            >
              {t('set_budgets')}
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mb-3">
            {t('auto_created_hint')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {budgets.filter(b => b.budget === 0).map((budget) => (
              <div 
                key={budget.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
                style={budget.category?.color ? {
                  borderLeftWidth: '4px',
                  borderLeftColor: budget.category.color
                } : undefined}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">
                    {budget.category?.icon || '📋'}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 truncate">
                    {getCatName(budget.category)}
                  </span>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-400 ml-2 flex-shrink-0">
                  {t('spent')}: {fc(budget.spent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {budgets.filter(b => b.budget > 0).length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('active_budgets')}</h2>
            <Link 
              to="/budgets" 
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('manage_all')}
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.filter(b => b.budget > 0).slice(0, 5).map((budget) => {
              const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0
              const isOverBudget = percentage > 100
              const barColor = budget.category?.color || (isOverBudget ? '#ef4444' : percentage > 80 ? '#f59e0b' : '#10b981')
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                    <span 
                      className="font-medium px-2 py-0.5 rounded inline-flex items-center"
                      style={budget.category?.color ? {
                        backgroundColor: `${budget.category.color}15`,
                        color: budget.category.color
                      } : undefined}
                    >
                      {budget.category?.icon && <span className="mr-1">{budget.category.icon}</span>}
                      {getCatName(budget.category)}
                    </span>
                    <span className={`font-semibold ${
                      isOverBudget 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {fc(budget.spent)} / {fc(budget.budget)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: barColor
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {percentage.toFixed(1)}% {t('used_suffix')}
                    {isOverBudget && <span className="text-rose-600 dark:text-rose-400 ml-2">{t('over_budget')}</span>}
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
