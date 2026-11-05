# peer-deps-demo

What happens when two copies of a library end up in one app, and how
`peerDependencies` prevents that.

This is the demo for the post
[What peerDependencies Actually Protect You From](https://ihabkhattab.com/blog/what-peerdependencies-actually-protect-you-from/).

## The packages

- **`@acme/theme`**: `ThemeProvider` and `useTheme()`, built on a React context
  whose default value is `"light"`.
  - **v1**: `useTheme()` returns a string.
  - **v2** is a breaking release: `useTheme()` returns an object, `{ theme }`.
- **`@acme/ui`**: a component library built on `@acme/theme`. Its `Button`
  sets `className={useTheme()}`, so v1 to v3 only work with theme v1.
  - **v1** lists `@acme/theme@^1.0.0` in `dependencies`. It brings its own copy.
  - **v2** lists `@acme/theme@^1.0.0` in `peerDependencies`. It uses the app's copy.
  - **v3** has the same code, with the peer range changed to `"*"`.
  - **v4** fixes the button to handle both majors and lists the peer range
    `"^1.0.0 || ^2.0.0"`.

Every scenario runs the same app:

```jsx
<ThemeProvider theme="dark">
  <Button>Save</Button>
</ThemeProvider>
```

`main.js` writes it with `createElement` so it runs in Node with no build step,
renders it with `renderToString`, and prints which copy of `@acme/theme` each
side loaded.

## Run it

```sh
./run.sh            # all nine scenarios
./run.sh 1-nested   # just one
```

Needs Node 18+ and npm 7+. `run.sh` packs the packages into `tarballs/` and starts
`registry.mjs`, a tiny local registry for `@acme/*` only (see each scenario's
`.npmrc`). Then, for each scenario, it does a fresh `npm install`, runs
`npm ls @acme/theme`, and runs `node main.js`. React comes from npmjs.

## The scenarios

| Scenario | `@acme/ui` | App asks for | Result |
|---|---|---|---|
| `1-nested` | v1 (dependency `^1`) | `@acme/theme@^2` | **Two copies.** `same ThemeContext? false`, `<button class="light">`. No error, no warning |
| `2-deduped` | v1 (dependency `^1`) | `@acme/theme@^1` | One copy (`deduped`), `<button class="dark">` |
| `3-peer-conflict` | v2 (peer `^1`) | `@acme/theme@^2` | **Install fails** with `ERESOLVE` |
| `4-peer-ok` | v2 (peer `^1`) | `@acme/theme@^1` | One copy, `<button class="dark">` |
| `5-peer-star` | v3 (peer `*`) | `@acme/theme@^2` | **Installs cleanly**, one copy, `npm ls` exits 0, then `<button class="[object Object]">` |
| `6-override` | v1 (dependency `^1`) | `@acme/theme@^2`, plus `"overrides": { "@acme/theme": "$@acme/theme" }` | One copy (`deduped`), but `@acme/ui` runs on v2: `<button class="[object Object]">` |
| `7-peer-star-app-v1` | v3 (peer `*`) | `@acme/theme@^1` | One copy (`deduped`), `<button class="dark">` |
| `8-peer-range` | v4 (peer `^1 \|\| ^2`) | `@acme/theme@^2` | One copy (`deduped`), `<button class="dark">`. The range was tested, so the check means something |
| `9-peer-range-app-v1` | v4 (peer `^1 \|\| ^2`) | `@acme/theme@^1` | One copy (`deduped`), `<button class="dark">` |

Scenarios 1 and 3 are the same mismatch. With a regular dependency it fails
silently at runtime. With a peer it fails loudly at install time. Scenario 5
is that peer with the check turned off: one copy, but the breaking major goes
in without a word. Scenario 6 is scenario 1 with an override: it removes the
second copy, but it can't make `@acme/ui` v1 work with v2. Scenario 7 is
scenario 5 on the version the button was written for: it works, but the range
didn't check that. Scenario 8 is the fix the post ends on: the library
supports both majors and says so in its range. Scenario 9 is the same fix for
an app still on v1.

## The eight cases in the post

The post's "All Eight Cases" figure crosses how `@acme/ui` lists `@acme/theme` with
what the app asks for. Each case is one scenario:

| `@acme/ui` lists it as | App asks for `^1.0.0` | App asks for `^2.0.0` |
|---|---|---|
| `dependencies: "^1.0.0"` | `2-deduped` | `1-nested` |
| `peerDependencies: "^1.0.0"` | `4-peer-ok` | `3-peer-conflict` |
| `peerDependencies: "*"` | `7-peer-star-app-v1` | `5-peer-star` |
| `peerDependencies: "^1.0.0 \|\| ^2.0.0"` | `9-peer-range-app-v1` | `8-peer-range` |

`6-override` isn't in the figure. The post covers it in its own section.

## Also worth trying

These need the registry running. Run `./pack.sh` once, start `node registry.mjs`
in another terminal, and work inside a scenario's folder.

- **How scenario 1 happens in real life.** Start from an app that only has
  `@acme/ui@^1`, then run `npm install @acme/theme`. npm writes
  `"@acme/theme": "^2.0.0"` (the latest), and `npm ls` shows two copies.
- **`--legacy-peer-deps` on scenario 3.** The install succeeds with one copy of
  v2, and `npm ls` reports `invalid: "^1.0.0" from node_modules/@acme/ui`. The
  library runs against the breaking major and renders
  `<button class="[object Object]">`.
- **Peers on the root project.** If the app lists `@acme/theme` under
  `peerDependencies` instead of `dependencies`, npm 7+ installs it anyway.
- **An override on scenario 3.** Add
  `"overrides": { "@acme/theme": "$@acme/theme" }` to its `package.json`. The
  `ERESOLVE` goes away, `npm ls` exits 0 without marking anything `invalid`, and
  the button renders `<button class="[object Object]">`.
- **`npm dedupe` and `npm find-dupes` on scenario 1.** After an install, `npm dedupe`
  reports "up to date" and leaves both copies, because no version satisfies both
  `^1.0.0` and `^2.0.0`. `npm find-dupes` doesn't list them either. `pnpm dedupe`
  also leaves both.

## pnpm

Checked with pnpm 12 (`pnpm install` and `pnpm why @acme/theme` in each scenario,
with the registry running). Scenarios 1, 2, 4 and 7 match npm, including the two
copies in scenario 1. The difference is scenario 3: pnpm **does not fail**. It
prints `Issues with peer dependencies found` and installs v2 out of range, which
is what npm does with `--legacy-peer-deps`. `pnpm peers check` shows the
mismatch, and `--config.strict-peer-dependencies=true` turns it into an install
error (`ERR_PNPM_PEER_DEP_ISSUES`). `pnpm add @acme/theme` writes `^2.0.0` just
like npm, and root `peerDependencies` get installed. Scenario 5 (`"*"`) gives
`No peer dependency issues found`, even with strict mode on, and so do
scenarios 8 and 9. Scenario 6 has a
`pnpm-workspace.yaml` with the same override, since pnpm 12 reads overrides
from there and ignores a `"pnpm"` field in `package.json` (with a warning).
