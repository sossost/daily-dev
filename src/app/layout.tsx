import type { ReactNode } from 'react'
import './globals.css'

type Props = {
  children: ReactNode
}

/**
 * Root layout — minimal shell.
 * Real layout (html, body, providers) lives in [locale]/layout.tsx.
 */
export default function RootLayout({ children }: Props) {
  return children
}
