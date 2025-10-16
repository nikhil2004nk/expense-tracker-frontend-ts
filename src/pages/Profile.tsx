import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/ToastProvider'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useTheme } from '../contexts/ThemeContext'
import { me as fetchMe } from '../services/auth'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  currency: z.string().min(1, 'Currency is required'),
})

const currencies = [
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
]

const themes = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
] as const

type ProfileForm = z.infer<typeof profileSchema>

export default function Profile() {
  const { show } = useToast()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [storedPreferences, setStoredPreferences] = useLocalStorage('userPreferences', {
    name: '',
    email: '',
    currency: 'INR',
  })

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: storedPreferences as ProfileForm,
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const apiData = await fetchMe()
        const profileData: ProfileForm = {
          name: (apiData as any).fullName ?? storedPreferences.name ?? '',
          email: (apiData as any).email ?? storedPreferences.email ?? '',
          currency: storedPreferences.currency ?? 'INR',
        }
        reset(profileData)
        setStoredPreferences(profileData)
      } catch (error) {
        console.warn('Failed to load from API, using local storage:', error)
        reset(storedPreferences)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
  }

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSaving(true)
      setStoredPreferences(data)
      try {
        await new Promise((r) => setTimeout(r, 1000))
        show('Profile saved successfully!', { type: 'success' })
      } catch {
        show('Profile saved locally (offline mode)', { type: 'warning' })
      }
      reset(data)
    } catch {
      show('Failed to save profile. Please try again.', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    reset(storedPreferences)
  }

  const handleChangePassword = () => {
    show('Password change feature coming soon!', { type: 'info' })
  }

  const handleExportData = () => {
    try {
      const userData = {
        profile: storedPreferences,
        exportDate: new Date().toISOString(),
        version: '1.0',
      }
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      show('Data exported successfully!', { type: 'success' })
    } catch {
      show('Failed to export data. Please try again.', { type: 'error' })
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '⚠️ Warning: This action cannot be undone!\n\n' +
        'Are you sure you want to permanently delete your account?\n' +
        'All your data will be lost forever.'
    )
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This is your last chance!\n\n' + 'Type YES in the next prompt to confirm account deletion.'
      )
      if (doubleConfirm) {
        const finalConfirm = window.prompt('Type "DELETE" to confirm (all caps):')
        if (finalConfirm === 'DELETE') {
          localStorage.clear()
          show('Account deleted successfully. Goodbye!', { type: 'success' })
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else {
          show('Account deletion cancelled.', { type: 'info' })
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Profile & Settings</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Profile & Settings</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Personal Information</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details and preferences</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
            <input
              id="name"
              type="text"
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.name ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="Enter your full name"
              {...register('name')}
            />
            {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
            <input
              id="email"
              type="email"
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.email ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="Enter your email address"
              {...register('email')}
            />
            {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Currency *</label>
            <select
              id="currency"
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.currency ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              {...register('currency')}
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>{currency.label}</option>
              ))}
            </select>
            {errors.currency && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.currency.message}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px=4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Theme Preference</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred theme - changes apply immediately</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                type="button"
                onClick={() => handleThemeChange(themeOption.value)}
                className={`relative flex cursor-pointer rounded-lg p-4 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${theme === themeOption.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{themeOption.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{themeOption.label}</div>
                  </div>
                </div>
                {theme === themeOption.value && (
                  <div className="absolute top-2 right-2">
                    <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Account Settings</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account security and privacy</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
            </div>
            <button onClick={handleChangePassword} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0">Change Password</button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Download your profile and transaction data</p>
            </div>
            <button onClick={handleExportData} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0">Export Data</button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button onClick={handleDeleteAccount} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto flex-shrink-0">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  )
}
 
