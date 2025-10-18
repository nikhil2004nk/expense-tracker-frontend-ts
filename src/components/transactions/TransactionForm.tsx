import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadReceipt } from '../../services/transactions'
import { fetchCategories, type Category } from '../../services/categories'
import { useToast } from '../ToastProvider'
import { Loader } from '../common'

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  receipt: z.any().optional(),
})

export type TransactionFormValues = z.infer<typeof schema>

export default function TransactionForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: { amount: number; categoryId?: string; date: string; notes?: string; receiptUrl?: string }
  onSubmit: (payload: { amount: number; categoryId?: string; date: string; notes: string; receiptUrl: string }) => Promise<void>
  submitting: boolean
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const { show } = useToast()
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: (defaultValues as any) || ({ amount: undefined, categoryId: '', date: '', notes: '', receipt: undefined } as any),
  })

  // Load categories on mount
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (e: any) {
      show(e.message || 'Failed to load categories', { type: 'error' })
    } finally {
      setLoadingCategories(false)
    }
  }, [show])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues as any)
    }
  }, [defaultValues, reset])

  async function onLocalSubmit(values: TransactionFormValues) {
    try {
      let receiptUrl = defaultValues?.receiptUrl || ''
      const fileList = values.receipt
      if (fileList && fileList.length > 0) {
        receiptUrl = await uploadReceipt(fileList[0])
      }
      const payload = { 
        amount: Number(values.amount), 
        categoryId: values.categoryId || undefined, 
        date: values.date, 
        notes: values.notes || '', 
        receiptUrl 
      }
      await onSubmit(payload)
      show('Transaction saved', { type: 'success' })
      if (!defaultValues) reset({ amount: undefined as any, categoryId: '', date: '', notes: '', receipt: undefined })
    } catch (e: any) {
      show(e.message || 'Failed to save transaction', { type: 'error' })
    }
  }

  const selectedReceipt = watch('receipt')

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
            </div>
            <input
              id="amount"
              type="number"
              step="1"
              className={`block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                errors.amount ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0"
              {...register('amount')}
            />
          </div>
          {errors.amount && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.amount.message as string}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <a
              href="/#/categories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create new
            </a>
          </div>
          <select
            id="categoryId"
            disabled={loadingCategories}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
              errors.categoryId ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            {...register('categoryId')}
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.categoryId.message as string}</p>
          )}
          {loadingCategories && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Loading categories...</p>
          )}
          {!loadingCategories && categories.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              No categories available. <a href="/#/categories" target="_blank" rel="noopener noreferrer" className="underline font-medium">Create one</a> to get started.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date *
          </label>
          <input
            id="date"
            type="date"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
              errors.date ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            {...register('date')}
          />
          {errors.date && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.date.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <input
            id="notes"
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder="Optional description"
            {...register('notes')}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Receipt
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="receipt" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                  <span>Upload a file</span>
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    {...register('receipt')}
                    onChange={(e) => setValue('receipt', e.target.files as any)}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
          {selectedReceipt && selectedReceipt.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="h-4 w-4 text-emerald-500 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {selectedReceipt[0]?.name}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {defaultValues && (
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-emerald-500"
          >
            Cancel
          </button>
        )}
        <button
          disabled={submitting}
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader size="sm" className="mr-2" />}
          {submitting ? 'Saving...' : (defaultValues ? 'Update Transaction' : 'Add Transaction')}
        </button>
      </div>
    </form>
  )
}
