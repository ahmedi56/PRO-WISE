import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    color: '#fff',
                    background: '#0f172a',
                    height: '100vh',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                }}>
                    <div style={{ maxWidth: '800px', width: '100%' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
                        <h1 style={{ color: '#f87171', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>SYSTEM ANOMALY DETECTED</h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '2rem' }}>The application encountered an unexpected runtime exception. Details for engineering trace are provided below.</p>
                        
                        <pre style={{
                            background: '#020617',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            overflow: 'auto',
                            border: '1px solid #334155',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            maxHeight: '400px',
                            color: '#94a3b8'
                        }}>
                            <code style={{ color: '#fca5a5', fontWeight: 600 }}>{this.state.error && this.state.error.toString()}</code>
                            <br /><br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                        
                        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--color-primary, #6366f1)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Emergency Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#334155',
                                    color: 'white',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Attempt Reset
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
