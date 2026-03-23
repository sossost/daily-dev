import { shuffle } from '@/lib/shuffle'

describe('shuffle', () => {
  it('returns a new array without mutating the original', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    shuffle(original)
    expect(original).toEqual(copy)
  })

  it('returns an array with the same elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(result.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('returns an array of the same length', () => {
    const input = [10, 20, 30]
    const result = shuffle(input)
    expect(result).toHaveLength(3)
  })

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([])
  })

  it('handles single-element array', () => {
    expect(shuffle([42])).toEqual([42])
  })

  it('accepts readonly arrays', () => {
    const input: readonly number[] = [1, 2, 3]
    const result = shuffle(input)
    expect(result.sort()).toEqual([1, 2, 3])
  })
})
