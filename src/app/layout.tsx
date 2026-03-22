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
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased">
        <main className="max-w-lg mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
