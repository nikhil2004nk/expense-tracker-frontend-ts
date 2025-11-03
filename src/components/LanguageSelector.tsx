import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'
import { LANGUAGES } from '../config/constants'

/**
 * LanguageSelector component - Reusable language toggle buttons
 * Used in Login, Register, and Settings pages
 */
export default function LanguageSelector() {
  const { t } = useI18n()
  const { settings, setSettings } = useSettings()

  return (
    <div 
      role="group" 
      aria-label={t('language_label') || 'Language'} 
      className="flex items-center gap-0.5"
    >
      {LANGUAGES.map((lang) => {
        const active = settings.language === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => setSettings((prev) => ({ ...prev, language: lang.code }))}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              active
                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-pressed={active}
            aria-label={`Switch to ${lang.name}`}
            title={lang.name}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

