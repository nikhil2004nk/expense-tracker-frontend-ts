import { useEffect, useMemo, useState, useRef } from 'react'
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
import { CHART_COLORS } from '../config/constants'
import {
  ArrowPathIcon,
  XCircleIcon,
  CheckIcon,
  InformationCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { fc } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const { settings } = useSettings()
  const { t } = useI18n()
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const [categories, setCategories] = useState<Category[]>([])
  const [reloadTick, setReloadTick] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const threshold = settings.budgetAlertThreshold
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth)
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false)
  const [compareMonth, setCompareMonth] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showLastSixMonths, setShowLastSixMonths] = useState<boolean>(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Selected month title (always show)
  const formattedMonth = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(selectedMonth + '-01'))
    } catch {
      return new Date(selectedMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
  }, [selectedMonth, locale])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    
    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchDashboardData({ 
          signal: controller.signal,
          month: selectedMonth,
          compareMonth: compareEnabled && compareMonth ? compareMonth : undefined,
        })
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
  }, [reloadTick, selectedMonth, compareEnabled, compareMonth])

  function handleRefresh() {
    if (isRefreshing) return
    setIsRefreshing(true)
    setReloadTick((v) => v + 1)
    
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    
    // Set new timer and store reference
    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false)
      refreshTimerRef.current = null
    }, 2000)
  }

  // Cleanup refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  // Load categories for localization mapping
  useEffect(() => {
    let active = true
    fetchCategories()
      .then((cats) => { if (active) setCategories(cats) })
      .catch((error) => {
        console.error('[Dashboard] Failed to load categories:', error)
      })
    return () => { active = false }
  }, [])


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')} - {formattedMonth}</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
        <LoaderCard message={t('loading_dashboard')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')} - {formattedMonth}</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-center gap-3">
            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')} - {formattedMonth}</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">{t('no_data')}</p>
        </div>
      </div>
    )
  }

  const { totalIncome, totalExpense, balance, transactionCount, categoryCount, categoryData, recentTransactionsMonth, budgets, selectedMonthKey, compareMonthKey, selectedTotalExpense, selectedTotalBudget, compareTotalExpense, compareTotalBudget, pendingSetup } = dashboardData

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

  // Safe translation fallback to avoid rendering raw keys when missing
  const tf = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  // First-time dashboard when there are no transactions yet
  if (dashboardData && dashboardData.transactionCount === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')} - {formattedMonth}</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 md:p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <PlusIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-1">{t('no_transactions')}</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">{t('get_started_add_first')}</p>
          <div className="flex items-center justify-center gap-2">
            <Link
              to="/transactions"
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {t('add_transaction')}
            </Link>
            <Link
              to="/budgets"
              className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('budgets_title')}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{tf('getting_started', 'Getting started')}</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-700 dark:text-gray-300">{tf('add_first_expense', 'Add your first expense or income')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-gray-700 dark:text-gray-300">{tf('set_monthly_budgets', 'Set monthly budgets for key categories')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-700 dark:text-gray-300">{tf('track_progress_here', 'Track your progress here on the dashboard')}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{tf('you_will_see', 'You will see')}</h3>
                <InformationCircleIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('balance') || 'Balance'}</div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{fc(0)}</div>
                </div>
                <div className="rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('total_spent') || 'Spent'}</div>
                  <div className="text-sm font-semibold text-rose-700 dark:text-rose-400">{fc(0)}</div>
                </div>
                <div className="rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('total_budget') || 'Budget'}</div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{fc(0)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{tf('tips_update_often', 'Tips: Add transactions regularly to keep insights fresh.')}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')} - {formattedMonth}</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white"
            aria-label={t('select_month')}
            title={t('select_month')}
          />
          
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('total_budget')}</div>
            <BanknotesIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-400 truncate">{fc(totalIncome)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('total_allocated')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('total_spent')}</div>
            <CreditCardIcon className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-rose-700 dark:text-rose-400 truncate">{fc(totalExpense)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('from_budgets')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('balance')}</div>
            <CheckCircleIcon className={`w-5 h-5 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div className={`mt-1 sm:mt-2 text-lg sm:text-xl font-semibold truncate ${balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {fc(balance)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('remaining_budget')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('transactions_count')}</div>
            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{transactionCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{categoryCount} {t('categories_count_suffix')}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('budgets_title')}</div>
            <RectangleStackIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{budgets.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(pendingSetup?.length ?? 0) > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">{pendingSetup.length} {t('pending_setup')}</span>
            ) : (
              <span>{t('all_configured')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
              {showLastSixMonths
                ? (t('last_6_months') || 'Last 6 months')
                : (compareEnabled && compareMonthKey ? (t('monthly_comparison') || 'Monthly comparison') : t('monthly_expenses'))}
            </h2>
            <div className="flex items-center gap-2">
              <label className="hidden sm:flex items-center gap-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200" title={t('compare')}>
                <input
                  type="checkbox"
                  checked={compareEnabled}
                  onChange={(e) => {
                    setCompareEnabled(e.target.checked)
                    if (e.target.checked) setShowLastSixMonths(false)
                  }}
                />
                <span>{t('compare') || 'Compare'}</span>
              </label>
              {compareEnabled && (
                <input
                  type="month"
                  value={compareMonth}
                  onChange={(e) => setCompareMonth(e.target.value)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs sm:text-sm text-gray-900 dark:text-white"
                  aria-label={t('select_compare_month')}
                  title={t('select_compare_month')}
                />
              )}
              <button
                onClick={() => setShowLastSixMonths((v) => {
                  const next = !v
                  if (next) setCompareEnabled(false)
                  return next
                })}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs sm:text-sm ${showLastSixMonths ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                title={t('last_6_months') || 'Last 6 months'}
              >
                {t('last_6_months') || 'Last 6 months'}
              </button>
            </div>
          </div>
          {showLastSixMonths ? (
            dashboardData.monthlyData.length > 0 ? (
              <div className="h-56 sm:h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                    <YAxis style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                    <Tooltip formatter={(v: any) => fc(Number(v))} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Bar dataKey="budget" name={t('total_budget') || 'Budget'} fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t('total_spent')} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">{t('no_txn_data')}</p>
              </div>
            )
          ) : compareEnabled && compareMonthKey ? (
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: new Date(selectedMonthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), expense: selectedTotalExpense, budget: selectedTotalBudget },
                  { label: new Date(compareMonthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), expense: compareTotalExpense || 0, budget: (compareTotalBudget || 0) },
                ]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="label" style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <YAxis style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                  <Tooltip formatter={(v: any) => fc(Number(v))} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="budget" name={t('total_budget') || 'Budget'} fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('total_spent')} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            selectedTotalExpense > 0 ? (
              <div className="h-56 sm:h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { label: new Date(selectedMonthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), expense: selectedTotalExpense, budget: selectedTotalBudget },
                  ]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="label" style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                    <YAxis style={{ fontSize: '0.75rem' }} className="fill-gray-600 dark:fill-gray-400" />
                    <Tooltip 
                      formatter={(v: any) => fc(Number(v))} 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Bar dataKey="budget" name={t('total_budget') || 'Budget'} fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t('total_spent')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">{t('no_txn_data')}</p>
              </div>
            )
          )}
          <p className="mt-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{t('chart_controls_hint')}</p>
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
                    onClick={(d: any) => setSelectedCategory(d?.name || null)}
                  >
                    {categoryData.map((entry, index) => {
                      // Try to find matching budget to get category color (match against any localized name)
                      const matchingBudget = budgets.find(b => matchesName(b.category, entry.name))
                      const color = matchingBudget?.category?.color || CHART_COLORS[index % CHART_COLORS.length]
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
      {(recentTransactionsMonth?.length ?? 0) > 0 && (
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
            {(selectedCategory ? recentTransactionsMonth.filter(rt => (rt.category?.name || 'Uncategorized') === selectedCategory) : recentTransactionsMonth).map((transaction) => (
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
            {selectedCategory && (
              <div className="pt-2">
                <button onClick={() => setSelectedCategory(null)} className="text-xs text-gray-600 dark:text-gray-300 hover:underline">
                  {t('clear_filter') || 'Clear filter'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budgets Pending Setup */}
      {(pendingSetup?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
            {pendingSetup.map((ps) => (
              <div 
                key={ps.categoryId}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
                style={ps.category?.color ? {
                  borderLeftWidth: '4px',
                  borderLeftColor: ps.category.color
                } : undefined}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">
                    {ps.category?.icon || '📋'}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 truncate">
                    {getCatName(ps.category)}
                  </span>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-400 ml-2 flex-shrink-0">
                  {t('spent')}: {fc(ps.spent)}
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
          {budgets.some(b => b.budget > 0 && (b.spent / b.budget) * 100 >= threshold && (b.spent / b.budget) * 100 < 100) && (
            <div className="mb-3 sm:mb-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-2.5 sm:p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  {t('budget_threshold_notice')}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {budgets
                      .filter(b => b.budget > 0)
                      .map(b => ({ b, p: (b.spent / b.budget) * 100 }))
                      .filter(x => x.p >= threshold && x.p < 100)
                      .slice(0, 3)
                      .map(({ b, p }) => (
                        <span key={b.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                          {getCatName(b.category)} • {p.toFixed(0)}%
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {budgets.filter(b => b.budget > 0).slice(0, 5).map((budget) => {
              const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0
              const isOverBudget = percentage > 100
              const barColor = budget.category?.color || (isOverBudget ? '#ef4444' : percentage > threshold ? '#f59e0b' : '#10b981')
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
                    {!isOverBudget && percentage >= threshold && <span className="text-amber-600 dark:text-amber-400 ml-2">{t('nearing_limit')}</span>}
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
