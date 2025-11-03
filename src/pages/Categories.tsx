import { useState, useEffect } from 'react'
import { Modal, ConfirmModal } from '../components/common'
import { useToast } from '../components/ToastProvider'
import { fetchCategories, createCategory, updateCategory, deleteCategory, type Category } from '../services/categories'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { ArrowPathIcon, PlusIcon, TagIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { CATEGORY_EMOJIS, CATEGORY_COLORS, VALIDATION, TIMING } from '../config/constants'

export default function Categories() {
  const { show } = useToast()
  const { t } = useI18n()
  const { settings } = useSettings()
  const locale = settings.language as 'en' | 'hi' | 'mr'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', icon: '', color: '' })
  const [formErrors, setFormErrors] = useState<{ name?: string; icon?: string; color?: string }>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; category: Category | null }>({ 
    isOpen: false, 
    category: null 
  })

  const getCategoryName = (cat?: { 
    name?: string; 
    name_en?: string; 
    name_hi?: string; 
    name_mr?: string;
    [key: string]: unknown;
  } | null) => {
    if (!cat) return t('uncategorized')
    const localizedKey = `name_${locale}`
    const localized = cat[localizedKey]
    return (typeof localized === 'string' ? localized : cat.name) || t('uncategorized')
  }

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    Promise.resolve(loadCategories()).finally(() => {
      setTimeout(() => setIsRefreshing(false), TIMING.REFRESH_DURATION)
    })
  }

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (error: unknown) {
      console.error('[Categories] Failed to load categories:', error)
      const message = error instanceof Error ? error.message : 'Failed to load categories'
      show(message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: { name?: string; icon?: string; color?: string } = {}
    if (!formData.name?.trim()) {
      errors.name = 'Category name is required'
    } else if (formData.name.trim().length < VALIDATION.CATEGORY_NAME.MIN_LENGTH) {
      errors.name = `Category name must be at least ${VALIDATION.CATEGORY_NAME.MIN_LENGTH} characters`
    } else if (formData.name.trim().length > VALIDATION.CATEGORY_NAME.MAX_LENGTH) {
      errors.name = `Category name must not exceed ${VALIDATION.CATEGORY_NAME.MAX_LENGTH} characters`
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({ name: '', icon: '', color: '' })
    setFormErrors({})
    setEditingCategory(null)
  }

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({ 
      name: category.name, 
      icon: category.icon || '', 
      color: category.color || '' 
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          icon: formData.icon || undefined,
          color: formData.color || undefined,
        })
        show(`Category "${formData.name}" updated successfully!`, { type: 'success' })
      } else {
        await createCategory({
          name: formData.name.trim(),
          icon: formData.icon || undefined,
          color: formData.color || undefined,
        })
        show(`Category "${formData.name}" created successfully!`, { type: 'success' })
      }
      await loadCategories()
      setIsModalOpen(false)
      resetForm()
    } catch (error: unknown) {
      console.error('[Categories] Failed to save category:', error)
      const message = error instanceof Error ? error.message : 'Failed to save category. Please try again.'
      show(message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = (category: Category) => {
    setDeleteConfirm({ isOpen: true, category })
  }

  const confirmDelete = async () => {
    const category = deleteConfirm.category
    if (!category) return

    try {
      setLoading(true)
      await deleteCategory(category.id)
      await loadCategories()
      show(`Category "${category.name}" deleted successfully!`, { type: 'success' })
    } catch (error: unknown) {
      console.error('[Categories] Failed to delete category:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete category. Please try again.'
      show(message, { type: 'error' })
    } finally {
      setLoading(false)
      setDeleteConfirm({ isOpen: false, category: null })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('categories_title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('categories_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
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
                {t('loading_categories')}
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('add_category')}
              </>
            )}
          </button>
        </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3 sm:mb-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('loading_categories')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('loading_wait')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3 sm:mb-4">
            <TagIcon className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('no_categories_yet')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 max-w-sm mx-auto">{t('create_first_category_hint')}</p>
          <button
            onClick={handleOpenModal}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('add_category')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {category.icon && (
                    <div 
                      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl"
                      style={{ backgroundColor: category.color ? `${category.color}20` : '#f3f4f6' }}
                    >
                      {category.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{getCategoryName(category)}</h3>
                    {category.color && (
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{category.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => handleEditCategory(category)}
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('edit_category')}
                >
                  {t('edit')}
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category)}
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('delete')}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingCategory ? t('edit_category') : t('add_new_category')}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('category_name_label')}</label>
            <input
              id="categoryName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${formErrors.name ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
              placeholder={t('category_name_placeholder')}
              maxLength={VALIDATION.CATEGORY_NAME.MAX_LENGTH}
            />
            {formErrors.name && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.name}
              </p>
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
                    onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      formData.icon === emoji
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500 dark:ring-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
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
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-emerald-400 dark:ring-offset-gray-800'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors dark:bg-gray-700 dark:text-white"
                placeholder={t('or_type_hex')}
                maxLength={20}
              />
            </div>
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
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('saving')}
                </span>
              ) : (
                editingCategory ? t('update_category') : t('create_category')
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null })}
        onConfirm={confirmDelete}
        title={t('delete_category_title') || 'Delete Category'}
        message={
          deleteConfirm.category
            ? `${t('delete_category_msg') || 'Are you sure you want to delete the category'} "${deleteConfirm.category.name}"?\n\n${t('delete_category_warning') || 'This action cannot be undone. Any transactions or budgets using this category will become uncategorized.'}`
            : ''
        }
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
      />
    </div>
  )
}

