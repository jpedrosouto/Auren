import React, { useEffect, useState } from 'react';
import { LayoutDashboard, List, CheckSquare, CreditCard, TrendingUp, FileBarChart, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { DataProvider, useData } from './contexts/DataContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Checklist from './components/Checklist';
import Cards from './components/Cards';
import Investments from './components/Investments';
import Summary from './components/Summary';
import Settings from './components/Settings';

type Tab = 'dashboard' | 'transactions' | 'checklist' | 'cards' | 'investments' | 'summary' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={15} /> },
  { id: 'transactions', label: 'Lançamentos',  icon: <List size={15} /> },
  { id: 'checklist',    label: 'Checklist',    icon: <CheckSquare size={15} /> },
  { id: 'cards',        label: 'Cartões',      icon: <CreditCard size={15} /> },
  { id: 'investments',  label: 'Investimentos',icon: <TrendingUp size={15} /> },
  { id: 'summary',      label: 'Resumo',       icon: <FileBarChart size={15} /> },
  { id: 'settings',     label: 'Ajustes',      icon: <SettingsIcon size={15} /> },
];

function AppShell() {
  const { isAuthenticated, isReady, userInfo } = useAuth();
  const { theme, toggle } = useTheme();
  const { refresh, isLoading, error } = useData();
  const [tab, setTab] = useState<Tab>('dashboard');

  // Auto-load on login
  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated]);

  if (!isReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  const tabContent: Record<Tab, React.ReactNode> = {
    dashboard:    <Dashboard />,
    transactions: <Transactions />,
    checklist:    <Checklist />,
    cards:        <Cards />,
    investments:  <Investments />,
    summary:      <Summary />,
    settings:     <Settings />,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <header className="app-header">
        <div className="page" style={{ width: '100%', maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M4 22L10 10L16 18L21 13L28 22" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.035em', color: 'var(--text-primary)' }}>AUREN</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoading && <div className="spinner" style={{ width: 16, height: 16 }} />}

            {/* Theme toggle */}
            <button
              className="btn btn-icon btn-secondary"
              onClick={toggle}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* User avatar */}
            {userInfo?.picture ? (
              <img
                src={userInfo.picture}
                alt="avatar"
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border-strong)', cursor: 'pointer' }}
                onClick={() => setTab('settings')}
                title="Ajustes"
              />
            ) : (
              <button className="btn btn-icon btn-secondary" onClick={() => setTab('settings')} title="Ajustes">
                <SettingsIcon size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="app-nav">
        <div className="page">
          <div className="nav-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Error banner */}
      {error && error !== 'SPREADSHEET_NOT_SET' && error !== 'AUTH_REQUIRED' && (
        <div style={{ background: 'var(--red-light)', borderBottom: '1px solid rgba(255,59,48,0.2)', padding: '10px 20px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--red)' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Spreadsheet not set banner */}
      {error === 'SPREADSHEET_NOT_SET' && (
        <div style={{ background: 'var(--orange-light)', borderBottom: '1px solid rgba(255,149,0,0.2)', padding: '10px 20px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--orange)' }}>ID da planilha não configurado.</span>
            <button className="btn btn-sm" style={{ background: 'var(--orange)', color: '#fff', height: 28, fontSize: 12 }} onClick={() => setTab('settings')}>
              Configurar
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ paddingTop: 24 }}>
        <div className="page">
          {tabContent[tab]}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
