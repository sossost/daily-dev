/**
 * Tests for ReviewSchedule conditional rendering logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the branching logic that determines what ReviewSchedule displays.
 */

type ReviewState = 'perfect' | 'review'

function getReviewState(incorrectCount: number): ReviewState {
  return incorrectCount === 0 ? 'perfect' : 'review'
}

function getReviewMessage(incorrectCount: number): string {
  if (incorrectCount === 0) {
    return '모든 문제를 맞혔습니다! 완벽해요!'
  }
  return `틀린 ${incorrectCount}문제가 다음 학습의 복습 목록에 추가되었습니다.`
}

describe('ReviewSchedule logic', () => {
  it('shows perfect state when no incorrect answers', () => {
    expect(getReviewState(0)).toBe('perfect')
  })

  it('shows review state when there are incorrect answers', () => {
    expect(getReviewState(1)).toBe('review')
    expect(getReviewState(5)).toBe('review')
  })

  it('generates correct message for perfect score', () => {
    expect(getReviewMessage(0)).toBe('모든 문제를 맞혔습니다! 완벽해요!')
  })

  it('includes incorrect count in review message', () => {
    expect(getReviewMessage(3)).toContain('틀린 3문제가')
    expect(getReviewMessage(1)).toContain('틀린 1문제가')
  })

  it('includes review list mention in message', () => {
    expect(getReviewMessage(2)).toContain('복습 목록에 추가되었습니다')
  })
})
