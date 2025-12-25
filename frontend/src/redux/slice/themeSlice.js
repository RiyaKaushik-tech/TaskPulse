import { createSlice } from "@reduxjs/toolkit";

// Function to get system theme preference
const getSystemTheme = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

// Function to get initial theme from localStorage or system
const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  }
  return "system";
};

// Function to get active theme (accounting for system theme)
const getActiveTheme = (themeMode) => {
  if (themeMode === "system") {
    return getSystemTheme();
  }
  return themeMode;
};

const initialState = {
  mode: getInitialTheme(), // "light", "dark", or "system"
  activeTheme: getActiveTheme(getInitialTheme()), // actual active theme ("light" or "dark")
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload; // "light", "dark", or "system"
      state.activeTheme = getActiveTheme(action.payload);
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", action.payload);
      }
    },
    updateSystemTheme: (state) => {
      if (state.mode === "system") {
        state.activeTheme = getSystemTheme();
      }
    },
  },
});

export const { setTheme, updateSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
