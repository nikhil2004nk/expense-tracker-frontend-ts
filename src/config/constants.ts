/**
 * Application-wide constants and configuration
 */

/**
 * File upload limits and allowed types
 */
export const FILE_UPLOAD = {
  /** Maximum file size in MB */
  MAX_SIZE_MB: 10,
  /** Maximum file size in bytes */
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  /** Allowed MIME types for receipt uploads */
  ALLOWED_TYPES: new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  /** Human-readable file type descriptions */
  ALLOWED_EXTENSIONS: ['PNG', 'JPEG', 'JPG', 'GIF', 'WebP', 'PDF', 'DOC', 'DOCX'],
} as const

/**
 * Predefined emoji options for category creation
 */
export const CATEGORY_EMOJIS = [
  '🛒', '🍕', '🚗', '🎬', '💡', '🏥', '🛍️', '✈️', 
  '🏠', '📱', '⚽', '🎓', '💰', '🎨', '🍔', '☕', 
  '🎮', '📚', '💼', '🏋️'
] as const

/**
 * Predefined color options for category creation
 */
export const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
] as const

/**
 * Chart colors for data visualization
 */
export const CHART_COLORS = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#14B8A6', // teal
  '#F97316', // orange
  '#EC4899', // pink
  '#06B6D4', // cyan
] as const

/**
 * Date-related constants
 */
export const DATE_LIMITS = {
  /** Number of years in the past to allow for transaction dates */
  MAX_YEARS_BACK: 10,
  /** Date format options */
  FORMATS: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const,
} as const

/**
 * UI timing constants (in milliseconds)
 */
export const TIMING = {
  /** Debounce delay for search inputs */
  DEBOUNCE_DELAY: 300,
  /** Refresh animation duration */
  REFRESH_DURATION: 2000,
  /** Toast notification duration */
  TOAST_DURATION: 3000,
  /** Redirect delay after successful registration */
  REDIRECT_DELAY: 700,
} as const

/**
 * Language options
 */
export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hi', label: 'हिं', name: 'हिन्दी' },
  { code: 'mr', label: 'मरा', name: 'मराठी' },
] as const

/**
 * Form validation limits
 */
export const VALIDATION = {
  CATEGORY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  USER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
} as const

/**
 * Budget alert thresholds (percentage)
 */
export const BUDGET_THRESHOLDS = {
  WARNING: 80,
  DANGER: 100,
} as const

/**
 * API request timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 60000,  // 60 seconds for file uploads
} as const

