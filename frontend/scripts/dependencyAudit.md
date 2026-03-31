# Dependency Audit (depcheck)

This project uses [depcheck](https://github.com/depcheck/depcheck) to find unused npm dependencies and missing dependencies. Use it to keep the dependency tree lean and to spot mistakes.

## How to run depcheck

From the **frontend** directory:

```bash
# Human-readable report (recommended for regular audits)
npm run depcheck

# Machine-readable JSON (for CI or custom tooling)
npm run depcheck:json
```

- **`npm run depcheck`** – Prints a summary to the terminal: unused dependencies, unused devDependencies, and missing dependencies.
- **`npm run depcheck:json`** – Same analysis in JSON (e.g. for scripts or pipelines).

## How to interpret results

### Unused dependencies

- **dependencies** – Listed if depcheck finds no `require()` / `import` (or common patterns) for that package in your source.
- **devDependencies** – Same idea; only build/tooling code is scanned.

**Important:** Depcheck is static and pattern-based. It can:

- **False positives:** Mark a package as “unused” when it is actually used (e.g. dynamic imports, config files, Vite/ESLint plugins, binaries, or dependencies of other tools). Always confirm before removing.
- **False negatives:** Miss some usage (e.g. in non-JS config or generated code). So “no unused” does not guarantee every dependency is necessary.

Treat the report as a **suggested audit list**, not an automatic removal list.

### Missing dependencies

Packages that are imported/required in code but not listed in `package.json` (or not installed). These should be fixed by adding the correct dependency; otherwise installs or builds can fail.

### Unused devDependencies

Same as unused dependencies but for dev-only packages. Again, verify each one: many are used by the toolchain (Vite, ESLint, etc.) and not by your app source.

## Warning: do not remove critical dependencies blindly

- **Do not** run automated scripts that remove every “unused” package from `package.json`. You can break the build, lint, or runtime.
- **Always** review and test after any change:
  - Run `npm run build` and `npm run dev`.
  - Run `npm run lint` if you rely on ESLint plugins.
- **Examples of “unused” but required packages:**
  - **Vite / Rollup plugins** (e.g. `@vitejs/plugin-react`, `rollup-plugin-visualizer`) – used in `vite.config.js`.
  - **ESLint plugins** (e.g. `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`) – used in `eslint.config.js`.
  - **Type definitions** (e.g. `@types/react`) – used by TypeScript/IDE, not by direct import in app code.
  - **Binaries / CLI tools** – used via `npx` or npm scripts, not via `import`/`require`.
  - **Optional or conditional usage** – e.g. `@axe-core/react` only in dev, or packages used in config/env-specific code.

**Best practice:** Use depcheck to get a shortlist, then remove only packages you have verified as truly unused (and re-run build + dev after each change).

## Production use

- Run `npm run depcheck` periodically (e.g. in a sprint or before releases) to catch accidental leftovers.
- Optionally run `npm run depcheck:json` in CI and fail or warn when “unused” or “missing” counts exceed a threshold, but still treat removals as a manual, reviewed step.
