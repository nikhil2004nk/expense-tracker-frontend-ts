import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/ToastProvider'
import { useLocalStorage } from '../hooks/useLocalStorage'
 
import { me as fetchMe, changePassword, deleteMe, updateMe } from '../services/auth'
import { ConfirmModal } from '../components/common'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  currency: z.string().min(1, 'Currency is required'),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match',
  })

const currencies = [
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
]

 

type ProfileForm = z.infer<typeof profileSchema>
type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export default function Profile() {
  const { show } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [storedPreferences, setStoredPreferences] = useLocalStorage('userPreferences', {
    name: '',
    email: '',
    currency: 'INR',
  })

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: storedPreferences as ProfileForm,
  })

  const { register: registerPwd, handleSubmit: handleSubmitPwd, reset: resetPwd, formState: { errors: pwdErrors }, watch: watchPwd } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema) as any,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const newPwdValue = watchPwd('newPassword') || ''
  const pwdStrength = (() => {
    const len = newPwdValue.length
    const hasLower = /[a-z]/.test(newPwdValue)
    const hasUpper = /[A-Z]/.test(newPwdValue)
    const hasNumber = /\d/.test(newPwdValue)
    const hasSymbol = /[^A-Za-z0-9]/.test(newPwdValue)
    let score = 0
    if (len >= 8) score++
    if (hasLower && hasUpper) score++
    if (hasNumber) score++
    if (hasSymbol) score++
    const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
    const color = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-yellow-500' : score === 3 ? 'bg-emerald-500' : 'bg-emerald-600'
    return { score, label, color }
  })()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const apiData = await fetchMe()
        const profileData: ProfileForm = {
          name: (apiData as any).fullName ?? storedPreferences.name ?? '',
          email: (apiData as any).email ?? storedPreferences.email ?? '',
          currency: (apiData as any).preferredCurrency ?? storedPreferences.currency ?? 'INR',
        }
        reset(profileData)
        setStoredPreferences(profileData)
        try { window.dispatchEvent(new Event('userPreferencesUpdated')) } catch {}
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

  

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSaving(true)
      // Persist to backend (full name, email, preferred currency)
      await updateMe({ fullName: data.name, email: data.email, preferredCurrency: data.currency })
      setStoredPreferences(data)
      try { window.dispatchEvent(new Event('userPreferencesUpdated')) } catch {}
      show('Profile saved successfully!', { type: 'success' })
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

  const handleChangePasswordToggle = () => {
    setShowChangePassword((v) => !v)
  }

  const onSubmitPassword = async (data: ChangePasswordForm) => {
    try {
      setIsChanging(true)
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      show('Password changed successfully', { type: 'success' })
      resetPwd()
      setShowChangePassword(false)
    } catch (err: any) {
      const msg = err?.message || 'Failed to change password'
      show(msg, { type: 'error' })
    } finally {
      setIsChanging(false)
    }
  }

  

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const onConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteMe()
      localStorage.clear()
      show('Account deleted successfully. Goodbye!', { type: 'success' })
      setTimeout(() => {
        window.location.href = '/login'
      }, 800)
    } catch (e: any) {
      show(e?.message || 'Failed to delete account', { type: 'error' })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
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
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Account Settings</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account security and privacy</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Change Password</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
            </div>
            <button onClick={handleChangePasswordToggle} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0">{showChangePassword ? 'Close' : 'Change Password'}</button>
          </div>
          {showChangePassword && (
            <form onSubmit={handleSubmitPwd(onSubmitPassword)} className="space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password *</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.currentPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Enter current password"
                    {...registerPwd('currentPassword')}
                  />
                  <button type="button" onClick={() => setShowCurrentPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showCurrentPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwdErrors.currentPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{pwdErrors.currentPassword.message}</p>}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password *</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.newPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Enter new password"
                    {...registerPwd('newPassword')}
                  />
                  <button type="button" onClick={() => setShowNewPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showNewPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex-1 rounded ${i < pwdStrength.score ? pwdStrength.color : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Strength: {pwdStrength.label}</p>
                </div>
                {pwdErrors.newPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{pwdErrors.newPassword.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password *</label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.confirmNewPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Confirm new password"
                    {...registerPwd('confirmNewPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showConfirmPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwdErrors.confirmNewPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{pwdErrors.confirmNewPassword.message}</p>}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetPwd(); setShowChangePassword(false) }}
                  className="w-auto sm:w-fit px-4 sm:px-5 py-1 sm:py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChanging}
                >
                  {isChanging ? 'Canceling...' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm flex items-center justify-center"
                >
                  {isChanging ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button onClick={handleDeleteAccount} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto flex-shrink-0">Delete Account</button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        title="Delete account?"
        message="This action is permanent and will remove all your data. Are you sure you want to continue?"
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText={isDeleting ? 'Please wait' : 'Cancel'}
        type="danger"
      />
    </div>
  )
}
 
