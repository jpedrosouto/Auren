import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Trash2, PiggyBank } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL } from '../utils';

interface Investment {
  id: string;
  nome: string;
  tipo: string;
  valor: number;
  dataAporte: string;
  rendimento: number; // % ao ano esperado
  notas: string;
}

const INV_KEY = 'auren_investments';
const TIPOS_INV = ['Renda Fixa', 'Tesouro Direto', 'CDB', 'LCI/LCA', 'Fundos', 'Ações', 'FIIs', 'Criptomoedas', 'Poupança', 'Previdência', 'Outro'];

function load(): Investment[] {
  try { return JSON.parse(localStorage.getItem(INV_KEY) || '[]'); } catch { return []; }
}
function save(inv: Investment[]) { localStorage.setItem(INV_KEY, JSON.stringify(inv)); }

export default function Investments() {
  const { transactions } = useData();
  const [investments, setInvestments] = useState<Investment[]>(load);
  const [showModal, setShowModal] = useState(false);

  const update = (next: Investment[]) => { setInvestments(next); save(next); };

  // Total invested from transactions (tipo === 'Investimento')
  const totalFromTransactions = useMemo(() =>
    transactions.filter(t => t.tipo === 'Investimento').reduce((s, t) => s + Math.abs(t.valor), 0),
    [transactions]);

  const totalManual = investments.reduce((s, i) => s + i.valor, 0);
  const total = totalFromTransactions + totalManual;

  const byTipo = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach(i => { map[i.tipo] = (map[i.tipo] || 0) + i.valor; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [investments]);

  // Investment transactions from sheets
  const invTransactions = useMemo(() =>
    [...transactions.filter(t => t.tipo === 'Investimento')].reverse().slice(0, 10),
    [transactions]);

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Summary */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}><PiggyBank size={18} /></div>
          <p className="t-caption" style={{ marginBottom: 4 }}>Total investido</p>
          <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{formatBRL(total)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}><TrendingUp size={18} /></div>
          <p className="t-caption" style={{ marginBottom: 4 }}>Da planilha (aportes)</p>
          <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(totalFromTransactions)}</p>
        </div>
      </div>

      {/* Distribution */}
      {byTipo.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <p className="t-headline" style={{ marginBottom: 14 }}>Distribuição</p>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {byTipo.map(([tipo, val]) => (
              <div key={tipo} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{tipo}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatBRL(val)} <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>({totalManual > 0 ? ((val / totalManual) * 100).toFixed(1) : 0}%)</span>
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: totalManual > 0 ? `${(val / totalManual) * 100}%` : '0%', background: 'var(--green)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual investments */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="section-header">
            <p className="t-headline">Meus investimentos</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>
        {investments.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p className="t-caption">Cadastre seus investimentos manualmente para acompanhar o portfólio.</p>
          </div>
        ) : investments.map(inv => (
          <div key={inv.id} className="list-item">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--green)' }}>
              <TrendingUp size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{inv.nome}</p>
              <p className="t-caption">{inv.tipo} · {inv.dataAporte}{inv.rendimento ? ` · ${inv.rendimento}% a.a.` : ''}</p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--green)', marginRight: 8 }}>
              {formatBRL(inv.valor)}
            </p>
            <button className="btn btn-icon btn-sm" onClick={() => update(investments.filter(i => i.id !== inv.id))} style={{ color: 'var(--text-tertiary)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Transactions from sheets */}
      {invTransactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <p className="t-headline" style={{ marginBottom: 0 }}>Aportes registrados na planilha</p>
          </div>
          {invTransactions.map(t => (
            <div key={t.id} className="list-item">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--purple)' }}>
                <PiggyBank size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao}</p>
                <p className="t-caption">{t.banco} · {t.data}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--purple)' }}>
                {formatBRL(Math.abs(t.valor))}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddInvestmentModal onClose={() => setShowModal(false)} onSave={inv => { update([...investments, inv]); setShowModal(false); }} />
      )}
    </div>
  );
}

function AddInvestmentModal({ onClose, onSave }: { onClose: () => void; onSave: (i: Investment) => void }) {
  const [form, setForm] = useState({ nome: '', tipo: 'Renda Fixa', valor: '', dataAporte: '', rendimento: '', notas: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <p className="t-headline">Novo investimento</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="input-label">Nome</label>
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: CDB Nubank 13% a.a." autoFocus />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {TIPOS_INV.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Valor (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Data do aporte</label>
              <input className="input" value={form.dataAporte} onChange={e => set('dataAporte', e.target.value)} placeholder="DD/MM/AAAA" />
            </div>
            <div className="form-group">
              <label className="input-label">Rendimento esperado (% a.a.)</label>
              <input className="input" type="number" min="0" step="0.1" value={form.rendimento} onChange={e => set('rendimento', e.target.value)} placeholder="13.5" />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Notas</label>
            <textarea className="input" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observações opcionais" style={{ minHeight: 64 }} />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={!form.nome.trim()}
            onClick={() => onSave({ id: Date.now().toString(), ...form, valor: parseFloat(form.valor) || 0, rendimento: parseFloat(form.rendimento) || 0 })}>
            Salvar investimento
          </button>
        </div>
      </div>
    </div>
  );
}
