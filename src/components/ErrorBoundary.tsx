'use client'

import { Component } from 'react'
import { useTranslations } from 'next-intl'
import { captureError } from '@/lib/sentry'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  private handleClearData = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <ErrorFallback
        onReset={this.handleReset}
        onClearData={this.handleClearData}
      />
    )
  }
}

function ErrorFallback({
  onReset,
  onClearData,
}: {
  onReset: () => void
  onClearData: () => void
}) {
  const t = useTranslations('error')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('description')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            aria-label={t('retry')}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            {t('retry')}
          </button>
          <button
            onClick={onClearData}
            aria-label={t('resetData')}
            className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('resetData')}
          </button>
        </div>
      </div>
    </div>
  )
}
