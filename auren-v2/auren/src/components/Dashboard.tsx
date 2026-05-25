import React, { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, RefreshCw,
  PiggyBank, ArrowUpRight, ArrowDownRight, Minus, Sparkles
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatBRL, formatBRLShort, calcSaldo, getCategoriaColor, groupByMonth, normalizeMesRef, formatMesLabel } from '../utils';

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = 54; const cx = size / 2; const cy = size / 2;
  let cumulative = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const start = cumulative;
    cumulative += pct;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = pct > 0.5 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="var(--bg-primary)" />
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.85}>
          <title>{s.label}: {formatBRL(s.value)} ({(s.pct * 100).toFixed(1)}%)</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={r * 0.58} fill="var(--bg-surface)" />
    </svg>
  );
}

// ─── Area / Bar chart ─────────────────────────────────────────────────────────
function MonthlyChart({ data }: { data: { label: string; receitas: number; despesas: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.receitas, d.despesas]), 1);
  const W = 100; const H = 80;
  const pts = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * W},${H - (v / maxVal) * H}`).join(' ');

  const recPts = data.map(d => d.receitas);
  const desPts = data.map(d => d.despesas);

  const polyline = (arr: number[], color: string) => (
    <polyline
      points={pts(arr)}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );

  const area = (arr: number[], color: string) => {
    const p = pts(arr);
    const last = `${W},${H} 0,${H}`;
    return <polygon points={`${p} ${last}`} fill={color} opacity="0.10" />;
  };

  return (
    <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width="100%" height="100%" preserveAspectRatio="none">
      {area(recPts, 'var(--green)')}
      {area(desPts, 'var(--red)')}
      {polyline(recPts, 'var(--green)')}
      {polyline(desPts, 'var(--red)')}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={(i / (data.length - 1)) * W} cy={H - (d.receitas / maxVal) * H} r="2.5" fill="var(--green)" />
          <circle cx={(i / (data.length - 1)) * W} cy={H - (d.despesas / maxVal) * H} r="2.5" fill="var(--red)" />
        </g>
      ))}
    </svg>
  );
}

// ─── Patrimony line ───────────────────────────────────────────────────────────
function PatrimonyChart({ data }: { data: { label: string; saldo: number }[] }) {
  if (data.length < 2) return null;
  const values = data.map(d => d.saldo);
  const min = Math.min(...values);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const W = 100; const H = 60;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * H}`
  ).join(' ');
  const lastPositive = values[values.length - 1] >= 0;

  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} width="100%" height="100%" preserveAspectRatio="none">
      <polygon
        points={`${pts} ${W},${H} 0,${H}`}
        fill={lastPositive ? 'var(--green)' : 'var(--red)'}
        opacity="0.12"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={lastPositive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Trend badge ──────────────────────────────────────────────────────────────
function Trend({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  if (previous === 0) return null;
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const positive = invert ? diff < 0 : diff > 0;
  const color = positive ? 'var(--green)' : 'var(--red)';
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color }}>
      <Icon size={12} />{Math.abs(diff).toFixed(1)}%
    </span>
  );
}

