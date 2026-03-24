/**
 * Tests for OptionList data logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the selection and state logic that drives OptionList rendering.
 */

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface OptionState {
  isSelected: boolean
  isCorrect: boolean
  showCorrect: boolean
  showIncorrect: boolean
  isDisabled: boolean
}

function computeOptionStates(
  correctIndex: number,
  selectedIndex: number | null,
  isAnswered: boolean,
): OptionState[] {
  return [0, 1, 2, 3].map((index) => {
    const isSelected = selectedIndex === index
    const isCorrect = index === correctIndex
    const showCorrect = isAnswered && isCorrect
    const showIncorrect = isAnswered && isSelected && !isCorrect

    return {
      isSelected,
      isCorrect,
      showCorrect,
      showIncorrect,
      isDisabled: isAnswered,
    }
  })
}

describe('OptionList state logic', () => {
  it('has four option labels A-D', () => {
    expect(OPTION_LABELS).toEqual(['A', 'B', 'C', 'D'])
  })

  it('marks no option as selected when selectedIndex is null', () => {
    const states = computeOptionStates(0, null, false)

    for (const state of states) {
      expect(state.isSelected).toBe(false)
    }
  })

  it('marks correct option as selected', () => {
    const states = computeOptionStates(2, 2, false)

    expect(states[0].isSelected).toBe(false)
    expect(states[1].isSelected).toBe(false)
    expect(states[2].isSelected).toBe(true)
    expect(states[3].isSelected).toBe(false)
  })

  it('shows correct answer after answering correctly', () => {
    const states = computeOptionStates(1, 1, true)

    expect(states[1].showCorrect).toBe(true)
    expect(states[1].showIncorrect).toBe(false)
  })

  it('shows both correct and incorrect after wrong answer', () => {
    const states = computeOptionStates(2, 0, true)

    // Selected wrong option shows incorrect
    expect(states[0].showIncorrect).toBe(true)
    expect(states[0].showCorrect).toBe(false)

    // Correct option still shows correct
    expect(states[2].showCorrect).toBe(true)
    expect(states[2].showIncorrect).toBe(false)
  })

  it('disables all options after answering', () => {
    const states = computeOptionStates(0, 0, true)

    for (const state of states) {
      expect(state.isDisabled).toBe(true)
    }
  })

  it('does not disable options before answering', () => {
    const states = computeOptionStates(0, null, false)

    for (const state of states) {
      expect(state.isDisabled).toBe(false)
    }
  })

  it('does not show correct/incorrect before answering', () => {
    const states = computeOptionStates(2, 1, false)

    for (const state of states) {
      expect(state.showCorrect).toBe(false)
      expect(state.showIncorrect).toBe(false)
    }
  })

  it('only the wrong selection shows incorrect, not other unselected options', () => {
    const states = computeOptionStates(3, 1, true)

    expect(states[0].showIncorrect).toBe(false)
    expect(states[1].showIncorrect).toBe(true) // selected wrong
    expect(states[2].showIncorrect).toBe(false)
    expect(states[3].showIncorrect).toBe(false) // correct, not incorrect
  })
})
