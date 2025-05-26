import * as React from 'react';

interface ErrorBoundaryProps {
    onError?: (err: any) => void;
    fallbackComponent: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: any;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundaryProps>, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  override componentDidCatch(error: any) {
    if (this.props.onError) {
        this.props.onError(error);
    }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallbackComponent;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;