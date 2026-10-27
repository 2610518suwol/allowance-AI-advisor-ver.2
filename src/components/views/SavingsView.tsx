import React from 'react';
import {
  PiggyBank,
  PlusCircle,
  Calendar,
  Sparkles,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../../types';
import { calculateRecommendedSavingsPlan } from '../../utils/calculations';

interface SavingsViewProps {
  savingsGoals: SavingsGoal[];
  onOpenNewGoalModal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onOpenDepositModal: (goal: SavingsGoal) => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  savingsGoals,
  onOpenNewGoalModal,
  onEditGoal,
  onDeleteGoal,
  onOpenDepositModal,
}) => {
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const totalTarget = savingsGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🎯 저축 목표 및 드림 펀드</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            갖고 싶은 물건이나 경험을 목표로 세우고, 실제 저축한 금액만 모아서 꿈을 이뤄보세요!
          </p>
        </div>

        <button
          onClick={onOpenNewGoalModal}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-blue-200 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>새 저축 목표 만들기</span>
        </button>
      </div>

      {/* Overall Savings Progress Summary */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider block">
              누적 전체 저축 실적
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              ₩{totalSaved.toLocaleString()} / ₩{totalTarget.toLocaleString()}
            </div>
            <p className="text-xs text-blue-100 mt-1">
              확인된 실제 저금만 실적으로 반영되며, 일반 생활비 지출과 엄격히 분리 관리됩니다.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-blue-400/50 sm:pl-6">
            <span className="text-xs font-semibold text-blue-100">전체 달성률</span>
            <div className="text-3xl sm:text-4xl font-black">{overallPercentage}%</div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full h-3 bg-blue-700/60 rounded-full overflow-hidden mt-4 p-0.5">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Savings Goals Grid */}
      {savingsGoals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <PiggyBank className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">등록된 저축 목표가 없어요</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            무선 이어폰, 게임 타이틀, 친구 생일 선물 등 모으고 싶은 목표를 정해보세요!
          </p>
          <button
            onClick={onOpenNewGoalModal}
            className="mt-4 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-200 hover:bg-blue-700 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>첫 저축 목표 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const plan = calculateRecommendedSavingsPlan(
              goal.targetAmount,
              goal.currentAmount,
              goal.targetDate
            );

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Goal Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                        style={{ backgroundColor: `${goal.color || '#3B82F6'}18` }}
                      >
                        {goal.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-base text-slate-800">
                            {goal.title}
                          </h3>
                          {goal.isTestData && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                              TEST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>목표일: {goal.targetDate}</span>
                          <span>(D-{plan.daysRemaining}일)</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('이 저축 목표를 삭제하시겠습니까?')) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts & Percentage */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">현재 모은 금액</span>
                      <div className="text-xl font-black text-slate-900">
                        ₩{goal.currentAmount.toLocaleString()}원
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold">목표 금액</span>
                      <div className="text-sm font-bold text-slate-600">
                        ₩{goal.targetAmount.toLocaleString()}원
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-2 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${plan.progressPercentage}%`,
                        backgroundColor: goal.color || '#3B82F6',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <span className="font-extrabold text-blue-600">
                      {plan.progressPercentage}% 달성
                    </span>
                    <span className="text-slate-400">
                      남은 금액: ₩{plan.remainingAmount.toLocaleString()}원
                    </span>
                  </div>

                  {/* Smart Weekly/Monthly Recommendation Box */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    {plan.isCompleted ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Trophy className="w-4 h-4 text-emerald-500" />
                        <span>🎉 축하합니다! 목표 금액을 100% 달성했어요!</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between font-medium">
                          <span>📅 기한 내 달성을 위한 권장 저축액:</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>매주(주간): ₩{plan.requiredWeekly.toLocaleString()}원</span>
                          <span>매월(월간): ₩{plan.requiredMonthly.toLocaleString()}원</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Deposit Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    기록된 저금 {goal.deposits?.length || 0}회
                  </span>

                  <button
                    onClick={() => {
                      if (plan.isCompleted) {
                        triggerConfetti();
                      }
                      onOpenDepositModal(goal);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200 transition-all"
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>저금하기</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
