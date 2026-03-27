# DailyDev

A daily learning platform where every developer levels up in just 5 minutes a day.

**[Live Demo](https://daily-dev-omega.vercel.app)**

## Features

- 10-question daily sessions with spaced repetition
- Multiple question types: concept, output prediction, debugging, comparison
- Progress tracking with topic-level statistics
- Mobile-responsive design
- Multi-language support (English / Korean)
- Dark mode with system preference detection
- Timed challenge mode
- Wrong answer notebook for targeted review
- Streak tracking for daily sessions
- Keyboard shortcuts for navigation
- Session history with past results
- Topic filter for focused practice
- Export/Import progress data
- Bookmark questions for review
- Onboarding flow with position-based topics

## Topics

| Topic | Questions |
|-------|-----------|
| Algorithms | 30 |
| API Design | 25 |
| Async | 28 |
| Browser API | 25 |
| Closure | 30 |
| CSS Layout | 30 |
| Data Structures | 30 |
| Database | 30 |
| Design Patterns | 30 |
| DOM Manipulation | 20 |
| Event Loop | 28 |
| Git Advanced | 20 |
| Network | 20 |
| Node.js | 30 |
| Promise | 28 |
| Prototype | 28 |
| React Basics | 30 |
| Scope | 30 |
| this Keyword | 30 |
| Type Coercion | 30 |
| TypeScript | 30 |
| Web Performance | 20 |
| Web Security | 25 |

**Total: 627 questions across 23 topics**

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

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4, Framer Motion 12
- **i18n**: next-intl (English / Korean)
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
  app/[locale]/  — Locale-aware pages and layouts
  components/    — React components
  hooks/         — Custom React hooks
  i18n/          — next-intl routing, request config, navigation
  lib/           — Utilities, helpers, stores
  types/         — TypeScript type definitions
data/
  questions/
    en/          — English question JSON files (one per topic)
    ko/          — Korean question JSON files (one per topic)
messages/
  en.json        — English UI translations
  ko.json        — Korean UI translations
__tests__/       — Jest test files
.harness/        — Agent orchestration system
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
