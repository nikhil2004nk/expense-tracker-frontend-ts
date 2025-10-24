import { useEffect, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Link } from 'react-router-dom'
import { fetchTransactions, deleteTransaction, seedDemoIfEmpty, type Transaction } from '../../services/transactions'
import { fetchCategories, type Category } from '../../services/categories'
import { useToast } from '../ToastProvider'
import { LoaderCard, ConfirmModal } from '../common'
import { useDebounce } from '../../hooks/useDebounce'
import { getApiBaseUrl } from '../../services/api-client'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useSettings } from '../../contexts/SettingsContext'
import { formatDate } from '../../utils/date'
import { useI18n } from '../../contexts/I18nContext'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export type TransactionListRef = {
  refresh: () => Promise<void>
}

type TransactionListProps = {
  onEdit: (t: Transaction) => void
}

const TransactionList = forwardRef<TransactionListRef, TransactionListProps>(({ onEdit }, ref) => {
  const { show } = useToast()
  const { fcs } = useCurrency()
  const { settings } = useSettings()
  const { t } = useI18n()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [month, setMonth] = useState('')
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'>('dateDesc')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const debouncedCategoryFilter = useDebounce(categoryFilter, 300)
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const getCategoryName = useCallback((cat?: any) => {
    if (!cat) return t('uncategorized')
    const localized = cat[`name_${locale}`]
    if (localized) return localized
    const match = categories.find(c => {
      const names = [c.name, c.name_en, c.name_hi, c.name_mr].filter(Boolean) as string[]
      return names.includes(cat.name)
    })
    if (match) return (match as any)[`name_${locale}`] || match.name
    return cat.name || t('uncategorized')
  }, [locale, t, categories])

  const loadTransactions = useCallback(async (signal?: AbortSignal) => {
    try {
      const list = await fetchTransactions({ signal, month: month || undefined })
      setTransactions(list)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        show(e.message || 'Failed to load transactions', { type: 'error' })
      }
    }
  }, [show, month])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    seedDemoIfEmpty()
    setLoading(true)
    loadTransactions(controller.signal)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [loadTransactions])

  // load categories to help localize names when embedded cat lacks fields
  useEffect(() => {
    let mounted = true
    fetchCategories().then(c => { if (mounted) setCategories(c) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadTransactions()
    }
  }), [loadTransactions])

  function handleDelete(id: string) {
    setDeleteConfirmId(id)
  }

  async function confirmDelete() {
    const id = deleteConfirmId!
    setDeleteConfirmId(null)
    try {
      await deleteTransaction(id)
      setTransactions((t) => t.filter((x) => x.id !== id))
      show('Transaction deleted', { type: 'success' })
    } catch (e: any) {
      show(e.message || 'Delete failed', { type: 'error' })
    }
  }

  const filteredSorted = useMemo(() => {
    let list = [...transactions]
    if (debouncedCategoryFilter) {
      list = list.filter((t) => {
        const categoryName = getCategoryName(t.category)
        return categoryName.toLowerCase().includes(debouncedCategoryFilter.toLowerCase())
      })
    }
    list.sort((a, b) => {
      if (sortBy === 'dateDesc') return b.date.localeCompare(a.date)
      if (sortBy === 'dateAsc') return a.date.localeCompare(b.date)
      if (sortBy === 'amountDesc') return b.amount - a.amount
      if (sortBy === 'amountAsc') return a.amount - b.amount
      return 0
    })
    return list
  }, [transactions, debouncedCategoryFilter, sortBy])

  // Derived UI helpers
  const filteredTotalAmount = useMemo(() => filteredSorted.reduce((sum, t) => sum + t.amount, 0), [filteredSorted])
  const monthTitle = useMemo(() => (
    month ? new Date(month + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : ''
  ), [month, locale])

  const API_BASE = getApiBaseUrl()

  if (loading) {
    return <LoaderCard message={t('loading_transactions')} />
  }

  if (filteredSorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-10 text-center text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('no_transactions')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {categoryFilter || month ? t('no_txn_match_filters') : t('get_started_add_first')}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {(categoryFilter || month) && (
            <button
              onClick={() => { setCategoryFilter(''); setMonth('') }}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('clear_filter')}
            </button>
          )}
          <Link
            to="/"
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {t('dashboard')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 sm:flex-row sm:items-center">
          <input
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder={t('filter_by_category')}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label={t('select_month')}
              className="w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
            {month && (
              <button
                onClick={() => setMonth('')}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {t('clear_filter')}
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="dateDesc">{t('date_desc')}</option>
            <option value="dateAsc">{t('date_asc')}</option>
            <option value="amountDesc">{t('amount_desc')}</option>
            <option value="amountAsc">{t('amount_asc')}</option>
          </select>
        </div>

        {/* Summary bar */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60">
          <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
            {filteredSorted.length} {t('transactions') || 'Transactions'}{monthTitle ? ` • ${monthTitle}` : ''}
            {(categoryFilter || month) && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">{t('filters') || 'Filters'}:</span>
            )}
            {categoryFilter && (
              <span className="ml-2 inline-flex items-center rounded px-2 py-0.5 text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{categoryFilter}</span>
            )}
            {monthTitle && (
              <span className="ml-2 inline-flex items-center rounded px-2 py-0.5 text-[11px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{monthTitle}</span>
            )}
          </div>
          <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
            {t('total_spent') || 'Total'}: <span className="font-semibold text-gray-900 dark:text-white">{fcs(filteredTotalAmount)}</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="block sm:hidden">
          {filteredSorted.map((tx) => (
            <div key={tx.id} className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <span 
                        className="text-sm font-medium px-2 py-1 rounded inline-flex items-center w-fit"
                        style={tx.category?.color ? {
                          backgroundColor: `${tx.category.color}15`,
                          color: tx.category.color,
                          borderLeft: `3px solid ${tx.category.color}`
                        } : undefined}
                      >
                        {tx.category ? (
                          <>
                            {tx.category.icon && <span className="mr-1">{tx.category.icon}</span>}
                            {getCategoryName(tx.category)}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">{t('uncategorized')}</span>
                        )}
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">{fcs(tx.amount)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(tx.date, settings.dateFormat)}</p>
                    {tx.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{tx.notes}</p>}
                    {tx.receiptUrl && (
                      <a
                        href={tx.receiptUrl.startsWith('http') ? tx.receiptUrl : `${API_BASE}${tx.receiptUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-1 inline-block underline"
                      >
                        {t('view_receipt')}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(tx)}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                {[t('date'), t('category'), t('amount'), t('notes'), t('receipt'), t('actions')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSorted.map((tItem) => (
                <tr key={tItem.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">{formatDate(tItem.date, settings.dateFormat)}</td>
                  <td className="px-4 py-3">
                    <span 
                      className="font-medium px-2 py-1 rounded inline-flex items-center"
                      style={tItem.category?.color ? {
                        backgroundColor: `${tItem.category.color}15`,
                        color: tItem.category.color,
                        borderLeft: `3px solid ${tItem.category.color}`
                      } : undefined}
                    >
                      {tItem.category ? (
                        <>
                          {tItem.category.icon && <span className="mr-1">{tItem.category.icon}</span>}
                          {getCategoryName(tItem.category)}
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">{t('uncategorized')}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fcs(tItem.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{tItem.notes}</td>
                  <td className="px-4 py-3">
                    {tItem.receiptUrl ? (
                      <a
                        href={tItem.receiptUrl.startsWith('http') ? tItem.receiptUrl : `${API_BASE}${tItem.receiptUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded"
                      >
                        {t('view')}
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(tItem)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(tItem.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title={t('delete_txn_title')}
        message={t('delete_txn_msg')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
      />
    </>
  )
})

TransactionList.displayName = 'TransactionList'

export default TransactionList
