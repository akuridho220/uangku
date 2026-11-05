export type AccountRow = {
  id: string
  name: string
  sort_order: number
  is_archived: boolean
  balance: number
  opening_balance: number
}

export type CashflowRow = {
  id: string
  code: string
  label: string
  description: string | null
  color: string | null
}

export type CategoryRow = {
  id: string
  cashflow_id: string
  name: string
  target_amount: number | null
  sort_order: number
  is_archived: boolean
}

export type TransactionRow = {
  id: string
  tx_date: string
  category_id: string | null
  description: string
  amount: number
  account_in_id: string | null
  account_out_id: string | null
}

export type BudgetRow = {
  id: string
  category_id: string
  year: number
  month: number
  amount: number
}

export const CASHFLOW_ORDER = [
  "income",
  "spending",
  "bills",
  "saving_invest",
  "financial_goals",
]