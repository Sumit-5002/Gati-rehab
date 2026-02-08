
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 text-center">
                        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-100">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Something went wrong</h1>
                        <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                            We encountered an unexpected error. Don't worry, your recovery data is safe.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Reload Application
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95"
                            >
                                <Home className="w-5 h-5" />
                                Back to Home
                            </button>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left border border-slate-100 overflow-auto max-h-40">
                                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
