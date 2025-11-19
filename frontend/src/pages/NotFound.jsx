import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    const target = user ? "/user" : "/login";
    const t = setTimeout(() => navigate(target, { replace: true }), 3500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.36 }}
        className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center"
      >
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">404 — Page not found</h1>
        <p className="text-sm text-slate-500 mb-6">The page you requested doesn't exist. You'll be redirected shortly.</p>

        <div className="inline-flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Go back
          </button>

          <button
            onClick={() => {
              const user = localStorage.getItem("user");
              navigate(user ? "/user" : "/login", { replace: true });
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
          >
            Go to {localStorage.getItem("user") ? "Dashboard" : "Login"}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">Redirecting in a few seconds…</p>
      </motion.div>
    </div>
  );
};

export default NotFound;