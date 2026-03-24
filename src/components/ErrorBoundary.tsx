'use client'

import { Component } from 'react'
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            문제가 발생했습니다
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            앱에서 오류가 발생했습니다. 다시 시도하거나 데이터를 초기화해 주세요.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={this.handleReset}
              aria-label="다시 시도"
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={this.handleClearData}
              aria-label="데이터 초기화"
              className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              데이터 초기화
            </button>
          </div>
        </div>
      </div>
    )
  }
}
