import React, { useMemo, useState } from 'react';
import { Download, FileText, BarChart2, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL, calcSaldo, groupByMonth, getCategoriaColor } from '../utils';

export default function Summary() {
  const { transactions } = useData();
  const [selectedMonth, setSelectedMonth] = useState('all');

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map(t => t.mesReferencia).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() =>
    selectedMonth === 'all' ? transactions : transactions.filter(t => t.mesReferencia === selectedMonth),
    [transactions, selectedMonth]);

  const { receitas, despesas, investimentos, saldo } = useMemo(() => calcSaldo(filtered), [filtered]);

  // By category
  const byCategory = useMemo(() => {
    const map: Record<string, { saida: number; entrada: number }> = {};
    filtered.forEach(t => {
      const cat = t.categoria || 'Outros';
      if (!map[cat]) map[cat] = { saida: 0, entrada: 0 };
      if (t.tipo === 'Entrada') map[cat].entrada += Math.abs(t.valor);
      else map[cat].saida += Math.abs(t.valor);
    });
    return Object.entries(map).sort((a, b) => (b[1].saida + b[1].entrada) - (a[1].saida + a[1].entrada));
  }, [filtered]);

  // Monthly summary table
  const monthlyData = useMemo(() => {
    const byMonth = groupByMonth(transactions);
    return Object.entries(byMonth)
      .map(([month, ts]) => ({ month, ...calcSaldo(ts as any[]) }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Data', 'Mês Referência', 'Valor', 'Descrição', 'Categoria', 'Banco', 'Tipo', 'Método', 'Observações', 'Parcelas', 'Responsável'];
    const rows = filtered.map(t => [
      t.data, t.mesReferencia, t.valor.toFixed(2), t.descricao,
      t.categoria, t.banco, t.tipo, t.metodo, t.observacoes, t.parcelas, t.responsavel,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auren_${selectedMonth === 'all' ? 'completo' : selectedMonth.replace(' ', '_')}.csv`;
    link.click();
  };

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Month filter + export */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
          <button onClick={() => setSelectedMonth('all')} className="btn btn-sm"
            style={{ background: selectedMonth === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: selectedMonth === 'all' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Geral
          </button>
          {availableMonths.map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className="btn btn-sm"
              style={{ background: selectedMonth === m ? 'var(--accent)' : 'var(--bg-surface)', color: selectedMonth === m ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {m}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Receitas', value: receitas, color: 'var(--green)', bg: 'var(--green-light)', icon: <TrendingUp size={16} /> },
          { label: 'Despesas', value: despesas, color: 'var(--red)', bg: 'var(--red-light)', icon: <TrendingDown size={16} /> },
          { label: 'Investimentos', value: investimentos, color: 'var(--purple)', bg: 'var(--purple-light)', icon: <PiggyBank size={16} /> },
          { label: 'Saldo', value: saldo, color: saldo >= 0 ? 'var(--green)' : 'var(--red)', bg: saldo >= 0 ? 'var(--green-light)' : 'var(--red-light)', icon: <BarChart2 size={16} /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
            <p className="t-caption" style={{ marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', color }}>{formatBRL(Math.abs(value))}</p>
          </div>
        ))}
      </div>

      {/* By Category */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <p className="t-headline">Por categoria</p>
            <span className="t-caption">{filtered.length} lançamentos</span>
          </div>
        </div>
        {byCategory.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}><p className="t-caption">Nenhum dado</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Categoria', 'Despesas', 'Receitas', 'Lançamentos'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCategory.map(([cat, { saida, entrada }]) => {
                  const count = filtered.filter(t => (t.categoria || 'Outros') === cat).length;
                  return (
                    <tr key={cat} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: getCategoriaColor(cat), flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{cat}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--red)' }}>{saida > 0 ? formatBRL(saida) : '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{entrada > 0 ? formatBRL(entrada) : '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>{count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly table */}
      <div className="card">
        <div className="card-header">
          <p className="t-headline" style={{ marginBottom: 0 }}>Histórico mensal</p>
        </div>
        {monthlyData.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}><p className="t-caption">Nenhum dado</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Mês', 'Receitas', 'Despesas', 'Investimentos', 'Saldo'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(({ month, receitas: r, despesas: d, investimentos: inv, saldo: s }) => (
                  <tr key={month} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{month}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{formatBRL(r)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--red)' }}>{formatBRL(d)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--purple)' }}>{formatBRL(inv)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: s >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatBRL(Math.abs(s))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
