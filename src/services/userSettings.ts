import { apiRequest } from './api-client'

export type UserSettingsResponse = {
  user_id: string
  theme: 'light' | 'dark'
  language: 'en' | 'hi' | 'mr'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  budget_alert_threshold: number
  created_at: string
  updated_at: string
}

export async function getUserSettings(): Promise<UserSettingsResponse> {
  return apiRequest<UserSettingsResponse>('/user/settings', { method: 'GET' })
}

export async function updateUserSettings(payload: Partial<Pick<UserSettingsResponse, 'theme' | 'language' | 'date_format' | 'budget_alert_threshold'>>): Promise<UserSettingsResponse> {
  return apiRequest<UserSettingsResponse>('/user/settings', { method: 'PUT', body: payload })
}
