import React, { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CalendarClock } from 'lucide-react';
import { formatBRL } from '../utils';

interface CheckItem {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  categoria: string;
}

const STORAGE_KEY = 'auren_checklist';

function loadItems(): CheckItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveItems(items: CheckItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function Checklist() {
  const [items, setItems] = useState<CheckItem[]>(loadItems);
  const [showModal, setShowModal] = useState(false);

  const update = (next: CheckItem[]) => { setItems(next); saveItems(next); };

  const toggle = (id: string) =>
    update(items.map(i => i.id === id ? { ...i, pago: !i.pago } : i));

  const remove = (id: string) => update(items.filter(i => i.id !== id));

  const { total, pago, pendente } = useMemo(() => {
    const total = items.reduce((s, i) => s + i.valor, 0);
    const pago = items.filter(i => i.pago).reduce((s, i) => s + i.valor, 0);
    return { total, pago, pendente: total - pago };
  }, [items]);

  const sorted = useMemo(() => [...items].sort((a, b) => {
    if (a.pago !== b.pago) return a.pago ? 1 : -1;
    return a.vencimento.localeCompare(b.vencimento);
  }), [items]);

  const progress = total > 0 ? (pago / total) * 100 : 0;

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p className="t-caption" style={{ marginBottom: 4 }}>Total do período</p>
              <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(total)}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Adicionar
            </button>
          </div>

          <div className="progress-track" style={{ height: 6, marginBottom: 10 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--green)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p className="t-caption">Pago</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(pago)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="t-caption">Pendente</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(pendente)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarClock size={22} /></div>
            <p className="t-subheadline" style={{ marginBottom: 4 }}>Checklist vazio</p>
            <p className="t-caption">Adicione contas e compromissos financeiros do mês.</p>
          </div>
        ) : sorted.map(item => (
          <div key={item.id} className="list-item" style={{ opacity: item.pago ? 0.5 : 1 }}>
            <button onClick={() => toggle(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.pago ? 'var(--green)' : 'var(--border-strong)', padding: 0, flexShrink: 0 }}>
              {item.pago ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, textDecoration: item.pago ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.descricao}
              </p>
              <p className="t-caption">
                {item.categoria}
                {item.vencimento ? ` · vence ${item.vencimento}` : ''}
              </p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginRight: 8, textDecoration: item.pago ? 'line-through' : 'none' }}>
              {formatBRL(item.valor)}
            </p>
            <button className="btn btn-icon btn-sm" onClick={() => remove(item.id)} style={{ color: 'var(--text-tertiary)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showModal && <AddCheckModal onClose={() => setShowModal(false)} onSave={item => { update([...items, item]); setShowModal(false); }} />}
    </div>
  );
}

function AddCheckModal({ onClose, onSave }: { onClose: () => void; onSave: (i: CheckItem) => void }) {
  const [form, setForm] = useState({ descricao: '', valor: '', vencimento: '', categoria: '' });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.descricao.trim()) return;
    onSave({
      id: Date.now().toString(),
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor.replace(',', '.')) || 0,
      vencimento: form.vencimento,
      categoria: form.categoria || 'Outros',
      pago: false,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <p className="t-headline">Adicionar ao checklist</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="input-label">Descrição</label>
            <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Aluguel, Fatura Nubank..." autoFocus />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Valor (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label className="input-label">Vencimento</label>
              <input className="input" value={form.vencimento} onChange={e => set('vencimento', e.target.value)} placeholder="DD/MM" />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Categoria</label>
            <input className="input" value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Moradia, Saúde, Assinatura..." />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSave} disabled={!form.descricao.trim()}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
