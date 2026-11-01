import { createContext, createElement, useContext } from 'react'

export const VERSION = '1.0.0'

// Each copy of this file that gets loaded creates its own context.
export const ThemeContext = createContext('light')

export function ThemeProvider({ theme, children }) {
  return createElement(ThemeContext.Provider, { value: theme }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}
