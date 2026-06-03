import { describe, expect, it } from 'vitest'

import {
  appendRowsToSelection,
  buildTransferItem,
  removeRowsFromSelection,
  restoreConfirmedSelection
} from './useTagTransferSelection'

describe('TagTransfer selection helpers', () => {
  it('normalizes a table row into the public transfer item shape', () => {
    expect(buildTransferItem({ uid: 1, title: 'Alpha' }, 'uid', 'title')).toEqual(
      {
        id: 1,
        label: 'Alpha',
        raw: { uid: 1, title: 'Alpha' }
      }
    )
  })

  it('adds page rows without duplicating existing confirmed items', () => {
    const next = appendRowsToSelection(
      [{ id: 1, label: 'Alpha' }],
      [
        { uid: 1, title: 'Alpha' },
        { uid: 2, title: 'Beta' }
      ],
      'uid',
      'title'
    )

    expect(next).toEqual([
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Beta', raw: { uid: 2, title: 'Beta' } }
    ])
  })

  it('removes only the rows that were unchecked on the current page', () => {
    const next = removeRowsFromSelection(
      [
        { id: 1, label: 'Alpha' },
        { id: 2, label: 'Beta' },
        { id: 3, label: 'Gamma' }
      ],
      [{ uid: 2 }, { uid: 3 }],
      'uid'
    )

    expect(next).toEqual([{ id: 1, label: 'Alpha' }])
  })

  it('restores dialog working state from the last confirmed value', () => {
    const source = [{ id: 9, label: 'Pinned' }]
    const restored = restoreConfirmedSelection(source)

    expect(restored).toEqual([{ id: 9, label: 'Pinned' }])
    expect(restored).not.toBe(source)
  })
})
