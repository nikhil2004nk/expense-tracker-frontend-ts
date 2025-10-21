import { useState, useRef } from 'react'
import ArrowPathIcon from '../components/icons/ArrowPathIcon'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionList, { type TransactionListRef } from '../components/transactions/TransactionList'
import { createTransaction, updateTransaction, type Transaction } from '../services/transactions'
import { useI18n } from '../contexts/I18nContext'

export default function Transactions() {
  const { t } = useI18n()
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)
  const listRef = useRef<TransactionListRef>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleSubmit(payload: { amount: number; categoryId?: string; date: string; notes: string; receiptUrl: string }) {
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, payload)
        setEditing(null)
      } else {
        await createTransaction(payload)
      }
      // Refresh the list after successful create/update
      await listRef.current?.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleRefresh() {
    if (isRefreshing) return
    setIsRefreshing(true)
    Promise.resolve(listRef.current?.refresh()).finally(() => {
      setTimeout(() => setIsRefreshing(false), 2000)
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('transactions_title')}</h1>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{editing ? t('edit_transaction') : t('add_transaction')}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {editing ? t('edit_transaction_hint') : t('add_transaction_hint')}
          </p>
        </div>
        <TransactionForm 
          defaultValues={editing ? {
            amount: editing.amount,
            categoryId: editing.categoryId,
            date: editing.date,
            notes: editing.notes,
            receiptUrl: editing.receiptUrl
          } : undefined} 
          onSubmit={handleSubmit} 
          submitting={saving} 
        />
      </div>

      <TransactionList ref={listRef} onEdit={(t) => setEditing(t)} />
    </div>
  )
}
