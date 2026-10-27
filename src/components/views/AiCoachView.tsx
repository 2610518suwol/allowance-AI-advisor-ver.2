import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { Transaction, Budget, AiCoachAnalysis, ChatMessage } from '../../types';
import { generateRuleBasedCoachAnalysis } from '../../utils/aiAnalysisRuleBased';

interface AiCoachViewProps {
  transactions: Transaction[];
  currentBudget: Budget | undefined;
  currentMonth: string;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  transactions,
  currentBudget,
  currentMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [analysis, setAnalysis] = useState<AiCoachAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '안녕! 나는 너의 개인 맞춤형 AI 용돈 코치야. 이번 달 소비에 대해 궁금한 점이나 돈을 더 모으고 싶은 목표가 있다면 무엇이든 편하게 물어봐!',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const fetchAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          monthStr: currentMonth,
          budget: currentBudget,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        // Fallback to client-side rule engine
        const fallback = generateRuleBasedCoachAnalysis(transactions, currentBudget, currentMonth);
        setAnalysis(fallback);
      }
    } catch {
      const fallback = generateRuleBasedCoachAnalysis(transactions, currentBudget, currentMonth);
      setAnalysis(fallback);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [transactions, currentBudget, currentMonth]);

  const handleSendMessage = async (msgText: string) => {
    const textToSend = msgText.trim();
    if (!textToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          transactions,
          monthStr: currentMonth,
          budget: currentBudget,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || '답변을 생성하지 못했습니다.',
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch {
      // Local fallback reply
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: '현재 서버 연결이 원활하지 않아 오프라인 지능 모드로 작동 중입니다. 가계부에 기록된 지출을 살펴보시고 불필요한 간식이나 게임 소비를 점검해 보세요!',
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const presetQuestions = [
    '이번 달에 돈을 가장 많이 쓴 곳은 어디야?',
    '게임 아이템 지출을 줄이려면 어떻게 해야 해?',
    '다음 달 예산을 추천해 줘.',
    '50,000원짜리 물건을 사려면 얼마나 저축해야 해?',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span>AI 용돈 관리 코치 & 1:1 상담소</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
              {analysis?.source === 'gemini' ? 'Gemini 3.8 Flash' : '스마트 분석 엔진'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            실제 지출 데이터를 근거로 과소비 패턴을 진단하고, 실천 가능한 절약 플랜을 제안합니다.
          </p>
        </div>

        {/* Tab Switcher: Analysis vs Chat */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'analysis'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            소비 습관 진단 보고서
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI 용돈 상담 챗봇
          </button>
        </div>
      </div>

      {activeTab === 'analysis' ? (
        /* ================= ANALYSIS REPORT TAB ================= */
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl shadow-purple-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-200 tracking-wider uppercase block">
                  {currentMonth} 맞춤 절약 솔루션
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-1">
                  다음 달 예상 절약 금액: ₩
                  {(analysis?.projectedMonthlySavings || 0).toLocaleString()}원
                </h2>
                <p className="text-xs sm:text-sm text-purple-100 mt-2 max-w-xl leading-relaxed">
                  {analysis?.cheeringMessage || '데이터를 분석 중입니다...'}
                </p>
              </div>

              <button
                onClick={fetchAnalysis}
                disabled={loadingAnalysis}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAnalysis ? 'animate-spin' : ''}`} />
                <span>분석 다시하기</span>
              </button>
            </div>
          </div>

          {/* Data Grounded Analysis Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2 mb-2">
              <span className="text-lg">📈</span>
              <span>실제 데이터에 근거한 분석</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {analysis?.dataGroundedAnalysis || '분석 중입니다...'}
            </p>

            <div className="mt-4">
              <h4 className="font-bold text-xs text-slate-500 mb-1">💡 개선이 필요한 이유</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysis?.needForImprovement ||
                  '소비 우선순위를 정하고 불필요한 반복 지출을 줄이면 저축 목표를 더 빨리 이룰 수 있습니다.'}
              </p>
            </div>
          </div>

          {/* Discovered Habits Grid */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>발견된 소비 습관 리포트</span>
            </h3>

            {analysis?.discoveredHabits && analysis.discoveredHabits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.discoveredHabits.map((habit, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      habit.severity === 'alert'
                        ? 'bg-rose-50/70 border-rose-200'
                        : habit.severity === 'warning'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-blue-50/70 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          habit.severity === 'alert'
                            ? 'bg-rose-200 text-rose-800'
                            : habit.severity === 'warning'
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {habit.severity === 'alert'
                          ? '주의'
                          : habit.severity === 'warning'
                          ? '점검'
                          : '정보'}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                        {habit.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {habit.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">소비 습관을 분석하고 있습니다.</p>
            )}
          </div>

          {/* Concrete Action Steps */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>구체적인 실천 방법 (Action Plan)</span>
            </h3>

            {analysis?.concreteActionSteps && analysis.concreteActionSteps.length > 0 ? (
              <div className="space-y-2.5">
                {analysis.concreteActionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="w-6 h-6 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">실천 방안을 계산 중입니다.</p>
            )}
          </div>
        </div>
      ) : (
        /* ================= CHATBOT TAB ================= */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-800 block">
                  AI 용돈 멘토 챗봇
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">
                  실제 가계부 데이터를 바탕으로 친절하게 답변해요
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                setChatMessages([
                  {
                    id: 'reset',
                    sender: 'assistant',
                    text: '대화가 초기화되었습니다. 궁금한 점을 언제든 물어보세요!',
                    timestamp: Date.now(),
                  },
                ])
              }
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              대화 비우기
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 self-center mr-1">
              추천 질문:
            </span>
            {presetQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={chatLoading}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white text-purple-700 hover:bg-purple-100/60 border border-purple-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="p-3.5 bg-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                  <span>가계부 데이터를 확인하며 생각 중...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="예: 편의점 지출을 줄이려면 어떻게 해야 할까?"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={chatLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || chatLoading}
              className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
