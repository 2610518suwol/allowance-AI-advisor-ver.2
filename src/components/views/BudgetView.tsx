import React from 'react';
import {
  Wallet,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  Calendar,
  Settings2,
  TrendingDown,
} from 'lucide-react';
import { BudgetStatus, recommendNextMonthBudget } from '../../utils/calculations';
import { Budget, Category, Transaction } from '../../types';

interface BudgetViewProps {
  budgetStatus: BudgetStatus;
  currentBudget: Budget | undefined;
  monthStr: string;
  setCurrentMonth: (month: string) => void;
  categories: Category[];
  transactions: Transaction[];
  onOpenBudgetModal: () => void;
  onApplyRecommendation: (budget: Budget) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgetStatus,
  currentBudget,
  monthStr,
  setCurrentMonth,
  categories,
  transactions,
  onOpenBudgetModal,
  onApplyRecommendation,
}) => {
  const handleQuickRecommend = () => {
    const rec = recommendNextMonthBudget(transactions, monthStr);
    onApplyRecommendation({
      month: monthStr,
      totalBudget: rec.totalBudget,
      categoryBudgets: rec.categoryBudgets,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>👛 예산 관리 및 지출 한도</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            월간 총 예산과 카테고리별 예산을 세워 초과 지출을 미연에 방지하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={monthStr}
              onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-amber-200 transition-all"
          >
            <Settings2 className="w-4 h-4" />
            <span>예산 수정하기</span>
          </button>
        </div>
      </div>

      {/* Main Total Budget Card */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          budgetStatus.isExceeded
            ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-300 shadow-sm'
            : budgetStatus.isWarning
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-sm'
            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {monthStr} 총 예산 대비 사용 현황
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                  budgetStatus.isExceeded
                    ? 'bg-rose-500 text-white'
                    : budgetStatus.isWarning
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {budgetStatus.usagePercentage}%
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              ₩{budgetStatus.totalSpent.toLocaleString()} / ₩
              {budgetStatus.totalBudget.toLocaleString()}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">
              {budgetStatus.isExceeded ? '초과 지출 금액' : '남은 지출 여력'}
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${
                budgetStatus.isExceeded ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {budgetStatus.isExceeded
                ? `+₩${budgetStatus.overageAmount.toLocaleString()}원 초과`
                : `₩${budgetStatus.remainingAmount.toLocaleString()}원 남음`}
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full h-4 bg-white/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              budgetStatus.isExceeded
                ? 'bg-rose-500'
                : budgetStatus.isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetStatus.usagePercentage)}%` }}
          />
        </div>

        {/* Status Callout Banner */}
        <div className="mt-4 flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 backdrop-blur-xs text-xs font-bold">
          {budgetStatus.isExceeded ? (
            <>
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-rose-700">
                🚨 이번 달 설정한 예산을 100% 초과했습니다! 필수 지출 외 추가 소비를 멈추고 지출 우선순위를 재검토하세요.
              </span>
            </>
          ) : budgetStatus.isWarning ? (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-amber-800">
                ⚠️ [주의 알림] 예산의 80% 이상을 소진했습니다! 남은 기간 동안 하루 지출 한도를 정해 아껴 써보세요.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-emerald-800">
                🎉 안전한 지출 속도입니다. 계획대로 잘 유지하고 있어요!
              </span>
            </>
          )}
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-3xl border border-purple-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-purple-950 block">
              지난달 데이터를 활용한 다음 달 맞춤 예산 추천
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              과거 소비 패턴을 분석해 무리하지 않으면서도 약 10~15% 절약할 수 있는 최적의 예산안을 제안합니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleQuickRecommend}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shrink-0 shadow-sm transition-all"
        >
          원클릭 예산 추천 적용
        </button>
      </div>

      {/* Category Budgets Grid */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-800">
              카테고리별 예산 소진율
            </h2>
            <p className="text-xs text-slate-500">
              각 분야별로 80% 도달 시 주의, 100% 초과 시 경고 표시가 나타납니다.
            </p>
          </div>
        </div>

        {budgetStatus.categoryStatuses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            설정된 카테고리 예산이 없습니다. '예산 수정하기' 버튼을 눌러 카테고리별 한도를 정해보세요!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetStatus.categoryStatuses.map((cat) => (
              <div
                key={cat.category}
                className={`p-4 rounded-2xl border transition-all ${
                  cat.isExceeded
                    ? 'bg-rose-50/60 border-rose-200'
                    : cat.isWarning
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50/80 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{cat.category}</span>
                    {cat.isExceeded && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 font-extrabold">
                        초과
                      </span>
                    )}
                    {cat.isWarning && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 font-extrabold">
                        주의 (80%)
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-600">
                    {cat.budget > 0 ? `${cat.usagePercentage}%` : '예산 미지정'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.isExceeded
                        ? 'bg-rose-500'
                        : cat.isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${cat.budget > 0 ? Math.min(100, cat.usagePercentage) : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>
                    ₩{cat.spent.toLocaleString()} / ₩{cat.budget.toLocaleString()}
                  </span>
                  {cat.isExceeded ? (
                    <span className="text-rose-600 font-bold">
                      +₩{cat.overage.toLocaleString()}원 초과
                    </span>
                  ) : (
                    <span>잔여: ₩{cat.remaining.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
