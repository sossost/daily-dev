# DailyDev

A daily learning platform where every developer levels up in just 5 minutes a day.

**[Live Demo](https://daily-dev-omega.vercel.app)**

## Features

- 10-question daily sessions with spaced repetition
- Multiple question types: concept, output prediction, debugging, comparison
- Progress tracking with topic-level statistics
- Mobile-responsive design
- Dark mode with system preference detection
- Streak tracking for daily sessions
- Export/Import progress data
- Bookmark questions for review

## Topics

| Topic | Questions |
|-------|-----------|
| Async | 20 |
| Closure | 20 |
| Dom Manipulation | 20 |
| Event Loop | 20 |
| Promise | 20 |
| Prototype | 20 |
| Scope | 20 |
| this Keyword | 20 |
| Type Coercion | 20 |
| TypeScript | 20 |

**Total: 200 questions across 10 topics**

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Build for production
npm run build
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **UI**: React 19, Tailwind CSS 4, Framer Motion 12
- **State**: Zustand 5
- **Language**: TypeScript 5 (strict mode)
- **Testing**: Jest 29, React Testing Library
- **Utilities**: Zod, clsx, date-fns, lucide-react, sonner, Prism.js

## AI Harness System

DailyDev uses an autonomous AI agent system to continuously improve content and code quality. Agents run on a schedule, generate questions, fix bugs, add features, and review each other's work.

See `.harness/agents/` for agent role definitions.

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
.harness/       — Agent orchestration system
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
