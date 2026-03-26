# Product Strategy

> This document is the source of truth for what the harness manager should prioritize.
> Update this file to change agent behavior. The manager reads it every run.

## Current Phase

```
phase: polish
```

### Phase Definitions

- **growth**: Build toward MVP. Add features, topics, and content aggressively.
- **polish**: Improve quality of what exists. No new features unless explicitly approved. Content expands to target, then refines.
- **maintain**: Bug fixes and content quality only. Minimal changes.

## Content Strategy

| Stage | Condition | Agent Behavior |
|-------|-----------|----------------|
| **Expand** | Topic has < 50 questions | Add up to 10 per run. Basic quality bar (review.md criteria). |
| **Refine** | Topic has 50–99 questions | Full review of existing questions FIRST. Fix issues before adding. Max 5 per run. Enhanced quality bar. |
| **Cap** | Topic has 100 questions | No additions. Quality improvement only. |

### Enhanced Quality Bar (Refine stage)

- Explanation must teach, not just restate the answer (min 50 chars, explains WHY)
- All 4 options must be plausible — no obvious filler
- New question must cover a concept not already tested in the topic
- Source URL must point to an authoritative reference (MDN, javascript.info, official docs)

## Topic Strategy

- No hard cap on topic count
- A new topic may be added ONLY when ALL of these are true:
  - It covers a subject frequently asked in frontend/backend developer interviews
  - It does not overlap 70%+ with any existing topic
  - At least 10 meaningful questions can be written for it (sufficient depth)
  - The agent can articulate WHY this topic is more valuable than alternatives
- If the agent is unsure whether a topic qualifies → skip. Never force a topic.

## Feature Strategy

- **Default mode**: No new features. Feature agent skips.
- **Approved mode**: Feature agent implements ONLY items from the list below.
- Feature agent must NEVER invent features on its own.

### Approved Features

```
(empty — add items here to enable feature agent)
```

Format: `- [feature name]: [one-line description]`

When this list is empty, feature agent always skips.

## Code Agent Scope

Allowed (autonomous, auto-merge):
- Bug fixes with clear right/wrong
- Test additions and improvements
- Type safety improvements (no `any`, proper narrowing)
- Accessibility attributes (ARIA, keyboard nav — additive only)
- Performance optimization (when measurable, not speculative)

**Forbidden** (requires human decision):
- UI layout or visual changes
- Component restructuring
- Feature consolidation or removal
- User flow or navigation changes
- State management structure changes
- Any change that alters what the user sees or how they interact

Rule: If a change would be visible in a screenshot, the code agent must NOT do it.

## Skip Policy

The manager MUST skip (run no agent) when:
- All agents are saturated/blocked and no approved features exist
- The same agent ran 3 times consecutively with diminishing returns
- The previous run was skipped and no external state change has occurred (no new commits, no strategy update)

**Skip is a valid, healthy outcome — not a failure.** An unnecessary commit is worse than no commit.

## Value Test

Before choosing any agent, the manager must ask:
> "If I showed this change to the user, would they care?"

- "Yes, this fixes something broken" → proceed
- "Yes, this adds content they don't have" → proceed (if within content strategy)
- "Maybe, it's a marginal improvement" → probably skip
- "No, but it keeps metrics up" → definitely skip
