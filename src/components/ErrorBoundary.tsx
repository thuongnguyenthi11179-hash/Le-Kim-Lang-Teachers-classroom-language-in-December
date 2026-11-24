import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    // Reset local corrupted workspace cache if needed and reload
    window.location.reload();
  };

  handleReset = (): void => {
    try {
      localStorage.removeItem('lkl_active_workspace');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-sky-100 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Đã xảy ra lỗi hiển thị
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống đã tự động bảo vệ dữ liệu học tập của thầy/cô. Thầy/cô vui lòng bấm nút bên dưới để khôi phục và tiếp tục.
              </p>
              {this.state.error && (
                <p className="text-xs font-mono text-slate-400 bg-slate-100 p-2 rounded-lg break-words text-left max-h-24 overflow-y-auto">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 cursor-pointer transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Về trang chính</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
