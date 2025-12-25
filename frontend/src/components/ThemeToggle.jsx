import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme, updateSystemTheme } from "../redux/slice/themeSlice";
import { FiSun, FiMoon } from "react-icons/fi";
import { BiDesktop } from "react-icons/bi";

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { mode, activeTheme } = useSelector((state) => state.theme);
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      dispatch(updateSystemTheme());
    };

    // Modern way to listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [dispatch]);

  // Apply theme to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (activeTheme === "dark") {
      htmlElement.setAttribute("data-theme", "dark");
    } else {
      htmlElement.removeAttribute("data-theme");
    }
  }, [activeTheme]);

  const handleThemeChange = (newMode) => {
    dispatch(setTheme(newMode));
    setShowDropdown(false);
  };

  const getActiveThemeLabel = () => {
    if (mode === "system") {
      return `System (${activeTheme === "dark" ? "Dark" : "Light"})`;
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-lg transition-colors duration-200"
        style={{
          // backgroundColor: "var(--bg-tertiary)",
          // color: "var(--text-primary)",
          // border: "0.5px solid var(--border-color)",
        }}
        title="Toggle theme"
        aria-label="Theme selector"
      >
        {activeTheme === "dark" ? (
          <FiMoon className="w-5 h-5" />
        ) : (
          <FiSun className="w-5 h-5" />
        )}
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="p-2">
            <p
              className="px-3 py-2 text-xs font-semibold uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Theme
            </p>

            {/* Light Theme Option */}
            <button
              onClick={() => handleThemeChange("light")}
              className="w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors"
              style={{
                backgroundColor:
                  mode === "light" ? "var(--sidebar-active-bg)" : "transparent",
                color:
                  mode === "light"
                    ? "var(--sidebar-active-text)"
                    : "var(--text-primary)",
              }}
            >
              <FiSun className="w-4 h-4" />
              <span>Light</span>
              {mode === "light" && (
                <span
                  className="ml-auto w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                ></span>
              )}
            </button>

            {/* Dark Theme Option */}
            <button
              onClick={() => handleThemeChange("dark")}
              className="w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors"
              style={{
                backgroundColor:
                  mode === "dark" ? "var(--sidebar-active-bg)" : "transparent",
                color:
                  mode === "dark"
                    ? "var(--sidebar-active-text)"
                    : "var(--text-primary)",
              }}
            >
              <FiMoon className="w-4 h-4" />
              <span>Dark</span>
              {mode === "dark" && (
                <span
                  className="ml-auto w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                ></span>
              )}
            </button>

            {/* System Theme Option */}
            <button
              onClick={() => handleThemeChange("system")}
              className="w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors"
              style={{
                backgroundColor:
                  mode === "system" ? "var(--sidebar-active-bg)" : "transparent",
                color:
                  mode === "system"
                    ? "var(--sidebar-active-text)"
                    : "var(--text-primary)",
              }}
            >
              <BiDesktop className="w-4 h-4" />
              <div className="flex-1">
                <span>System</span>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {activeTheme === "dark" ? "Dark" : "Light"}
                </p>
              </div>
              {mode === "system" && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                ></span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
