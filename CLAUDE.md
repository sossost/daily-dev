# DailyDev — Agent Rules

## Protected Files

The following files and directories must NEVER be modified by agents:

- `CLAUDE.md`
- `jest.config.ts`
- `next.config.ts`
- `tsconfig.json`
- `package.json`
- `.harness/` (entire directory)

`GOALS.md` and `README.md` are NOT protected — harness scripts update them automatically.

## Code Quality Standard

Write code at the level of a senior engineer at a top-tier tech company. Every line must express clear intent. Follow SRP, DRY, composition over inheritance, declarative patterns, and immutability. If a senior would reject it in code review, don't write it.

## Code Rules

- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4
- State: Zustand
- No `any` types. Use `unknown` and narrow.
- Explicit null checks (`== null`, `!= null`). Never rely on implicit falsy coercion.
- Named constants for all magic numbers.
- Early return with guard clauses. No deep nesting.
- Immutable data. Never mutate objects or arrays.
- One component per file. One hook per file.
- All functions and components must have clear, single responsibilities.
- File size limit: 800 lines. Function limit: 50 lines.
- No `console.log` in production code.
- Tests run in jsdom. Browser APIs (matchMedia, IntersectionObserver, etc.) are mocked in `__tests__/setup.ts`. Use the existing mocks, don't add new global mocks inline.

## Deployment Safety (CRITICAL)

This app runs in users' browsers with persisted data in localStorage. Every change you make must work for BOTH new users AND existing users with old data. If your change can crash a deployed app, it is a production incident. Before committing, verify your changes are safe against all existing client state.

## Content Rules

- Question IDs follow the pattern: `{topic}-{NNN}` (3-digit zero-padded number)
  - Example: `scope-006`, `event-loop-012`
- Each question must have exactly 4 options.
- `correctIndex` must be distributed across 0-3 (no more than 50% on one value per file).
- `explanation` must be at least 20 characters.
- `sourceUrl` must start with `http`.
- `output-prediction` type must include a `code` field.
- No duplicate question IDs across all files.
- No duplicate options within a single question.

## Commit Rules

- Language: English
- Format: conventional commits
- Pattern: `feat({agent}): {summary}`
- Keep commit messages concise and descriptive.

## Tech Stack

- Next.js 15 (App Router, static export)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 4
- Zustand 5
- Framer Motion 12
- Prism.js
- Zod
- clsx
- date-fns
- lucide-react
- sonner

All listed packages are pre-installed. Do not add new packages.

## Project Structure

```
src/
  app/          — Next.js App Router pages and layouts
  components/   — React components
  hooks/        — Custom React hooks
  lib/          — Utilities, helpers, stores
  types/        — TypeScript type definitions
data/
  questions/    — Question JSON files (one per topic)
__tests__/      — Jest test files
.harness/       — Agent orchestration system (protected)
```

## File Change Limit

Agents must not modify more than 20 files in a single run.
