# AUREN — Controle Financeiro Inteligente

Sistema de controle financeiro pessoal integrado ao Google Sheets.

---

## Stack

- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS**
- **Google Sheets API v4** + **OAuth 2.0**
- Deploy: **Vercel**

---

## Pré-requisitos

1. Conta Google
2. Planilha Google Sheets com os dados (colunas: Data, Mês Referência, Valor, Descrição, Categoria, Banco, Tipo, Método, Observações, Parcelas, Responsável)
3. Projeto no Google Cloud com Sheets API ativada

---

## Configuração do Google Cloud

### 1. Criar projeto
Acesse [console.cloud.google.com](https://console.cloud.google.com) e crie um novo projeto.

### 2. Ativar APIs
- Acesse **APIs e Serviços > Biblioteca**
- Ative **Google Sheets API**
- Ative **Google+ API** ou **Google Identity**

### 3. Criar credenciais OAuth
- Acesse **APIs e Serviços > Credenciais**
- Clique em **Criar credenciais > ID do cliente OAuth**
- Tipo: **Aplicativo da Web**
- Origens JavaScript autorizadas:
  - `http://localhost:5173` (desenvolvimento)
  - `https://SEU-DOMINIO.vercel.app` (produção)
- Copie o **Client ID**

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`.

Na tela de login:
1. Cole o **Client ID** do Google Cloud
2. Cole o **ID da planilha** (encontrado na URL do Sheets)
3. Clique em **Entrar com Google**

---

## Deploy no Vercel

### Opção A — Via GitHub (recomendado)

1. Faça push deste projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) e conecte o repositório
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Clique em **Deploy**

### Opção B — Via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### Após o deploy

- Copie a URL gerada (ex: `https://auren-xxx.vercel.app`)
- Volte ao Google Cloud > Credenciais > seu OAuth Client ID
- Adicione a URL em **Origens JavaScript autorizadas**
- Salve

---

## Estrutura da planilha

A primeira linha deve ser o cabeçalho (pode ter qualquer nome). As colunas devem estar **nessa ordem**:

| Col | Campo          | Exemplo              |
|-----|----------------|----------------------|
| A   | Data           | 15/05/2025           |
| B   | Mês Referência | Maio 2025            |
| C   | Valor          | 250.00               |
| D   | Descrição      | Supermercado Extra   |
| E   | Categoria      | Alimentação          |
| F   | Banco          | Nubank               |
| G   | Tipo           | Saída                |
| H   | Método         | Débito               |
| I   | Observações    | (opcional)           |
| J   | Parcelas       | (opcional)           |
| K   | Responsável    | (opcional)           |

### Tipos válidos
- `Entrada` — receitas, salário, freelance
- `Saída` — despesas em geral
- `Cartão` — compras no crédito (associa ao cartão pelo campo Banco)
- `Investimento` — aportes em investimentos

---

## Funcionalidades

- **Dashboard** — saldo, receitas, despesas, investimentos; gráfico de fluxo mensal; top categorias
- **Lançamentos** — listagem, filtros, busca, exclusão, adição
- **Checklist** — controle de contas a pagar do mês (armazenado localmente)
- **Cartões** — gestão de cartões de crédito com limite e fatura (armazenado localmente)
- **Investimentos** — portfólio manual + aportes da planilha
- **Resumo** — análise por categoria e histórico mensal, exportação CSV
- **Ajustes** — tema claro/escuro, configuração da planilha, sessão

---

## Segurança

- Nenhum dado é enviado para servidores externos além do Google
- O token OAuth é armazenado no `localStorage` e expira em 1 hora
- O Client ID e ID da planilha ficam apenas no navegador do usuário
