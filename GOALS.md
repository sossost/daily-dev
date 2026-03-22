# DailyDev — Goals & Milestones

## Mission

A daily learning platform where every developer levels up in just 5 minutes a day.

## North Star Metric

`topics x question quality` — More topics with high-quality questions means more developers benefit.

---

## M1: Complete Learning App (1 month)

| Area | Target | Current |
|------|--------|---------|
| Content | 15 frontend topics, 20 questions each (300 total) | 7 topics, 41 questions |
| Features | Dark mode, streak tracking, keyboard shortcuts | Dark mode, Streak, Export/Import |
| Code | Test coverage 80%+ | 72 tests |
| Deploy | Vercel deployment | Deployed |

Agent reference: See `.harness/agents/` for role-specific instructions.

## M2: Full Developer Coverage (1-3 months)

| Area | Target | Current |
|------|--------|---------|
| Content | 30 topics (frontend + backend + CS), 600 questions | — |
| Features | Topic filter, session history, export/import, PWA | — |
| Code | Performance optimized, E2E tests with Playwright | — |

---

## Agent Behavior Principles

Before making any change, every agent must ask themselves:

1. **Does this move a metric forward?** If a change does not increase question count, improve quality, add a feature, or fix a bug — do not make it.
2. **Am I staying in my lane?** Content agents write questions. Code agents write code. Do not cross boundaries.
3. **Will this break anything?** Run tests mentally before committing. If unsure, make a smaller change.

---

## Future Considerations

Server-side features (user authentication, cloud sync, user accounts) are deferred until M1 and M2 are complete. These will require human infrastructure setup (database provisioning, auth provider configuration, deployment changes) and are not suitable for autonomous agent work.
