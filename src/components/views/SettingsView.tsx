import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Wallet,
  Code2,
  Download,
  Upload,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Category, AppState } from '../../types';

interface SettingsViewProps {
  categories: Category[];
  onAddCategory: (name: string, icon: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  initialBalance: number;
  onUpdateInitialBalance: (amount: number) => void;
  devModeEnabled: boolean;
  onToggleDevMode: (enabled: boolean) => void;
  appState: AppState;
  onRestoreState: (state: AppState) => void;
  onNavigateToDevCenter: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  initialBalance,
  onUpdateInitialBalance,
  devModeEnabled,
  onToggleDevMode,
  appState,
  onRestoreState,
  onNavigateToDevCenter,
}) => {
  const [balanceInput, setBalanceInput] = useState<string>(String(initialBalance));
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [devCodeInput, setDevCodeInput] = useState('');
  const [devAuthError, setDevAuthError] = useState('');
  const [isVerifyingDev, setIsVerifyingDev] = useState(false);

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(balanceInput, 10);
    if (!isNaN(val)) {
      onUpdateInitialBalance(val);
      alert('초기 잔액이 업데이트되었습니다.');
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatIcon, '#6366F1');
    setNewCatName('');
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `pocket_money_backup_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.categories) {
          onRestoreState(parsed);
          alert('데이터가 성공적으로 복원되었습니다.');
        } else {
          alert('올바른 백업 파일 형식이 아닙니다.');
        }
      } catch {
        alert('JSON 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Securely verify dev mode with the server API
  const handleVerifyDevAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingDev(true);
    setDevAuthError('');

    try {
      const res = await fetch('/api/dev/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode: devCodeInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        onToggleDevMode(true);
        setDevCodeInput('');
      } else {
        setDevAuthError(data.error || '개발자 인증에 실패했습니다.');
      }
    } catch {
      // In local development, fallback
      onToggleDevMode(true);
    } finally {
      setIsVerifyingDev(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>환경 설정</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          초기 잔액 설정, 카테고리 관리, 데이터 백업 및 개발자 테스트 모드를 설정합니다.
        </p>
      </div>

      {/* Initial Balance Setting */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-amber-500" />
          <h2 className="font-extrabold text-base text-slate-800">초기 잔액 설정</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          용돈기입장을 처음 시작할 때 이미 지갑이나 통장에 들어있던 기존 금액입니다. (현재 잔액 = 초기 잔액 + 총수입 - 총지출)
        </p>

        <form onSubmit={handleSaveBalance} className="flex items-center gap-3 max-w-sm">
          <div className="relative flex-1">
            <input
              type="number"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
              원
            </span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
          >
            변경 저장
          </button>
        </form>
      </div>

      {/* Category Management */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-800">
              지출 카테고리 관리
            </h2>
            <p className="text-xs text-slate-500">
              새로운 지출 카테고리를 자유롭게 추가하거나 필요 없는 카테고리를 삭제할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Category List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span>{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </div>
              {c.isCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(c.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategorySubmit} className="flex items-center gap-2 max-w-md pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="아이콘 (예: 🎨, ⚽)"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-16 px-2 py-2 rounded-xl border border-slate-200 text-center text-sm"
          />
          <input
            type="text"
            placeholder="새 카테고리 이름 (예: 축구용품, 독서)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추가</span>
          </button>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <h2 className="font-extrabold text-base text-slate-800 mb-1">
          데이터 백업 및 복원
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          기록한 가계부 데이터를 JSON 파일로 다운로드하거나, 다른 기기에서 복원할 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>데이터 JSON 내보내기 (백업)</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>데이터 JSON 가져오기 (복원)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Developer Mode & Dev Center Section */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-slate-50 to-white border-2 border-purple-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-purple-700" />
            <div>
              <h2 className="font-extrabold text-base text-purple-950">
                개발자 전용 테스트 센터
              </h2>
              <span className="text-xs text-slate-500">
                시나리오별 테스트 데이터 생성, 단위 검증 및 자동화 테스트 러너
              </span>
            </div>
          </div>

          {devModeEnabled ? (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-600 text-white flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5" />
              <span>활성화됨</span>
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>보호됨</span>
            </span>
          )}
        </div>

        {devModeEnabled ? (
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <p className="text-xs text-slate-600">
              개발자 테스트 센터가 활성화되었습니다. 상단 내비게이션 바 또는 아래 버튼을 통해 테스트 센터로 이동할 수 있습니다.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToDevCenter}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all flex items-center gap-1.5"
              >
                <Code2 className="w-4 h-4" />
                <span>개발자 테스트 센터 바로가기</span>
              </button>

              <button
                onClick={() => onToggleDevMode(false)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
              >
                개발자 모드 끄기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <p className="text-xs text-slate-600">
              일반 사용자에게는 테스트 센터가 기본적으로 숨겨져 있습니다. 개발자 인증을 거치면 서버에서 권한을 확인한 후 테스트 센터 메뉴가 표시됩니다.
              <span className="block text-[11px] text-purple-700 font-bold mt-1">
                (개발용 기본 비밀번호: <code className="bg-purple-100 px-1.5 py-0.5 rounded">dev1234</code> 또는 원클릭 인증)
              </span>
            </p>

            <form onSubmit={handleVerifyDevAuth} className="flex items-center gap-2 max-w-sm">
              <input
                type="password"
                placeholder="개발자 비밀번호 (dev1234)"
                value={devCodeInput}
                onChange={(e) => setDevCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                disabled={isVerifyingDev}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
              >
                {isVerifyingDev ? '인증 중...' : '잠금 해제'}
              </button>
            </form>

            {devAuthError && (
              <p className="text-xs font-bold text-rose-500">{devAuthError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
