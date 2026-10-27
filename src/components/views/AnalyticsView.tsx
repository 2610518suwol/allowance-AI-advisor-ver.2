import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
  Store,
  Crown,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CategoryBreakdownItem,
  MonthSummary,
  MonthOverMonthChange,
  findTopMerchants,
  calculateTrends,
  calculateMonthOverMonthChange,
} from '../../utils/calculations';
import { Transaction } from '../../types';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  summary: MonthSummary;
  categoryBreakdown: CategoryBreakdownItem[];
}

const PASTEL_COLORS = [
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280', // Slate
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  currentMonth,
  setCurrentMonth,
  summary,
  categoryBreakdown,
}) => {
  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('daily');

  const topMerchants = findTopMerchants(transactions, currentMonth);
  const trends = calculateTrends(transactions, currentMonth);
  const momChange = calculateMonthOverMonthChange(transactions, currentMonth);

  // Prepare chart data for PieChart
  const pieData = categoryBreakdown.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: PASTEL_COLORS[index % PASTEL_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-800 text-white p-2.5 rounded-xl text-xs shadow-lg">
          <p className="font-bold">{data.name}</p>
          <p className="text-amber-300 font-extrabold">₩{data.value.toLocaleString()}원</p>
          {data.payload.percentage !== undefined && (
            <p className="text-slate-300">비율: {data.payload.percentage}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>📊 소비 패턴 심층 분석</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            원형 차트와 소비 추이를 통해 내가 어디에 돈을 자주 쓰는지 분석해 보세요.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
          />
        </div>
      </div>

      {/* MoM Comparison & Needs vs Wants Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Month over Month Change Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">지난달 대비 지출 변화</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">
                {momChange.diffAmount > 0 ? '+' : ''}₩
                {momChange.diffAmount.toLocaleString()}원
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  momChange.isIncrease
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {momChange.isIncrease ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {Math.abs(momChange.diffPercentage)}% {momChange.isIncrease ? '증가' : '절약'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              지난달: ₩{momChange.previousMonthTotal.toLocaleString()}원 → 이번 달: ₩
              {momChange.currentMonthTotal.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* Needs vs Wants Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">필요 지출 vs 선택 지출 비율</span>
            <span className="text-[11px] text-slate-400">
              {summary.needsRatio}% : {summary.wantsRatio}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${summary.needsRatio}%` }}
              title={`필요 지출: ${summary.needsRatio}%`}
            />
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${summary.wantsRatio}%` }}
              title={`선택 지출: ${summary.wantsRatio}%`}
            />
          </div>

          <div className="flex items-center justify-between mt-2.5 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>꼭 필요해요: ₩{summary.needsTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>하고 싶어요: ₩{summary.wantsTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Category Pie Chart + Top Ranked Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="font-extrabold text-sm sm:text-base text-slate-800">
              카테고리별 지출 비율 (원형 그래프)
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              총 ₩{summary.totalExpense.toLocaleString()}
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="py-24 text-slate-400 text-xs">
              이번 달 지출 기록이 없어 차트를 표시할 수 없습니다.
            </div>
          ) : (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend Chips */}
          <div className="w-full flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
                <span className="text-slate-400">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Spending Rankings & Top Frequent Merchants */}
        <div className="space-y-4">
          {/* Top Category Crown */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-base text-slate-800">
                가장 많이 지출한 카테고리
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">지출 내역이 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {categoryBreakdown.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-slate-900 block">
                        ₩{item.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-amber-700 font-semibold">
                        전체의 {item.percentage}% ({item.count}회 결제)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Frequent Merchants */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-purple-600" />
              <span className="font-extrabold text-base text-slate-800">
                가장 자주 찾은 단골 사용처 TOP 3
              </span>
            </div>

            {topMerchants.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                사용처(가게명)가 등록된 지출 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {topMerchants.slice(0, 3).map((m, idx) => (
                  <div
                    key={m.merchant}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/40 border border-purple-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-purple-700 text-xs">#{idx + 1}</span>
                      <span className="font-bold text-slate-800">{m.merchant}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-800">총 {m.count}회 방문</span>
                      <span className="text-slate-400 block text-[10px]">
                        누적 ₩{m.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Daily & Weekly Spending Trends (Bar Chart) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>소비 추이 그래프 ({trendView === 'daily' ? '일별' : '주별'})</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              날짜별 또는 주차별 지출 흐름을 시각적으로 비교해 보세요.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTrendView('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendView === 'daily' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              일별 추이
            </button>
            <button
              onClick={() => setTrendView('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendView === 'weekly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              주별 추이
            </button>
          </div>
        </div>

        {/* Unified chart data */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(trendView === 'daily' ? trends.daily : trends.weekly).map((item) => ({
                label: 'day' in item ? `${item.day}일` : item.week,
                expense: item.expense,
                income: item.income,
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="expense"
                name="지출"
                fill="#F43F5E"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="income"
                name="수입"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
