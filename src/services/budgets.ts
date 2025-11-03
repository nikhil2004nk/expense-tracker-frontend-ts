import { apiRequest } from './api-client'

/**
 * Category info embedded in budget response
 */
export interface BudgetCategory {
  id: string
  name: string
  name_en?: string
  name_hi?: string
  name_mr?: string
  icon?: string
  color?: string
  [key: string]: unknown
}

export interface Budget {
  id: string
  categoryId: string
  category: BudgetCategory | null
  budget: number
  spent: number
  createdAt: string
  updatedAt: string
}

export interface CreateBudgetDto {
  categoryId: string
  amount: number
}

export interface UpdateBudgetDto {
  categoryId?: string
  amount?: number
}

export const budgetService = {
  /**
   * Get all budgets for the authenticated user
   */
  async getAll(month?: string): Promise<Budget[]> {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return await apiRequest<Budget[]>(`/budgets${qs}`, { method: 'GET' });
  },

  /**
   * Get a specific budget by ID
   */
  async getById(id: string): Promise<Budget> {
    return await apiRequest<Budget>(`/budgets/${id}`, { method: 'GET' });
  },

  /**
   * Create a new budget
   */
  async create(data: CreateBudgetDto, month?: string): Promise<Budget> {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return await apiRequest<Budget>(`/budgets${qs}`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing budget
   */
  async update(id: string, data: UpdateBudgetDto, month?: string): Promise<Budget> {
    const qs = month ? `?month=${encodeURIComponent(month)}` : ''
    return await apiRequest<Budget>(`/budgets/${id}${qs}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete a budget
   */
  async delete(id: string): Promise<{ id: string }> {
    return await apiRequest<{ id: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },
};

