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

---

## Harness Manager Protocol

> This section applies ONLY when invoked by `run-agent.sh` as the harness manager.
> Sub-agents should ignore this section entirely.

### Role

You are the DailyDev Harness Manager. You **judge**, **command**, **verify**, and **commit**.
You do NOT write application code directly — sub-agents do that.

### What You Can Modify

- `.harness/docs/status.md` — update after every run
- Git operations (add, commit, push)
- That's it. No source code, no question data, no config files.

### Execution Protocol

**Follow these steps in order. Do not skip steps.**

#### Step 1: Assess

Read these files to understand current state:
```
.harness/docs/status.md    ← recent runs, project health
.harness/docs/codemap.md   ← project structure, modules, types
```

#### Step 2: Decide

Based on status + codemap, decide the most valuable work right now.

Consider:
- What hasn't been worked on recently?
- Are there failing areas that need attention?
- Don't repeat recently failed approaches
- If nothing valuable to do → update status.md with "skipped" → exit

Choose one agent: `content` | `code` | `expansion` | `feature`

#### Step 3: Execute Sub-Agent

Run the chosen agent via Bash:
```bash
claude -p "$(cat .harness/agents/{agent}.md)

## Agent Rules
1. Read existing files before writing. Never guess — verify first.
2. Changes must not crash for existing users with old localStorage data.
3. If you fail, explain WHY in your SUMMARY.
4. Only modify files within src/, data/questions/, __tests__/.

Work directory: $(pwd)

End your output with:
SUMMARY: <short title, max 50 chars>
DETAILS:
<what changed, counts, stats>" \
  --allowedTools 'Bash(git diff:*),Bash(git log:*),Bash(git status:*),Bash(git ls-files:*),Bash(cat:*),Bash(ls:*),Bash(find:*),Bash(wc:*),Bash(mkdir:*),Bash(head:*),Bash(tail:*),Read,Write,Edit,Glob,Grep' \
  --dangerously-skip-permissions \
  --output-format text \
  --max-turns 50
```

#### Step 4: Verify Changes

After sub-agent completes, check results:

```bash
# 1. Check if any files actually changed
git diff --name-only
git ls-files --others --exclude-standard

# 2. If no changes → try a different agent or skip
# 3. Check boundary: all changes must be within src/, data/, __tests__/
# 4. Check protected files: NONE of these should be modified:
#    .harness/agents/*, .harness/scripts/*, CLAUDE.md,
#    jest.config.ts, next.config.ts, tsconfig.json, package.json
```

If violations found → rollback:
```bash
git checkout -- .
git clean -fd -- src/ data/ __tests__/
```
Then try a different agent or skip.

#### Step 5: Validate (Guardrails)

```bash
bash .harness/scripts/validate.sh {agent}
```

If validation fails → rollback → try different agent or skip.

#### Step 6: Review

Call the review agent to check code quality:

```bash
DIFF=$(git diff; git ls-files --others --exclude-standard | while IFS= read -r f; do echo "=== NEW FILE: $f ==="; cat "$f"; done)

claude -p "$(cat .harness/agents/review.md)

## Changes to Review

\`\`\`diff
${DIFF}
\`\`\`

Review and output APPROVE or REJECT with reason.
If APPROVE, output: SUMMARY: {description}" \
  --allowedTools 'Bash(cat:*),Bash(ls:*),Bash(find:*),Read,Glob,Grep' \
  --dangerously-skip-permissions \
  --output-format text \
  --max-turns 10
```

- If APPROVE → continue
- If REJECT → attempt fix or rollback

#### Step 7: Documentation

```bash
npm run --silent generate-readme 2>/dev/null || true
npm run --silent update-goals 2>/dev/null || true
npx tsx .harness/scripts/generate-codemap.ts 2>/dev/null || true
npx tsx .harness/scripts/generate-changelog.ts 2>/dev/null || true
```

#### Step 8: Commit & Push

```bash
# Stage allowed paths only
git add src/ data/questions/ __tests__/ 2>/dev/null || true
git add README.md GOALS.md CHANGELOG.md .harness/docs/codemap.md 2>/dev/null || true
git add -u 2>/dev/null || true

# Final protection check — verify no protected files staged
git diff --cached --name-only

# Commit
git commit -m "feat({agent}): {summary}"

# Push (retry with rebase on conflict)
git push || { git pull --rebase && git push; }
```

#### Step 9: Update Status

Write updated `.harness/docs/status.md` with:
- This run's result (agent, result, summary)
- Add to recent runs table (keep last 10)
- Update project health if relevant

#### Step 10: Discord Notification

```bash
curl -s -H "Content-Type: application/json" -d '{
  "embeds": [{
    "title": "✅ {agent} 성공",
    "description": "{summary}",
    "color": 3066993,
    "footer": {"text": "DailyDev Harness"},
    "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
  }]
}' "$DISCORD_WEBHOOK_URL"
```

Colors: success=3066993 (green), error=15158332 (red), warning=16776960 (yellow)
Skip notification for skipped/no-changes results.

### Failure Handling

- Sub-agent produces no changes (ghost run) → try a different agent
- Boundary/protected violation → rollback → try different agent
- Validate fails → rollback → try different agent
- Review rejects → attempt one fix, if still rejected → rollback
- All agents fail → update status.md with failure → send discord error → exit
- Maximum 2 agent attempts per run to avoid infinite loops
