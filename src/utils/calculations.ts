import { Transaction, Budget, SavingsGoal, ExpenseNature } from '../types';

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  initialBalance: number;
  currentBalance: number; // initialBalance + totalIncome - totalExpense
  actualSavings: number; // Sum of confirmed savings deposits
  needsTotal: number;
  wantsTotal: number;
  needsRatio: number;
  wantsRatio: number;
  transactionCount: number;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color?: string;
  icon?: string;
}

export interface BudgetStatus {
  month: string;
  totalBudget: number;
  totalSpent: number;
  usagePercentage: number;
  remainingAmount: number;
  isWarning: boolean; // >= 80%
  isExceeded: boolean; // >= 100%
  overageAmount: number;
  categoryStatuses: {
    category: string;
    budget: number;
    spent: number;
    usagePercentage: number;
    remaining: number;
    isWarning: boolean;
    isExceeded: boolean;
    overage: number;
  }[];
}

export interface DailyTrendItem {
  date: string; // YYYY-MM-DD or DD
  day: number;
  income: number;
  expense: number;
}

export interface WeeklyTrendItem {
  week: string; // "1주차", "2주차", etc.
  weekNumber: number;
  income: number;
  expense: number;
}

export interface MonthOverMonthChange {
  currentMonthTotal: number;
  previousMonthTotal: number;
  diffAmount: number; // current - previous
  diffPercentage: number; // % change (+ or -)
  isIncrease: boolean;
}

/**
 * Filter transactions by month (format: YYYY-MM)
 */
export function filterTransactionsByMonth(
  transactions: Transaction[],
  monthStr: string
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(monthStr));
}

/**
 * Filter out test data if not in simulation mode
 */
export function filterTransactions(
  transactions: Transaction[],
  includeTestData: boolean = false
): Transaction[] {
  if (includeTestData) return transactions;
  return transactions.filter((t) => !t.isTestData);
}

/**
 * Calculate current total balance:
 * initialBalance + totalIncome - totalExpense
 * Note: Savings deposits are tracked in savings goals and do not double count in general expenses unless explicitly recorded.
 */
export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      income += Number(t.amount) || 0;
    } else if (t.type === 'expense') {
      expense += Number(t.amount) || 0;
    }
  }

  return initialBalance + income - expense;
}

/**
 * Compute monthly summary statistics
 */
export function calculateMonthSummary(
  transactions: Transaction[],
  monthStr: string,
  initialBalance: number = 0,
  savingsGoals: SavingsGoal[] = []
): MonthSummary {
  const monthTransactions = filterTransactionsByMonth(transactions, monthStr);

  let totalIncome = 0;
  let totalExpense = 0;
  let needsTotal = 0;
  let wantsTotal = 0;

  for (const t of monthTransactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'expense') {
      totalExpense += amt;
      if (t.nature === '필요') {
        needsTotal += amt;
      } else {
        wantsTotal += amt;
      }
    }
  }

  // Calculate actual confirmed savings for the month across all goals
  let actualSavings = 0;
  for (const goal of savingsGoals) {
    if (goal.deposits) {
      for (const dep of goal.deposits) {
        if (dep.date.startsWith(monthStr)) {
          actualSavings += Number(dep.amount) || 0;
        }
      }
    }
  }

  // Calculate current balance based on all historical transactions up to this month or overall
  const currentBalance = calculateBalance(initialBalance, transactions);

  const totalExpenseNonZero = totalExpense > 0 ? totalExpense : 1;
  const needsRatio = totalExpense > 0 ? Math.round((needsTotal / totalExpenseNonZero) * 100) : 0;
  const wantsRatio = totalExpense > 0 ? Math.round((wantsTotal / totalExpenseNonZero) * 100) : 0;

  return {
    month: monthStr,
    totalIncome,
    totalExpense,
    initialBalance,
    currentBalance,
    actualSavings,
    needsTotal,
    wantsTotal,
    needsRatio,
    wantsRatio,
    transactionCount: monthTransactions.length,
  };
}

/**
 * Category breakdown and percentage for the given month
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  monthStr?: string
): CategoryBreakdownItem[] {
  const targetTransactions = monthStr
    ? filterTransactionsByMonth(transactions, monthStr)
    : transactions;

  const expenses = targetTransactions.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const map = new Map<string, { amount: number; count: number }>();

  for (const t of expenses) {
    const cat = t.category || '기타';
    const existing = map.get(cat) || { amount: 0, count: 0 };
    existing.amount += Number(t.amount) || 0;
    existing.count += 1;
    map.set(cat, existing);
  }

  const items: CategoryBreakdownItem[] = [];
  for (const [category, data] of map.entries()) {
    const percentage =
      totalExpense > 0 ? Math.round((data.amount / totalExpense) * 1000) / 10 : 0;
    items.push({
      category,
      amount: data.amount,
      percentage,
      count: data.count,
    });
  }

  // Sort descending by amount
  return items.sort((a, b) => b.amount - a.amount);
}

/**
 * Top spending category
 */
