import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>

                        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-8">
                            We encountered an unexpected error while loading the application. This might be due to a temporary glitch or a connection issue.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-xl text-left mb-8 overflow-hidden">
                            <p className="text-xs text-gray-400 font-mono mb-1">Error Details:</p>
                            <p className="text-sm text-red-600 font-mono break-words">
                                {this.state.error?.message || 'Unknown Error'}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} /> Reload Application
                        </button>

                        <p className="text-xs text-gray-400 mt-6">
                            If this persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
