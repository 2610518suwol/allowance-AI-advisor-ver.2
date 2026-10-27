import {
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  WeeklyMission,
  AppState,
} from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '편의점 및 간식', icon: '🍿', color: '#F59E0B' },
  { id: 'cat-2', name: '음식 및 외식', icon: '🍔', color: '#EF4444' },
  { id: 'cat-3', name: '게임 아이템', icon: '🎮', color: '#8B5CF6' },
  { id: 'cat-4', name: '교통비', icon: '🚌', color: '#3B82F6' },
  { id: 'cat-5', name: '문구 및 학용품', icon: '✏️', color: '#10B981' },
  { id: 'cat-6', name: '취미 및 여가', icon: '🎨', color: '#EC4899' },
  { id: 'cat-7', name: '쇼핑', icon: '🛍️', color: '#6366F1' },
  { id: 'cat-8', name: '선물', icon: '🎁', color: '#14B8A6' },
  { id: 'cat-9', name: '기타', icon: '💡', color: '#6B7280' },
];

export const DEFAULT_MISSIONS: WeeklyMission[] = [
  {
    id: 'mission-1',
    title: '일주일 동안 3,000원 저축하기',
    description: '저축 목표에 이번 주 3,000원 이상을 저금해 보세요.',
    targetAmount: 3000,
    rewardPoints: 50,
    type: 'save_amount',
    status: 'in_progress',
    progressPercentage: 0,
    deadline: getEndDateOfWeek(),
  },
  {
    id: 'mission-2',
    title: '이번 주 예산 지키기',
    description: '설정한 주간 예산의 80% 이내로 지출하여 여유 자금을 남겨보세요.',
    rewardPoints: 70,
    type: 'stay_under_budget',
    status: 'in_progress',
    progressPercentage: 0,
    deadline: getEndDateOfWeek(),
  },
  {
    id: 'mission-3',
    title: '계획에 없던 충동구매 줄이기',
    description: '선택 지출(Wants)을 2회 이하로 제한하고 꼭 필요한 것만 구매해 보세요.',
    rewardPoints: 60,
    type: 'no_impulse',
    status: 'in_progress',
    progressPercentage: 0,
    deadline: getEndDateOfWeek(),
  },
  {
    id: 'mission-4',
    title: '편의점 및 간식 지출 줄이기',
    description: '이번 주 간식 지출을 5,000원 이하로 아껴보세요.',
    categoryConstraint: '편의점 및 간식',
    targetAmount: 5000,
    rewardPoints: 50,
    type: 'reduce_category',
    status: 'in_progress',
    progressPercentage: 0,
    deadline: getEndDateOfWeek(),
  },
];

function getEndDateOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() + (7 - (day === 0 ? 7 : day));
  const sunday = new Date(now.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const STORAGE_KEY = 'ai_pocket_money_app_state_v1';

export function getInitialAppState(): AppState {
  const currentMonth = getCurrentMonthString();
  const today = new Date().toISOString().split('T')[0];

  // Realistic sample starting data for regular user
  const initialTransactions: Transaction[] = [
    {
      id: 'tx-init-1',
      type: 'income',
      date: `${currentMonth}-01`,
      amount: 50000,
      category: '용돈',
      memo: '이번 달 정기 용돈',
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'tx-init-2',
      type: 'expense',
      date: `${currentMonth}-02`,
      amount: 4500,
      category: '편의점 및 간식',
      merchant: 'GS25 편의점',
      itemName: '초코우유와 삼각김밥',
      nature: '선택',
      memo: '하교 후 간식',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'tx-init-3',
      type: 'expense',
      date: `${currentMonth}-03`,
      amount: 3000,
      category: '문구 및 학용품',
      merchant: '드림문구',
      itemName: '노트와 형광펜 세트',
      nature: '필요',
      memo: '수학 시험 대비',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'tx-init-4',
      type: 'expense',
      date: `${currentMonth}-04`,
      amount: 2800,
      category: '교통비',
      merchant: '티머니 버스',
      itemName: '시내버스 2회',
      nature: '필요',
      memo: '학원 왕복',
      createdAt: Date.now() - 86400000 * 2,
    },
  ];

  const initialBudgets: Record<string, Budget> = {
    [currentMonth]: {
      month: currentMonth,
      totalBudget: 45000,
      categoryBudgets: {
        '편의점 및 간식': 12000,
        '음식 및 외식': 8000,
        '게임 아이템': 10000,
        '교통비': 7000,
        '문구 및 학용품': 8000,
      },
    },
  };

  const initialSavingsGoals: SavingsGoal[] = [
    {
      id: 'goal-init-1',
      title: '새 학기 무선 이어폰 사기',
      targetAmount: 35000,
      currentAmount: 15000,
      targetDate: getFutureDateString(45),
      category: '전자기기',
      icon: '🎧',
      color: '#3B82F6',
      deposits: [
        {
          id: 'dep-1',
          date: `${currentMonth}-01`,
          amount: 15000,
          memo: '용돈 받자마자 먼저 저축!',
        },
      ],
      createdAt: Date.now() - 86400000 * 5,
    },
  ];

  return {
    initialBalance: 10000,
    transactions: initialTransactions,
    categories: DEFAULT_CATEGORIES,
    budgets: initialBudgets,
    savingsGoals: initialSavingsGoals,
    missions: DEFAULT_MISSIONS,
    devModeEnabled: false,
    filterTestData: true, // Hide test data in real user statistics by default
    includeTestDataInSimulation: false,
  };
}

function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialAppState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;

    // Ensure all critical fields exist
    return {
      initialBalance: typeof parsed.initialBalance === 'number' ? parsed.initialBalance : 10000,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
      budgets: parsed.budgets || {},
      savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
      missions: Array.isArray(parsed.missions) && parsed.missions.length > 0 ? parsed.missions : DEFAULT_MISSIONS,
      devModeEnabled: !!parsed.devModeEnabled,
      filterTestData: parsed.filterTestData !== false,
      includeTestDataInSimulation: !!parsed.includeTestDataInSimulation,
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getInitialAppState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Asynchronously notify server for persistence if available
    fetch('/api/ledger/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {
      // offline or server unavailable, client localStorage remains source of truth
    });
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Creates preset test data scenarios with isTestData: true
 */
export type TestScenarioType =
  | 'sample_preset'
  | 'normal_spending'
  | 'excessive_spending'
  | 'over_budget'
  | 'savings_goal_scenario';

export function generateTestScenarioData(
  scenario: TestScenarioType,
  currentMonth: string
): {
  transactions: Transaction[];
  budget?: Budget;
  savingsGoal?: SavingsGoal;
  description: string;
} {
  const now = Date.now();

  switch (scenario) {
    case 'sample_preset': {
      // Explicit example data requested in prompt:
      // 용돈 수입: 70,000원
      // 게임 아이템: 30,000원
      // 편의점: 16,600원
      // 교통비: 6,000원
      // 친구 생일 선물: 5,000원
      // 음식점: 4,500원
      // 문구점: 2,500원
      // 총지출: 64,600원
      const txs: Transaction[] = [
        {
          id: `test-sample-inc-1`,
          type: 'income',
          date: `${currentMonth}-01`,
          amount: 70000,
          category: '용돈',
          memo: '테스트용 정기 용돈 수입',
          createdAt: now,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-1`,
          type: 'expense',
          date: `${currentMonth}-03`,
          amount: 30000,
          category: '게임 아이템',
          merchant: '구글플레이 스토어',
          itemName: '배틀패스 다이아 충전',
          nature: '선택',
          memo: '신규 시즌 아이템',
          createdAt: now + 1,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-2`,
          type: 'expense',
          date: `${currentMonth}-05`,
          amount: 16600,
          category: '편의점 및 간식',
          merchant: 'CU 편의점',
          itemName: '포켓몬 빵과 음료수 다수',
          nature: '선택',
          memo: '방과 후 친구들과 간식',
          createdAt: now + 2,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-3`,
          type: 'expense',
          date: `${currentMonth}-07`,
          amount: 6000,
          category: '교통비',
          merchant: '지하철 티머니',
          itemName: '지하철 충전',
          nature: '필요',
          memo: '학원 통학 교통비',
          createdAt: now + 3,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-4`,
          type: 'expense',
          date: `${currentMonth}-10`,
          amount: 5000,
          category: '선물',
          merchant: '아트박스',
          itemName: '친구 생일 선물',
          nature: '선택',
          memo: '단짝 생일 축하',
          createdAt: now + 4,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-5`,
          type: 'expense',
          date: `${currentMonth}-12`,
          amount: 4500,
          category: '음식 및 외식',
          merchant: '김밥천국',
          itemName: '참치김밥 1줄',
          nature: '필요',
          memo: '점심 식사',
          createdAt: now + 5,
          isTestData: true,
          testTag: 'sample_preset',
        },
        {
          id: `test-sample-exp-6`,
          type: 'expense',
          date: `${currentMonth}-14`,
          amount: 2500,
          category: '문구 및 학용품',
          merchant: '알파문구',
          itemName: '샤프심 및 수정테이프',
          nature: '필요',
          memo: '시험 준비물',
          createdAt: now + 6,
          isTestData: true,
          testTag: 'sample_preset',
        },
      ];

      return {
        transactions: txs,
        description: '공식 예시 데이터: 수입 70,000원, 지출 64,600원 (게임 30,000원, 편의점 16,600원 등)',
      };
    }

    case 'normal_spending': {
      const txs: Transaction[] = [
        {
          id: `test-norm-inc-1`,
          type: 'income',
          date: `${currentMonth}-01`,
          amount: 60000,
          category: '용돈',
          memo: '정상 소비 시나리오 용돈',
          createdAt: now,
          isTestData: true,
          testTag: 'normal_spending',
        },
        {
          id: `test-norm-exp-1`,
          type: 'expense',
          date: `${currentMonth}-02`,
          amount: 8000,
          category: '문구 및 학용품',
          merchant: '모닝글로리',
          itemName: '연습장 및 펜세트',
          nature: '필요',
          memo: '필수 학용품',
          createdAt: now + 1,
          isTestData: true,
          testTag: 'normal_spending',
        },
        {
          id: `test-norm-exp-2`,
          type: 'expense',
          date: `${currentMonth}-04`,
          amount: 7000,
          category: '교통비',
          merchant: '시내버스',
          itemName: '교통카드 충전',
          nature: '필요',
          memo: '등하교',
          createdAt: now + 2,
          isTestData: true,
          testTag: 'normal_spending',
        },
        {
          id: `test-norm-exp-3`,
          type: 'expense',
          date: `${currentMonth}-06`,
          amount: 5000,
          category: '편의점 및 간식',
          merchant: '세븐일레븐',
          itemName: '주스 및 빵',
          nature: '선택',
          memo: '주말 간식',
          createdAt: now + 3,
          isTestData: true,
          testTag: 'normal_spending',
        },
      ];

      return {
        transactions: txs,
        description: '정상 소비 시나리오: 균형 잡힌 필요 지출 중심 (총수입 60,000원, 지출 20,000원)',
      };
    }

    case 'excessive_spending': {
      const txs: Transaction[] = [
        {
          id: `test-excess-inc-1`,
          type: 'income',
          date: `${currentMonth}-01`,
          amount: 80000,
          category: '용돈',
          memo: '용돈',
          createdAt: now,
          isTestData: true,
          testTag: 'excessive_spending',
        },
        {
          id: `test-excess-exp-1`,
          type: 'expense',
          date: `${currentMonth}-02`,
          amount: 45000,
          category: '게임 아이템',
          merchant: '원스토어 게임마켓',
          itemName: '한정판 뽑기 10회권',
          nature: '선택',
          memo: '충동 결제',
          createdAt: now + 1,
          isTestData: true,
          testTag: 'excessive_spending',
        },
        {
          id: `test-excess-exp-2`,
          type: 'expense',
          date: `${currentMonth}-04`,
          amount: 22000,
          category: '편의점 및 간식',
          merchant: '이마트24',
          itemName: '수입 과자 및 탄산음료 대량',
          nature: '선택',
          memo: '스트레스 해소 간식',
          createdAt: now + 2,
          isTestData: true,
          testTag: 'excessive_spending',
        },
        {
          id: `test-excess-exp-3`,
          type: 'expense',
          date: `${currentMonth}-06`,
          amount: 15000,
          category: '취미 및 여가',
          merchant: '인형뽑기방',
          itemName: '코인 충전',
          nature: '선택',
          memo: '인형뽑기',
          createdAt: now + 3,
          isTestData: true,
          testTag: 'excessive_spending',
        },
      ];

      return {
        transactions: txs,
        description: '과소비 시나리오: 게임/간식/뽑기 등 선택 지출 82,000원 집중',
      };
    }

    case 'over_budget': {
      const txs: Transaction[] = [
        {
          id: `test-budget-inc-1`,
          type: 'income',
          date: `${currentMonth}-01`,
          amount: 50000,
          category: '용돈',
          memo: '용돈',
          createdAt: now,
          isTestData: true,
          testTag: 'over_budget',
        },
        {
          id: `test-budget-exp-1`,
          type: 'expense',
          date: `${currentMonth}-02`,
          amount: 32000,
          category: '게임 아이템',
          merchant: '스팀 게임',
          itemName: '인디게임 패키지',
          nature: '선택',
          memo: '할인 행사',
          createdAt: now + 1,
          isTestData: true,
          testTag: 'over_budget',
        },
        {
          id: `test-budget-exp-2`,
          type: 'expense',
          date: `${currentMonth}-05`,
          amount: 24000,
          category: '음식 및 외식',
          merchant: '치킨플러스',
          itemName: '순살 치킨 세트',
          nature: '선택',
          memo: '친구들과 파티',
          createdAt: now + 2,
          isTestData: true,
          testTag: 'over_budget',
        },
      ];

      const testBudget: Budget = {
        month: currentMonth,
        totalBudget: 50000,
        categoryBudgets: {
          '게임 아이템': 20000,
          '음식 및 외식': 15000,
        },
      };

      return {
        transactions: txs,
        budget: testBudget,
        description: '예산 초과 시나리오: 50,000원 예산 대비 56,000원 지출 (112% 초과)',
      };
    }

    case 'savings_goal_scenario': {
      const targetDate = getFutureDateString(30);
      const testGoal: SavingsGoal = {
        id: `test-goal-${now}`,
        title: '테스트용 저축 목표: 보조배터리',
        targetAmount: 20000,
        currentAmount: 14000,
        targetDate,
        category: '전자기기',
        icon: '🔋',
        color: '#10B981',
        isTestData: true,
        deposits: [
          {
            id: `test-dep-1`,
            date: `${currentMonth}-03`,
            amount: 8000,
            memo: '1차 저축',
          },
          {
            id: `test-dep-2`,
            date: `${currentMonth}-08`,
            amount: 6000,
            memo: '2차 저축',
          },
        ],
        createdAt: now,
      };

      return {
        transactions: [],
        savingsGoal: testGoal,
        description: '저축 목표 시나리오: 목표 20,000원 중 14,000원 저축 달성(70%)',
      };
    }
  }
}

/**
 * Removes ONLY test data (isTestData === true), strictly preserving user data!
 */
export function purgeTestDataOnly(state: AppState): AppState {
  return {
    ...state,
    transactions: state.transactions.filter((t) => !t.isTestData),
    savingsGoals: state.savingsGoals.filter((g) => !g.isTestData),
  };
}
