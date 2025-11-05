import { useEffect, useState } from 'react'
import { useToast } from '../components/ToastProvider'
import { useTheme } from '../contexts/ThemeContext'
import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'
import { updateUserSettings } from '../services/userSettings'
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function Settings() {
  const { show } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { t } = useI18n()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { theme, setTheme } = useTheme()
  const [initialTheme, setInitialTheme] = useState(theme)
  const [draftTheme, setDraftTheme] = useState<'light' | 'dark'>(theme)

  const { settings, setSettings } = useSettings()

  // Local draft state; only commit to contexts/backend on Save
  const [draft, setDraft] = useState({
    language: settings.language as 'en' | 'hi' | 'mr',
    dateFormat: settings.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
    budgetAlertThreshold: settings.budgetAlertThreshold as number,
    // Local-only settings below (not persisted to backend)
    fiscalYearStart: settings.fiscalYearStart,
    notifications: settings.notifications,
    emailReports: settings.emailReports,
    defaultTransactionView: settings.defaultTransactionView,
    autoBackup: settings.autoBackup,
  })

  const handleSettingChange = (
    key:
      | 'language'
      | 'dateFormat'
      | 'budgetAlertThreshold'
      | 'fiscalYearStart'
      | 'notifications'
      | 'emailReports'
      | 'defaultTransactionView'
      | 'autoBackup',
    value: any,
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }
  const hasSettingsChanges =
    draft.language !== settings.language ||
    draft.dateFormat !== settings.dateFormat ||
    draft.fiscalYearStart !== settings.fiscalYearStart ||
    draft.budgetAlertThreshold !== settings.budgetAlertThreshold ||
    draftTheme !== initialTheme

  // Track individual field changes
  const fieldChanges = {
    theme: draftTheme !== initialTheme,
    language: draft.language !== settings.language,
    dateFormat: draft.dateFormat !== settings.dateFormat,
    fiscalYearStart: draft.fiscalYearStart !== settings.fiscalYearStart,
    budgetAlertThreshold: draft.budgetAlertThreshold !== settings.budgetAlertThreshold,
    notifications: draft.notifications !== settings.notifications,
    emailReports: draft.emailReports !== settings.emailReports,
    autoBackup: draft.autoBackup !== settings.autoBackup,
  }

  // Component to show inline warning message
  const FieldChangeWarning = () => (
    <div className="mt-2">
      <p className="text-xs text-amber-600 dark:text-amber-400">{t('save_to_apply_changes')}</p>
    </div>
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserSettings({
        theme: draftTheme,
        language: draft.language,
        date_format: draft.dateFormat,
        budget_alert_threshold: draft.budgetAlertThreshold,
      })
      // Apply to contexts only after successful save
      setSettings((prev: any) => ({
        ...prev,
        language: draft.language,
        dateFormat: draft.dateFormat,
        budgetAlertThreshold: draft.budgetAlertThreshold,
        // Apply local-only settings to context on save as well
        fiscalYearStart: draft.fiscalYearStart,
        notifications: draft.notifications,
        emailReports: draft.emailReports,
        defaultTransactionView: draft.defaultTransactionView,
        autoBackup: draft.autoBackup,
      }))
      // Apply theme to UI only after successful save
      setTheme(draftTheme)
      setInitialTheme(draftTheme)
      show(t('settings_save_success'), { type: 'success' })
    } catch {
      show(t('settings_save_error'), { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }
  useEffect(() => {
    setDraft({
      language: settings.language as 'en' | 'hi' | 'mr',
      dateFormat: settings.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
      budgetAlertThreshold: settings.budgetAlertThreshold,
      fiscalYearStart: settings.fiscalYearStart,
      notifications: settings.notifications,
      emailReports: settings.emailReports,
      defaultTransactionView: settings.defaultTransactionView,
      autoBackup: settings.autoBackup,
    })
  }, [
    settings.language,
    settings.dateFormat,
    settings.budgetAlertThreshold,
    settings.fiscalYearStart,
    settings.notifications,
    settings.emailReports,
    settings.defaultTransactionView,
    settings.autoBackup,
  ])
  useEffect(() => {
    // keep draftTheme in sync with current theme if it changes externally
    setDraftTheme(theme)
  }, [theme])
  useEffect(() => {
    // capture baseline theme at mount for save-change detection
    setInitialTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('settings_title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings_subtitle')}</p>
        </div>
        <button
          onClick={() => {
            if (isRefreshing) return
            setIsRefreshing(true)
            setTimeout(() => {
              setIsRefreshing(false)
              window.location.reload()
            }, 2000)
          }}
          className="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 self-start"
          title={t('refresh')}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('refresh') || 'Refresh'}</span>
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('theme_preference')}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">{t('theme_hint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ value: 'light', label: t('light'), icon: '☀️' }, { value: 'dark', label: t('dark'), icon: '🌙' }].map((tItem) => (
              <button
                key={tItem.value}
                type="button"
                onClick={() => {
                  const next = tItem.value as 'light' | 'dark'
                  setDraftTheme(next)
                }}
                className={`relative flex cursor-pointer rounded-lg p-4 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${draftTheme === tItem.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{tItem.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tItem.label}</div>
                  </div>
                </div>
                {draftTheme === tItem.value && (
                  <div className="absolute top-2 right-2">
                    <CheckIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {fieldChanges.theme && <FieldChangeWarning />}
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('regional_preferences')}</h2>
          <div className="space-y-4 sm:space-y-6">
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('language_label')}</label>
              <select
                id="language"
                value={draft.language}
                onChange={(e) => handleSettingChange('language', e.target.value as 'en' | 'hi' | 'mr')}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
              {fieldChanges.language && <FieldChangeWarning />}
            </div>

            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('date_format_label')}</label>
              <select
                id="dateFormat"
                value={draft.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
              </select>
              {fieldChanges.dateFormat && <FieldChangeWarning />}
            </div>

            <div>
              <label htmlFor="fiscalYearStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('fiscal_year_start_label')}</label>
              <select
                id="fiscalYearStart"
                value={draft.fiscalYearStart}
                onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="april">{t('april_india')}</option>
                <option value="january">{t('january')}</option>
                <option value="july">{t('july')}</option>
                <option value="october">{t('october')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fiscal_hint')}</p>
              {fieldChanges.fiscalYearStart && <FieldChangeWarning />}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('budget_alerts_title')}</h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="budgetAlertThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('budget_alert_threshold_label')}</label>
              <div className="flex items-center gap-4">
                <input
                  id="budgetAlertThreshold"
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={draft.budgetAlertThreshold}
                  onChange={(e) => handleSettingChange('budgetAlertThreshold', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-right">{draft.budgetAlertThreshold}%</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('budget_alert_hint')}</p>
              {fieldChanges.budgetAlertThreshold && <FieldChangeWarning />}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasSettingsChanges}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('notifications_title')}</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('push_notifications')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('push_hint')}</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !draft.notifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${draft.notifications ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${draft.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {fieldChanges.notifications && (
              <div className="sm:col-span-2">
                <FieldChangeWarning />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('email_reports')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('email_hint')}</p>
              </div>
              <button
                onClick={() => handleSettingChange('emailReports', !draft.emailReports)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${draft.emailReports ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${draft.emailReports ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {fieldChanges.emailReports && (
              <div className="sm:col-span-2">
                <FieldChangeWarning />
              </div>
            )}
          </div>
        </div>

        

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('data_privacy_title')}</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('auto_backup')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('auto_backup_hint')}</p>
              </div>
              <button
                onClick={() => handleSettingChange('autoBackup', !draft.autoBackup)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${draft.autoBackup ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${draft.autoBackup ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {fieldChanges.autoBackup && (
              <div className="sm:col-span-2">
                <FieldChangeWarning />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('clear_cache')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('clear_cache_hint')}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(t('clear_cache_confirm'))) {
                    show(t('cache_cleared_success'), { type: 'success' })
                  }
                }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0"
              >
                {t('clear_cache')}
              </button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
