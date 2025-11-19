import React from "react";
import { motion } from "framer-motion";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error, info: null };
  }

  componentDidCatch(_error, info) {
    // send to logging service if you have one
    // console.error(_error, info);
    this.setState({ info: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.36 }}
          className="w-full max-w-xl bg-white rounded-xl shadow-md border border-slate-100 p-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">An unexpected error occurred. You can reload or return home.</p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Reload
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Go home
              </button>
            </div>

            {/* Expandable dev details — keeps UI minimal for users */}
            <details className="mt-4 text-xs text-slate-500">
              <summary className="cursor-pointer">Technical details</summary>
              <pre className="whitespace-pre-wrap mt-2 text-xs text-rose-600">{this.state.error?.message}</pre>
              <pre className="whitespace-pre-wrap mt-2 text-xs text-slate-600">{this.state.info}</pre>
            </details>
          </div>
        </motion.div>
      </div>
    );
  }
}