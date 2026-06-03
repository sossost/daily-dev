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
| Algorithms | 65 |
| API Design | 65 |
| Async | 70 |
| Browser API | 65 |
| Closure | 70 |
| CSS Layout | 65 |
| Data Structures | 65 |
| Database | 65 |
| Design Patterns | 65 |
| DOM Manipulation | 70 |
| Event Loop | 70 |
| Git Advanced | 65 |
| Network | 65 |
| Node.js | 65 |
| Promise | 70 |
| Prototype | 70 |
| React Basics | 65 |
| Scope | 70 |
| this Keyword | 65 |
| Type Coercion | 70 |
| TypeScript | 65 |
| Web Performance | 65 |
| Web Security | 65 |

**Total: 1535 questions across 23 topics**

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
