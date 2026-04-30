import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EmptyState, Button } from './ui';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
    public state: State = { hasError: false };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmptyState
                        icon="warning-outline"
                        title="Something went wrong"
                        description="The application encountered an unexpected error."
                        action={
                            <Button onClick={() => window.location.reload()} variant="primary">
                                Refresh Page
                            </Button>
                        }
                    />
                </div>
            );
        }
        return this.props.children;
    }
}
