import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { recommendNextMonthBudget } from '../utils/calculations';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: Budget | undefined;
  monthStr: string;
  categories: Category[];
  transactions: Transaction[];
  onSave: (budget: Budget) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  monthStr,
  categories,
  transactions,
  onSave,
}) => {
  const [totalBudget, setTotalBudget] = useState<string>('50000');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [recommendationInfo, setRecommendationInfo] = useState<string | null>(null);

  useEffect(() => {
    if (currentBudget) {
      setTotalBudget(String(currentBudget.totalBudget || 50000));
      const strMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(currentBudget.categoryBudgets || {})) {
        strMap[k] = String(v);
      }
      setCategoryBudgets(strMap);
    } else {
      setTotalBudget('50000');
      const initialCatMap: Record<string, string> = {};
      categories.forEach((c) => {
        initialCatMap[c.name] = '10000';
      });
      setCategoryBudgets(initialCatMap);
    }
    setRecommendationInfo(null);
  }, [currentBudget, isOpen, categories]);

  if (!isOpen) return null;

  const handleCategoryChange = (catName: string, val: string) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [catName]: val,
    }));
  };

  const handleApplyAiRecommendation = () => {
    const rec = recommendNextMonthBudget(transactions, monthStr);
    setTotalBudget(String(rec.totalBudget));
    const strMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec.categoryBudgets)) {
      strMap[k] = String(v);
    }
    setCategoryBudgets(strMap);
    setRecommendationInfo(rec.rationale);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(totalBudget, 10) || 0;
    const finalCatBudgets: Record<string, number> = {};

    for (const [k, v] of Object.entries(categoryBudgets)) {
      const parsed = parseInt(v, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalCatBudgets[k] = parsed;
      }
    }

    onSave({
      month: monthStr,
      totalBudget: total,
      categoryBudgets: finalCatBudgets,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {monthStr} 월간 예산 설정
            </h2>
            <p className="text-xs text-slate-500">
              용돈 한도를 정해두면 계획적인 소비를 실천할 수 있어요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Recommendation Banner */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-purple-50 to-amber-50 rounded-2xl border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="text-xs text-slate-700">
              <span className="font-bold text-purple-700 block">AI 스마트 예산 추천</span>
              <span>지난달 소비 데이터를 분석해 알맞은 예산을 제안해 드려요.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyAiRecommendation}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shrink-0 shadow-xs"
          >
            추천안 적용
          </button>
        </div>

        {recommendationInfo && (
          <p className="mt-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
            💡 {recommendationInfo}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              이번 달 총 지출 한도 (총 예산)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-base font-bold text-slate-800"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                원
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">
                카테고리별 세부 예산 (선택)
              </label>
              <span className="text-[11px] text-slate-400">
                80% 사용 시 주의 알림 제공
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-medium text-slate-700">
                      {cat.name}
                    </span>
                  </div>
                  <div className="relative w-32">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder="0"
                      value={categoryBudgets[cat.name] || ''}
                      onChange={(e) =>
                        handleCategoryChange(cat.name, e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-right font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold">
                      원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>예산 저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
