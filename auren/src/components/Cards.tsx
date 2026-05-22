import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, Trash2, TrendingDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL } from '../utils';

interface Card {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  fechamento: number;
  vencimento: number;
  cor: string;
}

const CARD_KEY = 'auren_cards';
const CARD_COLORS = ['#0057FF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#1D1D1F'];
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro'];

function loadCards(): Card[] {
  try { return JSON.parse(localStorage.getItem(CARD_KEY) || '[]'); } catch { return []; }
}

function saveCards(cards: Card[]) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards));
}

export default function Cards() {
  const { transactions } = useData();
  const [cards, setCards] = useState<Card[]>(loadCards);
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const update = (next: Card[]) => { setCards(next); saveCards(next); };

  // Aggregate credit card spending per card (from transactions)
  const spendByCard = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.tipo === 'Cartão' || t.metodo === 'Crédito')
      .forEach(t => {
        const key = t.banco || 'outros';
        map[key] = (map[key] || 0) + Math.abs(t.valor);
      });
    return map;
  }, [transactions]);

  const selected = cards.find(c => c.id === selectedCard);

  const cardTransactions = useMemo(() => {
    if (!selected) return [];
    return transactions
      .filter(t => (t.tipo === 'Cartão' || t.metodo === 'Crédito') && t.banco === selected.nome)
      .reverse()
      .slice(0, 20);
  }, [transactions, selected]);

  const usedLimit = selected ? (spendByCard[selected.nome] || 0) : 0;
  const freeLimit = selected ? Math.max(0, selected.limite - usedLimit) : 0;

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Card list */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        {cards.map(card => {
          const spent = spendByCard[card.nome] || 0;
          const pct = card.limite > 0 ? Math.min(100, (spent / card.limite) * 100) : 0;
          const isSelected = selectedCard === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setSelectedCard(isSelected ? null : card.id)}
              style={{
                minWidth: 240, borderRadius: 16, padding: '20px',
                background: isSelected ? card.cor : `${card.cor}15`,
                border: `2px solid ${isSelected ? card.cor : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.2s', color: isSelected ? '#fff' : 'var(--text-primary)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>{card.bandeira}</p>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{card.nome}</p>
                </div>
                <CreditCard size={22} style={{ opacity: 0.7 }} />
              </div>
              <p style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>Limite disponível</p>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(Math.max(0, card.limite - spent))}
              </p>
              <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: isSelected ? 'white' : card.cor, width: `${pct}%`, transition: 'width 0.4s' }} />
              </div>
              <p style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>
                {formatBRL(spent)} usado de {formatBRL(card.limite)}
              </p>
            </div>
          );
        })}

        <div
          onClick={() => setShowModal(true)}
          style={{
            minWidth: 200, borderRadius: 16, border: '2px dashed var(--border-strong)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, cursor: 'pointer', color: 'var(--text-tertiary)', padding: 20, flexShrink: 0,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
          }}
        >
          <Plus size={22} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Adicionar cartão</span>
        </div>
      </div>

      {/* Selected card detail */}
      {selected && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="section-header">
              <span className="t-headline">{selected.nome} — Lançamentos recentes</span>
              <button className="btn btn-danger btn-sm" onClick={() => { update(cards.filter(c => c.id !== selected.id)); setSelectedCard(null); }}>
                <Trash2 size={13} /> Remover cartão
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="t-caption">Fatura atual</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(spendByCard[selected.nome] || 0)}</p>
              </div>
              <div>
                <p className="t-caption">Limite total</p>
                <p style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(selected.limite)}</p>
              </div>
              <div>
                <p className="t-caption">Fecha dia</p>
                <p style={{ fontSize: 18, fontWeight: 700 }}>{selected.fechamento}</p>
              </div>
              <div>
                <p className="t-caption">Vence dia</p>
                <p style={{ fontSize: 18, fontWeight: 700 }}>{selected.vencimento}</p>
              </div>
            </div>
          </div>
          {cardTransactions.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p className="t-caption">Nenhum lançamento encontrado para este cartão.</p>
              <p className="t-caption" style={{ marginTop: 4 }}>Registre transações com o banco "{selected.nome}" e tipo "Cartão" ou método "Crédito".</p>
            </div>
          ) : cardTransactions.map(t => (
            <div key={t.id} className="list-item">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingDown size={15} color="var(--red)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao}</p>
                <p className="t-caption">{t.categoria} · {t.data}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--red)' }}>
                -{formatBRL(Math.abs(t.valor))}
              </p>
            </div>
          ))}
        </div>
      )}

      {cards.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CreditCard size={22} /></div>
            <p className="t-subheadline" style={{ marginBottom: 4 }}>Nenhum cartão cadastrado</p>
            <p className="t-caption">Adicione seus cartões de crédito para acompanhar faturas e limites.</p>
          </div>
        </div>
      )}

      {showModal && <AddCardModal onClose={() => setShowModal(false)} onSave={card => { update([...cards, card]); setShowModal(false); }} />}
    </div>
  );
}

function AddCardModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Card) => void }) {
  const [form, setForm] = useState({ nome: '', bandeira: 'Visa', limite: '', fechamento: '', vencimento: '', cor: CARD_COLORS[0] });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <p className="t-headline">Adicionar cartão</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="input-label">Nome do cartão / banco</label>
            <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Nubank, Itaú Gold" autoFocus />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Bandeira</label>
              <select className="input" value={form.bandeira} onChange={e => set('bandeira', e.target.value)}>
                {BANDEIRAS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Limite (R$)</label>
              <input className="input" type="number" min="0" value={form.limite} onChange={e => set('limite', e.target.value)} placeholder="5000" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="input-label">Dia de fechamento</label>
              <input className="input" type="number" min="1" max="31" value={form.fechamento} onChange={e => set('fechamento', e.target.value)} placeholder="15" />
            </div>
            <div className="form-group">
              <label className="input-label">Dia de vencimento</label>
              <input className="input" type="number" min="1" max="31" value={form.vencimento} onChange={e => set('vencimento', e.target.value)} placeholder="22" />
            </div>
          </div>
          <div className="form-group">
            <label className="input-label">Cor do cartão</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CARD_COLORS.map(c => (
                <div key={c} onClick={() => set('cor', c)} style={{
                  width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                  border: `3px solid ${form.cor === c ? c : 'transparent'}`,
                  outline: form.cor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2, transition: 'all 0.12s',
                }} />
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={!form.nome.trim()}
            onClick={() => onSave({ id: Date.now().toString(), ...form, limite: parseFloat(form.limite) || 0, fechamento: parseInt(form.fechamento) || 1, vencimento: parseInt(form.vencimento) || 1 })}>
            Salvar cartão
          </button>
        </div>
      </div>
    </div>
  );
}
