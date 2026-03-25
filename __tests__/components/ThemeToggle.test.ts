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

    // Mock useTranslations returns namespace.key format
    expect(screen.getByRole('radio', { name: 'settings.lightMode' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'settings.darkMode' })).toBeDefined()
    expect(screen.getByRole('radio', { name: 'settings.systemMode' })).toBeDefined()
  })

  it('marks the current mode as checked', () => {
    render(createElement(ThemeToggle))

    const systemButton = screen.getByRole('radio', { name: 'settings.systemMode' })
    expect(systemButton.getAttribute('aria-checked')).toBe('true')

    const lightButton = screen.getByRole('radio', { name: 'settings.lightMode' })
    expect(lightButton.getAttribute('aria-checked')).toBe('false')
  })

  it('toggles mode to dark on click', () => {
    render(createElement(ThemeToggle))

    const darkButton = screen.getByRole('radio', { name: 'settings.darkMode' })
    fireEvent.click(darkButton)

    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('toggles mode to light on click', () => {
    render(createElement(ThemeToggle))

    const lightButton = screen.getByRole('radio', { name: 'settings.lightMode' })
    fireEvent.click(lightButton)

    expect(useThemeStore.getState().mode).toBe('light')
  })
})