// ─── Smart Insight ────────────────────────────────────────────────────────────
function SmartInsights({ transactions }: { transactions: any[] }) {
  const insights = useMemo(() => {
    const result: { type: 'warn' | 'ok' | 'info'; text: string }[] = [];
    const byMonth = groupByMonth(transactions);
    const months = Object.keys(byMonth).sort((a, b) => normalizeMesRef(a).localeCompare(normalizeMesRef(b)));
    if (months.length < 2) return result;

    const lastMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    const last = calcSaldo(byMonth[lastMonth]);
    const prev = calcSaldo(byMonth[prevMonth]);

    if (last.despesas > prev.despesas * 1.2) {
      result.push({ type: 'warn', text: `Despesas em ${formatMesLabel(lastMonth)} aumentaram ${((last.despesas / prev.despesas - 1) * 100).toFixed(0)}% em relação ao mês anterior.` });
    }
    if (last.saldo < 0) {
      result.push({ type: 'warn', text: `Saldo negativo em ${formatMesLabel(lastMonth)}: ${formatBRL(last.saldo)}.` });
    } else if (last.saldo > 0) {
      result.push({ type: 'ok', text: `Saldo positivo de ${formatBRL(last.saldo)} em ${formatMesLabel(lastMonth)}.` });
    }
    if (last.investimentos > 0) {
      const txRate = last.receitas > 0 ? (last.investimentos / last.receitas) * 100 : 0;
      result.push({ type: 'info', text: `Taxa de investimento: ${txRate.toFixed(1)}% da receita em ${formatMesLabel(lastMonth)}.` });
    }

    // Top expense category
    const catMap: Record<string, number> = {};
    transactions.filter(t => t.tipo !== 'Entrada' && t.tipo !== 'Investimento')
      .forEach(t => { const c = t.categoria || 'Outros'; catMap[c] = (catMap[c] || 0) + Math.abs(t.valor); });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const total = Object.values(catMap).reduce((s, v) => s + v, 0);
      result.push({ type: 'info', text: `"${topCat[0]}" é sua maior categoria de gasto: ${((topCat[1] / total) * 100).toFixed(0)}% do total.` });
    }
    return result.slice(0, 3);
  }, [transactions]);

  if (insights.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="var(--accent)" />
            </div>
            <span className="t-headline">Análise inteligente</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
            borderRadius: 10,
            background: ins.type === 'warn' ? 'var(--orange-light)' : ins.type === 'ok' ? 'var(--green-light)' : 'var(--accent-light)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
              background: ins.type === 'warn' ? 'var(--orange)' : ins.type === 'ok' ? 'var(--green)' : 'var(--accent)',
            }} />
            <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)' }}>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { transactions, isLoading, refresh, lastSync } = useData();

  // Sort months by normalized key
  const sortedMonths = useMemo(() => {
    const set = new Set(transactions.map(t => t.mesReferencia).filter(Boolean));
    return Array.from(set).sort((a, b) => normalizeMesRef(b).localeCompare(normalizeMesRef(a)));
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const filtered = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.mesReferencia === selectedMonth);
  }, [transactions, selectedMonth]);

  const { receitas, despesas, investimentos, saldo } = useMemo(() => calcSaldo(filtered), [filtered]);

  // Previous month comparison
  const prevMonthData = useMemo(() => {
    if (selectedMonth === 'all' || sortedMonths.length < 2) return null;
    const idx = sortedMonths.indexOf(selectedMonth);
    if (idx < 0 || idx >= sortedMonths.length - 1) return null;
    const prev = sortedMonths[idx + 1];
    return calcSaldo(transactions.filter(t => t.mesReferencia === prev));
  }, [selectedMonth, sortedMonths, transactions]);

  // Category breakdown for donut
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.tipo !== 'Entrada' && t.tipo !== 'Investimento')
      .forEach(t => {
        const c = t.categoria || 'Outros';
        map[c] = (map[c] || 0) + Math.abs(t.valor);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([label, value]) => ({ label, value, color: getCategoriaColor(label) }));
  }, [filtered]);

  const totalDespCat = catData.reduce((s, d) => s + d.value, 0) || 1;

  // Monthly trend (last 8 months)
  const monthlyTrend = useMemo(() => {
    const byMonth = groupByMonth(transactions);
    return Object.keys(byMonth)
      .sort((a, b) => normalizeMesRef(a).localeCompare(normalizeMesRef(b)))
      .slice(-8)
      .map(month => ({
        label: formatMesLabel(month),
        ...calcSaldo(byMonth[month] as any[]),
      }));
  }, [transactions]);

  // Patrimony evolution (cumulative saldo per month)
  const patrimony = useMemo(() => {
    const byMonth = groupByMonth(transactions);
    let cumulative = 0;
    return Object.keys(byMonth)
      .sort((a, b) => normalizeMesRef(a).localeCompare(normalizeMesRef(b)))
      .map(month => {
        const { saldo: s } = calcSaldo(byMonth[month] as any[]);
        cumulative += s;
        return { label: formatMesLabel(month), saldo: cumulative };
      });
  }, [transactions]);

  // Recent transactions
  const recent = useMemo(() => [...filtered].reverse().slice(0, 6), [filtered]);

  return (
    <div className="page-content" style={{ paddingBottom: 48 }}>

      {/* Month filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, paddingBottom: 2 }} className="nav-tabs" >
          {['all', ...sortedMonths.slice(0, 8)].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s',
                background: selectedMonth === m ? 'var(--accent)' : 'var(--bg-surface)',
                color: selectedMonth === m ? '#fff' : 'var(--text-secondary)',
                boxShadow: selectedMonth === m ? '0 2px 8px rgba(0,87,255,0.25)' : 'none',
                border: selectedMonth === m ? 'none' : '1px solid var(--border)',
              }}>
              {m === 'all' ? 'Todos' : formatMesLabel(m)}
            </button>
          ))}
        </div>
        <button onClick={refresh} className="btn btn-icon btn-secondary" disabled={isLoading} title="Sincronizar">
          <RefreshCw size={15} style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Saldo', value: saldo, prev: prevMonthData?.saldo, color: saldo >= 0 ? 'var(--green)' : 'var(--red)', bg: saldo >= 0 ? 'var(--green-light)' : 'var(--red-light)', icon: <Wallet size={16} /> },
          { label: 'Receitas', value: receitas, prev: prevMonthData?.receitas, color: 'var(--green)', bg: 'var(--green-light)', icon: <TrendingUp size={16} /> },
          { label: 'Despesas', value: despesas, prev: prevMonthData?.despesas, color: 'var(--red)', bg: 'var(--red-light)', icon: <TrendingDown size={16} />, invert: true },
          { label: 'Investimentos', value: investimentos, prev: prevMonthData?.investimentos, color: 'var(--purple)', bg: 'var(--purple-light)', icon: <PiggyBank size={16} /> },
        ].map(({ label, value, prev, color, bg, icon, invert }) => (
          <div key={label} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              {prev !== undefined && <Trend current={value} previous={prev} invert={invert} />}
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color, lineHeight: 1 }}>
              {formatBRLShort(Math.abs(value))}
            </p>
            {prev !== undefined && (
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Ant: {formatBRLShort(Math.abs(prev))}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Smart Insights */}
      <SmartInsights transactions={transactions} />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Donut - Categories */}
        <div className="card">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="t-headline">Despesas por categoria</span>
              <span className="t-caption">{formatBRL(totalDespCat)}</span>
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 20, alignItems: 'center' }}>
            {catData.length === 0 ? (
              <p className="t-caption">Nenhuma despesa no período</p>
            ) : (
              <>
                <DonutChart data={catData} size={148} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {catData.slice(0, 6).map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: color, width: `${(value / totalDespCat) * 100}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{((value / totalDespCat) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="t-headline">Fluxo mensal</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--green)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Rec</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--red)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Desp</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 20px 8px', height: 120 }}>
            {monthlyTrend.length >= 2 ? <MonthlyChart data={monthlyTrend} /> : <p className="t-caption" style={{ textAlign: 'center', paddingTop: 40 }}>Dados insuficientes</p>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 16px' }}>
            {monthlyTrend.slice(-4).map(m => (
              <span key={m.label} style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{m.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Patrimony evolution */}
      {patrimony.length >= 3 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span className="t-headline">Evolução patrimonial acumulada</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: patrimony[patrimony.length - 1]?.saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {formatBRL(patrimony[patrimony.length - 1]?.saldo || 0)}
              </span>
            </div>
          </div>
          <div style={{ padding: '8px 20px 8px', height: 90 }}>
            <PatrimonyChart data={patrimony} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 14px' }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{patrimony[0]?.label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{patrimony[patrimony.length - 1]?.label}</span>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <div className="section-header">
            <span className="t-headline">Lançamentos recentes</span>
            {lastSync && (
              <span className="t-caption">
                {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
        ) : recent.map(t => {
          const isEntrada = t.tipo === 'Entrada';
          const isInv = t.tipo === 'Investimento';
          const color = isEntrada ? 'var(--green)' : isInv ? 'var(--purple)' : 'var(--red)';
          const bg = isEntrada ? 'var(--green-light)' : isInv ? 'var(--purple-light)' : 'var(--red-light)';
          return (
            <div key={t.id} className="list-item">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
                {isEntrada ? <TrendingUp size={15} /> : isInv ? <PiggyBank size={15} /> : <TrendingDown size={15} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao || '—'}</p>
                <p className="t-caption">{t.categoria}{t.banco ? ` · ${t.banco}` : ''}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>
                  {isEntrada ? '+' : '-'}{formatBRL(Math.abs(t.valor))}
                </p>
                <p className="t-caption">{t.data}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
