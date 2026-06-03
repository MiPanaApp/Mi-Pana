import React from 'react'
import ReactDOM from 'react-dom/client'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#ff0000',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          position: 'fixed',
          inset: 0,
          overflow: 'auto',
          zIndex: 99999
        }}>
          <h2>ERROR CAPTURADO</h2>
          <p>{this.state.error?.message}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
