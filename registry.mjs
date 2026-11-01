// A tiny npm registry that serves only the @acme/* packages in packages/.
// It is just enough of the registry protocol for `npm install` to work:
// a JSON "packument" per package name, plus the tarballs from ./pack.sh.
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'

const PORT = 4873
const base = `http://localhost:${PORT}`
const root = new URL('.', import.meta.url).pathname
const packuments = {}

for (const dir of readdirSync(`${root}packages`)) {
  const pkg = JSON.parse(readFileSync(`${root}packages/${dir}/package.json`, 'utf8'))
  const file = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`
  const bytes = readFileSync(`${root}tarballs/${file}`)
  const doc = (packuments[pkg.name] ??= { name: pkg.name, versions: {}, 'dist-tags': {} })
  doc.versions[pkg.version] = {
    ...pkg,
    dist: {
      tarball: `${base}/-/${file}`,
      shasum: createHash('sha1').update(bytes).digest('hex'),
      integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    },
  }
  const latest = doc['dist-tags'].latest
  if (!latest || pkg.version.localeCompare(latest, undefined, { numeric: true }) > 0) {
    doc['dist-tags'].latest = pkg.version
  }
}

createServer((req, res) => {
  const path = decodeURIComponent(req.url)
  if (path.startsWith('/-/')) {
    res.writeHead(200, { 'content-type': 'application/octet-stream' })
    return res.end(readFileSync(`${root}tarballs/${path.slice(3)}`))
  }
  const doc = packuments[path.slice(1)]
  res.writeHead(doc ? 200 : 404, { 'content-type': 'application/json', 'cache-control': 'no-cache' })
  res.end(JSON.stringify(doc ?? { error: 'not found' }))
}).listen(PORT, () => console.log(`demo registry on ${base} (${Object.keys(packuments).join(', ')})`))
