import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions, deleteTransaction, seedDemoIfEmpty, type Transaction } from '../../services/transactions'
import { useToast } from '../ToastProvider'
import { LoaderCard, ConfirmModal } from '../common'
import { useDebounce } from '../../hooks/useDebounce'
import { formatCurrencyWithSymbol } from '../../utils/currency'

export default function TransactionList({ onEdit }: { onEdit: (t: Transaction) => void }) {
  const { show } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'>('dateDesc')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const debouncedCategoryFilter = useDebounce(categoryFilter, 300)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    seedDemoIfEmpty()
    fetchTransactions({ signal: controller.signal })
      .then((list) => { if (active) setTransactions(list) })
      .catch((e: any) => { if (active) show(e.message || 'Failed to load', { type: 'error' }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [show])

  function handleDelete(id: string) {
    setDeleteConfirmId(id)
  }

  function confirmDelete() {
    const id = deleteConfirmId!
    setDeleteConfirmId(null)
    deleteTransaction(id)
      .then(() => {
        setTransactions((t) => t.filter((x) => x.id !== id))
        show('Transaction deleted', { type: 'success' })
      })
      .catch((e: any) => show(e.message || 'Delete failed', { type: 'error' }))
  }

  const filteredSorted = useMemo(() => {
    let list = [...transactions]
    if (debouncedCategoryFilter) {
      list = list.filter((t) => t.category.toLowerCase().includes(debouncedCategoryFilter.toLowerCase()))
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

  if (loading) {
    return <LoaderCard message="Loading transactions..." />
  }

  if (filteredSorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-10 text-center text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {categoryFilter ? 'No transactions match your filters.' : 'Get started by adding your first transaction.'}
        </p>
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
            placeholder="Filter by category"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="dateDesc">Date ↓</option>
            <option value="dateAsc">Date ↑</option>
            <option value="amountDesc">Amount ↓</option>
            <option value="amountAsc">Amount ↑</option>
          </select>
        </div>

        <div className="block sm:hidden">
          {filteredSorted.map((t) => (
            <div key={t.id} className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.category}</span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(t.amount)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.date}</p>
                    {t.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{t.notes}</p>}
                    {t.receiptUrl && (
                      <a
                        href={t.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-1 inline-block underline"
                      >
                        View Receipt
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(t)}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                {['Date', 'Category', 'Amount', 'Notes', 'Receipt', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSorted.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-300">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{t.category}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{t.notes}</td>
                  <td className="px-4 py-3">
                    {t.receiptUrl ? (
                      <a
                        href={t.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 rounded"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(t)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  )
}
