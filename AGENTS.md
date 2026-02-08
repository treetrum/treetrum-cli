# Repository Guidelines

## Project Structure & Module Organization

- `src/index.ts` wires the CLI entrypoint and registers commands.
- `src/treetrum.ts` is the executable bin (`tt`).
- `src/commands/` contains feature modules (e.g., `budget/`, `download-tv/`).
- `src/utils/` holds shared helpers (env loading, 1Password lookups, etc.).
- Tests live next to code as `*.test.ts` (example: `src/commands/download-tv/utils.test.ts`).

## Build, Test, and Development Commands

- `bun install` installs dependencies.
- `bun run src/index.ts` runs the CLI in dev mode.
- `tt -h` runs the linked CLI after `bun link`.
- `bun test` runs the Bun test runner.
- `bun run lint` runs Biome checks and auto-fixes.

## Coding Style & Naming Conventions

- Language: TypeScript with ESM imports.
- Indentation: 4 spaces (Biome). YAML uses 2 spaces.
- Quotes: double quotes; semicolons always.
- Prefer `camelCase` for variables/functions and `PascalCase` for types/classes.
- Run `bun run lint` before pushing; `lefthook` enforces lint + test on pre-commit.

## Testing Guidelines

- Framework: `bun:test` (`describe`, `it`, `expect`).
- Naming: co-locate tests as `*.test.ts` next to the module under test.
- Run all tests via `bun test`. Add tests for URL parsing, env parsing, or command behavior when changing logic.

## Commit & Pull Request Guidelines

- Commit style follows Conventional Commits: `feat:`, `fix:`, `chore:`, `deps:` (see recent history).
- Keep commits focused; include scope if it clarifies (`feat(budget): ...`).
- PRs should include a clear description, linked issues when applicable, and testing notes (commands run, failures if any).

## Configuration & Secrets

- Environment variables are loaded from the nearest `.env` (searches parent dirs).
- Some commands expect secrets (e.g., `TENPLAY_USERNAME`, `TENPLAY_PASSWORD`, `UP_TOKEN`, `AMEX_USER`, `AMEX_PW`).
- Values can be plain strings or 1Password refs (`op://...`); `src/utils/secrets.ts` resolves them at runtime.
