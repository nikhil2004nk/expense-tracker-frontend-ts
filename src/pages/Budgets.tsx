import { useState } from 'react'
import { Modal } from '../components/common'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../components/ToastProvider'
import { getCurrencySymbol, formatCurrencyWithSymbol } from '../utils/currency'

export default function Budgets() {
  const { show } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<null | { id: number; category: string; spent: number; budget: number; createdAt: string }>(null)
  const [formData, setFormData] = useState({ category: '', amount: '' })
  const [formErrors, setFormErrors] = useState<{ category?: string; amount?: string }>({})

  const [userPreferences] = useLocalStorage('userPreferences', { currency: 'INR' })
  const currencySymbol = getCurrencySymbol(userPreferences.currency)

  const [budgetData, setBudgetData] = useLocalStorage('budgets', [
    { id: 1, category: 'Groceries', spent: 9500, budget: 12000, createdAt: new Date().toISOString() },
    { id: 2, category: 'Entertainment', spent: 4500, budget: 6000, createdAt: new Date().toISOString() },
    { id: 3, category: 'Transport', spent: 6000, budget: 8000, createdAt: new Date().toISOString() },
    { id: 4, category: 'Food & Dining', spent: 11000, budget: 10000, createdAt: new Date().toISOString() },
  ])

  const getProgressPercentage = (spent: number, budget: number) => Math.min((spent / budget) * 100, 100)
  const getProgressColor = (spent: number, budget: number) => {
    const percentage = getProgressPercentage(spent, budget)
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  const validateForm = () => {
    const errors: { category?: string; amount?: string } = {}
    if (!formData.category?.trim()) {
      errors.category = 'Category is required'
    } else if (formData.category.trim().length < 2) {
      errors.category = 'Category must be at least 2 characters'
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
    setFormData({ category: '', amount: '' })
    setFormErrors({})
    setEditingBudget(null)
  }

  const handleOpenModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget)
    setFormData({ category: budget.category, amount: budget.budget.toString() })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    try {
      if (editingBudget) {
        setBudgetData((prev: any[]) => prev.map((b) => (b.id === editingBudget.id ? { ...b, category: formData.category.trim(), budget: parseFloat(formData.amount), updatedAt: new Date().toISOString() } : b)))
        show(`Budget "${formData.category}" updated successfully!`, { type: 'success' })
      } else {
        const newBudget = { id: Date.now(), category: formData.category.trim(), spent: 0, budget: parseFloat(formData.amount), createdAt: new Date().toISOString() }
        setBudgetData((prev: any[]) => [...prev, newBudget])
        show(`Budget "${formData.category}" created successfully!`, { type: 'success' })
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      show('Failed to save budget. Please try again.', { type: 'error' })
    }
  }

  const handleDeleteBudget = (budget: any) => {
    const confirmed = window.confirm(`Are you sure you want to delete the "${budget.category}" budget?\n\nThis action cannot be undone.`)
    if (confirmed) {
      setBudgetData((prev: any[]) => prev.filter((b) => b.id !== budget.id))
      show(`Budget "${budget.category}" deleted successfully!`, { type: 'success' })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Track your spending against budget limits</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Budget
        </button>
      </div>

      {budgetData.length === 0 ? (
        <div className="text-center py-10 sm:py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-3 sm:mb-4">
            <svg className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No budgets yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 max-w-sm mx-auto">Create your first budget to start tracking your spending and take control of your finances</p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetData.map((budget: any) => {
            const percentage = getProgressPercentage(budget.spent, budget.budget)
            const progressColor = getProgressColor(budget.spent, budget.budget)
            const isOverBudget = budget.spent > budget.budget
            return (
              <div key={budget.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-lg dark:hover:shadow-emerald-900/10 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate pr-2">{budget.category}</h3>
                  {isOverBudget && (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 flex-shrink-0">Over Budget</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">{formatCurrencyWithSymbol(budget.spent, userPreferences.currency)}</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">/ {formatCurrencyWithSymbol(budget.budget, userPreferences.currency)}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    <span>Progress</span>
                    <span className={`${percentage >= 100 ? 'text-red-600 dark:text-red-400' : percentage >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden shadow-inner">
                    <div className={`h-2.5 rounded-full ${progressColor} transition-all duration-500 ease-out shadow-sm`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs sm:text-sm font-medium">
                    {isOverBudget ? (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="truncate">{formatCurrencyWithSymbol(budget.spent - budget.budget, userPreferences.currency)} over</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{formatCurrencyWithSymbol(budget.budget - budget.spent, userPreferences.currency)} left</span>
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditBudget(budget)} className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md font-medium transition-colors" title="Edit budget">Edit</button>
                    <button onClick={() => handleDeleteBudget(budget)} className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md font-medium transition-colors" title="Delete budget">Delete</button>
                  </div>
                </div>
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
        title={editingBudget ? 'Edit Budget' : 'Add New Budget'}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Category *</label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className={`block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${formErrors.category ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-gray-500'}`}
              placeholder="e.g., Groceries, Food, Transport"
            />
            {formErrors.category && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.category}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Budget Amount *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{currencySymbol}</span>
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
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
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
              Cancel
            </button>
            <button onClick={handleSubmit} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">
              {editingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
