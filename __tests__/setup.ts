// Jest global setup — mock browser APIs and modules not available in jsdom

// Mock next-intl — ESM module that Jest cannot transform
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => {
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = namespace != null ? `${namespace}.${key}` : key
      if (params != null) {
        return Object.entries(params).reduce<string>(
          (str, [k, v]) => str.replace(`{${k}}`, String(v)),
          fullKey,
        )
      }
      return fullKey
    }
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  hasLocale: (locales: string[], locale: string) => locales.includes(locale),
}))

jest.mock('next-intl/navigation', () => ({
  createNavigation: () => ({
    Link: 'a',
    redirect: jest.fn(),
    usePathname: () => '/',
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    getPathname: jest.fn(),
  }),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: 'a',
  redirect: jest.fn(),
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  getPathname: jest.fn(),
}))

// crypto.randomUUID is not available in jsdom
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => {
      // Simple v4 UUID for testing
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    },
  })
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
