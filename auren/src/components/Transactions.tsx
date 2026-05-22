import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL, formatDate, CATEGORIAS, BANCOS, TIPOS, METODOS, todayBR, currentMonthRef, getMonthsList } from '../utils';
import { Transaction } from '../services/googleSheets';

export default function Transactions() {
  const { transactions, isLoading, addTransaction, deleteTransaction } = useData();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = [...transactions].reverse();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.descricao.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q) ||
        t.banco.toLowerCase().includes(q)
      );
    }
    if (filterTipo) list = list.filter(t => t.tipo === filterTipo);
    if (filterMes) list = list.filter(t => t.mesReferencia === filterMes);
    return list;
  }, [transactions, search, filterTipo, filterMes]);

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map(t => t.mesReferencia).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const handleDelete = async (id: number) => {
    if (deleteConfirm === id) {
      await deleteTransaction(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 40 }} />
        </div>
        <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ width: 140, height: 40 }}>
          <option value="">Tipo</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input" value={filterMes} onChange={e => setFilterMes(e.target.value)} style={{ width: 180, height: 40 }}>
          <option value="">Mês</option>
          {availableMonths.map(m => <option key={m}>{m}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Count */}
      <p className="t-caption" style={{ marginBottom: 12 }}>
        {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
        {(search || filterTipo || filterMes) ? ' (filtrado)' : ''}
      </p>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 }}>
            <div className="spinner" /> <span className="t-caption">Carregando...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Filter size={22} /></div>
            <p className="t-subheadline" style={{ marginBottom: 4 }}>Nenhum resultado</p>
            <p className="t-caption">Tente ajustar os filtros ou adicione um lançamento.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Descrição', 'Categoria', 'Banco', 'Tipo', 'Valor', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.data}</td>
                    <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao || '—'}</p>
                      {t.observacoes && <p className="t-caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.observacoes}</p>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: 12 }}>{t.categoria || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.banco || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <TipoBadge tipo={t.tipo} />
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investimento' ? 'var(--purple)' : 'var(--text-primary)' }}>
                        {t.tipo === 'Entrada' ? '+' : '-'}{formatBRL(Math.abs(t.valor))}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <button
                        className="btn btn-icon btn-sm"
                        onClick={() => handleDelete(t.id)}
                        style={{ color: deleteConfirm === t.id ? 'var(--red)' : 'var(--text-tertiary)', background: deleteConfirm === t.id ? 'var(--red-light)' : 'transparent' }}
                        title={deleteConfirm === t.id ? 'Confirmar exclusão' : 'Excluir'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} onSave={addTransaction} />}
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    'Entrada':      { cls: 'badge-green',  icon: <TrendingUp size={11} /> },
    'Saída':        { cls: 'badge-red',    icon: <TrendingDown size={11} /> },
    'Investimento': { cls: 'badge-purple', icon: <PiggyBank size={11} /> },
    'Cartão':       { cls: 'badge-orange', icon: <CreditCard size={11} /> },
  };
  const { cls, icon } = map[tipo] || { cls: 'badge-neutral', icon: null };
  return (
    <span className={`badge ${cls}`} style={{ gap: 4 }}>
      {icon}{tipo || '—'}
    </span>
  );
}

interface AddModalProps {
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => Promise<void>;
}

function AddTransactionModal({ onClose, onSave }: AddModalProps) {
  const [form, setForm] = useState({
    data: todayBR(),
    mesReferencia: currentMonthRef(),
    valor: '',
    descricao: '',
    categoria: '',
    banco: '',
    tipo: 'Saída',
    metodo: '',
    observacoes: '',
    parcelas: '',
    responsavel: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.descricao.trim()) { setError('Informe a descrição.'); return; }
    if (!form.valor || isNaN(parseFloat(form.valor.replace(',', '.')))) { setError('Informe um valor válido.'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, valor: parseFloat(form.valor.replace(',', '.')) });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <p className="t-headline">Novo lançamento</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Tipo selector */}
          <div className="form-group">
            <label className="input-label">Tipo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIPOS.map(t => (
                <button key={t} onClick={() => set('tipo', t)}
                  style={{
                    flex: 1, padding: '8px 4px', border: '1px solid',
                    borderColor: form.tipo === t ? 'var(--accent)' : 'var(--border)',
                    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: form.tipo === t ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: form.tipo === t ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'all 0.12s',
                  }}>{t}</button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Data</label>
              <input className="input" value={form.data} onChange={e => set('data', e.target.value)} placeholder="DD/MM/AAAA" />
            </div>
            <div className="form-group">
              <label className="input-label">Valor (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Descrição</label>
            <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Supermercado Extra" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Categoria</label>
              <select className="input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                <option value="">Selecionar</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Banco / Carteira</label>
              <select className="input" value={form.banco} onChange={e => set('banco', e.target.value)}>
                <option value="">Selecionar</option>
                {BANCOS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Método de pagamento</label>
              <select className="input" value={form.metodo} onChange={e => set('metodo', e.target.value)}>
                <option value="">Selecionar</option>
                {METODOS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Mês de referência</label>
              <select className="input" value={form.mesReferencia} onChange={e => set('mesReferencia', e.target.value)}>
                {getMonthsList().map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Parcelas</label>
              <input className="input" value={form.parcelas} onChange={e => set('parcelas', e.target.value)} placeholder="Ex: 3/12" />
            </div>
            <div className="form-group">
              <label className="input-label">Responsável</label>
              <input className="input" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Observações</label>
            <textarea className="input" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Opcional" style={{ minHeight: 68 }} />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Salvando...</> : 'Salvar lançamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
