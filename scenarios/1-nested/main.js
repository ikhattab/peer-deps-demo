// The same app as this JSX, written without JSX so it runs in Node with no build step:
//
//   <ThemeProvider theme="dark">
//     <Button>Save</Button>
//   </ThemeProvider>
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider, ThemeContext, VERSION } from '@acme/theme'
import { Button, uiThemeContext, uiThemeVersion } from '@acme/ui'

const html = renderToString(h(ThemeProvider, { theme: 'dark' }, h(Button, null, 'Save')))

console.log(`app       uses @acme/theme ${VERSION}`)
console.log(`@acme/ui  uses @acme/theme ${uiThemeVersion}`)
console.log(`same ThemeContext? ${ThemeContext === uiThemeContext}`)
console.log(html)
