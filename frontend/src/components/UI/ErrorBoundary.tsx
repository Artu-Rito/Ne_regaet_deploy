import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="gcard p-8 max-w-md text-center">
            <div className="text-5xl mb-4">💥</div>
            <h2 className="text-xl font-bold text-white mb-2">Что-то пошло не так</h2>
            <p className="text-slate-400 mb-6">{this.state.error?.message ?? 'Неизвестная ошибка'}</p>
            <button className="gbtn-primary" onClick={() => window.location.reload()}>
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
