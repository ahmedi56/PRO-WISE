import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    color: '#fff',
                    background: '#1e293b',
                    height: '100vh',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ color: '#f87171' }}>Something went wrong.</h1>
                    <p style={{ color: '#94a3b8' }}>Please report the following error:</p>
                    <pre style={{
                        background: '#0f172a',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        overflow: 'auto',
                        border: '1px solid #334155',
                        marginTop: '1rem'
                    }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            marginTop: '2rem',
                            padding: '0.5rem 1rem',
                            background: '#0f766e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Home
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            marginLeft: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#334155',
                            color: 'white',
                            border: '1px solid #475569',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
