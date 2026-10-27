import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  StopCircle,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Database,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  FileCheck,
  CheckSquare,
  Eye,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  TestSuite,
  TestCaseResult,
  TestStatus,
  Transaction,
  Budget,
  SavingsGoal,
  AppState,
} from '../../types';
import {
  runIncomeExpenseTests,
  runCategoryAnalysisTests,
  runBudgetThresholdTests,
  runSavingsTests,
  runAiAnalysisTests,
  runStoragePersistenceTests,
  getInitialTestSuites,
} from '../../utils/testRunner';
import {
  generateTestScenarioData,
  TestScenarioType,
  purgeTestDataOnly,
} from '../../utils/storage';

interface DevCenterViewProps {
  appState: AppState;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  currentMonth: string;
  onNavigateToDashboard: () => void;
}

export const DevCenterView: React.FC<DevCenterViewProps> = ({
  appState,
  onUpdateAppState,
  currentMonth,
  onNavigateToDashboard,
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>(getInitialTestSuites());
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [activeSuiteRunning, setActiveSuiteRunning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('테스트 대기 상태입니다.');
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    environment: string;
    geminiKeyConfigured: boolean;
  } | null>(null);

  // Cancellation ref
  const abortControllerRef = useRef<boolean>(false);

  // Check server health and Gemini key presence on mount
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setServerHealth(data))
      .catch(() => {
        setServerHealth({
          status: 'offline_or_local',
          environment: 'development',
          geminiKeyConfigured: false,
        });
      });
  }, []);

  // Update a single test result in state
  const handleUpdateTest = (testId: string, result: TestCaseResult) => {
    setTestSuites((prevSuites) =>
      prevSuites.map((suite) => ({
        ...suite,
        tests: suite.tests.map((t) => (t.id === testId ? result : t)),
      }))
    );
  };

  // Run a specific suite
  const runSuiteById = async (suiteId: string) => {
    setActiveSuiteRunning(suiteId);
    setStatusMessage(`[${suiteId}] 테스트 스위트 실행 중...`);

    // Mark suite tests as RUNNING
    setTestSuites((prev) =>
      prev.map((s) =>
        s.id === suiteId
          ? { ...s, tests: s.tests.map((t) => ({ ...t, status: 'RUNNING' as TestStatus })) }
          : s
      )
    );

    let results: TestCaseResult[] = [];
    switch (suiteId) {
      case 'suite-calc':
        results = await runIncomeExpenseTests(handleUpdateTest);
        break;
      case 'suite-cat':
        results = await runCategoryAnalysisTests(handleUpdateTest);
        break;
      case 'suite-budget':
        results = await runBudgetThresholdTests(handleUpdateTest);
        break;
      case 'suite-save':
        results = await runSavingsTests(handleUpdateTest);
        break;
      case 'suite-ai':
        results = await runAiAnalysisTests(handleUpdateTest);
        break;
      case 'suite-store':
        results = await runStoragePersistenceTests(handleUpdateTest);
        break;
    }

    setTestSuites((prev) =>
      prev.map((s) => {
        if (s.id !== suiteId) return s;
        return {
          ...s,
          tests: s.tests.map((t) => {
            const found = results.find((r) => r.id === t.id);
            return found || t;
          }),
        };
      })
    );

    setActiveSuiteRunning(null);
    setStatusMessage(`[${suiteId}] 테스트 완료.`);
  };

  // Run ALL test suites sequentially
  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    abortControllerRef.current = false;
    setStatusMessage('전체 6개 테스트 스위트 자동 실행을 시작합니다...');

    const suiteIds = ['suite-calc', 'suite-cat', 'suite-budget', 'suite-save', 'suite-ai', 'suite-store'];

    for (const sid of suiteIds) {
      if (abortControllerRef.current) {
        setStatusMessage('테스트가 사용자에 의해 중단되었습니다.');
        break;
      }
      await runSuiteById(sid);
    }

    setIsRunningAll(false);
    if (!abortControllerRef.current) {
      setStatusMessage('모든 단위 및 통합 테스트가 완료되었습니다.');
    }
  };

  // Stop running tests
  const handleStopTests = () => {
    abortControllerRef.current = true;
    setIsRunningAll(false);
    setActiveSuiteRunning(null);
    setStatusMessage('실행 중인 테스트를 중단했습니다.');
  };

  // Reset test results to IDLE
  const handleResetResults = () => {
    setTestSuites(getInitialTestSuites());
    setStatusMessage('테스트 결과가 초기화되었습니다.');
  };

  // Export results to Markdown / JSON
  const handleExportTestResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      serverHealth,
      totalPassed: testSuites.flatMap((s) => s.tests).filter((t) => t.status === 'PASS').length,
      totalFailed: testSuites.flatMap((s) => s.tests).filter((t) => t.status === 'FAIL').length,
      totalTests: testSuites.flatMap((s) => s.tests).length,
      suites: testSuites,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `dev_test_report_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  // Test Data Management Buttons
  const handleInjectScenario = (scenario: TestScenarioType) => {
    const data = generateTestScenarioData(scenario, currentMonth);

    onUpdateAppState((prev) => {
      let nextBudgets = { ...prev.budgets };
      if (data.budget) {
        nextBudgets[data.budget.month] = data.budget;
      }

      let nextGoals = [...prev.savingsGoals];
      if (data.savingsGoal) {
        // remove existing with same id if any, append new
        nextGoals = nextGoals.filter((g) => g.id !== data.savingsGoal!.id);
        nextGoals.push(data.savingsGoal);
      }

      return {
        ...prev,
        transactions: [...prev.transactions, ...data.transactions],
        budgets: nextBudgets,
        savingsGoals: nextGoals,
      };
    });

    alert(`[${scenario}] 시나리오 테스트 데이터가 성공적으로 생성되었습니다!\n(${data.description})`);
  };

  // Reset ONLY test data (preserving real user data 100%)
  const handlePurgeTestData = () => {
    if (
      window.confirm(
        '정말 테스트 데이터만 초기화하시겠습니까?\n실제 사용자 데이터(isTestData가 아닌 항목)는 안전하게 100% 보존됩니다.'
      )
    ) {
      onUpdateAppState((prev) => purgeTestDataOnly(prev));
      alert('테스트 데이터가 모두 안전하게 정리되었습니다. 실제 사용자 데이터는 그대로 유지됩니다.');
    }
  };

  // Counts
  const allTests = testSuites.flatMap((s) => s.tests);
  const passCount = allTests.filter((t) => t.status === 'PASS').length;
  const failCount = allTests.filter((t) => t.status === 'FAIL').length;
  const runningCount = allTests.filter((t) => t.status === 'RUNNING').length;
  const idleCount = allTests.filter((t) => t.status === 'IDLE').length;

  const testTxCount = appState.transactions.filter((t) => t.isTestData).length;
  const realTxCount = appState.transactions.filter((t) => !t.isTestData).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Dev Center Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">
                  개발자 테스트 센터 (Developer Test Center)
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  DEVELOPER ACCESS
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                기능별 단위/통합 테스트, 시나리오 데이터 주입, 격리 제어 및 자동화 검증 시스템
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>대시보드로 복귀</span>
            </button>
          </div>
        </div>

        {/* Runtime Environment Status Bar */}
        <div className="mt-5 pt-4 border-t border-purple-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/40">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>런타임: Node.js 22 + Express (Port 3000)</span>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Gemini API Key:{' '}
              {serverHealth?.geminiKeyConfigured ? (
                <strong className="text-emerald-300">장착됨 (gemini-3.8-flash)</strong>
              ) : (
                <span className="text-amber-300">미장착 (규칙 기반 폴백 활성)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/40">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>
              데이터 저장소:{' '}
              <strong>실제 {realTxCount}건 / 테스트 {testTxCount}건</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ================= SECTION A: TEST DATA MANAGEMENT ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <span>A. 테스트 데이터 관리 (Test Data Generator)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              요구된 시나리오별로 식별값(isTestData)이 부여된 테스트 데이터를 생성합니다.
            </p>
          </div>

          {/* Test Data Isolation & Simulation Mode Switcher */}
          <div className="flex items-center gap-2 bg-purple-50 p-1.5 rounded-2xl border border-purple-100">
            <span className="text-xs font-bold text-purple-900 ml-1">
              대시보드 반영 미리보기:
            </span>
            <button
              onClick={() =>
                onUpdateAppState((prev) => ({
                  ...prev,
                  includeTestDataInSimulation: !prev.includeTestDataInSimulation,
                }))
              }
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                appState.includeTestDataInSimulation
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {appState.includeTestDataInSimulation
                ? '시뮬레이션 ON (테스트 데이터 포함)'
                : '시뮬레이션 OFF (실제 데이터만)'}
            </button>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {/* 1. Official Sample Preset */}
          <button
            onClick={() => handleInjectScenario('sample_preset')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 block">
              ⭐ 샘플 데이터 생성
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              수입 70,000원, 게임 30,000원, 편의점 16,600원 등 (총지출 64,600원)
            </span>
          </button>

          {/* 2. Normal Spending */}
          <button
            onClick={() => handleInjectScenario('normal_spending')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block">
              🌱 정상 소비 데이터 생성
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              필요 지출(문구/교통) 위주 20,000원 지출 균형 시나리오
            </span>
          </button>

          {/* 3. Excessive Spending */}
          <button
            onClick={() => handleInjectScenario('excessive_spending')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 block">
              🔥 과소비 상황 데이터 생성
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              게임 45,000원, 간식 22,000원 등 선택 지출 집중
            </span>
          </button>

          {/* 4. Over Budget */}
          <button
            onClick={() => handleInjectScenario('over_budget')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700 block">
              🚨 예산 초과 데이터 생성
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              예산 50,000원 대비 56,000원 지출 (초과금 6,000원)
            </span>
          </button>

          {/* 5. Savings Goal Scenario */}
          <button
            onClick={() => handleInjectScenario('savings_goal_scenario')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block">
              🎯 저축 목표 테스트 데이터
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
              목표 20,000원 중 14,000원 실제 저축(70%) 시나리오
            </span>
          </button>

          {/* 6. Purge Test Data Only */}
          <button
            onClick={handlePurgeTestData}
            className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all group"
          >
            <span className="text-xs font-bold text-amber-900 block flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>테스트 데이터 초기화</span>
            </span>
            <span className="text-[10px] text-amber-700 mt-0.5 block leading-tight">
              테스트 데이터만 안전하게 제거 (실제 데이터 100% 보존)
            </span>
          </button>

          {/* 7. Delete All Test Data */}
          <button
            onClick={handlePurgeTestData}
            className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all group"
          >
            <span className="text-xs font-bold text-rose-900 block flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
              <span>전체 테스트 데이터 삭제</span>
            </span>
            <span className="text-[10px] text-rose-700 mt-0.5 block leading-tight">
              모든 테스트 태그 항목 영구 삭제 (실제 사용자 데이터 보호)
            </span>
          </button>
        </div>

        {/* Safety & Isolation Notice */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>테스트 데이터 격리 안전성 준수:</strong> 테스트 데이터 초기화는 <code>isTestData: true</code> 식별자를 가진 항목만 필터링 삭제하며, 실제 사용자 데이터 전체 삭제 기능은 테스트 센터에서 제공하지 않습니다.
          </span>
        </div>
      </div>

      {/* ================= SECTION B & C: TEST EXECUTION CONTROL & RESULTS ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>B & C. 기능별 테스트 스위트 및 실행기</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              실제 코드를 기반으로 계산값, 알림 판정, API 호출을 직접 검증하여 진짜 PASS / FAIL을 산출합니다.
            </p>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAllTests}
              disabled={isRunningAll}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-purple-200 transition-all flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>전체 테스트 실행</span>
            </button>

            {isRunningAll && (
              <button
                onClick={handleStopTests}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>테스트 중지</span>
              </button>
            )}

            <button
              onClick={handleResetResults}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
              title="결과 새로고침"
            >
              <RotateCcw className="w-4 h-4" />
              <span>결과 새로고침</span>
            </button>

            <button
              onClick={handleExportTestResults}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
              title="테스트 결과 내보내기"
            >
              <Download className="w-4 h-4" />
              <span>결과 내보내기</span>
            </button>
          </div>
        </div>

        {/* Live Status Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <span>상태: {statusMessage}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> PASS: {passCount}
            </span>
            <span className="text-rose-600 flex items-center gap-1">
              <XCircle className="w-4 h-4" /> FAIL: {failCount}
            </span>
            {runningCount > 0 && (
              <span className="text-purple-600 flex items-center gap-1 animate-pulse">
                <Clock className="w-4 h-4" /> RUNNING: {runningCount}
              </span>
            )}
            <span className="text-slate-400">IDLE: {idleCount}</span>
          </div>
        </div>

        {/* Test Suites List */}
        <div className="space-y-6">
          {testSuites.map((suite) => (
            <div
              key={suite.id}
              className="bg-slate-50/60 rounded-3xl p-5 border border-slate-200/80 space-y-3"
            >
              {/* Suite Header with Individual Run Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    {suite.name}
                  </h3>
                  <p className="text-xs text-slate-500">{suite.description}</p>
                </div>

                <button
                  onClick={() => runSuiteById(suite.id)}
                  disabled={isRunningAll || activeSuiteRunning === suite.id}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 transition-colors flex items-center gap-1 shadow-2xs self-start sm:self-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>개별 테스트 실행</span>
                </button>
              </div>

              {/* Suite Tests Table */}
              <div className="divide-y divide-slate-200/60 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {suite.tests.map((test) => (
                  <div key={test.id} className="p-3.5 text-xs space-y-1.5 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Status Icon */}
                        {test.status === 'PASS' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        )}
                        {test.status === 'FAIL' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                        {test.status === 'RUNNING' && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> RUNNING
                          </span>
                        )}
                        {test.status === 'IDLE' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                            IDLE
                          </span>
                        )}

                        <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                          {test.name}
                        </span>
                      </div>

                      {test.durationMs > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {test.durationMs}ms
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 pl-1">{test.description}</p>

                    {/* Expected vs Actual Comparison (Required by prompt) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block font-sans">
                          예상 결과 (Expected):
                        </span>
                        <span className="text-slate-700">{test.expected}</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl border ${
                          test.status === 'PASS'
                            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                            : test.status === 'FAIL'
                            ? 'bg-rose-50/50 border-rose-100 text-rose-800'
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 block font-sans">
                          실제 결과 (Actual):
                        </span>
                        <span className="font-semibold">{test.actual}</span>
                      </div>
                    </div>

                    {/* Troubleshooting if failed */}
                    {test.status === 'FAIL' && test.troubleshooting && (
                      <div className="mt-1 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                        <strong>실패 원인 및 해결 방법:</strong> {test.troubleshooting}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
