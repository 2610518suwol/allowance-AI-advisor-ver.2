export type TransactionType = 'income' | 'expense';

export type IncomeCategory = '용돈' | '심부름/알바' | '상금/장학금' | '중고판매' | '기타수입';

export type ExpenseNature = '필요' | '선택'; // 필요 지출(Needs) vs 선택 지출(Wants)

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string; // Category name
  merchant?: string; // 사용처 (지출 항목)
  itemName?: string; // 구매한 물건/서비스 (지출 항목)
  nature?: ExpenseNature; // 필요 지출 또는 선택 지출
  memo?: string;
  createdAt: number;
  isTestData?: boolean; // 테스트 데이터 식별값
  testTag?: string; // 테스트 시나리오 태그
}

export interface Budget {
  month: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: Record<string, number>; // categoryName -> budget
}

export interface SavingsDeposit {
  id: string;
  date: string;
  amount: number;
  memo?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  icon: string;
  color: string;
  deposits: SavingsDeposit[];
  createdAt: number;
  isTestData?: boolean;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  categoryConstraint?: string;
  targetAmount?: number;
  rewardPoints: number;
  type: 'save_amount' | 'stay_under_budget' | 'reduce_category' | 'no_impulse';
  status: 'in_progress' | 'completed' | 'failed';
  progressPercentage: number;
  deadline: string; // YYYY-MM-DD
}

export interface AiCoachAnalysis {
  discoveredHabits: {
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'alert';
    category?: string;
  }[];
  dataGroundedAnalysis: string;
  needForImprovement: string;
  concreteActionSteps: string[];
  projectedMonthlySavings: number;
  cheeringMessage: string;
  topSpendingCategory: string;
  needsRatio: number; // 0-100
  wantsRatio: number; // 0-100
  source: 'gemini' | 'rule_based';
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedAction?: {
    label: string;
    actionType: 'navigate_budget' | 'navigate_savings' | 'navigate_missions';
  };
}

export type TestStatus = 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL' | 'SKIP';

export interface TestCaseResult {
  id: string;
  suiteId: string;
  name: string;
  description: string;
  status: TestStatus;
  expected: string;
  actual: string;
  durationMs: number;
  error?: string;
  troubleshooting?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCaseResult[];
}

export interface AppState {
  initialBalance: number;
  transactions: Transaction[];
  categories: Category[];
  budgets: Record<string, Budget>; // YYYY-MM -> Budget
  savingsGoals: SavingsGoal[];
  missions: WeeklyMission[];
  devModeEnabled: boolean;
  filterTestData: boolean; // true = exclude test data in real user statistics
  includeTestDataInSimulation: boolean; // true = preview dashboard with test data
}