export function findTopSpendingCategory(
  transactions: Transaction[],
  monthStr?: string
): { category: string; amount: number; percentage: number } | null {
  const breakdown = calculateCategoryBreakdown(transactions, monthStr);
  if (breakdown.length === 0 || breakdown[0].amount === 0) return null;
  return {
    category: breakdown[0].category,
    amount: breakdown[0].amount,
    percentage: breakdown[0].percentage,
  };
}

/**
 * Top frequented merchants
 */
export function findTopMerchants(
  transactions: Transaction[],
  monthStr?: string
): { merchant: string; count: number; totalAmount: number }[] {
  const target = monthStr
    ? filterTransactionsByMonth(transactions, monthStr)
    : transactions;

  const expenses = target.filter((t) => t.type === 'expense' && t.merchant);
  const map = new Map<string, { count: number; totalAmount: number }>();

  for (const t of expenses) {
    const m = (t.merchant || '').trim();
    if (!m) continue;
    const existing = map.get(m) || { count: 0, totalAmount: 0 };
    existing.count += 1;
    existing.totalAmount += Number(t.amount) || 0;
    map.set(m, existing);
  }

  const list = Array.from(map.entries()).map(([merchant, val]) => ({
    merchant,
    count: val.count,
    totalAmount: val.totalAmount,
  }));

  // Sort by frequency, then totalAmount
  return list.sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount);
}

/**
 * Daily and Weekly spending trends
 */
