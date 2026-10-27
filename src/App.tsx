/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppState, Transaction, Budget, SavingsGoal, Category } from './types';
import {
  loadAppState,
  saveAppState,
  getCurrentMonthString,
} from './utils/storage';
import {
  calculateBalance,
  calculateMonthSummary,
  calculateCategoryBreakdown,
  calculateBudgetStatus,
  filterTransactions,
} from './utils/calculations';

// Components
import { Navbar, ActivePage } from './components/Navbar';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { SavingsGoalModal, DepositModal } from './components/SavingsModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { BudgetView } from './components/views/BudgetView';
import { SavingsView } from './components/views/SavingsView';
import { AiCoachView } from './components/views/AiCoachView';
import { MissionsView } from './components/views/MissionsView';
import { SettingsView } from './components/views/SettingsView';
import { DevCenterView } from './components/views/DevCenterView';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthString());

  // Modal States
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const [savingsGoalModalOpen, setSavingsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetDepositGoal, setTargetDepositGoal] = useState<SavingsGoal | null>(null);

  // Sync to localStorage on state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Handle active transactions based on test data simulation toggle
  // In regular mode, test data is completely filtered out from real user statistics
  const activeTransactions = filterTransactions(
    appState.transactions,
    appState.includeTestDataInSimulation
  );

  const activeSavingsGoals = appState.includeTestDataInSimulation
    ? appState.savingsGoals
    : appState.savingsGoals.filter((g) => !g.isTestData);

  // Calculations
  const currentBalance = calculateBalance(appState.initialBalance, activeTransactions);
  const summary = calculateMonthSummary(
    activeTransactions,
    currentMonth,
    appState.initialBalance,
    activeSavingsGoals
  );
  const categoryBreakdown = calculateCategoryBreakdown(activeTransactions, currentMonth);
  const currentBudget = appState.budgets[currentMonth];
  const budgetStatus = calculateBudgetStatus(currentBudget, activeTransactions, currentMonth);

  // Transaction Handlers
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    setAppState((prev) => {
      let updatedList: Transaction[];
      if (txData.id) {
        // Edit
        updatedList = prev.transactions.map((t) =>
          t.id === txData.id
            ? { ...t, ...txData, id: txData.id, createdAt: t.createdAt }
            : t
        );
      } else {
        // Add
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          createdAt: Date.now(),
        };
        updatedList = [newTx, ...prev.transactions];
      }
      return { ...prev, transactions: updatedList };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  // Budget Handlers
  const handleSaveBudget = (newBudget: Budget) => {
    setAppState((prev) => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [newBudget.month]: newBudget,
      },
    }));
  };

  // Savings Goal Handlers
  const handleSaveSavingsGoal = (
    goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'deposits' | 'currentAmount'> & { id?: string }
  ) => {
    setAppState((prev) => {
      let updatedGoals: SavingsGoal[];
      if (goalData.id) {
        updatedGoals = prev.savingsGoals.map((g) =>
          g.id === goalData.id
            ? { ...g, ...goalData, id: goalData.id }
            : g
        );
      } else {
        const newGoal: SavingsGoal = {
          ...goalData,
          id: `goal-${Date.now()}`,
          currentAmount: 0,
          deposits: [],
          createdAt: Date.now(),
        };
        updatedGoals = [newGoal, ...prev.savingsGoals];
      }
      return { ...prev, savingsGoals: updatedGoals };
    });
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
    }));
  };

  const handleDepositToGoal = (goalId: string, amount: number, memo: string) => {
    setAppState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => {
        if (g.id !== goalId) return g;
        const newDep = {
          id: `dep-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount,
          memo: memo || '목표 저금',
        };
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          deposits: [newDep, ...(g.deposits || [])],
        };
      }),
    }));
  };

  // Category Handlers
  const handleAddCategory = (name: string, icon: string, color: string) => {
    setAppState((prev) => {
      if (prev.categories.some((c) => c.name === name)) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return prev;
      }
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name,
        icon,
        color,
        isCustom: true,
      };
      return { ...prev, categories: [...prev.categories, newCat] };
    });
  };

  const handleDeleteCategory = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentBalance={currentBalance}
        devModeEnabled={appState.devModeEnabled}
        simulationModeActive={appState.includeTestDataInSimulation}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activePage === 'dashboard' && (
          <DashboardView
            summary={summary}
            budgetStatus={budgetStatus}
            categoryBreakdown={categoryBreakdown}
            recentTransactions={activeTransactions}
            savingsGoals={activeSavingsGoals}
            missions={appState.missions}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onOpenTransactionModal={() => {
              setEditingTransaction(null);
              setTransactionModalOpen(true);
            }}
            onNavigate={(page) => setActivePage(page)}
            simulationModeActive={appState.includeTestDataInSimulation}
          />
        )}

        {activePage === 'transactions' && (
          <TransactionsView
            transactions={activeTransactions}
            categories={appState.categories}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setTransactionModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activePage === 'analytics' && (
          <AnalyticsView
            transactions={activeTransactions}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            summary={summary}
            categoryBreakdown={categoryBreakdown}
          />
        )}

        {activePage === 'budget' && (
          <BudgetView
            budgetStatus={budgetStatus}
            currentBudget={currentBudget}
            monthStr={currentMonth}
            setCurrentMonth={setCurrentMonth}
            categories={appState.categories}
            transactions={activeTransactions}
            onOpenBudgetModal={() => setBudgetModalOpen(true)}
            onApplyRecommendation={handleSaveBudget}
          />
        )}

        {activePage === 'savings' && (
          <SavingsView
            savingsGoals={activeSavingsGoals}
            onOpenNewGoalModal={() => {
              setEditingGoal(null);
              setSavingsGoalModalOpen(true);
            }}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setSavingsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteSavingsGoal}
            onOpenDepositModal={(goal) => {
              setTargetDepositGoal(goal);
              setDepositModalOpen(true);
            }}
          />
        )}

        {activePage === 'coach' && (
          <AiCoachView
            transactions={activeTransactions}
            currentBudget={currentBudget}
            currentMonth={currentMonth}
          />
        )}

        {activePage === 'missions' && (
          <MissionsView
            missions={appState.missions}
            savingsGoals={activeSavingsGoals}
            transactions={activeTransactions}
            currentBudget={currentBudget}
            currentMonth={currentMonth}
            onNavigate={(page) => setActivePage(page)}
          />
        )}

        {activePage === 'settings' && (
          <SettingsView
            categories={appState.categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            initialBalance={appState.initialBalance}
            onUpdateInitialBalance={(amt) =>
              setAppState((prev) => ({ ...prev, initialBalance: amt }))
            }
            devModeEnabled={appState.devModeEnabled}
            onToggleDevMode={(val) =>
              setAppState((prev) => ({ ...prev, devModeEnabled: val }))
            }
            appState={appState}
            onRestoreState={(restored) => setAppState(restored)}
            onNavigateToDevCenter={() => setActivePage('dev_center')}
          />
        )}

        {activePage === 'dev_center' && (
          <DevCenterView
            appState={appState}
            onUpdateAppState={(updater) => setAppState(updater)}
            currentMonth={currentMonth}
            onNavigateToDashboard={() => setActivePage('dashboard')}
          />
        )}
      </main>

      {/* Global Modals */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={appState.categories}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        currentBudget={currentBudget}
        monthStr={currentMonth}
        categories={appState.categories}
        transactions={activeTransactions}
        onSave={handleSaveBudget}
      />

      <SavingsGoalModal
        isOpen={savingsGoalModalOpen}
        onClose={() => setSavingsGoalModalOpen(false)}
        onSave={handleSaveSavingsGoal}
        editingGoal={editingGoal}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        goal={targetDepositGoal}
        onDeposit={handleDepositToGoal}
      />
    </div>
  );
}
