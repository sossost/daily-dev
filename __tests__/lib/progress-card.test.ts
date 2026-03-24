import type { Topic, TopicStat } from '@/types'
import { DEFAULT_USER_PROGRESS } from '@/types'
import {
  renderProgressCard,
  downloadCanvasAsImage,
  shareCanvasImage,
  type ProgressCardData,
} from '@/lib/progress-card'

function createMockContext(): CanvasRenderingContext2D {
  return {
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fillText: jest.fn(),
    fillRect: jest.fn(),
    set fillStyle(_v: string) { /* noop */ },
    set strokeStyle(_v: string) { /* noop */ },
    set lineWidth(_v: number) { /* noop */ },
    set lineCap(_v: string) { /* noop */ },
    set font(_v: string) { /* noop */ },
    set textAlign(_v: string) { /* noop */ },
    set textBaseline(_v: string) { /* noop */ },
  } as unknown as CanvasRenderingContext2D
}

function createMockCanvas(ctx: CanvasRenderingContext2D): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  jest.spyOn(canvas, 'getContext').mockReturnValue(ctx)
  return canvas
}

function makeTopicStats(
  overrides: Partial<Record<Topic, Partial<TopicStat>>> = {},
): Record<Topic, TopicStat> {
  const base = { ...DEFAULT_USER_PROGRESS.topicStats }
  for (const [topic, partial] of Object.entries(overrides)) {
    base[topic as Topic] = { ...base[topic as Topic], ...partial }
  }
  return base
}

function makeCardData(overrides: Partial<ProgressCardData> = {}): ProgressCardData {
  return {
    overallAccuracy: 75,
    totalSessions: 10,
    currentStreak: 3,
    longestStreak: 7,
    totalAnswered: 100,
    topicStats: makeTopicStats(),
    ...overrides,
  }
}

describe('renderProgressCard', () => {
  it('sets canvas dimensions', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData())

    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(400)
  })

  it('draws DailyDev title', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData())

    expect(ctx.fillText).toHaveBeenCalledWith('DailyDev', expect.any(Number), expect.any(Number))
  })

  it('renders accuracy percentage', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData({ overallAccuracy: 85 }))

    expect(ctx.fillText).toHaveBeenCalledWith('85%', expect.any(Number), expect.any(Number))
  })

  it('renders session count', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData({ totalSessions: 42 }))

    expect(ctx.fillText).toHaveBeenCalledWith('42', expect.any(Number), expect.any(Number))
  })

  it('renders top topics when available', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData({
      topicStats: makeTopicStats({
        scope: { totalAnswered: 10, correctAnswers: 9, accuracy: 90 },
        closure: { totalAnswered: 8, correctAnswers: 6, accuracy: 75 },
      }),
    }))

    const calls = (ctx.fillText as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    expect(calls).toContain('스코프')
    expect(calls).toContain('클로저')
  })

  it('renders empty state when no topics attempted', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData())

    const calls = (ctx.fillText as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    expect(calls).toContain('아직 학습한 토픽이 없습니다')
  })

  it('draws accuracy ring arc', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    renderProgressCard(canvas, makeCardData({ overallAccuracy: 50 }))

    // Arc should be called for background ring and progress ring
    expect(ctx.arc).toHaveBeenCalledTimes(2)
  })

  it('handles zero accuracy gracefully', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    expect(() => renderProgressCard(canvas, makeCardData({ overallAccuracy: 0 }))).not.toThrow()
  })

  it('does nothing when context is null', () => {
    const canvas = document.createElement('canvas')
    jest.spyOn(canvas, 'getContext').mockReturnValue(null)

    expect(() => renderProgressCard(canvas, makeCardData())).not.toThrow()
  })
})

describe('downloadCanvasAsImage', () => {
  it('creates and clicks a download link', () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)
    jest.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,abc')

    const clickSpy = jest.fn()
    const mockLink = { download: '', href: '', click: clickSpy }
    jest.spyOn(document, 'createElement').mockReturnValueOnce(mockLink as unknown as HTMLAnchorElement)

    downloadCanvasAsImage(canvas, 'test.png')

    expect(mockLink.download).toBe('test.png')
    expect(mockLink.href).toBe('data:image/png;base64,abc')
    expect(clickSpy).toHaveBeenCalled()
  })
})

describe('shareCanvasImage', () => {
  it('returns false when navigator.share is not available', async () => {
    const ctx = createMockContext()
    const canvas = createMockCanvas(ctx)

    const result = await shareCanvasImage(canvas)

    expect(result).toBe(false)
  })
})
