// HomePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HomePage= () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hover, setHover] = useState(false);
  
  const handleCTA = useCallback(() => {
    if (isLoggedIn) navigate("/user");
    else navigate("/login");
  }, [isLoggedIn, navigate]);
  
  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(Boolean(user));
  }, []);
  // press Enter anywhere (unless typing) to open login/dashboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      const el = document.activeElement;
      if (!el) return;
      const tag = el.tagName;
      const editable = el.getAttribute("contenteditable");
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || editable === "true") return;
      e.preventDefault();
      handleCTA();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCTA]);


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-green-100 to-slate-200 dark:from-slate-900 dark:via-green-900 dark:to-slate-900 p-6 relative">
      {/* floating decorative shapes */}
      <motion.div
        className="absolute left-12 top-20 w-24 h-24 rounded-full bg-green-400/30 dark:bg-green-700/30 blur-sm"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        aria-hidden
      />
      <motion.div
        className="absolute right-16 bottom-24 w-16 h-16 rounded-full bg-green-400/25 dark:bg-green-800/25"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        aria-hidden
      />

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: content / CTA */}
        <div className="p-8">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <svg className="w-8 h-8 text-green-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C7 2 3 6 3 11c0 2.4 1 4.6 2.7 6.2L5 21l3.8-0.8C10.4 21.6 11.2 22 12 22c5 0 9-4 9-9s-4-11-9-11z" />
              </svg>
            </div>
          </div>

          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300"
          >
            Project Flow
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-4 text-lg text-slate-700 dark:text-slate-200 max-w-xl"
          >
            Professional task management for teams — organize backlog, prioritize work, and ship faster. Beautiful, fast, and secure.
          </motion.p>

          <div className="mt-6 text-sm text-slate-500 dark:text-slate-300 max-w-xl">
            <ul className="space-y-2">
              <li>• Team boards & timelines</li>
              <li>• Role-based access & permissions</li>
              <li>• Real-time updates & analytics</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start">
            <motion.button
              onClick={handleCTA}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 text-white font-semibold shadow-lg"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
            </motion.button>

            <div className="flex gap-3 items-center">
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2 rounded-full border border-slate-200 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-slate-100"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signUp")}
                className="px-6 py-2 rounded-full border border-transparent text-green-600 dark:text-green-300 hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400">Tip: press Enter to open {isLoggedIn ? "dashboard" : "login"}.</div>
        </div>

        {/* Right: glass card + video placeholder */}
        <div className="p-8 flex items-center justify-center">
          <motion.div
            style={{ perspective: 1200 }}
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            <motion.div
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              animate={hover ? { rotateY: -8, rotateX: 4, scale: 1.02 } : { rotateY: 0, rotateX: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="relative rounded-xl bg-white/20 dark:bg-white/6 backdrop-blur-md border border-white/10 dark:border-white/6 shadow-2xl overflow-hidden"
            >
              {/* top gradient accent */}
              <div className="h-2 w-full bg-gradient-to-r from-green-600 to-green-400" />

              {/* inner content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-slate-400">Welcome</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">Join your team — start organizing</div>
                  </div>
                  <div className="text-xs text-slate-500">Live • Demo</div>
                </div>

                {/* video placeholder */}
                <div className="w-full h-56 bg-slate-100/60 dark:bg-slate-800/60 rounded-md flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <svg className="mx-auto mb-2 w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <div className="text-sm text-slate-700 dark:text-slate-200">Demo video will be placed here</div>
                    <div className="text-xs text-slate-400 mt-2">You can drop a live demo or walkthrough later</div>
                  </div>
                </div>

                {/* small controls */}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1 rounded bg-white/10 dark:bg-white/5">Preview</button>
                    <button className="px-3 py-1 rounded border border-white/10">Share</button>
                  </div>
                  <div>
                    <button onClick={() => navigate("/create-task")} className="px-3 py-1 rounded bg-green-600 text-white">Create Task</button>
                  </div>
                </div>
              </div>

              {/* bottom footer */}
              <div className="p-4 bg-white/6 dark:bg-white/4 text-xs text-slate-400 border-t border-white/8">
                © {new Date().getFullYear()} Project Flow — Privacy first
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
