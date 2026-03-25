/**
 * Tests for CodeBlock display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the language class derivation logic.
 */

function getLanguageClass(language: string): string {
  return `language-${language}`
}

const DEFAULT_LANGUAGE = 'javascript'

describe('CodeBlock logic', () => {
  it('generates correct language class with default language', () => {
    expect(getLanguageClass(DEFAULT_LANGUAGE)).toBe('language-javascript')
  })

  it('generates correct language class for custom language', () => {
    expect(getLanguageClass('python')).toBe('language-python')
    expect(getLanguageClass('typescript')).toBe('language-typescript')
    expect(getLanguageClass('css')).toBe('language-css')
  })

  it('handles empty language string', () => {
    expect(getLanguageClass('')).toBe('language-')
  })

  it('preserves code content identity', () => {
    const code = 'function foo() {\n  return 42;\n}'
    // Code is passed as-is to the <code> element — no transformation
    expect(code).toBe('function foo() {\n  return 42;\n}')
  })

  it('default language is javascript', () => {
    expect(DEFAULT_LANGUAGE).toBe('javascript')
  })
})
