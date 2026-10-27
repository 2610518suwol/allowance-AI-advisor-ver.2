import React, { useState, useEffect } from 'react';
import { X, Check, PiggyBank, Plus } from 'lucide-react';
import { SavingsGoal, SavingsDeposit } from '../types';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'deposits' | 'currentAmount'> & { id?: string }) => void;
  editingGoal?: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('위시리스트');
  const [icon, setIcon] = useState('🎧');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetAmount(String(editingGoal.targetAmount));
      setTargetDate(editingGoal.targetDate);
      setCategory(editingGoal.category || '위시리스트');
      setIcon(editingGoal.icon || '🎧');
      setColor(editingGoal.color || '#3B82F6');
    } else {
      setTitle('');
      setTargetAmount('50000');
      // Default 30 days ahead
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setTargetDate(d.toISOString().split('T')[0]);
      setCategory('위시리스트');
      setIcon('🎧');
      setColor('#3B82F6');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const icons = ['🎧', '🎮', '👟', '🎁', '📚', '🛹', '✈️', '📱', '🚲', '💰'];
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(targetAmount, 10);
    if (!title.trim() || isNaN(amt) || amt <= 0) return;

    onSave({
      id: editingGoal ? editingGoal.id : undefined,
      title: title.trim(),
      targetAmount: amt,
      targetDate,
      category,
      icon,
      color,
      isTestData: editingGoal?.isTestData,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-lg font-bold text-slate-800">
              {editingGoal ? '저축 목표 수정' : '새 저축 목표 등록'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              목표 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 닌텐도 스위치 게임팩, 무선이어폰"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                목표 금액 (원) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                목표 달성일 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              아이콘 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {icons.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    icon === ic
                      ? 'border-amber-400 bg-amber-50 scale-110 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              테마 색상
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-slate-800' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
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
              <span>{editingGoal ? '수정 완료' : '목표 등록'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onDeposit: (goalId: string, amount: number, memo: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  goal,
  onDeposit,
}) => {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    setAmount('');
    setMemo('');
  }, [isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) return;

    onDeposit(goal.id, amt, memo.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{goal.icon}</span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {goal.title}에 저금하기
              </h2>
              <span className="text-xs text-slate-500">
                현재: ₩{goal.currentAmount.toLocaleString()} / ₩{goal.targetAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              저금할 금액 (원)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="100"
                step="500"
                placeholder="예: 3000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-base font-bold text-slate-800"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                원
              </span>
            </div>
            {/* Quick Chips */}
            <div className="flex gap-1.5 mt-2">
              {[1000, 3000, 5000, 10000].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setAmount(String((parseInt(amount, 10) || 0) + chip))}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  +{chip.toLocaleString()}원
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              저금 메모 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 이번 주 간식 참고 남긴 돈"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
            />
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
            💡 확인된 저축액만 가계부 실제 저축 실적으로 반영되며, 일반 지출과 중복 계산되지 않습니다.
          </p>

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
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5"
            >
              <PiggyBank className="w-4 h-4" />
              <span>저금 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
