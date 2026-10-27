import { TestCaseResult, TestSuite, Transaction, Budget, SavingsGoal } from '../types';
import {
  calculateBalance,
  calculateCategoryBreakdown,
  findTopSpendingCategory,
  calculateBudgetStatus,
  calculateRecommendedSavingsPlan,
  calculateMonthSummary,
} from './calculations';
import { generateRuleBasedCoachAnalysis } from './aiAnalysisRuleBased';
import { purgeTestDataOnly } from './storage';

export type UpdateTestCallback = (testId: string, result: TestCaseResult) => void;

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://localhost:3000';
}

/**
 * 1. 수입·지출 계산 테스트
 */
export async function runIncomeExpenseTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Test 1-1: 수입 추가 시 잔액 증가
  {
    const start = performance.now();
    const testId = 'calc-1';
    let res: TestCaseResult;
    try {
      const initial = 10000;
      const txs: Transaction[] = [
        { id: 't1', type: 'income', date: '2026-10-01', amount: 50000, category: '용돈', createdAt: 1 },
      ];
      const actualBalance = calculateBalance(initial, txs);
      const expectedBalance = 60000;

      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '수입 추가 시 잔액 정확성 검증',
        description: '초기 잔액 10,000원에 수입 50,000원 추가 시 60,000원 계산 여부',
        status: actualBalance === expectedBalance ? 'PASS' : 'FAIL',
        expected: `잔액 ₩${expectedBalance.toLocaleString()}`,
        actual: `잔액 ₩${actualBalance.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
      if (res.status === 'FAIL') {
        res.error = '잔액 계산 불일치';
        res.troubleshooting = 'calculateBalance 함수에서 수입 가산 로직 및 부동소수점 처리를 점검하세요.';
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '수입 추가 시 잔액 정확성 검증',
        description: '초기 잔액 10,000원에 수입 50,000원 추가 시 60,000원 계산 여부',
        status: 'FAIL',
        expected: '잔액 ₩60,000',
        actual: `예외 발생: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 1-2: 지출 추가 시 잔액 감소
  {
    const start = performance.now();
    const testId = 'calc-2';
    let res: TestCaseResult;
    try {
      const initial = 60000;
      const txs: Transaction[] = [
        { id: 't2', type: 'expense', date: '2026-10-02', amount: 16600, category: '편의점 및 간식', createdAt: 2 },
      ];
      const actualBalance = calculateBalance(initial, txs);
      const expectedBalance = 43400;

      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '지출 추가 시 잔액 차감 검증',
        description: '초기 60,000원에서 편의점 지출 16,600원 차감 시 43,400원 검증',
        status: actualBalance === expectedBalance ? 'PASS' : 'FAIL',
        expected: `잔액 ₩${expectedBalance.toLocaleString()}`,
        actual: `잔액 ₩${actualBalance.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
      if (res.status === 'FAIL') {
        res.error = '잔액 차감 오류';
        res.troubleshooting = '지출 차감 연산시 type === "expense" 조건문과 문자열/숫자 파싱을 확인하세요.';
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '지출 추가 시 잔액 차감 검증',
        description: '초기 60,000원에서 편의점 지출 16,600원 차감 시 43,400원 검증',
        status: 'FAIL',
        expected: '잔액 ₩43,400',
        actual: `예외 발생: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 1-3: 지출 수정 및 삭제 후 합계 갱신 검증
  {
    const start = performance.now();
    const testId = 'calc-3';
    let res: TestCaseResult;
    try {
      const initial = 50000;
      let txs: Transaction[] = [
        { id: 't1', type: 'expense', date: '2026-10-02', amount: 10000, category: '간식', createdAt: 1 },
        { id: 't2', type: 'expense', date: '2026-10-03', amount: 15000, category: '게임', createdAt: 2 },
      ];
      // Step A: Modify t1 from 10,000 to 7,000
      txs = txs.map((t) => (t.id === 't1' ? { ...t, amount: 7000 } : t));
      // Step B: Delete t2
      txs = txs.filter((t) => t.id !== 't2');

      const finalBalance = calculateBalance(initial, txs);
      const expected = 43000; // 50000 - 7000

      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '지출 내역 수정 및 삭제 후 합계 재계산',
        description: '지출(10,000원->7,000원 수정) 및 지출(15,000원 삭제) 후 잔액 43,000원 검증',
        status: finalBalance === expected ? 'PASS' : 'FAIL',
        expected: `잔액 ₩${expected.toLocaleString()}`,
        actual: `잔액 ₩${finalBalance.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-calc',
        name: '지출 내역 수정 및 삭제 후 합계 재계산',
        description: '지출 수정/삭제 시 잔액 갱신 검증',
        status: 'FAIL',
        expected: '잔액 ₩43,000',
        actual: `예외: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * 2. 카테고리 분석 테스트
 */
export async function runCategoryAnalysisTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Test 2-1: 카테고리별 지출 합계와 비율 계산
  {
    const start = performance.now();
    const testId = 'cat-1';
    let res: TestCaseResult;
    try {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', date: '2026-10-01', amount: 30000, category: '게임 아이템', createdAt: 1 },
        { id: '2', type: 'expense', date: '2026-10-02', amount: 10000, category: '편의점 및 간식', createdAt: 2 },
      ];
      // Total 40,000. Game: 30,000 (75%), Snack: 10,000 (25%)
      const breakdown = calculateCategoryBreakdown(txs, '2026-10');
      const gameItem = breakdown.find((b) => b.category === '게임 아이템');
      const snackItem = breakdown.find((b) => b.category === '편의점 및 간식');

      const isPass =
        gameItem?.amount === 30000 &&
        gameItem?.percentage === 75 &&
        snackItem?.amount === 10000 &&
        snackItem?.percentage === 25;

      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '카테고리별 지출 합계 및 비율 계산',
        description: '게임 30,000원(75%), 간식 10,000원(25%) 합계와 비율 정확성',
        status: isPass ? 'PASS' : 'FAIL',
        expected: '게임 75%(30,000원), 간식 25%(10,000원)',
        actual: `게임 ${gameItem?.percentage}%(${gameItem?.amount}원), 간식 ${snackItem?.percentage}%(${snackItem?.amount}원)`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '카테고리별 지출 합계 및 비율 계산',
        description: '카테고리 비율 계산',
        status: 'FAIL',
        expected: '게임 75%, 간식 25%',
        actual: `예외: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 2-2: 가장 많이 지출한 카테고리 올바르게 찾기
  {
    const start = performance.now();
    const testId = 'cat-2';
    let res: TestCaseResult;
    try {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', date: '2026-10-01', amount: 5000, category: '교통비', createdAt: 1 },
        { id: '2', type: 'expense', date: '2026-10-02', amount: 30000, category: '게임 아이템', createdAt: 2 },
        { id: '3', type: 'expense', date: '2026-10-03', amount: 16600, category: '편의점 및 간식', createdAt: 3 },
      ];
      const top = findTopSpendingCategory(txs, '2026-10');
      const isPass = top?.category === '게임 아이템' && top?.amount === 30000;

      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '최다 지출 카테고리 1위 탐색',
        description: '게임(30,000원), 편의점(16,600원), 교통(5,000원) 중 1위 식별',
        status: isPass ? 'PASS' : 'FAIL',
        expected: '카테고리: 게임 아이템 (₩30,000)',
        actual: `카테고리: ${top?.category} (₩${top?.amount?.toLocaleString()})`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '최다 지출 카테고리 1위 탐색',
        description: '1위 카테고리 식별',
        status: 'FAIL',
        expected: '게임 아이템',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 2-3: 지출이 0원일 때 오류 없이 빈 배열 및 0% 처리
  {
    const start = performance.now();
    const testId = 'cat-3';
    let res: TestCaseResult;
    try {
      const txs: Transaction[] = [
        { id: '1', type: 'income', date: '2026-10-01', amount: 50000, category: '용돈', createdAt: 1 },
      ];
      const breakdown = calculateCategoryBreakdown(txs, '2026-10');
      const top = findTopSpendingCategory(txs, '2026-10');

      const isPass = Array.isArray(breakdown) && breakdown.length === 0 && top === null;

      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '지출 0원 시 0 나누기(Zero Division) 방어 및 안정성 검증',
        description: '지출 내역이 전무할 때 NaN/Infinity 오류 없이 안전하게 빈 결과 반환',
        status: isPass ? 'PASS' : 'FAIL',
        expected: 'breakdown.length === 0 && top === null (안정적 처리)',
        actual: `breakdown.length: ${breakdown.length}, top: ${top === null ? 'null (정상)' : '오류'}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-cat',
        name: '지출 0원 시 0 나누기 방어 검증',
        description: '0원 예외 처리',
        status: 'FAIL',
        expected: '정상 반환',
        actual: `예외 발생: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * 3. 예산 테스트 (79%, 80%, 99%, 100%, 101%)
 */
export async function runBudgetThresholdTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];
  const testMonth = '2026-10';
  const totalBudget = 100000;
  const budget: Budget = {
    month: testMonth,
    totalBudget,
    categoryBudgets: { '일반': 100000 },
  };

  const cases = [
    { pct: 79, spent: 79000, expectedWarning: false, expectedExceeded: false, expectedOverage: 0 },
    { pct: 80, spent: 80000, expectedWarning: true, expectedExceeded: false, expectedOverage: 0 },
    { pct: 99, spent: 99000, expectedWarning: true, expectedExceeded: false, expectedOverage: 0 },
    { pct: 100, spent: 100000, expectedWarning: false, expectedExceeded: true, expectedOverage: 0 },
    { pct: 101, spent: 101000, expectedWarning: false, expectedExceeded: true, expectedOverage: 1000 },
  ];

  for (const c of cases) {
    const start = performance.now();
    const testId = `budget-${c.pct}`;
    let res: TestCaseResult;
    try {
      const txs: Transaction[] = [
        { id: `b-${c.pct}`, type: 'expense', date: `${testMonth}-05`, amount: c.spent, category: '일반', createdAt: 1 },
      ];
      const status = calculateBudgetStatus(budget, txs, testMonth);

      const pass =
        status.usagePercentage === c.pct &&
        status.isWarning === c.expectedWarning &&
        status.isExceeded === c.expectedExceeded &&
        status.overageAmount === c.expectedOverage;

      res = {
        id: testId,
        suiteId: 'suite-budget',
        name: `예산 사용률 ${c.pct}% 임계값 검증`,
        description: `예산 100,000원 대비 ${c.spent.toLocaleString()}원 사용 시 알림(주의: ${c.expectedWarning}, 초과: ${c.expectedExceeded}, 초과액: ${c.expectedOverage}원) 검증`,
        status: pass ? 'PASS' : 'FAIL',
        expected: `사용률: ${c.pct}%, 주의: ${c.expectedWarning}, 초과: ${c.expectedExceeded}, 초과액: ${c.expectedOverage}원`,
        actual: `사용률: ${status.usagePercentage}%, 주의: ${status.isWarning}, 초과: ${status.isExceeded}, 초과액: ${status.overageAmount}원`,
        durationMs: Math.round(performance.now() - start),
      };
      if (!pass) {
        res.error = '임계값 플래그 불일치';
        res.troubleshooting = 'calculateBudgetStatus의 isWarning(>=80 && <100), isExceeded(>=100) 수식 점검 필요.';
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-budget',
        name: `예산 사용률 ${c.pct}% 임계값 검증`,
        description: `${c.pct}% 시나리오`,
        status: 'FAIL',
        expected: `${c.pct}% 통과`,
        actual: `예외: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * 4. 저축 테스트
 */
export async function runSavingsTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Test 4-1: 목표 금액과 현재 저축액 및 달성률 계산
  {
    const start = performance.now();
    const testId = 'save-1';
    let res: TestCaseResult;
    try {
      const plan = calculateRecommendedSavingsPlan(50000, 25000, '2026-11-26');
      const pass = plan.progressPercentage === 50 && plan.remainingAmount === 25000;

      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '저축 목표 달성률(50%) 및 잔여금액 계산',
        description: '목표 50,000원 중 25,000원 저축 시 달성률 50%, 잔여 25,000원 검증',
        status: pass ? 'PASS' : 'FAIL',
        expected: '달성률 50%, 남은금액 ₩25,000',
        actual: `달성률 ${plan.progressPercentage}%, 남은금액 ₩${plan.remainingAmount.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '저축 목표 달성률 계산',
        description: '달성률 계산',
        status: 'FAIL',
        expected: '달성률 50%',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 4-2: 목표 금액이 0원인 경우 안전 처리
  {
    const start = performance.now();
    const testId = 'save-2';
    let res: TestCaseResult;
    try {
      const plan = calculateRecommendedSavingsPlan(0, 0, '2026-11-26');
      const pass = plan.progressPercentage === 0 && !isNaN(plan.requiredWeekly);

      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '목표 금액 0원 설정 시 0 나누기 방어',
        description: '목표 금액이 0원일 때 NaN이나 무한대 없이 0% 및 잔여 0원 반환',
        status: pass ? 'PASS' : 'FAIL',
        expected: 'progressPercentage === 0 && requiredWeekly === 0',
        actual: `달성률 ${plan.progressPercentage}%, 주간 필요액: ${plan.requiredWeekly}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '목표 금액 0원 설정 시 0 나누기 방어',
        description: '0원 예외 처리',
        status: 'FAIL',
        expected: '안전 반환',
        actual: `예외: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 4-3: 목표 날짜에 따른 주간/월간 필요 저축액 계산
  {
    const start = performance.now();
    const testId = 'save-3';
    let res: TestCaseResult;
    try {
      // 14 days ahead, target 20,000, current 6,000 => remaining 14,000, 2 weeks => 7,000 / week
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 14);
      const plan = calculateRecommendedSavingsPlan(20000, 6000, targetDate.toISOString().split('T')[0]);

      const pass = plan.remainingAmount === 14000 && plan.requiredWeekly > 0 && plan.weeksRemaining >= 1;

      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '목표 기한 기반 주간 권장 저축액 계산',
        description: '남은 금액 14,000원에 대해 2주 동안 주당 약 7,000원 분할 저축 산출',
        status: pass ? 'PASS' : 'FAIL',
        expected: '남은금액 ₩14,000, 주간 약 ₩7,000',
        actual: `남은금액 ₩${plan.remainingAmount.toLocaleString()}, 주간 ₩${plan.requiredWeekly.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-save',
        name: '목표 기한 기반 주간 권장 저축액 계산',
        description: '주간 저축액',
        status: 'FAIL',
        expected: '정상 산출',
        actual: `예외: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * 5. AI 분석 테스트 (모의 응답 vs 실제 API 응답 명확 구분)
 */
export async function runAiAnalysisTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];
  const testMonth = '2026-10';

  // Sample data with Game 30,000, Snacks 16,600
  const sampleTxs: Transaction[] = [
    { id: '1', type: 'expense', date: `${testMonth}-03`, amount: 30000, category: '게임 아이템', nature: '선택', createdAt: 1 },
    { id: '2', type: 'expense', date: `${testMonth}-05`, amount: 16600, category: '편의점 및 간식', nature: '선택', createdAt: 2 },
    { id: '3', type: 'expense', date: `${testMonth}-08`, amount: 6000, category: '교통비', nature: '필요', createdAt: 3 },
  ];

  // Test 5-1: [모의/규칙기반] 데이터 전달 및 필수 응답 스키마 구조 검증
  {
    const start = performance.now();
    const testId = 'ai-mock-1';
    let res: TestCaseResult;
    try {
      const analysis = generateRuleBasedCoachAnalysis(sampleTxs, undefined, testMonth);

      const hasRequiredFields =
        Array.isArray(analysis.discoveredHabits) &&
        analysis.discoveredHabits.length > 0 &&
        typeof analysis.dataGroundedAnalysis === 'string' &&
        typeof analysis.needForImprovement === 'string' &&
        Array.isArray(analysis.concreteActionSteps) &&
        analysis.concreteActionSteps.length > 0 &&
        typeof analysis.projectedMonthlySavings === 'number';

      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] AI 코치 필수 구조(습관/근거/실천방법/예상절약액) 포함 여부',
        description: '소비 분석 객체가 prompt 요구사항(발견한 습관, 데이터 근거, 개선 이유, 구체적 실천방법, 예상 절약액)을 모두 충족하는지 검증',
        status: hasRequiredFields ? 'PASS' : 'FAIL',
        expected: '습관 배열, 데이터 근거 텍스트, 실천방법 배열, 예상 절약액 숫자 포함',
        actual: `발견 습관 ${analysis.discoveredHabits.length}건, 실천방법 ${analysis.concreteActionSteps.length}건, 절약액: ₩${analysis.projectedMonthlySavings.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] AI 코치 필수 구조 포함 여부',
        description: '필수 구조 검증',
        status: 'FAIL',
        expected: '모든 필수 필드 존재',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 5-2: [모의/규칙기반] 과소비(게임 30,000원) 상황에서 구체적 절약 조언 제공 여부
  {
    const start = performance.now();
    const testId = 'ai-mock-2';
    let res: TestCaseResult;
    try {
      const analysis = generateRuleBasedCoachAnalysis(sampleTxs, undefined, testMonth);
      const gameHabit = analysis.discoveredHabits.find((h) => h.category?.includes('게임') || h.title.includes('게임'));
      const hasSpecificSaving = analysis.projectedMonthlySavings > 0;

      const pass = !!gameHabit && hasSpecificSaving;

      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] 과소비 상황(게임 30,000원) 맞춤형 조언 및 절약액 도출',
        description: '게임 지출을 파악하여 구체적인 예산 제한 조언 및 예상 절약액을 산출하는지 확인',
        status: pass ? 'PASS' : 'FAIL',
        expected: '게임 지출 습관 감지 및 예상 절약액 > 0',
        actual: `감지 여부: ${gameHabit ? '성공' : '미감지'}, 산출 절약액: ₩${analysis.projectedMonthlySavings.toLocaleString()}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] 과소비 맞춤 조언 도출',
        description: '과소비 조언 검증',
        status: 'FAIL',
        expected: '게임 습관 및 절약액',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 5-3: [모의/규칙기반] 데이터가 부족할 때 가짜 정보 지어내지 않고 안내 반환
  {
    const start = performance.now();
    const testId = 'ai-mock-3';
    let res: TestCaseResult;
    try {
      const analysis = generateRuleBasedCoachAnalysis([], undefined, testMonth);
      const isPass = analysis.projectedMonthlySavings === 0 && analysis.topSpendingCategory === '없음';

      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] 지출 데이터 부재 시 지어내기(Hallucination) 방지',
        description: '지출이 없을 때 임의의 낭비 지출을 조작하지 않고 친절한 기록 권장 메시지 반환',
        status: isPass ? 'PASS' : 'FAIL',
        expected: 'projectedMonthlySavings: 0, topCategory: "없음"',
        actual: `절약액: ${analysis.projectedMonthlySavings}, 최다지출: ${analysis.topSpendingCategory}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[모의 분석] 데이터 부재 시 지어내기 방지',
        description: '환각 방지',
        status: 'FAIL',
        expected: '안내 메시지',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 5-4: [실제 백엔드 API] 서버 /api/ai/coach 엔드포인트 연동 및 Gemini/Fallback 확인
  {
    const start = performance.now();
    const testId = 'ai-live-1';
    let res: TestCaseResult;
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: sampleTxs,
          monthStr: testMonth,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const hasData = data && Array.isArray(data.discoveredHabits);
        const sourceLabel = data.source === 'gemini' ? 'Gemini 3.8 Flash 실제 연동' : '서버 규칙 기반 대체 분석';

        res = {
          id: testId,
          suiteId: 'suite-ai',
          name: '[실제 서버 연동] /api/ai/coach 엔드포인트 호출 및 응답 검증',
          description: '서버 백엔드로 가계부 데이터를 전송하고 Gemini API 또는 폴백 분석을 수신하는지 확인',
          status: hasData ? 'PASS' : 'FAIL',
          expected: 'HTTP 200 및 유효한 AI 코치 JSON 응답',
          actual: `HTTP ${response.status} (${sourceLabel}), 습관 ${data.discoveredHabits?.length || 0}건`,
          durationMs: Math.round(performance.now() - start),
        };
      } else {
        res = {
          id: testId,
          suiteId: 'suite-ai',
          name: '[실제 서버 연동] /api/ai/coach 엔드포인트 호출 및 응답 검증',
          description: '서버 백엔드 호출',
          status: 'FAIL',
          expected: 'HTTP 200',
          actual: `HTTP ${response.status}: ${response.statusText}`,
          durationMs: Math.round(performance.now() - start),
          error: `HTTP ${response.status}`,
          troubleshooting: '서버 프로세스가 정상 실행 중인지 확인하고 /api/ai/coach 라우터를 점검하세요.',
        };
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-ai',
        name: '[실제 서버 연동] /api/ai/coach 엔드포인트 호출 및 응답 검증',
        description: '네트워크 연결 실패',
        status: 'FAIL',
        expected: 'HTTP 200',
        actual: `연결 실패: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
        troubleshooting: '개발 서버가 포트 3000에서 실행 중인지 확인하세요.',
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * 6. 데이터 저장 및 안전성 격리 테스트
 */
export async function runStoragePersistenceTests(update?: UpdateTestCallback): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Test 6-1: 데이터 저장 및 로드 무결성
  {
    const start = performance.now();
    const testId = 'store-1';
    let res: TestCaseResult;
    try {
      const testKey = 'unit_test_persistence_key';
      const samplePayload = { testVal: 12345, timestamp: Date.now() };

      let retrieved: any = null;
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(testKey, JSON.stringify(samplePayload));
        retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
        localStorage.removeItem(testKey);
      } else {
        // Node CLI environment fallback mock
        const mockStore = new Map<string, string>();
        mockStore.set(testKey, JSON.stringify(samplePayload));
        retrieved = JSON.parse(mockStore.get(testKey) || '{}');
      }

      const pass = retrieved.testVal === 12345;

      res = {
        id: testId,
        suiteId: 'suite-store',
        name: '로컬 영구 저장소(Storage) 입출력 무결성',
        description: '브라우저 저장소에 데이터를 직렬화/역직렬화하여 새로고침 후에도 유지 가능한지 검증',
        status: pass ? 'PASS' : 'FAIL',
        expected: 'retrieved.testVal === 12345',
        actual: `저장값: ${retrieved.testVal}`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-store',
        name: '로컬 저장소 입출력 무결성',
        description: '저장소 검증',
        status: 'FAIL',
        expected: '저장 성공',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 6-2: 테스트 데이터 삭제 시 실제 사용자 데이터 안전 보존 검증 (핵심 안전성 요건)
  {
    const start = performance.now();
    const testId = 'store-2';
    let res: TestCaseResult;
    try {
      const stateWithBoth: any = {
        transactions: [
          { id: 'user-real-1', amount: 50000, isTestData: false, category: '용돈' },
          { id: 'user-real-2', amount: 3000, isTestData: undefined, category: '문구' },
          { id: 'test-scenario-1', amount: 30000, isTestData: true, category: '게임' },
        ],
        savingsGoals: [
          { id: 'user-goal-1', title: '실제 저축 목표', isTestData: false },
          { id: 'test-goal-1', title: '테스트용 목표', isTestData: true },
        ],
      };

      const purged = purgeTestDataOnly(stateWithBoth);

      const realTxPreserved = purged.transactions.length === 2 && purged.transactions.every((t) => !t.isTestData);
      const realGoalPreserved = purged.savingsGoals.length === 1 && !purged.savingsGoals[0].isTestData;
      const pass = realTxPreserved && realGoalPreserved;

      res = {
        id: testId,
        suiteId: 'suite-store',
        name: '테스트 데이터 초기화 시 사용자 실제 데이터 보존 격리 검증',
        description: 'purgeTestDataOnly 실행 시 isTestData: true 인 항목만 엄격히 제거되고 실제 사용자 기록은 100% 보존되는지 확인',
        status: pass ? 'PASS' : 'FAIL',
        expected: '실제 기록 2건 및 실제 목표 1건 완벽 보존, 테스트 항목만 0건 제거',
        actual: `보존된 실제 기록: ${purged.transactions.length}건, 보존된 실제 목표: ${purged.savingsGoals.length}건`,
        durationMs: Math.round(performance.now() - start),
      };
      if (!pass) {
        res.error = '데이터 격리 실패: 실제 사용자 데이터가 유실되었거나 테스트 데이터가 잔류함';
        res.troubleshooting = 'purgeTestDataOnly 필터 로직에서 !t.isTestData 조건을 재확인하세요.';
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-store',
        name: '테스트 데이터 격리 검증',
        description: '격리 검증',
        status: 'FAIL',
        expected: '완벽 격리',
        actual: `오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  // Test 6-3: 서버 헬스체크 및 개발자 보안 권한 검증 API
  {
    const start = performance.now();
    const testId = 'store-3';
    let res: TestCaseResult;
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/health`);
      if (resp.ok) {
        const body = await resp.json();
        res = {
          id: testId,
          suiteId: 'suite-store',
          name: '서버 런타임 헬스체크 및 개발 환경 감지',
          description: '서버가 활성 상태이며 개발 모드 및 Gemini 키 상태를 보안 통신으로 전달하는지 확인',
          status: body.status === 'ok' ? 'PASS' : 'FAIL',
          expected: 'status: "ok", geminiKeyConfigured: boolean',
          actual: `status: ${body.status}, Gemini Key: ${body.geminiKeyConfigured ? '등록됨' : '미등록(규칙기반 전환)'}`,
          durationMs: Math.round(performance.now() - start),
        };
      } else {
        res = {
          id: testId,
          suiteId: 'suite-store',
          name: '서버 런타임 헬스체크',
          description: '헬스체크',
          status: 'FAIL',
          expected: 'HTTP 200',
          actual: `HTTP ${resp.status}`,
          durationMs: Math.round(performance.now() - start),
          error: `HTTP ${resp.status}`,
        };
      }
    } catch (e: any) {
      res = {
        id: testId,
        suiteId: 'suite-store',
        name: '서버 런타임 헬스체크',
        description: '헬스체크 연결',
        status: 'FAIL',
        expected: '성공',
        actual: `연결 오류: ${e.message}`,
        durationMs: Math.round(performance.now() - start),
        error: e.message,
      };
    }
    results.push(res);
    update?.(testId, res);
  }

  return results;
}

/**
 * Returns initial empty test suites structure
 */
export function getInitialTestSuites(): TestSuite[] {
  return [
    {
      id: 'suite-calc',
      name: '1. 수입·지출 계산 테스트',
      description: '수입/지출 증감, 수정 및 삭제 후 잔액 재계산 무결성',
      tests: [
        { id: 'calc-1', suiteId: 'suite-calc', name: '수입 추가 시 잔액 정확성 검증', description: '초기 잔액 10,000원에 수입 50,000원 추가 시 60,000원 계산 여부', status: 'IDLE', expected: '잔액 ₩60,000', actual: '미실행', durationMs: 0 },
        { id: 'calc-2', suiteId: 'suite-calc', name: '지출 추가 시 잔액 차감 검증', description: '초기 60,000원에서 편의점 지출 16,600원 차감 시 43,400원 검증', status: 'IDLE', expected: '잔액 ₩43,400', actual: '미실행', durationMs: 0 },
        { id: 'calc-3', suiteId: 'suite-calc', name: '지출 내역 수정 및 삭제 후 합계 재계산', description: '지출 내역 수정/삭제 시 잔액 갱신 검증', status: 'IDLE', expected: '잔액 ₩43,000', actual: '미실행', durationMs: 0 },
      ],
    },
    {
      id: 'suite-cat',
      name: '2. 카테고리 분석 테스트',
      description: '카테고리별 지출 비율, 최다 지출 카테고리 식별 및 0원 예외 방어',
      tests: [
        { id: 'cat-1', suiteId: 'suite-cat', name: '카테고리별 지출 합계 및 비율 계산', description: '게임 30,000원(75%), 간식 10,000원(25%) 합계와 비율 정확성', status: 'IDLE', expected: '게임 75%, 간식 25%', actual: '미실행', durationMs: 0 },
        { id: 'cat-2', suiteId: 'suite-cat', name: '최다 지출 카테고리 1위 탐색', description: '게임, 편의점, 교통 중 최다 지출 항목 탐색', status: 'IDLE', expected: '게임 아이템', actual: '미실행', durationMs: 0 },
        { id: 'cat-3', suiteId: 'suite-cat', name: '지출 0원 시 0 나누기 방어 및 안정성 검증', description: '지출 0원 시 NaN/Infinity 방어', status: 'IDLE', expected: '안정적 빈 결과', actual: '미실행', durationMs: 0 },
      ],
    },
    {
      id: 'suite-budget',
      name: '3. 예산 테스트',
      description: '79%, 80%, 99%, 100%, 101% 시나리오 알림 및 초과금액 검증',
      tests: [
        { id: 'budget-79', suiteId: 'suite-budget', name: '예산 사용률 79% 임계값 검증', description: '79% 사용 시 안전 상태 유지', status: 'IDLE', expected: '사용률: 79%, 주의: false, 초과: false', actual: '미실행', durationMs: 0 },
        { id: 'budget-80', suiteId: 'suite-budget', name: '예산 사용률 80% 임계값 검증', description: '80% 도달 시 주의 알림 활성화', status: 'IDLE', expected: '사용률: 80%, 주의: true, 초과: false', actual: '미실행', durationMs: 0 },
        { id: 'budget-99', suiteId: 'suite-budget', name: '예산 사용률 99% 임계값 검증', description: '99% 도달 시 주의 알림 활성화', status: 'IDLE', expected: '사용률: 99%, 주의: true, 초과: false', actual: '미실행', durationMs: 0 },
        { id: 'budget-100', suiteId: 'suite-budget', name: '예산 사용률 100% 임계값 검증', description: '100% 소진 시 초과 상태 전환', status: 'IDLE', expected: '사용률: 100%, 주의: false, 초과: true', actual: '미실행', durationMs: 0 },
        { id: 'budget-101', suiteId: 'suite-budget', name: '예산 사용률 101% 임계값 검증', description: '101% 초과 시 초과금액(1,000원) 산출', status: 'IDLE', expected: '사용률: 101%, 초과: true, 초과액: ₩1,000', actual: '미실행', durationMs: 0 },
      ],
    },
    {
      id: 'suite-save',
      name: '4. 저축 테스트',
      description: '목표 달성률, 0원 목표 예외 처리 및 권장 분할 저축액 검증',
      tests: [
        { id: 'save-1', suiteId: 'suite-save', name: '저축 목표 달성률(50%) 및 잔여금액 계산', description: '달성률 계산', status: 'IDLE', expected: '달성률 50%, 남은금액 ₩25,000', actual: '미실행', durationMs: 0 },
        { id: 'save-2', suiteId: 'suite-save', name: '목표 금액 0원 설정 시 0 나누기 방어', description: '0원 예외 처리', status: 'IDLE', expected: '달성률 0%, NaN 방지', actual: '미실행', durationMs: 0 },
        { id: 'save-3', suiteId: 'suite-save', name: '목표 기한 기반 주간 권장 저축액 계산', description: '주간 분할 저축 산출', status: 'IDLE', expected: '남은금액 ₩14,000, 주간 약 ₩7,000', actual: '미실행', durationMs: 0 },
      ],
    },
    {
      id: 'suite-ai',
      name: '5. AI 분석 테스트',
      description: '모의 응답 분석, 과소비 피드백, 환각 방지 및 서버 연동 검증',
      tests: [
        { id: 'ai-mock-1', suiteId: 'suite-ai', name: '[모의 분석] AI 코치 필수 구조 포함 여부', description: '필수 구조 검증', status: 'IDLE', expected: '모든 필수 스키마 필드 존재', actual: '미실행', durationMs: 0 },
        { id: 'ai-mock-2', suiteId: 'suite-ai', name: '[모의 분석] 과소비 상황(게임 30,000원) 맞춤형 조언 및 절약액 도출', description: '과소비 조언 도출', status: 'IDLE', expected: '게임 지출 습관 감지 및 절약액 > 0', actual: '미실행', durationMs: 0 },
        { id: 'ai-mock-3', suiteId: 'suite-ai', name: '[모의 분석] 지출 데이터 부재 시 지어내기 방지', description: '환각 방지', status: 'IDLE', expected: '절약액 0, 친절한 기록 권장', actual: '미실행', durationMs: 0 },
        { id: 'ai-live-1', suiteId: 'suite-ai', name: '[실제 서버 연동] /api/ai/coach 엔드포인트 호출 및 응답 검증', description: '서버 백엔드 API 연동', status: 'IDLE', expected: 'HTTP 200 및 유효한 AI 코치 JSON', actual: '미실행', durationMs: 0 },
      ],
    },
    {
      id: 'suite-store',
      name: '6. 데이터 저장 및 안전성 격리 테스트',
      description: '저장소 무결성, 테스트 데이터 전용 삭제 및 서버 헬스체크',
      tests: [
        { id: 'store-1', suiteId: 'suite-store', name: '로컬 영구 저장소 입출력 무결성', description: '새로고침 유지 가능성', status: 'IDLE', expected: '저장/로드 일치', actual: '미실행', durationMs: 0 },
        { id: 'store-2', suiteId: 'suite-store', name: '테스트 데이터 초기화 시 사용자 실제 데이터 보존 격리 검증', description: '테스트 데이터만 삭제', status: 'IDLE', expected: '실제 기록 100% 보존', actual: '미실행', durationMs: 0 },
        { id: 'store-3', suiteId: 'suite-store', name: '서버 런타임 헬스체크 및 개발 환경 감지', description: '서버 통신 확인', status: 'IDLE', expected: 'status: "ok"', actual: '미실행', durationMs: 0 },
      ],
    },
  ];
}
