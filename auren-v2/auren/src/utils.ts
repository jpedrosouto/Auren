// AUREN — Utilities

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatBRLShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return formatBRL(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Accepts DD/MM/YYYY or YYYY-MM-DD
  let parts: string[];
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayBR(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function currentMonthRef(): string {
  const d = new Date();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getMonthsList(): string[] {
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const year = new Date().getFullYear();
  const result: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) {
    months.forEach(m => result.push(`${m} ${y}`));
  }
  return result;
}

export const CATEGORIAS = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Vestuário', 'Serviços', 'Assinaturas', 'Investimentos',
  'Salário', 'Freelance', 'Dividendos', 'Outros Rendimentos',
  'Cartão de Crédito', 'Empréstimo', 'Transferência', 'Poupança', 'Outros',
];

export const BANCOS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil',
  'Inter', 'C6 Bank', 'BTG Pactual', 'Sicoob', 'XP Investimentos',
  'Rico', 'Clear', 'Carteira', 'Outro',
];

export const TIPOS = ['Saída', 'Entrada', 'Investimento', 'Cartão'];

export const METODOS = [
  'PIX', 'Débito', 'Crédito', 'Transferência', 'Boleto', 'Dinheiro', 'Débito Automático',
];

export const CATEGORIA_COLORS: Record<string, string> = {
  'Alimentação':       '#FF9500',
  'Moradia':           '#AF52DE',
  'Transporte':        '#0057FF',
  'Saúde':             '#FF3B30',
  'Educação':          '#34C759',
  'Lazer':             '#FF2D55',
  'Vestuário':         '#5856D6',
  'Serviços':          '#32ADE6',
  'Assinaturas':       '#636366',
  'Investimentos':     '#30D158',
  'Salário':           '#34C759',
  'Freelance':         '#64D2FF',
  'Dividendos':        '#30D158',
  'Outros Rendimentos':'#34C759',
  'Cartão de Crédito': '#FF6B35',
  'Empréstimo':        '#FF3B30',
  'Transferência':     '#8E8E93',
  'Poupança':          '#30D158',
  'Outros':            '#8E8E93',
};

export function getCategoriaColor(categoria: string): string {
  return CATEGORIA_COLORS[categoria] || '#8E8E93';
}

export function groupByMonth(transactions: any[]): Record<string, any[]> {
  return transactions.reduce((acc, t) => {
    const key = t.mesReferencia || 'Sem mês';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, any[]>);
}

export function calcSaldo(transactions: any[]): { receitas: number; despesas: number; investimentos: number; saldo: number } {
  let receitas = 0, despesas = 0, investimentos = 0;
  transactions.forEach(t => {
    const v = Math.abs(t.valor);
    if (t.tipo === 'Entrada') receitas += v;
    else if (t.tipo === 'Investimento') investimentos += v;
    else despesas += v;
  });
  return { receitas, despesas, investimentos, saldo: receitas - despesas - investimentos };
}

// Converts any mesReferencia format to a sortable key (YYYY-MM)
export function normalizeMesRef(raw: string): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const MONTHS_PT: Record<string, string> = {
    janeiro:'01', fevereiro:'02', março:'03', marco:'03',
    abril:'04', maio:'05', junho:'06', julho:'07',
    agosto:'08', setembro:'09', outubro:'10', novembro:'11', dezembro:'12',
  };
  const parts = raw.toLowerCase().trim().split(/\s+/);
  if (parts.length === 2) {
    const m = MONTHS_PT[parts[0]];
    if (m && parts[1]) return `${parts[1]}-${m}`;
    const m2 = MONTHS_PT[parts[1]];
    if (m2 && parts[0]) return `${parts[0]}-${m2}`;
  }
  if (/^\d{2}\/\d{4}$/.test(raw)) {
    const [mm, yyyy] = raw.split('/');
    return `${yyyy}-${mm}`;
  }
  return raw;
}

export function formatMesLabel(raw: string): string {
  const normalized = normalizeMesRef(raw);
  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [y, m] = normalized.split('-');
    const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${MONTHS[parseInt(m) - 1]}/${y.slice(2)}`;
  }
  return raw;
}
