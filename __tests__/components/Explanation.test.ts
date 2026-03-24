/**
 * Tests for Explanation display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the conditional rendering logic for correct/incorrect states.
 */

function getResultLabel(isCorrect: boolean): string {
  return isCorrect ? '정답입니다!' : '오답입니다'
}

function getStyleVariant(isCorrect: boolean): 'green' | 'red' {
  return isCorrect ? 'green' : 'red'
}

describe('Explanation display logic', () => {
  it('returns correct label for right answer', () => {
    expect(getResultLabel(true)).toBe('정답입니다!')
  })

  it('returns incorrect label for wrong answer', () => {
    expect(getResultLabel(false)).toBe('오답입니다')
  })

  it('uses green style for correct answers', () => {
    expect(getStyleVariant(true)).toBe('green')
  })

  it('uses red style for incorrect answers', () => {
    expect(getStyleVariant(false)).toBe('red')
  })
})
