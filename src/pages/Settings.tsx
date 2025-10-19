import { useState } from 'react'
import { useToast } from '../components/ToastProvider'
import { useTheme } from '../contexts/ThemeContext'
import { useSettings } from '../contexts/SettingsContext'

export default function Settings() {
  const { show } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { theme, setTheme } = useTheme()

  const { settings, setSettings } = useSettings()

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      show('Settings saved successfully!', { type: 'success' })
    } catch {
      show('Failed to save settings. Please try again.', { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your application preferences</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Theme Preference</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">Choose your preferred theme - changes apply immediately</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ value: 'light', label: 'Light', icon: '☀️' }, { value: 'dark', label: 'Dark', icon: '🌙' }].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value as 'light' | 'dark')}
                className={`relative flex cursor-pointer rounded-lg p-4 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${theme === t.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</div>
                  </div>
                </div>
                {theme === t.value && (
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
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Regional Preferences</h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
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
              <label htmlFor="fiscalYearStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fiscal Year Start</label>
              <select
                id="fiscalYearStart"
                value={settings.fiscalYearStart}
                onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="april">April (India)</option>
                <option value="january">January</option>
                <option value="july">July</option>
                <option value="october">October</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used for annual reports and budget planning</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Receive notifications for budget alerts and updates</p>
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
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Reports</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Receive weekly expense summaries via email</p>
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
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Budget & Alerts</h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="budgetAlertThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget Alert Threshold</label>
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
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Get notified when you reach this percentage of your budget</p>
            </div>

            <div>
              <label htmlFor="defaultTransactionView" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Transaction View</label>
              <select
                id="defaultTransactionView"
                value={settings.defaultTransactionView}
                onChange={(e) => handleSettingChange('defaultTransactionView', e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
                <option value="month">Current Month</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Data & Privacy</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto Backup</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Automatically backup your data to secure cloud storage</p>
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
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Clear Cache</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Clear application cache and temporary data</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear the cache?')) {
                    show('Cache cleared successfully!', { type: 'success' })
                  }
                }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 self-start sm:self-auto flex-shrink-0"
              >
                Clear Cache
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
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
