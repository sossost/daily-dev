import { createElement } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useThemeStore } from '@/stores/useThemeStore'

jest.mock('lucide-react', () => ({
  Sun: (props: Record<string, unknown>) => createElement('svg', { ...props, 'data-testid': 'sun-icon' }),
  Moon: (props: Record<string, unknown>) => createElement('svg', { ...props, 'data-testid': 'moon-icon' }),
  Monitor: (props: Record<string, unknown>) => createElement('svg', { ...props, 'data-testid': 'monitor-icon' }),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ThemeToggle } = require('@/components/ThemeToggle')

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'system' })
    document.documentElement.classList.remove('dark')
  })

  it('renders three mode buttons', () => {
    render(createElement(ThemeToggle))

    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(3)
  })

  it('renders buttons with correct aria-labels', () => {
    render(createElement(ThemeToggle))

    expect(screen.getByRole('radio', { name: '라이트 모드' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '다크 모드' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '시스템 설정' })).toBeDefined()
  })

  it('marks the current mode as checked', () => {
    render(createElement(ThemeToggle))

    const systemButton = screen.getByRole('radio', { name: '시스템 설정' })
    expect(systemButton.getAttribute('aria-checked')).toBe('true')

    const lightButton = screen.getByRole('radio', { name: '라이트 모드' })
    expect(lightButton.getAttribute('aria-checked')).toBe('false')
  })

  it('toggles mode to dark on click', () => {
    render(createElement(ThemeToggle))

    const darkButton = screen.getByRole('radio', { name: '다크 모드' })
    fireEvent.click(darkButton)

    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('toggles mode to light on click', () => {
    render(createElement(ThemeToggle))

    const lightButton = screen.getByRole('radio', { name: '라이트 모드' })
    fireEvent.click(lightButton)

    expect(useThemeStore.getState().mode).toBe('light')
  })
})
