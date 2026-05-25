import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SPREADSHEET_ID_KEY } from '../services/googleSheets';

type Step = 'welcome' | 'setup' | 'connect';

export default function LoginScreen() {
  const { login, isLoading, error, clearError, hasClientId, setClientId } = useAuth();
  const [step, setStep] = useState<Step>(hasClientId ? 'connect' : 'welcome');
  const [clientIdInput, setClientIdInput] = useState('');
  const [spreadsheetInput, setSpreadsheetInput] = useState(
    () => localStorage.getItem(SPREADSHEET_ID_KEY) || ''
  );

  const handleSetup = () => {
    if (!clientIdInput.trim()) return;
    setClientId(clientIdInput.trim());
    if (spreadsheetInput.trim()) {
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetInput.trim());
    }
    setStep('connect');
  };

  const handleLogin = async () => {
    if (spreadsheetInput.trim()) {
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetInput.trim());
    }
    clearError();
    await login();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--accent)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            boxShadow: '0 8px 24px rgba(0,87,255,0.30)',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 22L10 10L16 18L21 13L28 22" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="t-display" style={{ letterSpacing: '-0.04em', marginBottom: 6 }}>AUREN</div>
          <div className="t-caption">Controle Financeiro Inteligente</div>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-body" style={{ padding: 28 }}>

            {step === 'welcome' && (
              <div>
                <p className="t-headline" style={{ marginBottom: 8 }}>Bem-vindo</p>
                <p className="t-caption" style={{ marginBottom: 28, lineHeight: 1.6 }}>
                  Para começar, você precisará de um Google OAuth Client ID e o ID da sua planilha.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {[
                    ['Crie um projeto no Google Cloud Console', 'https://console.cloud.google.com'],
                    ['Ative a Google Sheets API', ''],
                    ['Crie credenciais OAuth 2.0 (Web application)', ''],
                    ['Adicione seu domínio como origem autorizada', ''],
                  ].map(([text, url], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <span className="t-caption" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {text}
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--accent)', marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <ExternalLink size={11} /> abrir
                          </a>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep('setup')}>
                  Configurar <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 'setup' && (
              <div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setStep('welcome')}
                >
                  ← Voltar
                </button>

                <p className="t-headline" style={{ marginBottom: 6 }}>Configuração</p>
                <p className="t-caption" style={{ marginBottom: 24 }}>Insira suas credenciais do Google Cloud.</p>

                <div className="form-group">
                  <label className="input-label">Google OAuth Client ID</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="xxxxxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={e => setClientIdInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">ID da Planilha Google Sheets</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                    value={spreadsheetInput}
                    onChange={e => setSpreadsheetInput(e.target.value)}
                  />
                  <p className="t-caption" style={{ marginTop: 6 }}>
                    Encontre na URL da planilha: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
                  </p>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!clientIdInput.trim()}
                  onClick={handleSetup}
                >
                  Salvar e continuar <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 'connect' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--green-light)', color: 'var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={16} />
                  </div>
                  <p className="t-headline">Conectar ao Google</p>
                </div>

                <p className="t-caption" style={{ marginBottom: 24, lineHeight: 1.6 }}>
                  Autorize o acesso à sua planilha Google Sheets para sincronizar suas transações.
                </p>

                {!localStorage.getItem(SPREADSHEET_ID_KEY) && (
                  <div className="form-group">
                    <label className="input-label">ID da Planilha (obrigatório)</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="ID da planilha"
                      value={spreadsheetInput}
                      onChange={e => setSpreadsheetInput(e.target.value)}
                    />
                  </div>
                )}

                {error && (
                  <div style={{
                    background: 'var(--red-light)', border: '1px solid rgba(255,59,48,0.20)',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 18,
                    color: 'var(--red)', fontSize: 13, lineHeight: 1.5,
                  }}>
                    {error}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: 48, fontSize: 16 }}
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Aguardando...</>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" fillOpacity=".9"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".8"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" fillOpacity=".7"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".85"/>
                      </svg>
                      Entrar com Google
                    </>
                  )}
                </button>

                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 10, fontSize: 13 }}
                  onClick={() => setStep('setup')}
                >
                  Alterar configurações
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="t-caption" style={{ textAlign: 'center', marginTop: 20 }}>
          Seus dados ficam na sua planilha. Nenhuma informação é armazenada em servidores externos.
        </p>
      </div>
    </div>
  );
}
