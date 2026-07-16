import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('React ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-900/20 text-white rounded-xl border border-red-500/50 m-4 h-full overflow-auto">
          <h2 className="text-xl font-bold text-red-400 mb-4">React 渲染崩溃了 (ErrorBoundary)</h2>
          <div className="bg-black/50 p-4 rounded-lg text-left w-full max-w-4xl overflow-x-auto text-sm font-mono whitespace-pre-wrap text-red-200">
            {this.state.error && this.state.error.toString()}
            {'\n\n'}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium shadow-lg"
          >
            尝试恢复 (重置状态)
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
