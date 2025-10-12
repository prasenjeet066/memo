import React from "react";
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div>অনাকাঙ্ক্ষিত সমস্যা হয়েছে: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}