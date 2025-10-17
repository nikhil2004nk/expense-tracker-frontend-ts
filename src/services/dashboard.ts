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
 * Positive amounts are income, negative amounts are expense
 */
function isIncome(transaction: Transaction): boolean {
  return transaction.amount > 0
}

/**
 * Get month name from date string
 */
function getMonthName(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return 'Unknown'
  }
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

  // Group by month
  const monthMap = new Map<string, { income: number; expense: number }>()
  transactions.forEach(t => {
    const month = getMonthName(t.date)
    if (!monthMap.has(month)) {
      monthMap.set(month, { income: 0, expense: 0 })
    }
    const monthData = monthMap.get(month)!
    if (isIncome(t)) {
      monthData.income += t.amount
    } else {
      monthData.expense += Math.abs(t.amount)
    }
  })

  // Convert to array and sort by date (most recent first, but show last 6 months)
  const monthlyData: MonthlyData[] = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }))
    .slice(0, 6)
    .reverse() // Show oldest to newest for chart

  // Group expenses by category
  const categoryMap = new Map<string, number>()
  transactions.forEach(t => {
    if (!isIncome(t)) {
      const amount = Math.abs(t.amount)
      const currentAmount = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, currentAmount + amount)
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
  const categoryCount = new Set(transactions.map(t => t.category)).size

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

