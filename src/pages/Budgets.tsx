import { useState, useEffect, useMemo } from 'react'
import { Modal } from '../components/common'
import { useToast } from '../components/ToastProvider'
import { useCurrency } from '../contexts/CurrencyContext'
import { budgetService } from '../services/budgets'
import { fetchCategories, type Category } from '../services/categories'
import type { Budget } from '../services/budgets'
import { useI18n } from '../contexts/I18nContext'
import { 
  ArrowPathIcon,
  PlusIcon,
  RectangleStackIcon,
  BanknotesIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { useSettings } from '../contexts/SettingsContext'

export default function Budgets() {
  const { show } = useToast()
  const { t } = useI18n()
  const { settings } = useSettings()
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({ categoryId: '', amount: '' })
  const [formErrors, setFormErrors] = useState<{ categoryId?: string; amount?: string }>({})
  const [budgetData, setBudgetData] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Try to read from hash query param first for persistence
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const query = hash.includes('?') ? hash.split('?')[1] : ''
    const sp = new URLSearchParams(query)
    const mm = sp.get('month')
    if (mm && /^\d{4}-\d{2}$/.test(mm)) return mm
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const formattedMonth = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-')
    const y = Number(yStr)
    const m = Number(mStr || '1')
    const d = new Date(y, Math.max(0, m - 1), 1)
    try {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
    } catch {
      return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    }
  }, [selectedMonth, locale])

  const { symbol, fcs } = useCurrency()
  const threshold = settings.budgetAlertThreshold

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Keep hash month in sync when user changes selection
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || '#/budgets'
    const [path, queryStr] = hash.split('?')
    const sp = new URLSearchParams(queryStr || '')
    sp.set('month', selectedMonth)
    const next = `${path}?${sp.toString()}`
    if (next !== hash) {
      window.location.hash = next
    }
  }, [selectedMonth])

  // Load budgets on mount and when month changes
  useEffect(() => {
    loadBudgets()
  }, [selectedMonth])

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (error: any) {
      console.error('Failed to load categories:', error)
      show(error.message || 'Failed to load categories', { type: 'error' })
    } finally {
      setLoadingCategories(false)
    }
  }

  const getCategoryName = (cat?: any) => {
    if (!cat) return t('uncategorized')
    const localized = cat?.[`name_${locale}`]
    return localized || cat?.name || t('uncategorized')
  }

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const budgets = await budgetService.getAll(selectedMonth)
      setBudgetData(budgets)
    } catch (error: any) {
      console.error('Failed to load budgets:', error)
      const message = error.message || 'Failed to load budgets'
      show(message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    Promise.resolve(loadBudgets()).finally(() => {
      setTimeout(() => setIsRefreshing(false), 2000)
    })
  }

  const getProgressPercentage = (spent: number, budget: number) => Math.min((spent / budget) * 100, 100)

  const validateForm = () => {
    const errors: { categoryId?: string; amount?: string } = {}
    if (!formData.categoryId?.trim()) {
      errors.categoryId = 'Category is required'
    }
    if (!formData.amount) {
      errors.amount = 'Budget amount is required'
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'Budget amount must be greater than 0'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({ categoryId: '', amount: '' })
    setFormErrors({})
    setEditingBudget(null)
  }

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget)
    setFormData({ categoryId: budget.categoryId, amount: budget.budget.toString() })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      const categoryObj = categories.find(c => c.id === formData.categoryId)
      const categoryName = getCategoryName(categoryObj) || 'Budget'
      if (editingBudget) {
        await budgetService.update(editingBudget.id, {
          categoryId: formData.categoryId.trim(),
          amount: parseFloat(formData.amount),
        })
        show(`Budget "${categoryName}" updated successfully!`, { type: 'success' })
      } else {
        await budgetService.create({
          categoryId: formData.categoryId.trim(),
          amount: parseFloat(formData.amount),
        })
        show(`Budget "${categoryName}" created successfully!`, { type: 'success' })
      }
      await loadBudgets() // Reload budgets from server
      setIsModalOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to save budget:', error)
      const message = error.message || 'Failed to save budget. Please try again.'
      show(message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBudget = async (budget: Budget) => {
    const categoryName = getCategoryName(budget.category) || 'this budget'
    const confirmed = window.confirm(`Are you sure you want to delete the "${categoryName}" budget?\n\nThis action cannot be undone.`)
    if (confirmed) {
      try {
        setLoading(true)
        await budgetService.delete(budget.id)
        await loadBudgets() // Reload budgets from server
        show(`Budget "${categoryName}" deleted successfully!`, { type: 'success' })
      } catch (error: any) {
        console.error('Failed to delete budget:', error)
        const message = error.message || 'Failed to delete budget. Please try again.'
        show(message, { type: 'error' })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('budgets_title_page')} - {formattedMonth}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('budgets_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="hidden sm:block text-xs text-gray-600 dark:text-gray-300">
            {t('select_month') || 'Select month'}
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200"
            aria-label="Select month"
          />
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
          <button
            onClick={handleOpenModal}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('loading_budgets')}
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('add_budget')}
              </>
            )}
          </button>
        </div>
      </div>

      {budgetData.some(b => b.budget > 0 && (b.spent / b.budget) * 100 >= threshold && (b.spent / b.budget) * 100 < 100) && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              {t('budget_threshold_notice')}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {budgetData
                  .filter(b => b.budget > 0)
                  .map(b => ({ b, p: (b.spent / b.budget) * 100 }))
                  .filter(x => x.p >= threshold && x.p < 100)
                  .slice(0, 5)
                  .map(({ b, p }) => (
                    <span key={b.id} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                      {getCategoryName(b.category)} • {p.toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && budgetData.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3 sm:mb-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('loading_budgets')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('loading_budgets_wait')}</p>
        </div>
      ) : budgetData.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3 sm:mb-4">
            <RectangleStackIcon className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('no_budgets_yet')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 max-w-sm mx-auto">{t('create_first_budget_hint')}</p>
          <button
            onClick={handleOpenModal}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('add_budget')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetData.map((budget) => {
            const percentage = getProgressPercentage(budget.spent, budget.budget)
            const isOverBudget = budget.spent > budget.budget
            const isSetupRequired = budget.budget === 0

            return (
              <div
                key={budget.id}
                className={`rounded-lg border p-4 sm:p-5 md:p-6 shadow-sm transition-all duration-200 ${isSetupRequired
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-emerald-900/10'
                  }`}
                style={(categories.find(c => c.id === budget.categoryId)?.color || budget.category?.color) ? {
                  borderTopWidth: '4px',
                  borderTopColor: (categories.find(c => c.id === budget.categoryId)?.color || budget.category?.color) as string
                } : undefined}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate pr-2">
                    {(() => {
                      const cat = categories.find(c => c.id === budget.categoryId) || budget.category
                      if (!cat) return t('uncategorized')
                      return (
                        <span className="inline-flex items-center">
                          {cat.icon && <span className="mr-1">{cat.icon}</span>}
                          {getCategoryName(cat)}
                        </span>
                      )
                    })()}
                  </h3>
                  {isSetupRequired ? (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50 flex-shrink-0">{t('setup_required')}</span>
                  ) : isOverBudget ? (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 flex-shrink-0">{t('over_budget')}</span>
                  ) : (percentage >= threshold ? (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 flex-shrink-0">{t('nearing_limit')}</span>
                  ) : null)}
                </div>

                {isSetupRequired ? (
                  <>
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3">
                          <BanknotesIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">{t('no_budget_amount_set')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('set_budget_limit_hint')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditBudget(budget)} disabled={loading} className="flex-1 px-4 py-2 text-sm text-white bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" title={t('create_budget')}>
                        <span className="flex items-center justify-center gap-2">
                          <PlusIcon className="h-4 w-4" />
                          {t('create_budget')}
                        </span>
                      </button>
                      <button onClick={() => handleDeleteBudget(budget)} disabled={loading} className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" title={t('delete')}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">{fcs(budget.spent)}</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">/ {fcs(budget.budget)}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                        <span>{t('progress')}</span>
                        <span className={`${percentage >= 100 ? 'text-red-600 dark:text-red-400' : percentage >= threshold ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden shadow-inner">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: (categories.find(c => c.id === budget.categoryId)?.color || budget.category?.color) || (percentage >= 100 ? '#ef4444' : percentage >= threshold ? '#f59e0b' : '#10b981')
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs sm:text-sm font-medium">
                        {isOverBudget ? (
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{fcs(budget.spent - budget.budget)} {t('over_budget')}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{fcs(budget.budget - budget.spent)}</span>
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditBudget(budget)} disabled={loading} className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('update_budget')}>{t('edit')}</button>
                        <button onClick={() => handleDeleteBudget(budget)} disabled={loading} className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('delete')}>{t('delete')}</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingBudget ? t('update_budget') : t('create_budget')}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-200">{t('category')} *</label>
              <a
                href="/#/categories"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <PlusIcon className="h-3 w-3" />
                {t('create_category')}
              </a>
            </div>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
              disabled={loadingCategories}
              className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${formErrors.categoryId ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
            >
              <option value="">{t('category')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{getCategoryName(cat)}
                </option>
              ))}
            </select>
            {formErrors.categoryId && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.categoryId}
              </p>
            )}
            {loadingCategories && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('loading_categories')}</p>
            )}
            {!loadingCategories && categories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {t('no_categories_yet')} <a href="/#/categories" target="_blank" rel="noopener noreferrer" className="underline font-medium">{t('create_category')}</a>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('create_budget')} *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{symbol}</span>
              </div>
              <input
                id="budgetAmount"
                type="number"
                step="100"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className={`block w-full pl-8 pr-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white text-sm ${formErrors.amount ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
                placeholder="10000"
              />
            </div>
            {formErrors.amount && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.amount}
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="inline-flex items-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('saving')}
                </span>
              ) : (
                editingBudget ? t('update_budget') : t('create_budget')
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
