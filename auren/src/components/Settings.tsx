import React, { useState } from 'react';
import { LogOut, Moon, Sun, Shield, Database, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { SPREADSHEET_ID_KEY } from '../services/googleSheets';

export default function Settings() {
  const { userInfo, logout, timeUntilExpiry } = useAuth();
  const { theme, toggle } = useTheme();
  const { refresh, isLoading, lastSync, transactions } = useData();
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem(SPREADSHEET_ID_KEY) || '');
  const [saved, setSaved] = useState(false);

  const handleSaveSheet = () => {
    localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  const handleClearData = () => {
    if (confirm('Limpar todos os dados locais (checklist, cartões, investimentos manuais)? Esta ação não afeta a planilha.')) {
      ['auren_checklist', 'auren_cards', 'auren_investments'].forEach(k => localStorage.removeItem(k));
      alert('Dados locais removidos.');
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Profile */}
      {userInfo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {userInfo.picture && (
              <img src={userInfo.picture} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }} />
            )}
            <div style={{ flex: 1 }}>
              <p className="t-headline">{userInfo.name || 'Usuário'}</p>
              <p className="t-caption">{userInfo.email}</p>
              {timeUntilExpiry > 0 && (
                <p className="t-caption" style={{ marginTop: 2, color: timeUntilExpiry < 10 ? 'var(--orange)' : 'var(--text-tertiary)' }}>
                  Sessão expira em {timeUntilExpiry} min
                </p>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <p className="t-micro" style={{ marginBottom: 16 }}>Aparência</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {theme === 'dark' ? <Moon size={18} color="var(--text-secondary)" /> : <Sun size={18} color="var(--text-secondary)" />}
              <div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>Tema {theme === 'dark' ? 'escuro' : 'claro'}</p>
                <p className="t-caption">Muda a aparência da interface</p>
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggle} />
              <div className="toggle-track"></div>
              <div className="toggle-thumb"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <p className="t-micro" style={{ marginBottom: 16 }}>Planilha Google Sheets</p>

          <div className="form-group">
            <label className="input-label">ID da planilha</label>
            <input
              className="input"
              value={spreadsheetId}
              onChange={e => setSpreadsheetId(e.target.value)}
              placeholder="ID da planilha"
            />
            <p className="t-caption" style={{ marginTop: 6 }}>
              Encontre em: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
              <a href="https://sheets.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginLeft: 6 }}>
                Abrir Sheets <ExternalLink size={10} style={{ display: 'inline' }} />
              </a>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSaveSheet} disabled={!spreadsheetId.trim()}>
              {saved ? 'Salvo!' : 'Salvar'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }} />
              {isLoading ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>

          {lastSync && (
            <p className="t-caption" style={{ marginTop: 12 }}>
              Última sincronização: {lastSync.toLocaleTimeString('pt-BR')} — {transactions.length} lançamentos
            </p>
          )}
        </div>
      </div>

      {/* OAuth */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <p className="t-micro" style={{ marginBottom: 16 }}>Autenticação Google</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Shield size={16} color="var(--text-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Client ID configurado</p>
              <p className="t-caption" style={{ wordBreak: 'break-all' }}>
                {localStorage.getItem('auren_client_id') || 'Não configurado'}
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8, color: 'var(--red)' }}
                onClick={() => {
                  if (confirm('Redefinir as credenciais? Você precisará configurar novamente.')) {
                    logout();
                    localStorage.removeItem('auren_client_id');
                    localStorage.removeItem('auren_token');
                    window.location.reload();
                  }
                }}
              >
                Redefinir credenciais
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ border: '1px solid rgba(255,59,48,0.2)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={15} color="var(--red)" />
            <p className="t-micro" style={{ color: 'var(--red)' }}>Zona de risco</p>
          </div>
          <p className="t-caption" style={{ marginBottom: 14 }}>
            Remove dados locais (checklist, cartões, investimentos manuais). Não afeta sua planilha Google Sheets.
          </p>
          <button className="btn btn-danger btn-sm" onClick={handleClearData}>
            Limpar dados locais
          </button>
        </div>
      </div>

    </div>
  );
}
