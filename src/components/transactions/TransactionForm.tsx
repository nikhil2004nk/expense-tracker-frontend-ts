import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadReceipt } from '../../services/transactions'
import { getApiBaseUrl } from '../../services/api-client'
import { useCurrency } from '../../contexts/CurrencyContext'
import { fetchCategories, createCategory, type Category } from '../../services/categories'
import { useToast } from '../ToastProvider'
import { Loader, Modal, DatePicker } from '../common'
import { useI18n } from '../../contexts/I18nContext'
import { useSettings } from '../../contexts/SettingsContext'
import { PlusIcon, ChevronDownIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

import { FILE_UPLOAD, CATEGORY_EMOJIS, CATEGORY_COLORS, DATE_LIMITS, VALIDATION } from '../../config/constants'

// Date helpers (use local timezone, not UTC ISO, to avoid off-by-one issues)
function formatLocalISODate(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in ISO format (YYYY-MM-DD) using local timezone
 * Computed dynamically to handle timezone changes and long-running sessions
 */
function getTodayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return formatLocalISODate(d)
}

/**
 * Get minimum allowed date (10 years back from today)
 * Computed dynamically to handle long-running sessions
 */
function getMinDateISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setFullYear(d.getFullYear() - DATE_LIMITS.MAX_YEARS_BACK)
  d.setMonth(0)
  d.setDate(1)
  return formatLocalISODate(d)
}

