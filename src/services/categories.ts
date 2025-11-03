/**
 * Categories service - integrates with backend API
 */
import { apiRequest } from './api-client'

/**
 * Category type matching backend API response
 */
export type Category = {
  id: string
  name: string
  name_en?: string
  name_hi?: string
  name_mr?: string
  icon?: string
  color?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

/**
 * Create category payload
 */
export type CreateCategoryDto = {
  name: string
  name_en?: string
  name_hi?: string
  name_mr?: string
  icon?: string
  color?: string
}

/**
 * Update category payload
 */
export type UpdateCategoryDto = {
  name?: string
  name_en?: string
  name_hi?: string
  name_mr?: string
  icon?: string
  color?: string
}

/**
 * Fetch all categories for the authenticated user
 */
export async function fetchCategories(options: { signal?: AbortSignal } = {}): Promise<Category[]> {
  return apiRequest<Category[]>('/categories', {
    method: 'GET',
    signal: options.signal,
  })
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategory(id: string, options: { signal?: AbortSignal } = {}): Promise<Category> {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'GET',
    signal: options.signal,
  })
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: data,
  })
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, updates: UpdateCategoryDto): Promise<Category> {
  return apiRequest<Category>(`/categories/${id}`, {
    method: 'PATCH',
    body: updates,
  })
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/categories/${id}`, {
    method: 'DELETE',
  })
}

