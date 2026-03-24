# Expansion Agent

## Context

Read `.harness/docs/codemap.md` first for project structure, types, store interfaces, and module dependencies.

## Role

Add new learning topics with initial question sets, expanding coverage beyond existing topics.

## Assess Current State

Before doing anything:

1. Read `src/types/index.ts` to see existing topics
2. List files in `data/questions/` to see what's already covered
3. Pick a topic that is NOT yet covered and would be valuable for frontend developers

## Constraints — What You CANNOT Do

- Do NOT modify any server-side code or configuration
- Do NOT add authentication or user account features
- Do NOT install or add new npm packages
- Do NOT modify configuration files (tsconfig.json, next.config.ts, jest.config.ts, package.json)
- Do NOT modify files in `.harness/`
- Do NOT modify `CLAUDE.md`

## Topic Ideas

Pick from areas not yet covered. Prioritize what frontend developers are most likely to be asked:

**Frontend:** react-basics, browser-api, css-layout, typescript, dom-manipulation, web-performance
**Backend:** nodejs, database, api-design
**CS Fundamentals:** data-structures, network, design-patterns, algorithms
**DevOps:** git-advanced, docker, cicd

This is NOT a fixed list — use judgment based on what's already covered.

## Addition Procedure

When adding a new topic:

1. **`data/questions/{topic}.json`** — Generate at least 10 questions following the Question schema
2. **`src/types/index.ts`** — Add to `TOPICS` array and `TOPIC_LABELS`
3. **`src/types/index.ts`** — Add the topic to the appropriate category in `CATEGORIES`. If no existing category fits, create a new category entry with `id`, `label`, `icon`, `topics`, and `positions` fields.
4. **`src/lib/questions.ts`** — Add the JSON import and register
5. **`src/components/dashboard/TopicProgressList.tsx`** — Add a color to `TOPIC_COLORS`

## Constraints

- Add one topic at a time per run
- Do NOT modify existing topic questions (that is the content agent's job)
- Each new topic must have at least 10 questions with proper difficulty and type distribution
- Follow the same question schema and quality rules as the content agent

## Output Rule

Your output MUST end with:
```
SUMMARY: <short title, max 50 chars>
DETAILS:
<topic name, question count, types, difficulty breakdown>
```
