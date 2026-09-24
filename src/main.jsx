import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, backgroundColor: '#09090b', color: '#f87171', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ fontSize: 18, color: '#fbbf24', marginBottom: 12 }}>⚠️ Terjadi Error pada Komponen</h2>
          <pre style={{ backgroundColor: '#18181b', padding: 16, borderRadius: 8, overflowX: 'auto', border: '1px solid #27272a' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 16, padding: '8px 16px', backgroundColor: '#f59e0b', color: '#000', fontWeight: 'bold', borderRadius: 6, border: 'none', cursor: 'pointer' }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
