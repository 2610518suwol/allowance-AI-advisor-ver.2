import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Check, HelpCircle } from 'lucide-react';
import { Transaction, TransactionType, Category, ExpenseNature } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categories,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('편의점 및 간식');
  const [merchant, setMerchant] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [nature, setNature] = useState<ExpenseNature>('선택');
  const [memo, setMemo] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setMerchant(editingTransaction.merchant || '');
      setItemName(editingTransaction.itemName || '');
      setNature(editingTransaction.nature || '선택');
      setMemo(editingTransaction.memo || '');
    } else {
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setCategory(categories[0]?.name || '편의점 및 간식');
      setMerchant('');
      setItemName('');
      setNature('선택');
      setMemo('');
    }
    setError('');
  }, [editingTransaction, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseInt(amount, 10);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('올바른 금액(1원 이상)을 입력해 주세요.');
      return;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      date,
      amount: numAmt,
      category,
      merchant: type === 'expense' ? merchant.trim() || undefined : undefined,
      itemName: type === 'expense' ? itemName.trim() || undefined : undefined,
      nature: type === 'expense' ? nature : undefined,
      memo: memo.trim() || undefined,
      isTestData: editingTransaction?.isTestData,
      testTag: editingTransaction?.testTag,
    });

    onClose();
  };

  const incomeCategories = ['용돈', '심부름/알바', '상금/장학금', '중고판매', '기타수입'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {editingTransaction ? '내역 수정하기' : '새 내역 기록하기'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(categories[0]?.name || '편의점 및 간식');
              }}
              className={`py-2 rounded-xl text-sm font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              지출 (쓴 돈)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('용돈');
              }}
              className={`py-2 rounded-xl text-sm font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              수입 (받은 돈)
            </button>
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                금액 (원) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="예: 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-bold text-slate-800"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  원
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              카테고리 <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
            >
              {type === 'expense' ? (
                categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))
              ) : (
                incomeCategories.map((c) => (
                  <option key={c} value={c}>
                    💰 {c}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Expense Specific Fields: Merchant, Item Name, Nature */}
          {type === 'expense' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    사용처 (가게명 등)
                  </label>
                  <input
                    type="text"
                    placeholder="예: CU편의점, 다이소"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    구매한 물건이나 서비스
                  </label>
                  <input
                    type="text"
                    placeholder="예: 초코에몽, 지우개"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Expense Nature: Needs vs Wants */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    소비 성격 구분
                  </span>
                  <span className="text-[11px] text-slate-500">
                    AI 코치가 맞춤 분석할 때 활용돼요
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNature('필요')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      nature === '필요'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span>📘 꼭 필요해요 (Needs)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNature('선택')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      nature === '선택'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span>✨ 하고 싶어요 (Wants)</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              메모 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 친구 생일 파티 간식"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm text-slate-800"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          {/* Buttons */}
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
              <span>{editingTransaction ? '수정 완료' : '기록 추가'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
