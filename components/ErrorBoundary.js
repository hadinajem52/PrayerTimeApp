import React from 'react';

/**
 * Catches a render/mount failure in its subtree and shows `fallback` instead of
 * letting it unwind into a red screen (or, in release, a blank one).
 *
 * Added for the Qibla screen: constructing the native WebView throws
 * AndroidRuntimeException on devices where the system WebView package is
 * missing or mid-update, and that happens before the WebView's own `onError`
 * prop can ever fire. Anything React surfaces to JS lands here instead.
 *
 * A native view constructor that dies on the UI thread without being reported
 * back to JS is still fatal - this boundary cannot reach that case.
 *
 * @param {React.ReactNode|function} fallback - shown instead of the subtree;
 *   called with the error when it is a function.
 * @param {function} [onError] - side effects only (logging); never render here.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render failure:', error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  /** Let a parent retry - e.g. from the same button that reloads the subtree. */
  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(error, this.reset) : fallback ?? null;
  }
}

export default ErrorBoundary;
