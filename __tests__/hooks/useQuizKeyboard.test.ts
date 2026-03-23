import { renderHook } from '@testing-library/react'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('useQuizKeyboard', () => {
  it('calls onSelect with correct index when 1–4 pressed before answering', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: false, onSelect, onNext }),
    )

    fireKey('1')
    expect(onSelect).toHaveBeenCalledWith(0)

    fireKey('2')
    expect(onSelect).toHaveBeenCalledWith(1)

    fireKey('3')
    expect(onSelect).toHaveBeenCalledWith(2)

    fireKey('4')
    expect(onSelect).toHaveBeenCalledWith(3)

    expect(onNext).not.toHaveBeenCalled()
  })

  it('does not call onSelect when already answered', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: true, onSelect, onNext }),
    )

    fireKey('1')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onNext when Enter pressed after answering', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: true, onSelect, onNext }),
    )

    fireKey('Enter')
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when Space pressed after answering', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: true, onSelect, onNext }),
    )

    fireKey(' ')
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('does not call onNext when not yet answered', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: false, onSelect, onNext }),
    )

    fireKey('Enter')
    fireKey(' ')
    expect(onNext).not.toHaveBeenCalled()
  })

  it('ignores keys outside 1–4 range', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    renderHook(() =>
      useQuizKeyboard({ isAnswered: false, onSelect, onNext }),
    )

    fireKey('0')
    fireKey('5')
    fireKey('a')
    fireKey('Escape')

    expect(onSelect).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('cleans up event listener on unmount', () => {
    const onSelect = jest.fn()
    const onNext = jest.fn()

    const { unmount } = renderHook(() =>
      useQuizKeyboard({ isAnswered: false, onSelect, onNext }),
    )

    unmount()

    fireKey('1')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
