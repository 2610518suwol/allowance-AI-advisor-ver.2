import { Transaction, Budget, AiCoachAnalysis } from '../types';
import {
  calculateCategoryBreakdown,
  calculateMonthSummary,
  findTopMerchants,
} from './calculations';

/**
 * Generate a thorough, student-friendly, data-grounded rule-based analysis
 * when Gemini API key is absent, network fails, or in offline/test mode.
 */
export function generateRuleBasedCoachAnalysis(
  transactions: Transaction[],
  budget: Budget | undefined,
  monthStr: string
): AiCoachAnalysis {
  const summary = calculateMonthSummary(transactions, monthStr);
  const breakdown = calculateCategoryBreakdown(transactions, monthStr);
  const topMerchants = findTopMerchants(transactions, monthStr);

  const discoveredHabits: AiCoachAnalysis['discoveredHabits'] = [];
  const actionSteps: string[] = [];
  let projectedSavings = 0;

  if (summary.totalExpense === 0) {
    return {
      discoveredHabits: [
        {
          title: '아직 이번 달 지출 기록이 없어요',
          description: '용돈을 받거나 간식을 사 먹었을 때 가계부에 기록을 시작해 보세요!',
          severity: 'info',
        },
      ],
      dataGroundedAnalysis: `이번 달(${monthStr}) 총 수입은 ₩${summary.totalIncome.toLocaleString()}원이며 지출 내역은 아직 등록되지 않았습니다.`,
      needForImprovement: '지출 기록을 꾸준히 남기면 내가 어디에 돈을 쓰는지 한눈에 파악할 수 있어요.',
      concreteActionSteps: [
        '편의점이나 문구점에서 돈을 쓸 때 영수증을 챙기거나 바로 기록하기',
        '이번 주 용돈 목표와 예산을 먼저 세워보기',
      ],
      projectedMonthlySavings: 0,
      cheeringMessage: '티끌 모아 태산! 작은 지출부터 꼼꼼히 기록하는 습관이 멋진 저축왕의 시작입니다. 화이팅!',
      topSpendingCategory: '없음',
      needsRatio: 0,
      wantsRatio: 0,
      source: 'rule_based',
      generatedAt: new Date().toISOString(),
    };
  }

  // 1. Analyze Top Category
  const topCategory = breakdown[0];
  const topSpendingCategoryName = topCategory ? topCategory.category : '기타';

  // Check Game/Entertainment spending
  const gameSpending = breakdown.find((b) => b.category.includes('게임'));
  if (gameSpending && gameSpending.amount >= 20000) {
    const suggestedGameBudget = Math.round(gameSpending.amount * 0.7);
    const saveAmt = gameSpending.amount - suggestedGameBudget;
    projectedSavings += saveAmt;
    discoveredHabits.push({
      title: '게임 아이템 지출 비중이 높아요',
      description: `이번 달 게임 아이템에 ₩${gameSpending.amount.toLocaleString()}원(${gameSpending.percentage}%)을 사용했어요.`,
      severity: 'warning',
      category: gameSpending.category,
    });
    actionSteps.push(
      `다음 달 게임 예산을 ₩${suggestedGameBudget.toLocaleString()}원으로 상한선을 정해두면 매달 약 ₩${saveAmt.toLocaleString()}원을 더 아낄 수 있어요.`
    );
  }

  // Check Convenience Store / Snacks frequency
  const snackSpending = breakdown.find(
    (b) => b.category.includes('간식') || b.category.includes('편의점')
  );
  if (snackSpending && snackSpending.count >= 4) {
    const saveAmt = Math.round(snackSpending.amount * 0.25);
    projectedSavings += saveAmt;
    discoveredHabits.push({
      title: '편의점 및 간식 소액 다빈도 결제 습관',
      description: `이번 달 편의점/간식 결제가 ${snackSpending.count}회(총 ₩${snackSpending.amount.toLocaleString()}원) 발생했어요. 소액이라도 모이면 큰 금액이 됩니다.`,
      severity: 'warning',
      category: snackSpending.category,
    });
    actionSteps.push(
      `하교 후 편의점에 들르는 횟수를 주 1~2회로 줄이거나 묶음 간식을 미리 준비하면 약 ₩${saveAmt.toLocaleString()}원을 절약할 수 있어요.`
    );
  }

  // Check Wants vs Needs ratio
  if (summary.wantsRatio > 60) {
    const wantsSave = Math.round(summary.wantsTotal * 0.2);
    projectedSavings += wantsSave;
    discoveredHabits.push({
      title: '선택 지출(하고 싶은 것) 비율이 필요 지출보다 훨씬 높아요',
      description: `전체 소비 중 선택 지출이 ${summary.wantsRatio}%(₩${summary.wantsTotal.toLocaleString()}원)를 차지하고 있어요.`,
      severity: 'alert',
    });
    actionSteps.push(
      '구매 전 "이 물건이 정말 필요한가, 아니면 단순히 지금 갖고 싶은가?"를 3초간 생각하는 3초 생각법을 실천해 보세요.'
    );
  }

  // Check Budget status
  if (budget && budget.totalBudget > 0) {
    const usage = Math.round((summary.totalExpense / budget.totalBudget) * 100);
    if (usage >= 100) {
      discoveredHabits.push({
        title: '이번 달 설정한 예산을 초과했어요',
        description: `예산 ₩${budget.totalBudget.toLocaleString()}원 대비 ₩${(
          summary.totalExpense - budget.totalBudget
        ).toLocaleString()}원이 초과 지출되었습니다.`,
        severity: 'alert',
      });
      actionSteps.push('월말까지 추가 지출을 긴급 동결하고, 남은 기간은 교통비 등 필수 지출만 사용해 보세요.');
    } else if (usage >= 80) {
      discoveredHabits.push({
        title: '예산의 80% 이상을 소진했어요',
        description: `남은 예산은 ₩${Math.max(
          0,
          budget.totalBudget - summary.totalExpense
        ).toLocaleString()}원입니다. 지출 속도를 조금 늦춰주세요.`,
        severity: 'warning',
      });
    }
  }

  // Check frequent merchants
  if (topMerchants.length > 0 && topMerchants[0].count >= 3) {
    discoveredHabits.push({
      title: `가장 자주 찾은 단골 사용처: ${topMerchants[0].merchant}`,
      description: `이번 달에만 총 ${topMerchants[0].count}회 방문하여 ₩${topMerchants[0].totalAmount.toLocaleString()}원을 결제했어요.`,
      severity: 'info',
    });
  }

  if (discoveredHabits.length === 0) {
    discoveredHabits.push({
      title: '규형 잡힌 소비 패턴을 유지하고 있어요',
      description: '과도하게 쏠린 지출 없이 계획적으로 용돈을 사용하고 있습니다.',
      severity: 'info',
    });
    actionSteps.push('현재의 알뜰한 지출 루틴을 유지하면서 남은 잔액을 저축 목표에 이체해 보세요.');
    projectedSavings = Math.round(summary.totalExpense * 0.1);
  }

  // Grounded analysis text
  const dataGroundedAnalysis = `이번 달 총 지출은 ₩${summary.totalExpense.toLocaleString()}원이며, 그중 가장 큰 지출 카테고리는 [${topSpendingCategoryName}]으로 ₩${
    topCategory ? topCategory.amount.toLocaleString() : 0
  }원(${topCategory ? topCategory.percentage : 0}%)을 차지했습니다. 필요 지출(학용품·교통 등)은 ${
    summary.needsRatio
  }%, 선택 지출(게임·취미·간식 등)은 ${summary.wantsRatio}%입니다.`;

  const needForImprovement =
    summary.wantsRatio > 50
      ? '선택 지출 비중이 높아 목표 저축액을 모으는 속도가 더뎌질 수 있습니다. 무조건 참는 것이 아니라 계획된 한도 내에서 소비하는 규칙이 필요합니다.'
      : '전반적인 필수 지출 관리는 양호하나, 일상 속 작은 반복 소비(간식, 취미)를 한 번 더 점검하면 더 많은 저축 여력을 확보할 수 있습니다.';

  // Cheering message
  const cheeringMessage =
    projectedSavings > 0
      ? `조언대로 실천하시면 다음 달에는 최대 약 ₩${projectedSavings.toLocaleString()}원을 더 모아 원하는 목표를 더 일찍 달성할 수 있어요! 할 수 있습니다, 힘내세요!`
      : '스스로 소비를 돌아보고 조절하려는 태도가 정말 멋져요! 꾸준한 기록이 최고의 경제 교육입니다.';

  return {
    discoveredHabits,
    dataGroundedAnalysis,
    needForImprovement,
    concreteActionSteps: actionSteps.slice(0, 4),
    projectedMonthlySavings: projectedSavings,
    cheeringMessage,
    topSpendingCategory: topSpendingCategoryName,
    needsRatio: summary.needsRatio,
    wantsRatio: summary.wantsRatio,
    source: 'rule_based',
    generatedAt: new Date().toISOString(),
  };
}
