// AUREN — Google Sheets Data Service
import googleAuth from './googleAuth';

export const SPREADSHEET_ID_KEY = 'auren_spreadsheet_id';

function getSpreadsheetId(): string {
  return localStorage.getItem(SPREADSHEET_ID_KEY) || '';
}

async function req(url: string, options: RequestInit = {}): Promise<any> {
  const token = googleAuth.getAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH_REQUIRED');
    if (res.status === 403) throw new Error('PERMISSION_DENIED');
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function listSheets(): Promise<any[]> {
  const id = getSpreadsheetId();
  if (!id) throw new Error('SPREADSHEET_NOT_SET');
  const data = await req(`https://sheets.googleapis.com/v4/spreadsheets/${id}`);
  return data.sheets || [];
}

export async function getFirstSheetName(): Promise<string> {
  const sheets = await listSheets();
  return sheets[0]?.properties?.title || 'Sheet1';
}

function parseBRL(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const clean = String(raw).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export interface Transaction {
  id: number;
  data: string;
  mesReferencia: string;
  valor: number;
  descricao: string;
  categoria: string;
  banco: string;
  tipo: string;       // Entrada | Saída | Investimento | Cartão
  metodo: string;
  observacoes: string;
  parcelas: string;
  responsavel: string;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const id = getSpreadsheetId();
  if (!id) throw new Error('SPREADSHEET_NOT_SET');
  const sheetName = await getFirstSheetName();
  const range = `${sheetName}!A1:L50000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`;
  const data = await req(url);

  if (!data.values || data.values.length < 2) return [];

  const rows = data.values.slice(1);
  return rows
    .map((row: string[], i: number): Transaction | null => {
      if (!row || row.length < 3) return null;
      return {
        id: i + 1,
        data: row[0] || '',
        mesReferencia: row[1] || '',
        valor: parseBRL(row[2] || '0'),
        descricao: row[3] || '',
        categoria: row[4] || '',
        banco: row[5] || '',
        tipo: row[6] || '',
        metodo: row[7] || '',
        observacoes: row[8] || '',
        parcelas: row[9] || '',
        responsavel: row[10] || '',
      };
    })
    .filter(Boolean) as Transaction[];
}

export async function appendTransaction(t: Omit<Transaction, 'id'>): Promise<void> {
  const id = getSpreadsheetId();
  if (!id) throw new Error('SPREADSHEET_NOT_SET');
  const sheetName = await getFirstSheetName();
  const row = [
    t.data, t.mesReferencia, String(t.valor), t.descricao,
    t.categoria, t.banco, t.tipo, t.metodo, t.observacoes,
    t.parcelas, t.responsavel,
  ];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`;
  await req(url, { method: 'POST', body: JSON.stringify({ values: [row] }) });
}

export async function deleteTransactionRow(rowIndex: number): Promise<void> {
  const id = getSpreadsheetId();
  if (!id) throw new Error('SPREADSHEET_NOT_SET');
  const sheets = await listSheets();
  const sheetId = sheets[0]?.properties?.sheetId ?? 0;
  const realIndex = rowIndex; // rowIndex is 0-based data row; +1 for header
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;
  await req(url, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: realIndex, endIndex: realIndex + 1 },
        },
      }],
    }),
  });
}
