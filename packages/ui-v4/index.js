import { createElement } from 'react'
import { useTheme, ThemeContext, VERSION } from '@acme/theme'

// Handles both majors: v1's useTheme() returns a string, v2's returns { theme }.
export function Button({ children }) {
  const value = useTheme()
  const theme = typeof value === 'string' ? value : value.theme
  return createElement('button', { className: theme }, children)
}

// Exposed so the demo can show which copy of @acme/theme this library loaded.
export { ThemeContext as uiThemeContext, VERSION as uiThemeVersion }
