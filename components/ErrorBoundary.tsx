import React from "react";

// Properly type state and props
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component < ErrorBoundaryProps, ErrorBoundaryState > {
  state: ErrorBoundaryState = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;