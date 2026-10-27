import React from 'react';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeeklyMission, SavingsGoal, Transaction, Budget } from '../../types';

interface MissionsViewProps {
  missions: WeeklyMission[];
  savingsGoals: SavingsGoal[];
  transactions: Transaction[];
  currentBudget: Budget | undefined;
  currentMonth: string;
  onNavigate: (page: any) => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  savingsGoals,
  transactions,
  currentBudget,
  currentMonth,
  onNavigate,
}) => {
  // Compute real dynamic mission progress based on verified transactions
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthSavings = savingsGoals.reduce((sum, g) => {
    const goalMonthDeposits = (g.deposits || []).filter((d) => d.date.startsWith(currentMonth));
    return sum + goalMonthDeposits.reduce((dSum, d) => dSum + (Number(d.amount) || 0), 0);
  }, 0);

  const getComputedMissionStatus = (m: WeeklyMission) => {
    if (m.type === 'save_amount') {
      const target = m.targetAmount || 3000;
      const pct = Math.min(100, Math.round((monthSavings / target) * 100));
      return {
        progressPct: pct,
        isCompleted: monthSavings >= target,
        currentValue: `₩${monthSavings.toLocaleString()}원 저축`,
        targetValue: `₩${target.toLocaleString()}원`,
      };
    } else if (m.type === 'stay_under_budget') {
      const totalSpent = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const budget = currentBudget?.totalBudget || 50000;
      const usage = budget > 0 ? (totalSpent / budget) * 100 : 0;
      const isCompleted = usage <= 80;
      return {
        progressPct: Math.min(100, Math.round(100 - usage)),
        isCompleted,
        currentValue: `예산의 ${Math.round(usage)}% 사용 중`,
        targetValue: '80% 이하 유지',
      };
    } else if (m.type === 'no_impulse') {
      const wantsCount = monthTransactions.filter(
        (t) => t.type === 'expense' && t.nature === '선택'
      ).length;
      const isCompleted = wantsCount <= 2;
      return {
        progressPct: Math.max(0, 100 - wantsCount * 30),
        isCompleted,
        currentValue: `선택 지출 ${wantsCount}회`,
        targetValue: '2회 이하 유지',
      };
    } else if (m.type === 'reduce_category') {
      const snackSpent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category.includes('간식'))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const target = m.targetAmount || 5000;
      const isCompleted = snackSpent <= target;
      return {
        progressPct: snackSpent <= target ? 100 : Math.max(0, Math.round((target / (snackSpent || 1)) * 100)),
        isCompleted,
        currentValue: `간식 ₩${snackSpent.toLocaleString()}원 사용`,
        targetValue: `₩${target.toLocaleString()}원 이하`,
      };
    }

    return {
      progressPct: m.progressPercentage,
      isCompleted: m.status === 'completed',
      currentValue: '',
      targetValue: '',
    };
  };

  const handleCelebrate = () => {
    try {
      confetti({ particleCount: 80, spread: 60 });
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <span>소비 습관 개선 주간 미션</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          작은 절약 챌린지를 완수하고 올바른 돈 관리 습관을 길러보세요!
        </p>
      </div>

      {/* Points & Verification Policy Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-100 uppercase tracking-wider block">
            미션 검증 시스템
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            실제로 확인된 저축과 지출만 실적으로 인정돼요
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            가계부에 등록된 실제 데이터가 미션 기준을 통과하면 자동으로 포인트가 지급됩니다.
          </p>
        </div>

        <div className="bg-white/20 backdrop-blur-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shrink-0">
          <Coins className="w-5 h-5 text-amber-200" />
          <span className="font-black text-sm">누적 달성 보상: +180P</span>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missions.map((m) => {
          const comp = getComputedMissionStatus(m);

          return (
            <div
              key={m.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                comp.isCompleted
                  ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                  : 'bg-white border-slate-100 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        comp.isCompleted
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {comp.isCompleted ? '✓' : '🎯'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800">{m.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                    +{m.rewardPoints}P
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">진행 현황: {comp.currentValue}</span>
                    <span className="text-slate-400">목표: {comp.targetValue}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.isCompleted ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${comp.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>마감: 이번 주 일요일</span>
                </span>

                {comp.isCompleted ? (
                  <button
                    onClick={handleCelebrate}
                    className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl hover:bg-emerald-200 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>미션 완수! 축하하기</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('transactions')}
                    className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>내역 기록하러 가기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
