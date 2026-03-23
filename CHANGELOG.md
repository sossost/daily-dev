# Changelog

> Auto-generated from git history. Do not edit manually.

## 2026-03-23

### Features

- **content**: Enhanced 10 question explanations in type-coercion.json and typescript.json with... (`90dc9cf`)
- **content**: Enhanced 10 question explanations in closure.json and this.json with deeper tech... (`f44531c`)
- add Google Analytics 4 tracking (`3a5f1fd`)
- **content**: Enhanced explanations in async, event-loop, prototype, and scope question files ... (`cec76ba`)
- **content**: Reorder answer options and update correctIndex values to achieve perfectly even ... (`9196f96`)
- **content**: Added 5 new TypeScript questions (016-020) covering array inference, Omit/Pick, ... (`475388f`)
- **expansion**: add typescript topic with 15 questions (`6c5408a`)
- auto-generated CHANGELOG.md from git history (`92f2ddd`)
- add Discord webhook notifications to harness (`f14eddb`)
- **feature**: add bookmark feature with persistent store and dedicated page (`91a57ee`)
- **content**: Added 99 new questions across all 7 topic files (41→140 total), each file now ha... (`a7ad744`)
- order new questions by difficulty (easy → hard) (`9053b6a`)
- auto-generated codemap for agent context (`d516933`)
- remove daily session limit (`a4bd5fd`)
- **content**: Added 10 new prototype-related questions (006-015) covering debugging, compariso... (`57cf88c`)
- **feature**: Agent run completed (no summary provided); fix: Agent run completed (no summary ... (`b4eeb71`)
- DailyDev MVP — daily learning app for developers (`9347ced`)

### Bug Fixes

- use npm ci instead of npm install in pipeline (`a067eec`)
- auto-sync, auto-install, and detailed error notifications (`8ceb00c`)
- add error boundary, Sentry tracking, and localStorage migration (`de76239`)
- detect ghost runs where agent reports work but no files change (`975d736`)
- exclude .harness/docs/ from protected pattern (`1cfb2b1`)
- update review schedule text for unlimited sessions (`2649ee1`)
- SSR crash in useHydration during static export (`8ddc39b`)
- hydration race condition and layout shift (`48103f5`)
- auto-rebase on push conflict in agent runner (`b31ca24`)
- persist session state across page refresh (`4a3e5e1`)
- floating next button, dark mode contrast, code quality standard (`b803c60`)
- improve commit message quality — max-turns 50, review summary fallback (`d0be31c`)

### Refactoring

- inject agent principles via pipeline, not CLAUDE.md (`4c12902`)
- remove fixed targets, enable autonomous agent loop (`cf8f9a3`)
- structured commit messages in agent runner (`ba5d77e`)

### Documentation

- add deployment safety rules for agents (`95ed078`)
- add domain JSDoc to core modules (`1bd597b`)

### Chores

- change scheduler interval from 1 hour to 30 minutes (`86cc410`)
- project setup + AI harness system (`ecdb9b0`)
