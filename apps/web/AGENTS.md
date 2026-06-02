# SolStudy Project Instructions

## Project Overview

SolStudy is a focused study productivity app. The main product priority is:

1. To-do list
2. Pomodoro timer per task
3. Idea Vault
4. AI Chat, Mind Map, and Review Cards as future/secondary features

Do not treat AI chat, mind map, or flashcards as the main screen unless explicitly requested.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Better-T-Stack
- Bun package manager
- tRPC, Drizzle, PostgreSQL, Better Auth are available but should not be used unless the task specifically asks for backend/database/auth work.
- Current feature work should prefer local React state and localStorage unless instructed otherwise.

## UI Style

Preserve the existing SolStudy dark dashboard style:

- background: #111722
- panels/cards: #1a2332
- borders: #232f48
- muted text: #92a4c9
- low-priority text: #556987
- blue accent: #135bec
- emerald accent for active/done/focus states
- rounded-xl / rounded-2xl
- subtle borders, soft glow, clean spacing

Do not replace the UI with plain unstyled components.

## Development Rules

- Continue from existing files. Do not recreate the page from scratch unless explicitly asked.
- Reuse existing components where possible.
- Prefer minimal, targeted changes.
- Do not add new dependencies without explaining why.
- Do not introduce database/backend/auth changes unless requested.
- Keep TypeScript types explicit for app state.
- Avoid unused imports and broken component references.
- Make sure the app compiles after changes.

## Feature Priority

For `/study-mode`, prioritize:

- task creation
- task edit/delete/complete
- selected task state
- working Pomodoro timer
- Pomodoro count per task
- localStorage persistence
- Idea Vault modal

Demote these to sidebar or placeholder links:

- AI Chat
- Mind Map
- Review Cards
- Knowledge Rail

## Local Storage Keys

Use these keys when relevant:

- solstudy-tasks
- solstudy-selected-task-id
- solstudy-pomodoro-state
- solstudy-ideas
- solstudy-productivity-stats

## Response Style

When reporting back:

- Be brief.
- List changed files.
- List commands to run only if needed.
- Do not paste large code blocks unless asked.
