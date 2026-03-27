import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/lib/generatePageMetadata'

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata(locale, 'bookmarks', '/bookmarks', { noIndex: true })
}

export default function Layout({ children }: Props) {
  return children
}
