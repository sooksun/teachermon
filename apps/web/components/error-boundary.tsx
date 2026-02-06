'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle ChunkLoadError specifically
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.warn('ChunkLoadError detected - attempting to reload page');
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.name === 'ChunkLoadError' || 
        this.state.error?.message?.includes('Loading chunk');

      if (isChunkError) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                กำลังโหลดไฟล์ใหม่...
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                กำลังรีเฟรชหน้าเว็บเพื่อโหลดไฟล์ล่าสุด
              </p>
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                รีเฟรชหน้าเว็บ
              </button>
            </div>
          </div>
        );
      }

      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                เกิดข้อผิดพลาด
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
              </p>
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
