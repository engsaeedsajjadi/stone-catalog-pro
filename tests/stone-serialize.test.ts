import { describe, expect, it } from 'vitest'

import {
  getInventory,
  getInventoryNumber,
  serializeStone,
  serializeStones,
  PUBLIC_PRICE_TYPES,
} from '@/lib/stone-serialize'

const legacyStone = {
  id: 'stone-1',
  name: 'سنگ تست',
  prices: [
    { type: 'PER_SQM', amount: 100 },
    { type: 'WHOLESALE', amount: 70 },
    { type: 'PARTNER', amount: 60 },
    { type: 'PROJECT', amount: 55 },
  ],
  inventory: [
    {
      id: 'inv-1',
      slabCount: 12,
      totalSqm: 120,
      reservedSqm: 20,
      availableSqm: 100,
      warehouse: { name: 'انبار مرکزی', code: 'MAIN' },
    },
  ],
}

describe('stone serialize', () => {
  it('flattens the array-shaped inventory into an object', () => {
    const result = serializeStone(legacyStone) as Record<string, any>

    expect(Array.isArray(result.inventory)).toBe(false)
    expect(result.inventory.totalSqm).toBe(120)
    expect(result.inventory.availableSqm).toBe(100)
    expect(result.inventory.warehouseName).toBe('انبار مرکزی')
    expect(result.inventory.warehouseCode).toBe('MAIN')
  })

  it('leaves an already-normalized inventory untouched', () => {
    const normalized = {
      ...legacyStone,
      inventory: { totalSqm: 5, reservedSqm: 1, availableSqm: 4 },
    }

    const result = serializeStone(normalized) as Record<string, any>
    expect(result.inventory.availableSqm).toBe(4)
  })

  it('handles stones without inventory', () => {
    const result = serializeStone({ id: 'x', inventory: [] }) as Record<string, any>
    expect(result.inventory).toBeNull()
  })

  it('hides internal price tiers from anonymous visitors', () => {
    const result = serializeStone(legacyStone, { restrictPrices: true }) as Record<string, any>

    expect(result.prices.map((price: any) => price.type)).toEqual(['PER_SQM'])
    for (const type of result.prices.map((price: any) => price.type)) {
      expect(PUBLIC_PRICE_TYPES).toContain(type)
    }
  })

  it('keeps every price tier for signed-in users', () => {
    const result = serializeStone(legacyStone) as Record<string, any>
    expect(result.prices).toHaveLength(4)
  })

  it('serializes lists', () => {
    const result = serializeStones([legacyStone, { id: 'stone-2' }]) as Array<Record<string, any>>
    expect(result).toHaveLength(2)
    expect(result[1].inventory).toBeNull()
  })
})

describe('client-side inventory helpers', () => {
  it('reads both shapes', () => {
    expect(getInventoryNumber(legacyStone, 'totalSqm')).toBe(120)
    expect(getInventoryNumber({ inventory: { totalSqm: 7 } }, 'totalSqm')).toBe(7)
    expect(getInventoryNumber({ inventory: null }, 'totalSqm')).toBe(0)
  })

  it('returns null when there is no inventory record', () => {
    expect(getInventory({ inventory: [] })).toBeNull()
    expect(getInventory({})).toBeNull()
  })
})
