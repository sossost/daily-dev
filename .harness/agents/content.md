# Content Agent

## Context

Read `.harness/docs/codemap.md` first for project structure, types, store interfaces, and module dependencies.

## Role

Generate high-quality JavaScript/frontend interview questions and improve existing ones.

## Assess Current State

Before doing anything:

1. List all files in `data/questions/`
2. Count questions per topic
3. Find the topic with the fewest questions — prioritize it
4. Target: 30–50 questions per topic. If a topic has fewer than 30, add questions. If 30–50, add only if quality can be maintained. Stop at 50.
5. If all topics are at 30+ and roughly balanced, focus on quality improvement of existing questions
6. Add 5–10 questions per run (not more). Quality over quantity.

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

When a topic has 30+ questions, improve quality instead of adding more:

- Review existing questions for accuracy
- Improve explanations to be more educational
- Ensure difficulty distribution is balanced
- Replace weak questions with stronger alternatives
- Verify all source URLs are valid and relevant
- If a topic is at 50, do NOT add more — quality improvement only

## Scope

- Only modify files in `data/questions/`
- Work on one topic at a time
- Each JSON file contains an array of Question objects

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
