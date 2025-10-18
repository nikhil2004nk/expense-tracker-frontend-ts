/**
 * Dashboard service - processes transaction data for dashboard analytics
 */
import { fetchTransactions, type Transaction } from './transactions'
import { budgetService, type Budget } from './budgets'

export type DashboardSummary = {
  totalIncome: number // Total budget allocated (sum of all budget amounts)
  totalExpense: number // Total spent from budgets (sum of all spent amounts)
  balance: number // Remaining budget (totalIncome - totalExpense)
  transactionCount: number
  categoryCount: number
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
  recentTransactions: Transaction[]
  budgets: Budget[]
}

export type MonthlyData = {
  month: string
  income: number
  expense: number
}

export type CategoryData = {
  name: string
  value: number
  percentage: number
}

/**
 * Determine if a transaction is income or expense based on amount
 * In this expense tracker, all transactions are expenses (positive amounts)
 * This function can be extended later to support income tracking
 */
function isIncome(_transaction: Transaction): boolean {
  // For now, all transactions are expenses
  // In the future, we could add a 'type' field to distinguish income vs expense
  return false
}


/**
 * Fetch and process dashboard data
 */
export async function fetchDashboardData(options: { signal?: AbortSignal } = {}): Promise<DashboardSummary> {
  // Fetch transactions and budgets in parallel
  const [transactions, budgets] = await Promise.all([
    fetchTransactions(options),
    budgetService.getAll().catch(() => [] as Budget[]), // Don't fail if budgets fail
  ])

  // Calculate totals from budgets
  // Total Income = sum of all budget amounts
  // Total Expense = sum of all spent amounts
  // Balance = budget remaining (income - expense)
  let totalIncome = 0
  let totalExpense = 0

  budgets.forEach(b => {
    totalIncome += b.budget
    totalExpense += b.spent
  })

  const balance = totalIncome - totalExpense

  // Group by month - only show months that have transactions
  const monthMap = new Map<string, { income: number; expense: number; date: Date }>()
  
  transactions.forEach(t => {
    const transactionDate = new Date(t.date)
    const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { income: 0, expense: 0, date: transactionDate })
    }
    const monthData = monthMap.get(monthKey)!
    
    // Since all transactions are expenses in this app, income is always 0
    monthData.expense += Math.abs(t.amount)
  })

  // Convert to array, sort by date (most recent first), take last 6 months
  const monthlyData: MonthlyData[] = Array.from(monthMap.entries())
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0, // Always 0 since we don't track income
        expense: data.expense,
        sortKey: monthKey,
      }
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey)) // Most recent first
    .slice(0, 6) // Take last 6 months with transactions
    .reverse() // Reverse to show oldest to newest for chart
    .map(({ month, income, expense }) => ({ month, income, expense })) // Remove sortKey

  // Group expenses by category
  const categoryMap = new Map<string, number>()
  transactions.forEach(t => {
    if (!isIncome(t)) {
      const amount = Math.abs(t.amount)
      const categoryName = t.category?.name || 'Uncategorized'
      const currentAmount = categoryMap.get(categoryName) || 0
      categoryMap.set(categoryName, currentAmount + amount)
    }
  })

  // Convert to array and calculate percentages
  const totalExpenseForPercentage = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)
  const categoryData: CategoryData[] = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name: name || 'Uncategorized',
      value,
      percentage: totalExpenseForPercentage > 0 ? (value / totalExpenseForPercentage) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value) // Sort by value descending

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5)

  // Get unique categories
  const categoryCount = new Set(transactions.map(t => t.category?.name || 'Uncategorized')).size

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount: transactions.length,
    categoryCount,
    monthlyData,
    categoryData,
    recentTransactions,
    budgets,
  }
}

