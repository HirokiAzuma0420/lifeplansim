# Implementation Plan - Life Plan Simulator

This plan outlines the phased implementation of the project, building upon the current codebase to complete the MVP, improve quality, and add extensions.

## 1. Basic Policy
- Achieve an end-to-end MVP as quickly as possible: Form Input → API Execution → Result Visualization.
- Maximize the use of existing assets: Integrate `api/simulate/index.ts` and `components/dashboard/*` into the result page.
- Establish types and validation early to reduce future refactoring costs.

## 2. Phased Roadmap

**Status Legend:** `[Done]`, `[In Progress]`, `[Not Started]`

### Phase 0: Achieving End-to-End MVP
- `[Done]` 1) Implement the result page and set up routing.
- `[Done]` 2) Implement the Form → API integration.
- `[Done]` 3) Reuse and integrate dashboard components.
- `[Done]` 4) Implement minimum validation and error display.

### Phase 1: Strengthening Types/Design and Improving UX
- `[Done]` 5) Separate and share type definitions (`form-types.ts`, `simulation-types.ts`).
- `[Not Started]` 6) Implement robust validation using Zod for both form input and API responses.
- `[Done]` 7) Split the main form into smaller, manageable section components.
- `[Done]` 8) Improve navigation flow, allowing users to return from the result page to edit inputs.

### Phase 2: Calculation Accuracy and Feature Extension
- `[Not Started]` 9) Improve the accuracy of tax and social security calculations.
- `[Done]` 10) Clarify and implement investment scenarios (fixed vs. random/stress test) in the UI and backend.
- `[In Progress]` 11) Implement save/restore functionality.
    - Step 1: `localStorage` auto-save and restore. `[Done]`
    - Step 2: User sign-in and persistence using a database (e.g., Vercel KV, Supabase). `[Not Started]`

### Phase 3: Quality Assurance and Operations
- `[In Progress]` 12) Establish a testing suite.
    - Unit Tests: Cover critical calculation logic (Vitest). `[Not Started]`
    - UI/Component Tests: (React Testing Library). `[Not Started]`
    - E2E Tests: Basic setup with Playwright is complete. Needs expanded coverage. `[In Progress]`
- `[In Progress]` 13) Enhance CI/CD and Monitoring.
    - CI: A basic CI pipeline running tests on push/PR is set up via GitHub Actions. `[In Progress]`
    - CD: Automate deployment to Vercel. `[Not Started]`
    - Monitoring: Implement error tracking with a service like Sentry. `[Not Started]`

---
Detailed remaining tasks are synchronized with `unimplemented_features.md`.
