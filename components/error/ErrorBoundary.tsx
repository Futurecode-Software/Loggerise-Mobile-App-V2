/**
 * Error Boundary
 *
 * React component tree'deki yakalanmamış JS hatalarını yakalar.
 * Hata oluştuğunda ErrorFallback gösterir ve hatayı backend'e loglar.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logError } from '@/utils/error-logger'
import { ErrorFallback } from './ErrorFallback'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, {
      errorType: 'js_error',
      screen: 'ErrorBoundary',
      additionalData: {
        componentStack: errorInfo.componentStack?.substring(0, 2000),
      },
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}
