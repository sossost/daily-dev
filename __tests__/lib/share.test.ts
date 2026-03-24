import { buildShareText, shareResult } from '@/lib/share'

describe('buildShareText', () => {
  it('formats correct and total into share message', () => {
    const text = buildShareText(8, 10)

    expect(text).toContain('10문제 중 8개 맞췄어요')
    expect(text).toContain('https://daily5.dev')
  })

  it('handles zero correct', () => {
    const text = buildShareText(0, 10)

    expect(text).toContain('10문제 중 0개 맞췄어요')
  })

  it('handles perfect score', () => {
    const text = buildShareText(10, 10)

    expect(text).toContain('10문제 중 10개 맞췄어요')
  })

  it('returns fallback text for negative correct', () => {
    const text = buildShareText(-1, 10)

    expect(text).toContain('퀴즈를 풀었어요')
    expect(text).not.toContain('문제 중')
  })

  it('returns fallback text when correct exceeds total', () => {
    const text = buildShareText(11, 10)

    expect(text).toContain('퀴즈를 풀었어요')
  })

  it('returns fallback text for NaN values', () => {
    const text = buildShareText(NaN, 10)

    expect(text).toContain('퀴즈를 풀었어요')
  })

  it('returns fallback text for zero total', () => {
    const text = buildShareText(0, 0)

    expect(text).toContain('퀴즈를 풀었어요')
  })
})

describe('shareResult', () => {
  const originalNavigator = { ...navigator }

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  it('uses Web Share API when available', async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: shareMock, clipboard: null },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('shared')
    expect(shareMock).toHaveBeenCalledWith({
      text: expect.stringContaining('8개 맞췄어요'),
    })
  })

  it('returns cancelled when user dismisses share sheet (AbortError)', async () => {
    const abortError = new DOMException('User cancelled', 'AbortError')
    const shareMock = jest.fn().mockRejectedValue(abortError)
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: shareMock, clipboard: null },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('cancelled')
  })

  it('falls back to clipboard on NotAllowedError', async () => {
    const notAllowed = new DOMException('Permission denied', 'NotAllowedError')
    const shareMock = jest.fn().mockRejectedValue(notAllowed)
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: shareMock, clipboard: { writeText: writeTextMock } },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('copied')
    expect(writeTextMock).toHaveBeenCalled()
  })

  it('falls back to clipboard when share throws non-abort error', async () => {
    const shareMock = jest.fn().mockRejectedValue(new Error('Not allowed'))
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: shareMock, clipboard: { writeText: writeTextMock } },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('copied')
    expect(writeTextMock).toHaveBeenCalled()
  })

  it('uses clipboard when share is not available', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: undefined, clipboard: { writeText: writeTextMock } },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('copied')
  })

  it('returns failed when both share and clipboard fail', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { share: undefined, clipboard: undefined },
      writable: true,
      configurable: true,
    })

    const result = await shareResult(8, 10)

    expect(result).toBe('failed')
  })
})
