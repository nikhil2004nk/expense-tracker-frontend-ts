import { useState } from 'react'
import { useToast } from '../components/ToastProvider'
import { useTheme } from '../contexts/ThemeContext'
import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'

export default function Settings() {
  const { show } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  const { settings, setSettings } = useSettings()

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      show(t('settings_save_success'), { type: 'success' })
    } catch {
      show(t('settings_save_error'), { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{t('settings_title')}</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t('settings_subtitle')}</p>
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
                onClick={() => setTheme(tItem.value as 'light' | 'dark')}
                className={`relative flex cursor-pointer rounded-lg p-4 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${theme === tItem.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{tItem.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tItem.label}</div>
                  </div>
                </div>
                {theme === tItem.value && (
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
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('regional_preferences')}</h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('language_label')}</label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('date_format_label')}</label>
              <select
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
              </select>
            </div>

            <div>
              <label htmlFor="fiscalYearStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('fiscal_year_start_label')}</label>
              <select
                id="fiscalYearStart"
                value={settings.fiscalYearStart}
                onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="april">{t('april_india')}</option>
                <option value="january">{t('january')}</option>
                <option value="july">{t('july')}</option>
                <option value="october">{t('october')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fiscal_hint')}</p>
            </div>
          </div>
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
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${settings.notifications ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('email_reports')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('email_hint')}</p>
              </div>
              <button
                onClick={() => handleSettingChange('emailReports', !settings.emailReports)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${settings.emailReports ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.emailReports ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
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
                  value={settings.budgetAlertThreshold}
                  onChange={(e) => handleSettingChange('budgetAlertThreshold', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-right">{settings.budgetAlertThreshold}%</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('budget_alert_hint')}</p>
            </div>

            <div>
              <label htmlFor="defaultTransactionView" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('default_tx_view_label')}</label>
              <select
                id="defaultTransactionView"
                value={settings.defaultTransactionView}
                onChange={(e) => handleSettingChange('defaultTransactionView', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline.none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="all">{t('view_all_transactions')}</option>
                <option value="income">{t('income_only')}</option>
                <option value="expense">{t('expenses_only')}</option>
                <option value="month">{t('current_month')}</option>
                <option value="week">{t('this_week')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">{t('data_privacy_title')}</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font.medium text-gray-900 dark:text-white">{t('auto_backup')}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('auto_backup_hint')}</p>
              </div>
              <button
                onClick={() => handleSettingChange('autoBackup', !settings.autoBackup)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${settings.autoBackup ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.autoBackup ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

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

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('saving')}
              </>
            ) : (
              t('save_settings')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
