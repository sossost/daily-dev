'use client'

import dynamic from 'next/dynamic'
import SessionLoading from './loading'

const SessionContent = dynamic(
  () => import('@/components/quiz/SessionContent'),
  { loading: () => <SessionLoading />, ssr: false },
)

export default function SessionPage() {
  return <SessionContent />
}
