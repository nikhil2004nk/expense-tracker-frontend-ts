import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerUser } from '../../services/auth'
import { XCircleIcon, CheckCircleIcon, ArrowPathIcon, MoonIcon, SunIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import ScrollToTop from '../../components/common/ScrollToTop'
import { useI18n } from '../../contexts/I18nContext'
import { useTheme } from '../../contexts/ThemeContext'
import LanguageSelector from '../../components/LanguageSelector'
import { TIMING } from '../../config/constants'

export default function Register() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { mounted, currentTheme, toggleTheme } = useTheme()
  
  const schema = z
    .object({
      name: z
        .string()
        .min(2, t('name_min_2'))
        .max(100, t('name_max_100'))
        .trim()
        .regex(/^[a-zA-Z\s'-]+$/, t('name_valid_chars')),
      email: z
        .string()
        .min(1, t('email_required'))
        .trim()
        .toLowerCase()
        .email(t('enter_valid_email'))
        .max(255, t('email_max_255')),
      password: z
        .string()
        .min(8, t('password_min_8'))
        .max(128, t('password_max_128'))
        .regex(/[A-Z]/, t('password_uppercase'))
        .regex(/[a-z]/, t('password_lowercase'))
        .regex(/[0-9]/, t('password_number'))
        .regex(/[^A-Za-z0-9]/, t('password_special')),
      confirmPassword: z
        .string()
        .min(1, t('confirm_password_required')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwords_do_not_match'),
      path: ['confirmPassword'],
    })

  type FormData = z.infer<typeof schema>
  const [serverError, setServerError] = useState('')
  const [serverSuccess, setServerSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  async function onSubmit(values: FormData) {
    setServerError('')
    setServerSuccess('')
    try {
      await registerUser({ name: values.name, email: values.email, password: values.password })
      setServerSuccess(t('registration_success'))
      setTimeout(() => navigate('/login', { state: { email: values.email } }), TIMING.REDIRECT_DELAY)
    } catch (err: any) {
      setServerError(err?.message || t('registration_failed'))
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur px-1.5 py-1 shadow-sm">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
            aria-label={t('theme_preference') || 'Theme'}
            title={t('theme_preference') || 'Theme'}
          >
            {mounted && currentTheme === 'dark' ? (
              <MoonIcon className="h-4 w-4" />
            ) : (
              <SunIcon className="h-4 w-4" />
            )}
          </button>
          <LanguageSelector />
        </div>
      </div>
      <ScrollToTop />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('create_account')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('create_account_subtitle')}</p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          {serverError && (
            <div className="mb-4 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{serverError}</p>
                </div>
              </div>
            </div>
          )}

          {serverSuccess && (
            <div className="mb-4 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 dark:text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">{serverSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('full_name')}</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.name ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder={t('full_name_placeholder')}
                {...register('name')}
              />
              {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('email_address')}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.email ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder={t('email_placeholder')}
                {...register('email')}
              />
              {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.password ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={showPassword ? t('hide_password') : t('show_password')}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('confirm_password')}</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`block w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.confirmPassword ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={showConfirmPassword ? t('hide_password') : t('show_password')}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  {t('creating_account')}
                </>
              ) : (
                t('create_account')
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">{t('already_have_account')}</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/login" className="flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">{t('signin_to_your_account')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
