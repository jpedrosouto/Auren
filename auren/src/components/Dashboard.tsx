import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart2, RefreshCw, PiggyBank } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL, calcSaldo, getCategoriaColor, currentMonthRef, groupByMonth } from '../utils';

export default function Dashboard() {
  const { transactions, isLoading, refresh, lastSync } = useData();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map(t => t.mesReferencia).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.mesReferencia === selectedMonth);
  }, [transactions, selectedMonth]);

  const { receitas, despesas, investimentos, saldo } = useMemo(() => calcSaldo(filtered), [filtered]);

  // Top categories by expense
  const topCategorias = useMemo(() => {
    const map: Record<string, number> = {};
    filtered
      .filter(t => t.tipo === 'Saída' || t.tipo === 'Cartão')
      .forEach(t => {
        const cat = t.categoria || 'Outros';
        map[cat] = (map[cat] || 0) + Math.abs(t.valor);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const totalDespesas = topCategorias.reduce((s, [, v]) => s + v, 0) || 1;

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const byMonth = groupByMonth(transactions);
    return Object.entries(byMonth)
      .slice(-6)
      .map(([month, ts]) => {
        const { receitas, despesas } = calcSaldo(ts as any[]);
        return { month: month.split(' ')[0].slice(0, 3), receitas, despesas };
      });
  }, [transactions]);

  const maxVal = Math.max(...monthlyTrend.flatMap(m => [m.receitas, m.despesas]), 1);

  // Recent transactions
  const recent = useMemo(() => [...filtered].reverse().slice(0, 8), [filtered]);

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>

      {/* Month filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            onClick={() => setSelectedMonth('all')}
            className="btn btn-sm"
            style={{ background: selectedMonth === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: selectedMonth === 'all' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >Tudo</button>
          {availableMonths.slice(0, 6).map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className="btn btn-sm"
              style={{ background: selectedMonth === m ? 'var(--accent)' : 'var(--bg-surface)', color: selectedMonth === m ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
              {m}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="btn btn-icon btn-secondary" disabled={isLoading} title="Sincronizar">
          <RefreshCw size={15} style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPICard
          label="Saldo"
          value={saldo}
          color={saldo >= 0 ? 'var(--green)' : 'var(--red)'}
          bgColor={saldo >= 0 ? 'var(--green-light)' : 'var(--red-light)'}
          icon={<Wallet size={18} />}
        />
        <KPICard label="Receitas" value={receitas} color="var(--green)" bgColor="var(--green-light)" icon={<TrendingUp size={18} />} />
        <KPICard label="Despesas" value={despesas} color="var(--red)" bgColor="var(--red-light)" icon={<TrendingDown size={18} />} />
        <KPICard label="Investimentos" value={investimentos} color="var(--purple)" bgColor="var(--purple-light)" icon={<PiggyBank size={18} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <span className="t-headline">Categorias</span>
              <span className="t-caption">{selectedMonth === 'all' ? 'Geral' : selectedMonth}</span>
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {topCategorias.length === 0 ? (
              <p className="t-caption" style={{ textAlign: 'center', padding: '20px 0' }}>Nenhuma despesa</p>
            ) : topCategorias.map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(val)}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(val / totalDespesas) * 100}%`, background: getCategoriaColor(cat) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <span className="t-headline">Fluxo Mensal</span>
              <BarChart2 size={14} color="var(--text-tertiary)" />
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            {monthlyTrend.length === 0 ? (
              <p className="t-caption" style={{ textAlign: 'center', padding: '20px 0' }}>Sem dados</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                {monthlyTrend.map(({ month, receitas: r, despesas: d }) => (
                  <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, height: 100 }}>
                      <div style={{
                        flex: 1, background: 'var(--green)',
                        height: `${(r / maxVal) * 100}%`, borderRadius: '3px 3px 0 0', opacity: 0.85, minHeight: 2,
                      }} title={`Receita: ${formatBRL(r)}`} />
                      <div style={{
                        flex: 1, background: 'var(--red)',
                        height: `${(d / maxVal) * 100}%`, borderRadius: '3px 3px 0 0', opacity: 0.75, minHeight: 2,
                      }} title={`Despesa: ${formatBRL(d)}`} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{month}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)' }} />
                <span className="t-caption">Receitas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} />
                <span className="t-caption">Despesas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <div className="section-header">
            <span className="t-headline">Lançamentos recentes</span>
            {lastSync && (
              <span className="t-caption">
                Atualizado {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Wallet size={22} /></div>
            <p className="t-subheadline" style={{ marginBottom: 4 }}>Nenhum lançamento</p>
            <p className="t-caption">Adicione sua primeira transação para começar.</p>
          </div>
        ) : (
          <div>
            {recent.map(t => (
              <div key={t.id} className="list-item">
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: t.tipo === 'Entrada' ? 'var(--green-light)' : t.tipo === 'Investimento' ? 'var(--purple-light)' : 'var(--red-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.tipo === 'Entrada' ? <TrendingUp size={16} color="var(--green)" /> : t.tipo === 'Investimento' ? <PiggyBank size={16} color="var(--purple)" /> : <TrendingDown size={16} color="var(--red)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.descricao || '—'}
                  </p>
                  <p className="t-caption">{t.categoria} {t.banco ? `· ${t.banco}` : ''}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: t.tipo === 'Entrada' ? 'var(--green)' : t.tipo === 'Investimento' ? 'var(--purple)' : 'var(--text-primary)' }}>
                    {t.tipo === 'Entrada' ? '+' : '-'}{formatBRL(Math.abs(t.valor))}
                  </p>
                  <p className="t-caption">{t.data}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, color, bgColor, icon }: { label: string; value: number; color: string; bgColor: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bgColor, color }}>{icon}</div>
      <p className="t-caption" style={{ marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', color }}>
        {formatBRL(Math.abs(value))}
      </p>
    </div>
  );
}
