# Zintas AI Pilot

AI-powered dental SEO platform. Next.js 14 App Router + TypeScript strict mode.

## Architecture

- **Route groups:** `(public)`, `(practice)`, `(manager)`, `(onboarding)`
- **packages/**: Local module directories (not a monorepo), imported via `@packages/*` alias
- **Auth:** Clerk with Organizations. Roles: `org:manager`, `org:practice_owner`
- **Database:** Supabase (Postgres) with Row-Level Security scoped by `org_id`
- **Agents:** LangGraph StateGraphs — Conductor, Scholar, Ghostwriter, Analyst
- **Deployment:** Vercel Pro with `maxDuration: 300` on agent routes

## Conventions

### Code Style
- TypeScript strict mode. No `any` types. Use `unknown` with type guards.
- `interface` for objects, `type` for unions/primitives
- Files: `kebab-case.ts`. Components: `PascalCase.tsx`. Functions: `camelCase`
- Named exports (except `page.tsx` files)
- Async/await everywhere. No `.then()` chains. Early returns to reduce nesting.

### Imports
```typescript
// 1. External packages
// 2. Internal absolute imports (@packages/*, @/*)
// 3. Relative imports
```

### Security
- Always check auth via Clerk's `auth()` in API routes
- Always check `orgRole` before processing
- Use `supabaseAdmin` (service role) for agent/server operations
- Use `supabaseServer` (with RLS) for user-facing operations
- Validate all inputs with Zod. Never trust user input.
- Never log credentials, tokens, or PII
- Rate limit public endpoints

### Testing
- Vitest for unit/integration tests
- Test files co-located: `foo.ts` → `foo.test.ts`
- TDD: RED → GREEN → REFACTOR

## Key References
- **Dev Guide:** `zintas-claude-code-dev-guide.md` (42 tasks)
- **Playbook:** `zintas-pilot-build-playbook.md` (build HOW-TO)
- **BRD:** `Zintas-Pilot-Build-BRD.docx` (WHAT to build)
