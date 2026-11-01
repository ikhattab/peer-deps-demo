import { createContext, createElement, useContext } from 'react'

export const VERSION = '2.0.0'

// Each copy of this file that gets loaded creates its own context.
export const ThemeContext = createContext('light')

export function ThemeProvider({ theme, children }) {
  return createElement(ThemeContext.Provider, { value: theme }, children)
}

// Breaking change in 2.0.0: useTheme() returns an object, not a string.
export function useTheme() {
  return { theme: useContext(ThemeContext) }
}
