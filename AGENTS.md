# Repository Guidelines

## Project Structure & Module Organization
- `src/main` hosts the Electron main process entry points and app lifecycle utilities under `src/main/utils`.
- `src/preload` exposes the bridged APIs injected into renderer windows.
- `src/renderer/src` contains the React front end: `components/` for widgets, `layout/` for shell chrome, `store/` for Zustand state, and `assets/` for static UI assets. `main.jsx` wires the app root.
- `resources/` carries packaged assets (icons, default configs) used by electron-builder.
- Build artefacts land in `out/` and `build/`; treat them as generated and keep changes out of version control.

## Build, Test, and Development Commands
- `npm install` installs all Electron and React dependencies; rerun after editing `package.json`.
- `npm run dev` launches the hot-reloaded Electron app via electron-vite.
- `npm run start` opens the compiled preview bundle for sanity checks.
- `npm run build` produces production bundles in `out/`; pair with `npm run build:mac|win|linux` for platform packages.
- `npm run lint` and `npm run format` run ESLint and Prettier; run before commits to avoid CI churn.

## Coding Style & Naming Conventions
- Follow `.editorconfig`: spaces, 2-space indent, LF endings, no trailing whitespace.
- Prettier enforces single quotes, 100 char line width, and no semicolons.
- Name React components and Zustand stores in PascalCase; hooks remain camelCase with `use` prefix.
- Keep IPC channel identifiers and preload exports snake_case to match existing modules.

## Testing Guidelines
- Automated tests are not wired yet; exercise new flows manually in `npm run dev` using sample models like `fisher.tck`.
- When adding tests, colocate them near the feature (e.g., `src/renderer/src/components/ComponentName.test.jsx`) and document the command you add.
- Record manual test notes in PR descriptions until a runner is introduced.

## Commit & Pull Request Guidelines
- Match recent history: `feat:`, `fix:`, `chore:` prefixes followed by a concise summary (e.g., `feat: improve automaton layout`).
- Scope commits narrowly and include relevant commands or data files touched.
- PRs need: a short purpose statement, testing evidence (commands run or screenshots for UI changes), and links to tracked issues.
- Request review from maintainers familiar with the affected area (UI vs. Electron main) and respond to feedback promptly.
