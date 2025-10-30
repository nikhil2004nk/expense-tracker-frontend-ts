/**
 * Dashboard service - processes transaction data for dashboard analytics
 */
import { fetchTransactions, type Transaction } from './transactions'
import type { BudgetCategory } from './budgets'
import { budgetService, type Budget } from './budgets'

export type DashboardSummary = {
  totalIncome: number // Total budget allocated (sum of all budget amounts)
  totalExpense: number // Total spent from budgets (sum of all spent amounts)
  balance: number // Remaining budget (totalIncome - totalExpense)
  transactionCount: number
  categoryCount: number
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
  categoryDataCompare?: CategoryData[]
  selectedMonthKey: string
  compareMonthKey?: string
  selectedTotalExpense: number
  selectedTotalBudget: number
  compareTotalExpense?: number
  compareTotalBudget?: number
  recentTransactions: Transaction[]
  recentTransactionsMonth: Transaction[]
  budgets: Budget[]
  pendingSetup: PendingSetupItem[]
}

export type MonthlyData = {
  month: string
  income: number
  expense: number
  budget: number
}

export type CategoryData = {
  name: string
  value: number
  percentage: number
}

export type PendingSetupItem = {
  categoryId: string
  category: BudgetCategory | Transaction['category'] | null
  spent: number
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
export async function fetchDashboardData(options: { signal?: AbortSignal; month?: string; compareMonth?: string } = {}): Promise<DashboardSummary> {
  // Always fetch all transactions for monthly trend
  const [allTransactions, budgets, compareBudgets] = await Promise.all([
    fetchTransactions({ signal: options.signal }),
    budgetService.getAll(options.month).catch(() => [] as Budget[]), // Don't fail if budgets fail
    options.compareMonth ? budgetService.getAll(options.compareMonth).catch(() => [] as Budget[]) : Promise.resolve([] as Budget[]),
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

  // Selected month: total budget
  const selectedTotalBudget = budgets.reduce((sum, b) => sum + (b.budget || 0), 0)
  const compareTotalBudget = (compareBudgets?.length ?? 0) > 0 ? compareBudgets.reduce((s, b) => s + (b.budget || 0), 0) : undefined

  // Group by month - only show months that have transactions
  const monthMap = new Map<string, { income: number; expense: number; date: Date }>()
  
  allTransactions.forEach(t => {
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
  const monthlyWithKeys = Array.from(monthMap.entries())
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0, // Always 0 since we don't track income
        expense: data.expense,
        sortKey: monthKey,
      }
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey)) // Most recent first
    .slice(0, 6) // Take last 6 months with transactions
    .reverse() // Reverse to show oldest to newest for chart

  // Fetch budgets for those months to compute monthly total budget
  const monthKeysForBudgets = monthlyWithKeys.map(m => m.sortKey)
  const monthlyBudgetsArrays = await Promise.all(
    monthKeysForBudgets.map(mk => budgetService.getAll(mk).catch(() => [] as Budget[]))
  )
  const budgetTotalsByKey = new Map<string, number>()
  monthKeysForBudgets.forEach((mk, idx) => {
    const total = monthlyBudgetsArrays[idx].reduce((sum, b) => sum + (b.budget || 0), 0)
    budgetTotalsByKey.set(mk, total)
  })

  const monthlyData: MonthlyData[] = monthlyWithKeys.map(({ label, income, expense, sortKey }) => ({
    month: label,
    income,
    expense,
    budget: budgetTotalsByKey.get(sortKey) || 0,
  }))

  // Month keys
  const now = new Date()
  const targetMonthKey = (options.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const compareMonthKey = options.compareMonth

  // Selected month transactions
  const monthFilteredTransactions = allTransactions.filter(t => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return key === targetMonthKey
  })
  const categoryMap = new Map<string, number>()
  monthFilteredTransactions.forEach(t => {
    if (!isIncome(t)) {
      const amount = Math.abs(t.amount)
      const categoryName = t.category?.name || 'Uncategorized'
      const currentAmount = categoryMap.get(categoryName) || 0
      categoryMap.set(categoryName, currentAmount + amount)
    }
  })

  // Pending setup: categories with transactions this month but no budget created for this month
  const budgetCategoryIds = new Set<string>(budgets.map(b => b.categoryId))
  const spentByCatId = new Map<string, number>()
  monthFilteredTransactions.forEach(t => {
    const cid = t.categoryId
    if (!cid) return
    const prev = spentByCatId.get(cid) || 0
    spentByCatId.set(cid, prev + Math.abs(t.amount))
  })
  const pendingSetup: PendingSetupItem[] = Array.from(spentByCatId.entries())
    .filter(([cid]) => !!cid && !budgetCategoryIds.has(cid))
    .map(([cid, spent]) => {
      const sampleTxn = monthFilteredTransactions.find(tx => tx.categoryId === cid)
      return {
        categoryId: cid,
        category: sampleTxn?.category || null,
        spent,
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

  // Compare month (optional)
  let categoryDataCompare: CategoryData[] | undefined
  let compareTotalExpense: number | undefined
  if (compareMonthKey) {
    const compareTxns = allTransactions.filter(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return key === compareMonthKey
    })
    const compareMap = new Map<string, number>()
    compareTxns.forEach(t => {
      if (!isIncome(t)) {
        const amount = Math.abs(t.amount)
        const categoryName = t.category?.name || 'Uncategorized'
        const currentAmount = compareMap.get(categoryName) || 0
        compareMap.set(categoryName, currentAmount + amount)
      }
    })
    const compareTotal = Array.from(compareMap.values()).reduce((s, v) => s + v, 0)
    compareTotalExpense = compareTotal
    categoryDataCompare = Array.from(compareMap.entries())
      .map(([name, value]) => ({
        name: name || 'Uncategorized',
        value,
        percentage: compareTotal > 0 ? (value / compareTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }

  // Get recent transactions (last 5 overall) and month-filtered (last 5 of selected month)
  const recentTransactions = allTransactions.slice(0, 5)
  const recentTransactionsMonth = monthFilteredTransactions.slice(0, 5)

  // Get unique categories
  const categoryCount = new Set(allTransactions.map(t => t.category?.name || 'Uncategorized')).size

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount: monthFilteredTransactions.length,
    categoryCount,
    monthlyData,
    categoryData,
    categoryDataCompare,
    selectedMonthKey: targetMonthKey,
    compareMonthKey,
    selectedTotalExpense: totalExpenseForPercentage,
    selectedTotalBudget,
    compareTotalExpense,
    compareTotalBudget,
    recentTransactions,
    recentTransactionsMonth,
    budgets,
    pendingSetup,
  }
}

