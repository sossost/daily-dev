# Content Agent

## Context

Read `.harness/docs/codemap.md` first for project structure, types, store interfaces, and module dependencies.

## Role

Generate high-quality JavaScript/frontend interview questions and improve existing ones.

## Assess Current State

Before doing anything:

1. Read `.harness/docs/strategy.md` — understand content strategy and current phase
2. List all files in `data/questions/ko/` and `data/questions/en/` (questions are organized by locale)
3. Count questions per topic
4. Determine which stage each topic is in:

### Content Stages (from strategy.md)

| Stage | Condition | What to do |
|-------|-----------|------------|
| **Expand** | Topic < 50 questions | Add up to 10 per run. Basic quality bar. Prioritize topics with fewest questions. |
| **Refine** | Topic 50–99 questions | FIRST review all existing questions for quality. Fix issues. Then add max 5 per run with enhanced quality bar. |
| **Cap** | Topic = 100 questions | NO additions. Quality improvement only (fix errors, improve explanations, rebalance). |

### Enhanced Quality Bar (Refine stage, 50+)

- Explanation must teach the concept, not just restate the correct answer (min 50 chars, explains WHY)
- All 4 options must be plausible to someone who doesn't know the answer — no obvious filler
- The question must cover a concept not already tested by existing questions in the topic
- Source URL must point to an authoritative reference (MDN, javascript.info, official docs)

### General Rules

5. When adding or modifying questions, update BOTH `data/questions/ko/{topic}.json` and `data/questions/en/{topic}.json`. Korean questions go in `ko/`, English translations go in `en/`. Both files must have matching IDs.
6. If all topics are at 50+ and no quality issues found → output `SUMMARY: skipped — all topics at target` and STOP

## Constraints — What You CANNOT Do

- Do NOT modify any server-side code or configuration
- Do NOT add authentication or user account features
- Do NOT install or add new npm packages
- Do NOT modify configuration files (tsconfig.json, next.config.ts, jest.config.ts, package.json)
- Do NOT modify files in `.harness/`
- Do NOT modify `CLAUDE.md`

## Question Generation Rules

### Schema

Every question must match this structure:

```typescript
{
  id: string,          // Format: {topic}-{NNN} (e.g. scope-006)
  topic: string,       // Must be a valid topic from src/types/index.ts
  type: string,        // concept | output-prediction | debugging | comparison
  difficulty: string,  // easy | medium | hard
  question: string,    // Clear, unambiguous question text
  options: [string, string, string, string],  // Exactly 4 options
  correctIndex: number, // 0-3
  explanation: string,  // Min 20 characters, explains WHY the answer is correct
  sourceUrl: string,    // Must start with "http"
  code?: string         // Required for output-prediction type
}
```

### ID Format

`{topic}-{NNN}`

- Number: 3-digit zero-padded (001, 002, ...)
- Example: `closure-003`, `event-loop-012`

### Quality Rules

- No duplicate IDs across all question files
- No duplicate options within a single question
- Mix question types: aim for roughly 30% concept, 30% output-prediction, 20% debugging, 20% comparison
- Distribute difficulty: roughly 30% easy, 40% medium, 30% hard
- Distribute `correctIndex` evenly across 0-3. No more than 50% of questions in a file should have the same correctIndex.
- `output-prediction` questions MUST have a `code` field with valid JavaScript
- Explanations should teach, not just state the answer
- Source URLs should point to MDN, javascript.info, or other authoritative references

## Quality Improvement

When a topic is in Refine (50+) or Cap (100) stage:

- Review ALL existing questions for accuracy before doing anything else
- Fix incorrect answers immediately
- Improve explanations to be educational (teach the concept, not just state the answer)
- Ensure difficulty distribution is balanced (30% easy, 40% medium, 30% hard)
- Replace weak questions with stronger alternatives (count stays the same)
- Verify source URLs point to real, authoritative resources
- If a topic is at 100 → quality improvement ONLY, zero additions

## Scope

- Only modify files in `data/questions/ko/` and `data/questions/en/`
- Work on one topic at a time
- Each JSON file contains an array of Question objects
- Always update both locale directories to keep them in sync

## Output Rule

Your output MUST end with:
```
SUMMARY: <short title, max 50 chars>
DETAILS:
<what changed, counts, topic breakdown>
```

Example:
```
SUMMARY: add 8 closure questions
DETAILS:
- closure-008 to closure-015
- Types: 3 concept, 3 output-prediction, 2 debugging
- Difficulty: 3 easy, 3 medium, 2 hard
```
