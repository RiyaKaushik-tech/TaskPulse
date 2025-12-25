# Dark and Light Theme Implementation Guide

## Overview

The TaskPulse application now includes a comprehensive dark and light theme system with the following features:

- **Light Mode**: Clean, bright interface for daytime usage
- **Dark Mode**: Eye-friendly interface for low-light environments
- **System Theme**: Automatically respects the user's operating system theme preference
- **Persistent Storage**: Theme preference is saved to browser localStorage
- **Smooth Transitions**: All theme changes feature smooth CSS transitions
- **Global CSS Variables**: Theme is managed using CSS custom properties for easy customization

## Architecture

### 1. Redux Theme Slice

**File**: `src/redux/slice/themeSlice.js`

Manages the theme state with three possible modes:
- `light`: Light theme
- `dark`: Dark theme
- `system`: Automatically detects and applies system theme

```javascript
// Example usage
import { setTheme } from "../redux/slice/themeSlice"
dispatch(setTheme("dark"))  // Switch to dark theme
dispatch(setTheme("light")) // Switch to light theme
dispatch(setTheme("system")) // Use system theme
```

### 2. Theme CSS Variables

**File**: `src/theme.css`

Defines all color schemes using CSS custom properties. The file includes:

**Light Theme (default)** - Variables set in `:root`
- `--bg-primary`: Main background (#ffffff)
- `--text-primary`: Main text color (#1f2937)
- `--accent-primary`: Primary accent color (#3b82f6)
- And more...

**Dark Theme** - Variables set in `html[data-theme="dark"]`
- `--bg-primary`: Main background (#111827)
- `--text-primary`: Main text color (#f3f4f6)
- `--accent-primary`: Primary accent color (#60a5fa)
- And more...

#### Available CSS Variables

```css
/* Background Colors */
--bg-primary          /* Main background */
--bg-secondary        /* Secondary background */
--bg-tertiary         /* Tertiary background */
--bg-hover            /* Hover state background */

/* Text Colors */
--text-primary        /* Main text */
--text-secondary      /* Secondary text */
--text-tertiary       /* Tertiary text */
--text-inverse        /* Inverse text (white in light, dark in dark) */

/* Accent Colors */
--accent-primary      /* Primary accent */
--accent-danger       /* Danger/error color */
--accent-success      /* Success color */
--accent-warning      /* Warning color */
--accent-info         /* Info color */

/* Borders */
--border-color        /* Main border color */
--border-light        /* Light border color */

/* Shadows */
--shadow-sm           /* Small shadow */
--shadow-md           /* Medium shadow */
--shadow-lg           /* Large shadow */

/* Form Elements */
--input-bg            /* Input background */
--input-border        /* Input border */
--input-focus-border  /* Input focus border */
--input-placeholder   /* Input placeholder text */

/* Component-specific */
--navbar-bg           /* Navbar background */
--sidebar-bg          /* Sidebar background */
--card-bg             /* Card background */
--modal-bg            /* Modal background */
```

### 3. Theme Toggle Component

**File**: `src/components/ThemeToggle.jsx`

A reusable dropdown component that allows users to:
- Switch between Light, Dark, and System themes
- See the current active theme
- See visual feedback (checkmark) for the selected theme

Features:
- Automatically listens for system theme changes
- Applies theme to the document in real-time
- Integrated into the Navbar for easy access

## Using the Theme System

### In Components

Use the CSS variables directly in your inline styles:

```jsx
<div style={{
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-primary)",
  borderColor: "var(--border-color)"
}}>
  Content goes here
</div>
```

### Common Color Patterns

**Card Component**:
```jsx
<div style={{
  backgroundColor: "var(--card-bg)",
  borderColor: "var(--card-border)",
  boxShadow: "var(--card-shadow)"
}}>
  Card content
</div>
```

**Button Component**:
```jsx
<button style={{
  backgroundColor: "var(--accent-primary)",
  color: "var(--text-inverse)"
}}>
  Button
</button>
```

**Input Component**:
```jsx
<input style={{
  backgroundColor: "var(--input-bg)",
  borderColor: "var(--input-border)",
  color: "var(--text-primary)"
}} />
```

**Navbar Component**:
```jsx
<nav style={{
  backgroundColor: "var(--navbar-bg)",
  borderColor: "var(--navbar-border)"
}}>
  Navigation
</nav>
```

### With Tailwind Classes

The theme CSS overrides Tailwind's color utilities automatically:

```jsx
<div className="bg-gray-900 text-gray-100 border border-gray-200">
  {/* Will use theme colors instead of hardcoded Tailwind colors */}
</div>
```

## Adding Theme Support to Existing Components

### Step 1: Replace Hardcoded Colors

**Before**:
```jsx
<div className="bg-white text-gray-900 border border-gray-200">
  Content
</div>
```

**After**:
```jsx
<div
  className="border"
  style={{
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    borderColor: "var(--border-color)"
  }}
>
  Content
</div>
```

### Step 2: Use Appropriate CSS Variables

Choose the right variable for each element:
- **Backgrounds**: Use `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- **Text**: Use `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Interactive**: Use `--accent-primary`, `--accent-success`, etc.
- **Borders**: Use `--border-color`, `--border-light`

### Step 3: Test in Both Themes

Always test your changes in both light and dark themes using the ThemeToggle button.

## Accessing Theme State in Components

### Using Redux

```jsx
import { useSelector } from "react-redux"

function MyComponent() {
  const { mode, activeTheme } = useSelector((state) => state.theme)
  
  // mode: "light", "dark", or "system"
  // activeTheme: "light" or "dark" (actual active theme)
  
  return (
    <div>
      Current theme mode: {mode}
      Active theme: {activeTheme}
    </div>
  )
}
```

### Dispatching Theme Changes

```jsx
import { useDispatch } from "react-redux"
import { setTheme } from "../redux/slice/themeSlice"

function ThemeSelector() {
  const dispatch = useDispatch()
  
  return (
    <button onClick={() => dispatch(setTheme("dark"))}>
      Switch to Dark Mode
    </button>
  )
}
```

## Persisting Theme Preference

The theme preference is automatically saved to browser localStorage with the key `theme`. The app will:

1. Load the saved preference on startup
2. Save any changes made by the user
3. Fall back to system theme if no preference is saved

## Customizing Theme Colors

To customize theme colors, edit `src/theme.css`:

### Light Theme Colors

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
  --accent-primary: #3b82f6;
  /* ... other variables ... */
}
```

### Dark Theme Colors

```css
html[data-theme="dark"] {
  --bg-primary: #111827;
  --text-primary: #f3f4f6;
  --accent-primary: #60a5fa;
  /* ... other variables ... */
}
```

### Example: Changing the Primary Accent Color

To change the primary accent from blue to purple:

```css
:root {
  --accent-primary: #a855f7;        /* Light mode */
  --accent-primary-hover: #9333ea;
  --accent-primary-light: #ede9fe;
}

html[data-theme="dark"] {
  --accent-primary: #d8b4fe;        /* Dark mode */
  --accent-primary-hover: #e9d5ff;
  --accent-primary-light: #581c87;
}
```

## Best Practices

1. **Always Use CSS Variables**: Never hardcode colors in new components
2. **Test Both Themes**: Always test changes in light and dark modes
3. **Use Semantic Names**: Choose variable names that describe their purpose
4. **Consistent Spacing**: Use the same padding/margin in both themes
5. **Contrast**: Ensure text has sufficient contrast in both themes
6. **Focus States**: Maintain visible focus states in both themes

## Troubleshooting

### Theme Not Applying

1. Ensure `theme.css` is imported in `main.jsx` and `App.jsx`
2. Check that the Redux theme slice is included in the store
3. Verify that components use inline styles with CSS variables

### Dark Mode Not Showing

1. Check the browser console for errors
2. Ensure `html[data-theme="dark"]` is present in `theme.css`
3. Verify that the theme toggle is working by checking Redux state

### Smooth Transitions Not Working

The CSS includes automatic transitions. If they're not smooth:

1. Check browser DevTools for CSS errors
2. Verify that `transition` properties are set in `theme.css`
3. Ensure no inline `!important` styles are overriding transitions

## Components Already Updated for Theme Support

- ✅ Navbar
- ✅ Sidebar (SideMenu)
- ✅ DashboardLayout
- ✅ AuthLayout
- ✅ Modal
- ✅ Progress bar
- ✅ ThemeToggle button

## Next Steps

To complete the theme migration for your app:

1. Update all page components to use CSS variables
2. Update all utility components (buttons, inputs, badges, etc.)
3. Update chart and graph components (CustomBarGraph, CustomPieChart, etc.)
4. Test all pages in both light and dark modes
5. Consider adding additional theme customization options (color schemes, font sizes, etc.)

## Browser Support

The theme system uses:
- CSS Custom Properties (Variables): Supported in all modern browsers
- `prefers-color-scheme` media query: Supported in all modern browsers
- LocalStorage: Supported in all modern browsers

## Files Modified

- `src/redux/store.js` - Added theme reducer
- `src/redux/slice/themeSlice.js` - Created (new)
- `src/theme.css` - Created (new)
- `src/components/ThemeToggle.jsx` - Created (new)
- `src/App.jsx` - Added theme import and state handling
- `src/main.jsx` - Added theme CSS import
- `src/components/Navbar.jsx` - Updated with theme variables
- `src/components/SideMenu.jsx` - Updated with theme variables
- `src/components/DashboardLayout.jsx` - Updated with theme variables
- `src/components/AuthLayout.jsx` - Updated with theme variables
- `src/components/Modal.jsx` - Updated with theme variables
- `src/components/Progress.jsx` - Updated with theme variables
