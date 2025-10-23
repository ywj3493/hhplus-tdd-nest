# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based TDD (Test-Driven Development) sample project for a point system, part of the HH Plus curriculum. The project implements user point management with charge/use functionality and transaction history tracking.

## 🚨 CRITICAL: Mandatory Development Rules

**READ [context/policy.md](context/policy.md) FIRST before any implementation work.**

The following rules are **MANDATORY** and must be strictly followed:

### 1. Package Manager Rule
**ALWAYS use pnpm (v8.12.0).** Never use npm or yarn.
```bash
✅ pnpm install
✅ pnpm test
❌ npm install  # NEVER use this
```

### 2. Issue-Based Development Rule
**BEFORE implementing any major feature:**
1. Create issue file in `/context/issue/` (e.g., `issue001.md`)
2. Document problem, plan, test scenarios, and acceptance criteria
3. Implement following the issue plan
4. Update and close issue when complete

### 3. TDD Red-Green-Refactor Rule
**ALWAYS follow this cycle with separate commits:**
- 🔴 **Red**: Write failing tests → Commit: `test: add failing tests for [feature]`
- 🟢 **Green**: Minimal implementation → Commit: `feat: implement [feature] (minimal)`
- ♻️ **Refactor**: Improve code → Commit: `refactor: improve [feature]`

**Each phase MUST have its own separate commit.**

### 4. STEP1 and STEP2 Separation Rule
**DO NOT mix STEP1 and STEP2 work:**

**STEP1 (Do First)**: Basic CRUD with unit tests only
- ✅ 4 basic API endpoints
- ✅ Unit tests with mocking
- ❌ NO business rules yet
- ❌ NO concurrency control yet
- ❌ NO integration tests yet

**STEP2 (Do After STEP1 Complete)**: Advanced features
- ✅ Business rules/policies (minimum amounts, balance checks, etc.)
- ✅ Concurrency control
- ✅ Integration tests
- ✅ Concurrent scenario tests

## Important: Context Documentation

**ALWAYS refer to the `/context` folder for comprehensive project documentation:**

- **[context/policy.md](context/policy.md)**: 🚨 **READ THIS FIRST** - Complete development workflow, TDD process, issue-based development, testing strategy, commit conventions, and quality standards
- **[context/requirements.md](context/requirements.md)**: Detailed API specifications, business rules, data models, validation rules, and test requirements
- **[context/issue/](context/issue/)**: Issue tracking files for each feature implementation (issue001.md, issue002.md, etc.)

These documents define the complete requirements, constraints, and development processes. **Consult these files before implementing any features.**

## Development Commands

### Build and Run

- `pnpm build` - Build the NestJS project
- `pnpm start` - Start the application
- `pnpm start:dev` - Start in watch mode for development
- `pnpm start:debug` - Start with debugging enabled
- `pnpm start:prod` - Run production build

### Testing

