import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Filter,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, TransactionType, Category, ExpenseNature } from '../../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  onAddTransaction: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  currentMonth,
  setCurrentMonth,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [natureFilter, setNatureFilter] = useState<'all' | '필요' | '선택'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter transactions
  const filtered = transactions.filter((t) => {
    // Month filter
    if (currentMonth && !t.date.startsWith(currentMonth)) return false;

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    // Nature filter
    if (natureFilter !== 'all') {
      if (t.type === 'expense' && t.nature !== natureFilter) return false;
      if (t.type === 'income') return false; // income has no nature
    }

    // Keyword search in merchant, itemName, memo, category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.category.toLowerCase().includes(q) ||
        (t.merchant && t.merchant.toLowerCase().includes(q)) ||
        (t.itemName && t.itemName.toLowerCase().includes(q)) ||
        (t.memo && t.memo.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Sort by date descending, then createdAt descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['날짜', '구분', '카테고리', '금액(원)', '소비성격', '사용처', '품목', '메모'];
    const rows = sorted.map((t) => [
      t.date,
      t.type === 'income' ? '수입' : '지출',
      t.category,
      t.amount,
      t.nature || '',
      t.merchant || '',
      t.itemName || '',
      t.memo || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pocket_money_${currentMonth}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredExpense = sorted
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalFilteredIncome = sorted
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-800">
            수입 및 지출 내역 관리
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            용돈 수입과 지출을 꼼꼼히 기록하고 언제든 수정하거나 검색할 수 있어요.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            title="CSV 파일로 내보내기"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV 내보내기</span>
          </button>

          <button
            onClick={() => onAddTransaction('income')}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>수입 등록</span>
          </button>

          <button
            onClick={() => onAddTransaction('expense')}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-amber-200 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>지출 등록</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Month selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              지출만
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                typeFilter === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              수입만
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          {/* Needs vs Wants filter */}
          <select
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="all">소비성격 전체</option>
            <option value="필요">📘 꼭 필요해요 (Needs)</option>
            <option value="선택">✨ 하고 싶어요 (Wants)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="사용처(편의점명), 물건 이름, 메모 등으로 검색해 보세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-slate-50/50"
          />
        </div>

        {/* Filtered Summary stats */}
        <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600 font-semibold border-t border-slate-100">
          <span>총 {sorted.length}건 검색됨</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600">
              수입 합계: +₩{totalFilteredIncome.toLocaleString()}
            </span>
            <span className="text-rose-600">
              지출 합계: -₩{totalFilteredExpense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">해당 조건의 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              검색어나 필터를 재조정하거나 새 내역을 등록해 보세요!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[11px] sm:text-xs">
                  <th className="py-3 px-4">날짜</th>
                  <th className="py-3 px-3">구분</th>
                  <th className="py-3 px-3">카테고리</th>
                  <th className="py-3 px-3">사용처 / 품목</th>
                  <th className="py-3 px-3">소비 성격</th>
                  <th className="py-3 px-4 text-right">금액</th>
                  <th className="py-3 px-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium text-xs">
                      {t.date}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {t.type === 'income' ? '수입' : '지출'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{t.category}</span>
                        {t.isTestData && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                            TEST
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Merchant & Item */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-700">
                        {t.merchant || (t.type === 'income' ? '용돈/수입' : '-')}
                      </div>
                      {(t.itemName || t.memo) && (
                        <div className="text-[11px] text-slate-400">
                          {t.itemName} {t.memo ? `(${t.memo})` : ''}
                        </div>
                      )}
                    </td>

                    {/* Nature */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {t.type === 'expense' && t.nature ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.nature === '필요'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}
                        >
                          {t.nature === '필요' ? '📘 필요 지출' : '✨ 선택 지출'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-4 text-right font-black whitespace-nowrap text-xs sm:text-sm ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}₩
                      {t.amount.toLocaleString()}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(t)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="수정하기"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('이 내역을 삭제하시겠습니까? 대시보드와 통계에도 즉시 반영됩니다.')) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="삭제하기"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
