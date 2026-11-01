import { createElement } from 'react'
import { useTheme, ThemeContext, VERSION } from '@acme/theme'

export function Button({ children }) {
  return createElement('button', { className: useTheme() }, children)
}

// Exposed so the demo can show which copy of @acme/theme this library loaded.
export { ThemeContext as uiThemeContext, VERSION as uiThemeVersion }