- `pnpm test` - Run all integration tests
- `pnpm test:watch` - Run tests in watch mode (useful during TDD)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm test:debug` - Run tests with Node debugger

### Code Quality

- `pnpm lint` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier
- `pnpm sonar` - Generate SonarQube report

### Docker

The project has a multi-stage Dockerfile:

- Dev phase: `docker build --target dev`
- Build phase: `docker build --target build`
- Production: `docker build --target prod`

## Architecture

### Module Structure
The application follows NestJS modular architecture:

- **AppModule**: Root module that imports PointModule
- **PointModule**: Feature module for point management
  - Imports DatabaseModule for data access
  - Contains PointController for HTTP endpoints
- **DatabaseModule**: Provides table services (UserPointTable, PointHistoryTable)

### Data Layer Pattern
The project uses in-memory table classes to simulate database operations:

- **UserPointTable**: Manages user point data with simulated async latency (200-300ms)
  - `selectById(id)`: Retrieve user point record
  - `insertOrUpdate(id, amount)`: Update user points
  - Uses Map for in-memory storage
  - DO NOT modify these table classes - use only their public APIs

- **PointHistoryTable**: Manages transaction history with simulated async latency
  - `insert(userId, amount, transactionType, updateMillis)`: Record transaction
  - `selectAllByUserId(userId)`: Get user's transaction history
  - Uses array for in-memory storage with auto-incrementing cursor
  - DO NOT modify these table classes - use only their public APIs

### Data Models
Defined in [src/point/point.model.ts](src/point/point.model.ts):

- **UserPoint**: `{ id, point, updateMillis }`
- **PointHistory**: `{ id, userId, type, amount, timeMillis }`
- **TransactionType**: Enum with CHARGE and USE

### API Endpoints
All endpoints are under `/point` prefix:

- `GET /point/:id` - Get user's current points
- `GET /point/:id/histories` - Get user's transaction history
- `PATCH /point/:id/charge` - Charge points (body: `{ amount: number }`)
- `PATCH /point/:id/use` - Use points (body: `{ amount: number }`)

### Validation
The project uses class-validator for DTO validation:
- PointBody DTO validates that amount is an integer
- ValidationPipe is applied to request bodies

## TDD Approach

This is a TDD-focused project following the Red-Green-Refactor cycle. **See [context/policy.md](context/policy.md) for complete TDD workflow.**

This project uses both **unit tests** and **integration tests**:

### Unit Tests

- Test individual functions/methods in isolation
- Use **Mock/Stub liberally** with Jest (`jest.fn()`, `jest.spyOn()`, etc.)
- Isolate external dependencies for fast, stable tests
- Test complex business logic independently
- Located in `*.spec.ts` files alongside implementation

### Integration Tests

- Test from API endpoints through to the data layer
- Verify complete business logic flow end-to-end
- Use actual in-memory table implementations
- Validate component interactions
- Located in `*.spec.ts` or `*.e2e-spec.ts` files

### TDD Workflow with Git Commits

This project follows a strict TDD cycle with **commits at each phase**:

1. **Red Phase** - Write failing tests
   - Write tests first that describe the desired functionality
   - Run `pnpm test:watch` for immediate feedback
   - Verify tests fail (red)
   - **Commit**: `test: add failing tests for [feature]`

2. **Green Phase** - Implement minimal code
   - Write the minimum code needed to pass the tests
   - Focus on making tests pass, not on perfect code
   - Run tests to verify they pass (green)
   - **Commit**: `feat: implement [feature] (minimal)`

3. **Refactor Phase** - Improve code quality
   - Refactor code while keeping tests green
   - Improve structure, remove duplication, enhance readability
   - Run `pnpm test:coverage` to check coverage
   - **Commit**: `refactor: improve [feature]`

**Important**: Each phase should have its own commit. This creates a clear history of the TDD process and makes it easy to track the development progression.

### Commit Message Convention

- **Red phase**: `test: add failing tests for [feature description]`
  - Example: `test: add failing tests for point charge minimum amount validation`

- **Green phase**: `feat: implement [feature description] (minimal)`
  - Example: `feat: implement point charge minimum amount validation (minimal)`

- **Refactor phase**: `refactor: improve [feature description]`
  - Example: `refactor: improve point charge validation error handling`

See [context/policy.md](context/policy.md) for detailed commit guidelines and examples.

### Test Configuration

- Unit/Integration tests use Jest with rootDir: "src"
- E2E tests use separate config in [test/jest-e2e.json](test/jest-e2e.json)
- Tests generate sonar_report.xml for code quality analysis
- Coverage target: 80%+ overall, 100% for core business logic

## Key Implementation Notes

The controller methods in [src/point/point.controller.ts](src/point/point.controller.ts) contain TODO comments indicating features to implement. Currently, they return placeholder responses and need proper integration with the table services.

### Business Rules to Implement

**See [context/requirements.md](context/requirements.md) for complete specifications.** Key rules:

1. **Charge minimum amount**: Point charging requires minimum 1,000 won
2. **Usage unit restriction**: Point usage must be in 100 won increments
3. **Minimum balance requirement**: Point usage requires current balance ≥ 5,000 won (before usage)

### Implementation Checklist

When implementing point charge/use logic:
- Validate user IDs (must be positive integers)
- Apply all business rules in correct order (see [context/requirements.md](context/requirements.md))
- Record all transactions in PointHistoryTable
- Update UserPointTable with new point totals
- Ensure point balance never goes negative for USE operations
- Return appropriate HTTP status codes and error messages
- Handle concurrent operations appropriately (simple synchronization, not distributed)

### Development Workflow

**Follow the issue-based workflow defined in [context/policy.md](context/policy.md):**

1. Create issue file in `/context/issue/` (e.g., issue001.md)
2. Write failing tests (Red)
3. Implement minimal code (Green)
4. Refactor and improve (Refactor)
5. Verify all tests pass and coverage meets targets
6. Close issue

### Service Layer Recommendation

As business logic becomes more complex, consider separating concerns:

```text
PointController (HTTP layer)
    ↓
PointService (Business logic & validation)
    ↓
UserPointTable / PointHistoryTable (Data layer)
```
