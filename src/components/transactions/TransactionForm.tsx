import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadReceipt } from '../../services/transactions'
import { getApiBaseUrl } from '../../services/api-client'
import { useCurrency } from '../../contexts/CurrencyContext'
import { fetchCategories, type Category } from '../../services/categories'
import { useToast } from '../ToastProvider'
import { Loader } from '../common'

// Date helpers
const todayISO = (() => {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d.toISOString().slice(0,10)
})()
const minDateISO = (() => {
  const d = new Date()
  d.setHours(0,0,0,0)
  d.setFullYear(d.getFullYear() - 10)
  d.setMonth(0)
  d.setDate(1)
  return d.toISOString().slice(0,10)
})()

const schema = z.object({
  amount: z.coerce
    .number()
    .refine((v) => !Number.isNaN(v), { message: 'Amount is required' })
    .nonnegative('Amount must be 0 or more'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required')
    .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' })
    .refine((s) => s >= minDateISO, { message: `Date must be on/after ${minDateISO}` })
    .refine((s) => s <= todayISO, { message: 'Date cannot be in the future' }),
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
  const [dragOver, setDragOver] = useState(false)
  const { show } = useToast()
  const { symbol } = useCurrency()
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptName, setReceiptName] = useState('')
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: (defaultValues as any) || ({ amount: 0 as any, categoryId: '', date: '', notes: '', receipt: undefined } as any),
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
      if (defaultValues.receiptUrl) {
        setReceiptUrl(defaultValues.receiptUrl)
        try {
          const fromUrl = defaultValues.receiptUrl.split('/').pop() || ''
          setReceiptName(fromUrl)
        } catch { setReceiptName('Document') }
      }
    }
  }, [defaultValues, reset])

  async function onLocalSubmit(values: TransactionFormValues) {
    try {
      const payload = { 
        amount: Number(values.amount), 
        categoryId: values.categoryId || undefined, 
        date: values.date, 
        notes: values.notes || '', 
        receiptUrl 
      }
      await onSubmit(payload)
      show('Transaction saved', { type: 'success' })
      if (!defaultValues) {
        reset({ amount: 0 as any, categoryId: '', date: '', notes: '', receipt: undefined })
        setValue('amount', 0 as any)
        setReceiptUrl('')
        setReceiptName('')
        setCatOpen(false)
        setCatQuery('')
        setDragOver(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (e: any) {
      show(e.message || 'Failed to save transaction', { type: 'error' })
    }
  }

  // We keep the field registered for form reset compatibility,
  // but we handle uploads immediately and store the URL in state.
  // const selectedReceipt = watch('receipt')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const maxBytes = 10 * 1024 * 1024 // 10MB
    const allowedTypes = new Set([
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
    if (file.size > maxBytes) {
      show('File is too large. Max size is 10MB.', { type: 'error' })
      return
    }
    if (!allowedTypes.has(file.type)) {
      show('Unsupported file type. Please upload PNG, JPG, PDF, DOC, or DOCX.', { type: 'error' })
      return
    }
    try {
      setUploading(true)
      const url = await uploadReceipt(file)
      setReceiptUrl(url)
      setReceiptName(file.name)
      // clear controlled file input value
      setValue('receipt', undefined as any)
    } catch (err: any) {
      show(err?.message || 'Upload failed', { type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const apiBase = getApiBaseUrl()
  const viewUrl = receiptUrl ? (receiptUrl.startsWith('http') ? receiptUrl : `${apiBase}${receiptUrl}`) : ''
  const [catOpen, setCatOpen] = useState(false)
  const [catQuery, setCatQuery] = useState('')
  const selectedCategoryId = watch('categoryId')
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const catRef = useRef<HTMLDivElement | null>(null)

  // Close category dropdown on outside click or Escape key
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!catOpen) return
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (!catOpen) return
      if (e.key === 'Escape') setCatOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [catOpen])

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{symbol}</span>
            </div>
            <input
              id="amount"
              type="number"
              step="1"
              min={0}
              inputMode="numeric"
              onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

          {/* Hidden native select to keep form semantics */}
          <select id="categoryId" className="hidden" {...register('categoryId')} />

          {/* Custom dropdown */}
          <div className="relative" ref={catRef}>
            <button
              type="button"
              disabled={loadingCategories}
              onClick={() => setCatOpen((v) => !v)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                errors.categoryId ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-haspopup="listbox"
              aria-expanded={catOpen}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={selectedCategory?.color ? { backgroundColor: `${selectedCategory.color}15`, color: selectedCategory.color } : {}}>
                  {selectedCategory?.icon || '📁'}
                </span>
                {selectedCategory ? selectedCategory.name : 'No category'}
              </span>
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {catOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    autoFocus
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <ul role="listbox" className="max-h-56 overflow-auto py-1">
                  <li>
                    <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2" onClick={() => { setValue('categoryId', ''); setCatOpen(false) }}>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">—</span>
                      No category
                    </button>
                  </li>
                  {categories
                    .filter(c => !catQuery || c.name.toLowerCase().includes(catQuery.toLowerCase()))
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={c.id === selectedCategoryId}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${c.id === selectedCategoryId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                          onClick={() => { setValue('categoryId', c.id); setCatOpen(false) }}
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={c.color ? { backgroundColor: `${c.color}15`, color: c.color } : {}}>
                            {c.icon || '📁'}
                          </span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      </li>
                    ))}
                  {categories.filter(c => !catQuery || c.name.toLowerCase().includes(catQuery.toLowerCase())).length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No categories found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
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
          <div className="space-y-2">
            <input
              id="date"
              type="date"
              min={minDateISO}
              max={todayISO}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                errors.date ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              {...register('date')}
              onBlur={(e) => {
                const v = e.currentTarget.value
                if (!v) return
                if (v < minDateISO) setValue('date', minDateISO)
                if (v > todayISO) setValue('date', todayISO)
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setValue('date', todayISO)}>
                Today
              </button>
              <button type="button" className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 1)
                  d.setHours(0,0,0,0)
                  setValue('date', d.toISOString().slice(0,10))
                }}>
                Yesterday
              </button>
              <button type="button" className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 7)
                  d.setHours(0,0,0,0)
                  const iso = d.toISOString().slice(0,10)
                  setValue('date', iso < minDateISO ? minDateISO : iso)
                }}>
                7 days ago
              </button>
              <button type="button" className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  const d = new Date()
                  d.setDate(1)
                  d.setHours(0,0,0,0)
                  setValue('date', d.toISOString().slice(0,10))
                }}>
                Start of month
              </button>
            </div>
          </div>
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
          {!receiptUrl && (
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${dragOver ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-600'} border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  setValue('receipt', files as any);
                  void handleFiles(files);
                }
              }}
            >
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
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      {...register('receipt')}
                      ref={fileInputRef}
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF, DOC, DOCX up to 10MB</p>
              </div>
            </div>
          )}
          {uploading && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Loader size="sm" /> Uploading...
            </div>
          )}
          {receiptUrl && !uploading && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h8.586A2 2 0 0014 16.586L17.586 13A2 2 0 0018 11.586V5a2 2 0 00-2-2H4z" />
                </svg>
                <span className="truncate text-sm text-gray-700 dark:text-gray-300" title={receiptName || 'Document'}>{receiptName || 'Document'}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={viewUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">Open</a>
                <button type="button" onClick={() => { setReceiptUrl(''); setReceiptName(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs px-3 py-1 rounded border border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
              </div>
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
