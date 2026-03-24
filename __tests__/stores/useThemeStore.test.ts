import { useThemeStore, resolveTheme } from '@/stores/useThemeStore'

describe('resolveTheme', () => {
  it('returns "light" for light mode', () => {
    expect(resolveTheme('light')).toBe('light')
  })

  it('returns "dark" for dark mode', () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('returns "light" for system mode when prefers-color-scheme is light', () => {
    ;(window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    expect(resolveTheme('system')).toBe('light')
  })

  it('returns "dark" for system mode when prefers-color-scheme is dark', () => {
    ;(window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    expect(resolveTheme('system')).toBe('dark')
  })

  it('returns "light" for system mode when matchMedia throws', () => {
    ;(window.matchMedia as jest.Mock).mockImplementation(() => {
      throw new Error('matchMedia not supported')
    })

    expect(resolveTheme('system')).toBe('light')
  })
})

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'system' })
  })

  it('has system as the default mode', () => {
    expect(useThemeStore.getState().mode).toBe('system')
  })

  it('setMode updates the mode to dark', () => {
    useThemeStore.getState().setMode('dark')
    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('setMode updates the mode to light', () => {
    useThemeStore.getState().setMode('light')
    expect(useThemeStore.getState().mode).toBe('light')
  })

  it('setMode updates the mode back to system', () => {
    useThemeStore.getState().setMode('dark')
    useThemeStore.getState().setMode('system')
    expect(useThemeStore.getState().mode).toBe('system')
  })
})
