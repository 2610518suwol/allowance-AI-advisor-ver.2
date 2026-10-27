import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  AlertOctagon,
  PlusCircle,
  Sparkles,
  Trophy,
  ArrowRight,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  MonthSummary,
  BudgetStatus,
  CategoryBreakdownItem,
} from '../../utils/calculations';
import { Transaction, Budget, SavingsGoal, WeeklyMission } from '../../types';

interface DashboardViewProps {
  summary: MonthSummary;
  budgetStatus: BudgetStatus;
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: Transaction[];
  savingsGoals: SavingsGoal[];
  missions: WeeklyMission[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  onOpenTransactionModal: (type?: 'income' | 'expense') => void;
  onNavigate: (page: any) => void;
  simulationModeActive: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  budgetStatus,
  categoryBreakdown,
  recentTransactions,
  savingsGoals,
  missions,
  currentMonth,
  setCurrentMonth,
  onOpenTransactionModal,
  onNavigate,
  simulationModeActive,
}) => {
  const topCategory = categoryBreakdown[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Month Selector & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-800">
              👋 반가워요! 이번 달 용돈 현황
            </span>
            {simulationModeActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                테스트 데이터 반영 중
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            계획적으로 쓰고 똑똑하게 모으는 우리들의 용돈 습관
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => onOpenTransactionModal('expense')}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-amber-200 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>기록하기</span>
          </button>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold">현재 잔액</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ₩{summary.currentBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            초기 잔액 + 수입 - 지출
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold">이번 달 쓴 돈</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ₩{summary.totalExpense.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            총 {summary.transactionCount}건의 소비
          </span>
        </div>

        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold">이번 달 받은 돈</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ₩{summary.totalIncome.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            용돈 및 기타 수입 합계
          </span>
        </div>

        {/* Actual Confirmed Savings */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold">실제 저축액</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ₩{summary.actualSavings.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            확인된 저축 목표 적립액
          </span>
        </div>
      </div>

      {/* Budget Status Alert Bar */}
      <div
        onClick={() => onNavigate('budget')}
        className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer group ${
          budgetStatus.isExceeded
            ? 'bg-rose-50/90 border-rose-300'
            : budgetStatus.isWarning
            ? 'bg-amber-50/90 border-amber-300'
            : 'bg-white border-slate-100 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {budgetStatus.isExceeded ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 animate-bounce" />
            ) : budgetStatus.isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : (
              <Wallet className="w-5 h-5 text-emerald-600" />
            )}
            <span className="font-bold text-sm sm:text-base text-slate-800">
              이번 달 예산 사용 현황
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                budgetStatus.isExceeded
                  ? 'bg-rose-200 text-rose-800'
                  : budgetStatus.isWarning
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {budgetStatus.usagePercentage}% 사용
            </span>
          </div>

          <div className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1 group-hover:text-amber-600">
            <span>
              ₩{budgetStatus.totalSpent.toLocaleString()} / ₩
              {budgetStatus.totalBudget.toLocaleString()}
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetStatus.isExceeded
                ? 'bg-rose-500'
                : budgetStatus.isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetStatus.usagePercentage)}%` }}
          />
        </div>

        {/* Alert Message */}
        <div className="mt-2 text-xs font-medium">
          {budgetStatus.isExceeded ? (
            <span className="text-rose-600 font-bold">
              🚨 예산을 초과했어요! 초과 금액: ₩
              {budgetStatus.overageAmount.toLocaleString()}원. 남은 기간 동안 지출을 긴급 점검하세요!
            </span>
          ) : budgetStatus.isWarning ? (
            <span className="text-amber-700 font-bold">
              ⚠️ 예산의 80% 이상을 사용했어요! 남은 예산 ₩
              {budgetStatus.remainingAmount.toLocaleString()}원으로 월말까지 조절해 보세요.
            </span>
          ) : (
            <span className="text-emerald-700">
              🌱 안전하게 계획대로 지출하고 있어요! 남은 예산: ₩
              {budgetStatus.remainingAmount.toLocaleString()}원
            </span>
          )}
        </div>
      </div>

      {/* Middle Grid: AI Coach Quick Card & Active Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Pocket Money Coach Preview */}
        <div
          onClick={() => onNavigate('coach')}
          className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-amber-500/5 to-white border border-purple-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-800">
                AI 용돈 코치의 맞춤 진단
              </span>
            </div>
            <span className="text-xs font-bold text-purple-700 group-hover:underline flex items-center gap-1">
              자세히 보기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {topCategory
              ? `이번 달 가장 많은 지출은 [${topCategory.category}] (₩${topCategory.amount.toLocaleString()}원, ${topCategory.percentage}%)에 집중되어 있어요. 다음 달 예산을 조금만 낮추면 저축액을 크게 늘릴 수 있습니다!`
              : '가계부에 수입과 지출을 등록하면 AI 코치가 나의 소비 습관을 분석하여 맞춤 절약법을 조언해 줘요.'}
          </p>

          <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between text-[11px] font-semibold text-purple-800">
            <span>🤖 Gemini 3.8 AI & 맞춤 규칙 엔진 가동 중</span>
            <span className="bg-purple-100 px-2 py-0.5 rounded-lg">AI 상담 챗봇 열기</span>
          </div>
        </div>

        {/* Weekly Saving Missions Preview */}
        <div
          onClick={() => onNavigate('missions')}
          className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-800">
                이번 주 절약 미션
              </span>
            </div>
            <span className="text-xs font-bold text-amber-700 group-hover:underline flex items-center gap-1">
              미션 목록 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-2">
            {missions.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 bg-white/80 rounded-2xl border border-amber-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">🎯</span>
                  <span className="font-bold text-slate-800">{m.title}</span>
                </div>
                <span className="text-amber-600 font-extrabold">+{m.rewardPoints}P</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100 text-[11px] font-semibold text-amber-800 flex items-center justify-between">
            <span>실제 기록된 저축만 미션 실적으로 인정돼요!</span>
            <span>도전하기</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Category Breakdown Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="font-extrabold text-base text-slate-800">
              최근 기록한 내역
            </span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              전체 보기 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              등록된 내역이 없습니다. '기록하기' 버튼을 눌러 첫 지출이나 용돈을 입력해 보세요!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        t.type === 'income'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {t.type === 'income' ? '수입' : '지출'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {t.category}
                        </span>
                        {t.nature && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              t.nature === '필요'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {t.nature === '필요' ? '필요' : '선택'}
                          </span>
                        )}
                        {t.isTestData && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                            TEST
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {t.date} {t.merchant ? `· ${t.merchant}` : ''} {t.itemName ? `(${t.itemName})` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}₩
                    {t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Spending Categories List (1 column on lg) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-extrabold text-base text-slate-800">
                카테고리별 지출 순위
              </span>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                분석 차트
              </button>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                지출 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.slice(0, 4).map((c, idx) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="text-[11px] w-4 text-slate-400">
                          #{idx + 1}
                        </span>
                        <span>{c.category}</span>
                      </span>
                      <span className="font-extrabold text-slate-900">
                        ₩{c.amount.toLocaleString()} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Savings Goal Highlight */}
          {savingsGoals.length > 0 && (
            <div
              onClick={() => onNavigate('savings')}
              className="mt-4 p-3 bg-blue-50/70 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span>🎯 {savingsGoals[0].title}</span>
                <span>
                  {Math.round((savingsGoals[0].currentAmount / (savingsGoals[0].targetAmount || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((savingsGoals[0].currentAmount / (savingsGoals[0].targetAmount || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
