import { calculateSRS, createInitialSRS } from '@/lib/srs'
import type { SRSRecord } from '@/types'

describe('createInitialSRS', () => {
  it('creates a record with default values', () => {
    const record = createInitialSRS('scope-001', '2024-01-01')

    expect(record.questionId).toBe('scope-001')
    expect(record.ease).toBe(2.5)
    expect(record.interval).toBe(1)
    expect(record.repetitions).toBe(0)
    expect(record.nextReview).toBe('2024-01-02')
    expect(record.lastReview).toBe('2024-01-01')
  })
})

describe('calculateSRS', () => {
  const makeRecord = (overrides: Partial<SRSRecord> = {}): SRSRecord => ({
    questionId: 'scope-001',
    ease: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: '2024-01-02',
    lastReview: '2024-01-01',
    ...overrides,
  })

  describe('correct answer', () => {
    it('sets interval to 1 on first correct answer', () => {
      const current = makeRecord({ repetitions: 0 })
      const result = calculateSRS(current, true, '2024-01-02')

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.nextReview).toBe('2024-01-03')
    })

    it('sets interval to 6 on second correct answer', () => {
      const current = makeRecord({ repetitions: 1, interval: 1 })
      const result = calculateSRS(current, true, '2024-01-03')

      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
      expect(result.nextReview).toBe('2024-01-09')
    })

    it('multiplies interval by ease factor on subsequent correct answers', () => {
      const current = makeRecord({
        repetitions: 2,
        interval: 6,
        ease: 2.5,
      })
      const result = calculateSRS(current, true, '2024-01-09')

      expect(result.interval).toBe(15) // Math.round(6 * 2.5)
      expect(result.repetitions).toBe(3)
    })

    it('increases ease factor on correct answer', () => {
      const current = makeRecord({ ease: 2.5 })
      const result = calculateSRS(current, true, '2024-01-02')

      expect(result.ease).toBe(2.6)
    })

    it('creates progressive intervals with consecutive correct answers', () => {
      let record = makeRecord()
      const today = '2024-01-02'

      // First correct: interval 1
      record = calculateSRS(record, true, today)
      expect(record.interval).toBe(1)

      // Second correct: interval 6
      record = calculateSRS(record, true, today)
      expect(record.interval).toBe(6)

      // Third correct: interval * ease (6 * 2.7 = 16.2 -> 16)
      record = calculateSRS(record, true, today)
      expect(record.interval).toBe(16)

      // Fourth correct: 16 * 2.8 = 44.8 -> 45
      record = calculateSRS(record, true, today)
      expect(record.interval).toBe(45)
    })
  })

  describe('incorrect answer', () => {
    it('resets interval to 1 and repetitions to 0', () => {
      const current = makeRecord({
        repetitions: 5,
        interval: 30,
      })
      const result = calculateSRS(current, false, '2024-02-01')

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
      expect(result.nextReview).toBe('2024-02-02')
    })

    it('decreases ease factor on incorrect answer', () => {
      const current = makeRecord({ ease: 2.5 })
      const result = calculateSRS(current, false, '2024-01-02')

      expect(result.ease).toBe(2.3)
    })

    it('never lets ease factor go below 1.3', () => {
      const current = makeRecord({ ease: 1.3 })
      const result = calculateSRS(current, false, '2024-01-02')

      expect(result.ease).toBe(1.3)
    })

    it('clamps ease factor to minimum on repeated failures', () => {
      let record = makeRecord({ ease: 1.5 })

      record = calculateSRS(record, false, '2024-01-02')
      expect(record.ease).toBe(1.3)

      record = calculateSRS(record, false, '2024-01-03')
      expect(record.ease).toBe(1.3)
    })
  })

  it('preserves questionId through calculations', () => {
    const current = makeRecord({ questionId: 'closure-003' })

    const correctResult = calculateSRS(current, true, '2024-01-02')
    expect(correctResult.questionId).toBe('closure-003')

    const incorrectResult = calculateSRS(current, false, '2024-01-02')
    expect(incorrectResult.questionId).toBe('closure-003')
  })

  it('sets lastReview to today', () => {
    const current = makeRecord()

    const result = calculateSRS(current, true, '2024-06-15')
    expect(result.lastReview).toBe('2024-06-15')
  })
})