export default function TransactionForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: { amount: number; categoryId?: string; date: string; notes?: string; receiptUrl?: string }
  onSubmit: (payload: { amount: number; categoryId: string; date: string; notes: string; receiptUrl: string }) => Promise<void>
  submitting: boolean
}) {
  const { t } = useI18n()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const { show } = useToast()
  const { symbol } = useCurrency()
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptName, setReceiptName] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const schema = useMemo(() => {
    const today = getTodayISO()
    const minDate = getMinDateISO()
    
    return z.object({
      amount: z.coerce
        .number()
        .refine((v) => !Number.isNaN(v), { message: t('amount_required') })
        .nonnegative(t('amount_nonnegative')),
      categoryId: z.string().min(1, t('category_required') || 'Category is required'),
      date: z.string().min(1, t('date_required'))
        .refine((s) => !Number.isNaN(Date.parse(s)), { message: t('invalid_date') })
        .refine((s) => s >= minDate, { message: `${t('date_min_prefix')} ${minDate}` })
        .refine((s) => s <= today, { message: t('date_future_forbidden') }),
      notes: z.string().optional(),
      receipt: z.any().optional(),
    })
  }, [t])
  
  type TransactionFormValues = z.infer<typeof schema>
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TransactionFormValues>({
    // Note: zodResolver with z.coerce creates a type mismatch that's safe at runtime
    // The resolver correctly transforms string inputs to numbers
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ? {
      amount: defaultValues.amount,
      categoryId: defaultValues.categoryId || '',
      date: defaultValues.date,
      notes: defaultValues.notes || '',
      receipt: undefined,
    } : {
      amount: 0,
      categoryId: '',
      date: '',
      notes: '',
      receipt: undefined,
    },
  })

  // Load categories on mount
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (e: any) {
      show(e.message || t('failed_load_categories'), { type: 'error' })
    } finally {
      setLoadingCategories(false)
    }
  }, [show, t])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (defaultValues) {
      reset({
        amount: defaultValues.amount,
        categoryId: defaultValues.categoryId,
        date: defaultValues.date,
        notes: defaultValues.notes,
        receipt: undefined,
      })
      if (defaultValues.receiptUrl) {
        setReceiptUrl(defaultValues.receiptUrl)
        try {
          const fromUrl = defaultValues.receiptUrl.split('/').pop() || ''
          setReceiptName(fromUrl)
        } catch (error) {
          console.error('[TransactionForm] Failed to parse receipt URL:', error)
          setReceiptName('Document')
        }
      }
    }
  }, [defaultValues, reset])

  async function onLocalSubmit(values: TransactionFormValues) {
    try {
      const payload = { 
        amount: Number(values.amount), 
        categoryId: values.categoryId, 
        date: values.date, 
        notes: values.notes || '', 
        receiptUrl 
      }
      await onSubmit(payload)
      show(t('transaction_saved'), { type: 'success' })
      if (!defaultValues) {
        reset({
          amount: 0,
          categoryId: '',
          date: '',
          notes: '',
          receipt: undefined,
        })
        setValue('amount', 0)
        setReceiptUrl('')
        setReceiptName('')
        setCatOpen(false)
        setCatQuery('')
        setDragOver(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (e: any) {
      show(e.message || t('failed_save_transaction'), { type: 'error' })
    }
  }

  // We keep the field registered for form reset compatibility,
  // but we handle uploads immediately and store the URL in state.
  // const selectedReceipt = watch('receipt')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    
    // Validate file size
    if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      show(t('file_too_large') || `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit`, { type: 'error' })
      return
    }
    
    // Validate file type
    if (!FILE_UPLOAD.ALLOWED_TYPES.has(file.type)) {
      show(
        t('unsupported_file_type') || `Only ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')} files are allowed`, 
        { type: 'error' }
      )
      return
    }
    try {
      setUploading(true)
      const url = await uploadReceipt(file)
      setReceiptUrl(url)
      setReceiptName(file.name)
      // clear controlled file input value
      setValue('receipt', undefined)
    } catch (err: any) {
      show(err?.message || t('upload_failed'), { type: 'error' })
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
  const { settings } = useSettings()
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const getCategoryName = useCallback((cat?: any) => {
    if (!cat) return t('no_category_option')
    const localized = cat?.[`name_${locale}`]
    return localized || cat?.name || t('no_category_option')
  }, [locale, t])

  // Inline Add Category modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCat, setNewCat] = useState<{ name: string; icon: string; color: string }>({ name: '', icon: '', color: '' })
  const [newCatErrors, setNewCatErrors] = useState<{ name?: string }>({})

  const resetNewCatForm = () => {
    setNewCat({ name: '', icon: '', color: '' })
    setNewCatErrors({})
  }

  const validateNewCat = () => {
    const errs: { name?: string } = {}
    if (!newCat.name.trim()) {
      errs.name = t('category_name_required') || 'Category name is required'
    } else if (newCat.name.trim().length < VALIDATION.CATEGORY_NAME.MIN_LENGTH) {
      errs.name = t('category_name_min') || `Category name must be at least ${VALIDATION.CATEGORY_NAME.MIN_LENGTH} characters`
    } else if (newCat.name.trim().length > VALIDATION.CATEGORY_NAME.MAX_LENGTH) {
      errs.name = t('category_name_max') || `Category name must not exceed ${VALIDATION.CATEGORY_NAME.MAX_LENGTH} characters`
    }
    setNewCatErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreateCategory = async () => {
    if (!validateNewCat()) return
    try {
      setCreatingCat(true)
      const created = await createCategory({
        name: newCat.name.trim(),
        icon: newCat.icon || undefined,
        color: newCat.color || undefined,
      })
      await loadCategories()
      setValue('categoryId', created.id, { shouldValidate: true })
      setIsCatModalOpen(false)
      resetNewCatForm()
      show(t('category_created') || 'Category created', { type: 'success' })
    } catch (e: any) {
      show(e?.message || t('failed_save_category') || 'Failed to save category', { type: 'error' })
    } finally {
      setCreatingCat(false)
    }
  }

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

  // Refresh categories when the window regains focus (e.g., after creating a category in a new tab)
  useEffect(() => {
    const onFocus = () => {
      setLoadingCategories(true)
      void loadCategories()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [loadCategories])

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('amount_label')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{symbol}</span>
            </div>
            <input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              onKeyDown={(e) => { 
                // Prevent invalid characters in numeric input
                if (['-', 'e', 'E', '+'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              className={`block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                errors.amount ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
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
              {t('category_label')}
            </label>
            <button
              type="button"
              onClick={() => { resetNewCatForm(); setIsCatModalOpen(true) }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              {t('create_new')}
            </button>
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
                {selectedCategory ? (
                  <>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: `${selectedCategory.color}15`, color: selectedCategory.color }}>
                      {selectedCategory.icon}
                    </span>
                    {getCategoryName(selectedCategory)}
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{t('select_category') || 'Select a category'}</span>
                )}
              </span>
              <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
            </button>
            {catOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    autoFocus
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                    placeholder={t('search_categories')}
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <ul role="listbox" className="max-h-56 overflow-auto py-1">
                  {categories
                    .filter(c => !catQuery || c.name.toLowerCase().includes(catQuery.toLowerCase()))
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={c.id === selectedCategoryId}
                          className={`w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${c.id === selectedCategoryId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                          onClick={() => { setValue('categoryId', c.id, { shouldValidate: true }); setCatOpen(false) }}
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={c.color ? { backgroundColor: `${c.color}15`, color: c.color } : {}}>
                            {c.icon || '📁'}
                          </span>
                          <span className="truncate">{getCategoryName(c)}</span>
                        </button>
                      </li>
                    ))}
                  {categories.filter(c => !catQuery || c.name.toLowerCase().includes(catQuery.toLowerCase())).length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{t('no_categories_available')}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.categoryId.message as string}</p>
          )}
          {loadingCategories && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('loading_categories')}</p>
          )}
          {!loadingCategories && categories.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('no_categories_available')} <a href="/#/categories" target="_blank" rel="noopener noreferrer" className="underline font-medium">{t('create_one')}</a>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('date_label')}
          </label>
          <div className="space-y-2">
            <DatePicker
              value={watch('date') || ''}
              onChange={(value) => setValue('date', value, { shouldValidate: true })}
              minDate={getMinDateISO()}
              maxDate={getTodayISO()}
            />
            <div className="flex flex-wrap gap-2">
              <button 
                type="button" 
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setValue('date', getTodayISO(), { shouldValidate: true })}
              >
                {t('today')}
              </button>
              <button 
                type="button" 
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 1)
                  d.setHours(0, 0, 0, 0)
                  setValue('date', formatLocalISODate(d), { shouldValidate: true })
                }}
              >
                {t('yesterday')}
              </button>
              <button 
                type="button" 
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 7)
                  d.setHours(0, 0, 0, 0)
                  const iso = formatLocalISODate(d)
                  const minDate = getMinDateISO()
                  setValue('date', iso < minDate ? minDate : iso, { shouldValidate: true })
                }}
              >
                {t('seven_days_ago')}
              </button>
              <button 
                type="button" 
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  const d = new Date()
                  d.setDate(1)
                  d.setHours(0, 0, 0, 0)
                  setValue('date', formatLocalISODate(d), { shouldValidate: true })
                }}
              >
                {t('start_of_month')}
              </button>
            </div>
          </div>
          {errors.date && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.date.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('notes_label')}
          </label>
          <input
            id="notes"
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            placeholder={t('optional_description')}
            {...register('notes')}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('receipt_label')}
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
                  setValue('receipt', files);
                  void handleFiles(files);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="receipt" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                    <span>{t('upload_a_file')}</span>
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
                  <p className="pl-1">{t('or_drag_and_drop')}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('upload_help')}</p>
              </div>
            </div>
          )}
          {uploading && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Loader size="sm" /> {t('uploading')}
            </div>
          )}
          {receiptUrl && !uploading && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <DocumentTextIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="truncate text-sm text-gray-700 dark:text-gray-300" title={receiptName || t('document')}>{receiptName || t('document')}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={viewUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">{t('open')}</a>
                <button type="button" onClick={() => { setReceiptUrl(''); setReceiptName(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs px-3 py-1 rounded border border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">{t('remove')}</button>
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
            {t('cancel')}
          </button>
        )}
        <button
          disabled={submitting}
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Loader size="sm" className="mr-2" />}
          {submitting ? t('saving') : (defaultValues ? t('update_transaction') : t('add_transaction'))}
        </button>
      </div>
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => { setIsCatModalOpen(false); resetNewCatForm() }}
        title={t('add_new_category')}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="inlineCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('category_name_label')}</label>
            <input
              id="inlineCategoryName"
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
              className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${newCatErrors.name ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
              placeholder={t('category_name_placeholder')}
              maxLength={VALIDATION.CATEGORY_NAME.MAX_LENGTH}
            />
            {newCatErrors.name && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{newCatErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('icon_optional')}</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCat((p) => ({ ...p, icon: emoji }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${newCat.icon === emoji ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500 dark:ring-emerald-400' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newCat.icon}
                onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors dark:bg-gray-700 dark:text-white"
                placeholder={t('or_type_emoji')}
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('color_optional')}</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCat((p) => ({ ...p, color }))}
                    className={`w-10 h-10 rounded-lg transition-all ${newCat.color === color ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-emerald-400 dark:ring-offset-gray-800' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="text"
                value={newCat.color}
                onChange={(e) => setNewCat((p) => ({ ...p, color: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors dark:bg-gray-700 dark:text-white"
                placeholder={t('or_type_hex')}
                maxLength={20}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { setIsCatModalOpen(false); resetNewCatForm() }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCat}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingCat ? t('saving') : t('create_category')}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
