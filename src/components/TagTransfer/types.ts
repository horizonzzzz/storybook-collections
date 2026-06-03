export interface TransferItem {
  id: string | number
  label: string
  raw?: Record<string, unknown>
}

export interface TransferColumn {
  prop: string
  label: string
  minWidth?: string | number
}

export interface TransferTableData {
  rows: Record<string, unknown>[]
  totalRows?: number
  pageNo?: number
  pageSize?: number
}
