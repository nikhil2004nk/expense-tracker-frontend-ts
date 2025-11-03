import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/ToastProvider'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useI18n } from '../contexts/I18nContext'
import { TIMING, VALIDATION } from '../config/constants'
import { me as fetchMe, changePassword, deleteMe, updateMe, type User } from '../services/auth'
import { ConfirmModal } from '../components/common'

const profileSchema = z.object({
  name: z.string().min(VALIDATION.USER_NAME.MIN_LENGTH, `Name must be at least ${VALIDATION.USER_NAME.MIN_LENGTH} characters`),
  email: z.string().email('Please enter a valid email address'),
  currency: z.string().min(1, 'Currency is required'),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(VALIDATION.PASSWORD.MIN_LENGTH, `New password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`),
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
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [storedPreferences, setStoredPreferences] = useLocalStorage<ProfileForm>('userPreferences', {
    name: '',
    email: '',
    currency: 'INR',
  })

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: storedPreferences,
  })

  const { register: registerPwd, handleSubmit: handleSubmitPwd, reset: resetPwd, formState: { errors: pwdErrors }, watch: watchPwd } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        const apiData: User = await fetchMe()
        const profileData: ProfileForm = {
          name: apiData.fullName ?? storedPreferences.name ?? '',
          email: apiData.email ?? storedPreferences.email ?? '',
          currency: apiData.preferredCurrency ?? storedPreferences.currency ?? 'INR',
        }
        reset(profileData)
        setStoredPreferences(profileData)
        try { 
          window.dispatchEvent(new Event('userPreferencesUpdated')) 
        } catch (error) {
          console.error('[Profile] Failed to dispatch userPreferencesUpdated event:', error)
        }
      } catch (error) {
        console.error('[Profile] Failed to load from API, using local storage:', error)
        reset(storedPreferences)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTick])

  const handleRefresh = () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setReloadTick((v) => v + 1)
    
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    
    // Set new timer and store reference
    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false)
      refreshTimerRef.current = null
    }, TIMING.REFRESH_DURATION)
  }
  
  // Cleanup refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSaving(true)
      // Persist to backend (full name, email, preferred currency)
      await updateMe({ fullName: data.name, email: data.email, preferredCurrency: data.currency })
      setStoredPreferences(data)
      try { 
        window.dispatchEvent(new Event('userPreferencesUpdated')) 
      } catch (error) {
        console.error('[Profile] Failed to dispatch userPreferencesUpdated event:', error)
      }
      show(t('profile_saved'), { type: 'success' })
      reset(data)
    } catch (error) {
      console.error('[Profile] Failed to save profile:', error)
      show(t('failed_to_save_profile'), { type: 'error' })
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
      show(t('password_changed'), { type: 'success' })
      resetPwd()
      setShowChangePassword(false)
    } catch (err: any) {
      const msg = err?.message || t('failed_to_change_password')
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
      show(t('account_deleted'), { type: 'success' })
      setTimeout(() => {
        window.location.href = '/login'
      }, 800)
    } catch (e: any) {
      show(e?.message || t('failed_to_delete_account'), { type: 'error' })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('profile_settings_title')}</h1>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            title={t('refresh')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
          </button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('profile_settings_title')}</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('manage_account_prefs')}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 self-start"
          title={t('refresh')}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{t('personal_info')}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('update_personal_details')}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('full_name')}</label>
            <input
              id="name"
              type="text"
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.name ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder={t('enter_full_name')}
              {...register('name')}
            />
            {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('email_address')}</label>
            <input
              id="email"
              type="email"
              className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.email ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder={t('enter_email_address')}
              {...register('email')}
            />
            {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('preferred_currency')}</label>
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
                {t('cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                  {t('saving')}
                </>
              ) : (
                t('save_settings')
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{t('account_settings')}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('manage_account_security')}</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('change_password')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('update_account_password')}</p>
            </div>
            <button onClick={handleChangePasswordToggle} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0">{showChangePassword ? t('close') : t('change_password')}</button>
          </div>
          {showChangePassword && (
            <form onSubmit={handleSubmitPwd(onSubmitPassword)} className="space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('current_password')}</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.currentPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder={t('enter_current_password')}
                    {...registerPwd('currentPassword')}
                  />
                  <button type="button" onClick={() => setShowCurrentPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showCurrentPwd ? t('hide') : t('show')}
                  </button>
                </div>
                {pwdErrors.currentPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{pwdErrors.currentPassword.message}</p>}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('new_password')}</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.newPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder={t('enter_new_password')}
                    {...registerPwd('newPassword')}
                  />
                  <button type="button" onClick={() => setShowNewPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showNewPwd ? t('hide') : t('show')}
                  </button>
                </div>
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex-1 rounded ${i < pwdStrength.score ? pwdStrength.color : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('password_strength')}: {pwdStrength.label}</p>
                </div>
                {pwdErrors.newPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{pwdErrors.newPassword.message}</p>}
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('confirm_new_password')}</label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    className={`block w-full rounded-md border pr-10 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${pwdErrors.confirmNewPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder={t('confirm_new_password')}
                    {...registerPwd('confirmNewPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs">
                    {showConfirmPwd ? t('hide') : t('show')}
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
                  {isChanging ? t('saving') : t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-sm flex items-center justify-center"
                >
                  {isChanging ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                      {t('saving')}
                    </>
                  ) : (
                    t('change_password')
                  )}
                </button>
              </div>
            </form>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">{t('delete_account')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('delete_account_warning')}</p>
            </div>
            <button onClick={handleDeleteAccount} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto flex-shrink-0">{t('delete_account')}</button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        title={t('delete_txn_title')}
        message={t('delete_txn_msg')}
        confirmText={isDeleting ? t('saving') : t('delete')}
        cancelText={isDeleting ? t('saving') : t('cancel')}
        type="danger"
      />
    </div>
  )
}
 