export function calculateTrends(
  transactions: Transaction[],
  monthStr: string
): { daily: DailyTrendItem[]; weekly: WeeklyTrendItem[] } {
  const monthTransactions = filterTransactionsByMonth(transactions, monthStr);

  const [yearStr, mStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(mStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();

  // Daily map
  const dailyMap = new Map<number, { income: number; expense: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { income: 0, expense: 0 });
  }

  for (const t of monthTransactions) {
    const day = parseInt(t.date.split('-')[2], 10);
    if (day && dailyMap.has(day)) {
      const entry = dailyMap.get(day)!;
      if (t.type === 'income') entry.income += Number(t.amount) || 0;
      else if (t.type === 'expense') entry.expense += Number(t.amount) || 0;
    }
  }

  const daily: DailyTrendItem[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const data = dailyMap.get(d)!;
    daily.push({
      date: `${monthStr}-${String(d).padStart(2, '0')}`,
      day: d,
      income: data.income,
      expense: data.expense,
    });
  }

  // Weekly map (1주차: 1-7, 2주차: 8-14, 3주차: 15-21, 4주차: 22-28, 5주차: 29-끝)
  const weekly: WeeklyTrendItem[] = [
    { week: '1주차', weekNumber: 1, income: 0, expense: 0 },
    { week: '2주차', weekNumber: 2, income: 0, expense: 0 },
    { week: '3주차', weekNumber: 3, income: 0, expense: 0 },
    { week: '4주차', weekNumber: 4, income: 0, expense: 0 },
    { week: '5주차', weekNumber: 5, income: 0, expense: 0 },
  ];

  for (const d of daily) {
    let weekIndex = 0;
    if (d.day <= 7) weekIndex = 0;
    else if (d.day <= 14) weekIndex = 1;
    else if (d.day <= 21) weekIndex = 2;
    else if (d.day <= 28) weekIndex = 3;
    else weekIndex = 4;

    weekly[weekIndex].income += d.income;
    weekly[weekIndex].expense += d.expense;
  }

  return { daily, weekly };
}

/**
 * Month over month spending change
 */
export function calculateMonthOverMonthChange(
  transactions: Transaction[],
  currentMonthStr: string
): MonthOverMonthChange {
  const [year, month] = currentMonthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const currentExpenses = filterTransactionsByMonth(transactions, currentMonthStr)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const prevExpenses = filterTransactionsByMonth(transactions, prevMonthStr)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const diffAmount = currentExpenses - prevExpenses;
  let diffPercentage = 0;
  if (prevExpenses > 0) {
    diffPercentage = Math.round((diffAmount / prevExpenses) * 100);
  } else if (currentExpenses > 0) {
    diffPercentage = 100;
  }

  return {
    currentMonthTotal: currentExpenses,
    previousMonthTotal: prevExpenses,
    diffAmount,
    diffPercentage,
    isIncrease: diffAmount > 0,
  };
}

/**
 * Calculate budget status (80% caution, 100% overflow)
 */
export function calculateBudgetStatus(
  budget: Budget | undefined,
  transactions: Transaction[],
  monthStr: string
): BudgetStatus {
  const monthTransactions = filterTransactionsByMonth(transactions, monthStr);
  const expenses = monthTransactions.filter((t) => t.type === 'expense');

  const totalSpent = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalBudget = budget ? Number(budget.totalBudget) || 0 : 0;

  const usagePercentage =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const isWarning = usagePercentage >= 80 && usagePercentage < 100;
  const isExceeded = usagePercentage >= 100;
  const overageAmount = isExceeded ? totalSpent - totalBudget : 0;
  const remainingAmount = Math.max(0, totalBudget - totalSpent);

  // Category statuses
  const categorySpentMap: Record<string, number> = {};
  for (const t of expenses) {
    const cat = t.category || '기타';
    categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (Number(t.amount) || 0);
  }

  const categoryBudgets = budget?.categoryBudgets || {};
  const allCategories = Array.from(
    new Set([...Object.keys(categoryBudgets), ...Object.keys(categorySpentMap)])
  );

  const categoryStatuses = allCategories.map((category) => {
    const bAmt = Number(categoryBudgets[category]) || 0;
    const sAmt = Number(categorySpentMap[category]) || 0;
    const catUsage = bAmt > 0 ? Math.round((sAmt / bAmt) * 100) : 0;
    const catWarning = catUsage >= 80 && catUsage < 100;
    const catExceeded = catUsage >= 100;
    const catOverage = catExceeded ? sAmt - bAmt : 0;
    const catRemaining = Math.max(0, bAmt - sAmt);

    return {
      category,
      budget: bAmt,
      spent: sAmt,
      usagePercentage: catUsage,
      remaining: catRemaining,
      isWarning: catWarning,
      isExceeded: catExceeded,
      overage: catOverage,
    };
  });

  return {
    month: monthStr,
    totalBudget,
    totalSpent,
    usagePercentage,
    remainingAmount,
    isWarning,
    isExceeded,
    overageAmount,
    categoryStatuses,
  };
}

/**
 * Recommend next month's budget based on past spending patterns
 */
export function recommendNextMonthBudget(
  transactions: Transaction[],
  currentMonthStr: string
): { totalBudget: number; categoryBudgets: Record<string, number>; rationale: string } {
  const breakdown = calculateCategoryBreakdown(transactions, currentMonthStr);
  const summary = calculateMonthSummary(transactions, currentMonthStr);

  const categoryBudgets: Record<string, number> = {};
  let totalRecommended = 0;

  for (const item of breakdown) {
    // Round to nearest 500 or 1,000 KRW
    // Suggest 5-10% saving buffer on high categories like game or snacks
    let factor = 1.0;
    if (item.category.includes('게임') || item.category.includes('간식') || item.category.includes('편의점')) {
      factor = 0.85; // 15% reduction recommended
    } else if (item.category.includes('교통') || item.category.includes('학용품')) {
      factor = 1.0; // Essential
    }
    const rec = Math.max(1000, Math.round((item.amount * factor) / 500) * 500);
    categoryBudgets[item.category] = rec;
    totalRecommended += rec;
  }

  if (totalRecommended === 0) {
    totalRecommended = 50000; // default for student
    categoryBudgets['편의점 및 간식'] = 20000;
    categoryBudgets['교통비'] = 10000;
    categoryBudgets['문구 및 학용품'] = 10000;
    categoryBudgets['취미 및 여가'] = 10000;
  }

  const rationale = `지난달 총 지출(₩${summary.totalExpense.toLocaleString()})과 소비 패턴을 분석하여, 불필요한 간식 및 게임 지출을 약 15% 절감하는 실현 가능한 예산안입니다.`;

  return {
    totalBudget: totalRecommended,
    categoryBudgets,
    rationale,
  };
}

/**
 * Calculate savings goal projection (weekly/monthly target)
 */
export function calculateRecommendedSavingsPlan(
  targetAmount: number,
  currentAmount: number,
  targetDateStr: string
): {
  remainingAmount: number;
  progressPercentage: number;
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  requiredWeekly: number;
  requiredMonthly: number;
  isCompleted: boolean;
} {
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const progressPercentage =
    targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const isCompleted = targetAmount > 0 && currentAmount >= targetAmount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

  const requiredWeekly = isCompleted ? 0 : Math.ceil(remainingAmount / weeksRemaining);
  const requiredMonthly = isCompleted ? 0 : Math.ceil(remainingAmount / monthsRemaining);

  return {
    remainingAmount,
    progressPercentage,
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    requiredWeekly,
    requiredMonthly,
    isCompleted,
  };
}
