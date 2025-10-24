/**
 * Transaction service - integrates with backend API
 */
import { apiRequest, apiUpload } from './api-client'

/**
 * Category info embedded in transaction response
 */
export type TransactionCategory = {
  id: string
  name: string
  name_en?: string
  name_hi?: string
  name_mr?: string
  icon?: string
  color?: string
}

/**
 * Transaction type matching backend API response
 */
export type Transaction = {
  id: string
  amount: number
  categoryId?: string
  category?: TransactionCategory | null
  date: string
  notes?: string
  receiptUrl?: string
}

/**
 * Create transaction payload
 */
export type CreateTransactionDto = {
  amount: number
  categoryId?: string
  date: string
  notes?: string
  receiptUrl?: string
}

/**
 * Update transaction payload
 */
export type UpdateTransactionDto = {
  amount?: number
  categoryId?: string
  date?: string
  notes?: string
  receiptUrl?: string
}

/**
 * Fetch all transactions for the authenticated user
 */
export async function fetchTransactions(options: { signal?: AbortSignal; month?: string } = {}): Promise<Transaction[]> {
  const qs = options.month ? `?month=${encodeURIComponent(options.month)}` : ''
  return apiRequest<Transaction[]>(`/transactions${qs}`, {
    method: 'GET',
    signal: options.signal,
  })
}

/**
 * Fetch a single transaction by ID
 */
export async function fetchTransaction(id: string, options: { signal?: AbortSignal } = {}): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'GET',
    signal: options.signal,
  })
}

/**
 * Create a new transaction
 */
export async function createTransaction(data: CreateTransactionDto): Promise<Transaction> {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: data,
  })
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id: string, updates: UpdateTransactionDto): Promise<Transaction> {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: updates,
  })
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/transactions/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Upload a receipt file and get back the URL
 */
export async function uploadReceipt(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('receipt', file)

  const response = await apiUpload<{ receiptUrl: string }>('/transactions/upload-receipt', formData)
  return response.receiptUrl
}

/**
 * Seed demo transactions (for development/demo purposes)
 * Note: In production, this would be handled by the backend
 */
export function seedDemoIfEmpty() {
  // This is now a no-op since data is managed by the backend
  // Keep the function for backward compatibility with existing code
}
