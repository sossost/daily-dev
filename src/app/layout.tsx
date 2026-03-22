import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DailyDev - 매일 5분 개발 학습',
  description: '매일 5분, JavaScript 핵심 개념을 학습하고 실력을 키워보세요.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=JSON.parse(localStorage.getItem('daily-dev-theme')||'{}');var mode=m.state&&m.state.mode||'system';var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen antialiased transition-colors">
        <main className="max-w-lg mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
