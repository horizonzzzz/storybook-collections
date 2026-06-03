import type { TransferItem } from './types'

export function buildTransferItem(
  row: Record<string, unknown>,
  idKey: string,
  labelKey: string
): TransferItem {
  return {
    id: row[idKey] as string | number,
    label: String(row[labelKey] ?? row[idKey]),
    raw: row
  }
}

export function appendRowsToSelection(
  selection: TransferItem[],
  rows: Record<string, unknown>[],
  idKey: string,
  labelKey: string
) {
  const next = [...selection]

  rows.forEach((row) => {
    const item = buildTransferItem(row, idKey, labelKey)

    if (!next.some((current) => current.id === item.id)) {
      next.push(item)
    }
  })

  return next
}

export function removeRowsFromSelection(
  selection: TransferItem[],
  rows: Record<string, unknown>[],
  idKey: string
) {
  const ids = new Set(rows.map((row) => row[idKey] as string | number))

  return selection.filter((item) => !ids.has(item.id))
}

export function restoreConfirmedSelection(selection: TransferItem[]) {
  return selection.map((item) => ({ ...item }))
}
