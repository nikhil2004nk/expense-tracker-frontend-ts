import { useState, useRef } from 'react'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionList, { type TransactionListRef } from '../components/transactions/TransactionList'
import { createTransaction, updateTransaction, type Transaction } from '../services/transactions'

export default function Transactions() {
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)
  const listRef = useRef<TransactionListRef>(null)

  async function handleSubmit(payload: { amount: number; category: string; date: string; notes: string; receiptUrl: string }) {
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{editing ? 'Edit transaction' : 'Add a transaction'}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {editing ? 'Update the transaction details below.' : 'Fill in the details to add a new transaction.'}
          </p>
        </div>
        <TransactionForm defaultValues={editing || undefined} onSubmit={handleSubmit} submitting={saving} />
      </div>

      <TransactionList ref={listRef} onEdit={(t) => setEditing(t)} />
    </div>
  )
}
