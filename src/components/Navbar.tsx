import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  PiggyBank,
  Sparkles,
  Trophy,
  Settings,
  Code2,
  Menu,
  X,
  Coins,
  ShieldAlert,
} from 'lucide-react';

export type ActivePage =
  | 'dashboard'
  | 'transactions'
  | 'analytics'
  | 'budget'
  | 'savings'
  | 'coach'
  | 'missions'
  | 'settings'
  | 'dev_center';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentBalance: number;
  devModeEnabled: boolean;
  simulationModeActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentBalance,
  devModeEnabled,
  simulationModeActive,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'transactions', label: '수입·지출 내역', icon: Receipt },
    { id: 'analytics', label: '소비 분석', icon: PieChart },
    { id: 'budget', label: '예산 관리', icon: Wallet },
    { id: 'savings', label: '저축 목표', icon: PiggyBank },
    { id: 'coach', label: 'AI 용돈 코치', icon: Sparkles },
    { id: 'missions', label: '절약 미션', icon: Trophy },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  if (devModeEnabled) {
    navItems.push({
      id: 'dev_center',
      label: '개발자 테스트 센터',
      icon: Code2,
    });
  }

  const handleNavClick = (id: ActivePage) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      {/* Simulation / Dev alert banner if active */}
      {simulationModeActive && (
        <div className="bg-amber-500 text-white text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-1.5 shadow-inner">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
          <span>[시뮬레이션 모드 활성화됨] 개발자 테스트 데이터가 대시보드 통계에 반영되어 표시 중입니다.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-200 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight">
                  AI 용돈도우미
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  학생용
                </span>
                {devModeEnabled && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 animate-pulse">
                    DEV
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                스마트한 소비와 즐거운 저축 습관
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const isDev = item.id === 'dev_center';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ActivePage)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? isDev
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                        : 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                      : isDev
                      ? 'text-purple-600 hover:bg-purple-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header: Balance Badge & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-medium">현재 잔액</span>
              <span className="text-sm font-extrabold text-slate-800">
                ₩{currentBalance.toLocaleString()}
              </span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-xl mb-2 sm:hidden">
            <span className="text-xs text-amber-800 font-medium">현재 잔액</span>
            <span className="text-base font-bold text-slate-900">
              ₩{currentBalance.toLocaleString()}
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isDev = item.id === 'dev_center';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as ActivePage)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? isDev
                      ? 'bg-purple-600 text-white'
                      : 'bg-amber-500 text-white'
                    : isDev
                    ? 'text-purple-700 hover:bg-purple-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
