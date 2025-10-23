# Development Policy

This document defines the development workflow, TDD process, and coding standards for this project.

## 🎯 Core Development Rules

### 1. Package Manager
**ALWAYS use pnpm (v8.12.0) for all operations.**
- ✅ `pnpm install`
- ✅ `pnpm test`
- ✅ `pnpm build`
- ❌ Never use `npm` or `yarn`

### 2. Issue-Based Development
**Before implementing any major feature, create an issue file first:**

1. Create issue file in `/context/issue/` directory (e.g., `issue001.md`, `issue002.md`)
2. Document in the issue file:
   - Problem statement
   - Implementation plan
   - Test scenarios
   - Acceptance criteria
3. Implement the feature following the issue plan
4. Update issue file with results and close when complete

**Issue File Template:**
```markdown
# Issue XXX: [Feature Name]

## Problem
[What needs to be implemented]

## Plan
[How to implement it]

## Test Scenarios
- [ ] Test case 1
- [ ] Test case 2

## Acceptance Criteria
- [ ] All tests pass
- [ ] Code coverage meets target

## Status
- [ ] In Progress
- [ ] Completed
```

### 3. TDD Red-Green-Refactor Cycle
**ALWAYS follow the TDD cycle for all feature development:**

#### Red Phase: Write Failing Tests
1. Write tests FIRST that describe the desired functionality
2. Run tests to verify they fail (red)
3. Use `pnpm test:watch` for immediate feedback
4. **Git commit**: `test: add failing tests for [feature]`

**Example:**
```bash
# Write test first
# Run: pnpm test:watch
# Verify test fails (RED)
git add .
git commit -m "test: add failing tests for point charge validation"
```

#### Green Phase: Implement Minimal Code
1. Write the MINIMUM code needed to pass the tests
2. Focus on making tests pass, NOT on perfect code
3. Run tests to verify they pass (green)
4. **Git commit**: `feat: implement [feature] (minimal)`

**Example:**
```bash
# Write minimal implementation
# Run: pnpm test
# Verify test passes (GREEN)
git add .
git commit -m "feat: implement point charge validation (minimal)"
```

#### Refactor Phase: Improve Code Quality
1. Refactor code while keeping tests green
2. Improve structure, remove duplication, enhance readability
3. Run `pnpm test:coverage` to check coverage
4. **Git commit**: `refactor: improve [feature]`

**Example:**
```bash
# Refactor code
# Run: pnpm test:coverage
# Ensure tests still pass and coverage improves
git add .
git commit -m "refactor: improve point charge validation error handling"
```

**⚠️ IMPORTANT**: Each phase MUST have its own separate commit. This creates a clear history of the TDD process.

### 4. STEP1 and STEP2 Separation
**DO NOT mix STEP1 and STEP2 work. Complete STEP1 entirely before starting STEP2.**

#### STEP1 - TDD Basic (Must Complete First)
**Goal**: Implement basic CRUD functionality with unit tests

**Scope**:
- ✅ Implement 4 basic API endpoints:
  1. GET /point/:id - Get user's current points
  2. GET /point/:id/histories - Get user's transaction history
  3. PATCH /point/:id/charge - Charge points
  4. PATCH /point/:id/use - Use points
- ✅ Write unit tests for each feature
- ✅ Use /database package classes WITHOUT modifying them
- ✅ Create PointService for business logic
- ✅ Follow Red-Green-Refactor for each feature
- ❌ NO business rules/policies yet (e.g., minimum balance, max charge)
- ❌ NO concurrency control yet
- ❌ NO integration tests yet (unit tests only)

**Testing Strategy for STEP1**:
- Focus on **unit tests** with mocking
- Test each service method in isolation
- Mock dependencies (UserPointTable, PointHistoryTable)
- Aim for 80%+ code coverage

**STEP1 Completion Checklist**:
- [ ] All 4 API endpoints implemented and working
- [ ] Unit tests written for all features
- [ ] All tests passing
- [ ] Code follows testable design patterns
- [ ] Each feature has Red-Green-Refactor commits
- [ ] No TODO comments remaining in implementation

#### STEP2 - TDD Advanced (Start Only After STEP1 Complete)
**Goal**: Add business policies, concurrency control, and integration tests

**Scope**:
- ✅ Add business rules/policies:
  - Minimum charge amount (e.g., 1,000 won)
  - Usage unit restrictions (e.g., 100 won increments)
  - Minimum balance requirement (e.g., 5,000 won)
  - Maximum balance limit
  - Insufficient balance handling
- ✅ Implement concurrency control for same user requests
- ✅ Write integration tests for all 4 features
- ✅ Write integration tests for concurrent scenarios
- ✅ Document concurrency control approach in README.md

**Testing Strategy for STEP2**:
- Add **integration tests** that test full flow
- Test from API endpoint through to data layer
- Use actual in-memory table implementations (no mocks)
- Test concurrent request scenarios
- Aim for 80%+ overall coverage, 100% for business logic

**STEP2 Completion Checklist**:
- [ ] All business rules implemented with tests
- [ ] Concurrency control implemented and tested
- [ ] Integration tests written for all features
- [ ] Concurrent scenario tests passing
- [ ] README.md documents concurrency approach
- [ ] All tests passing
- [ ] Coverage targets met

## 📝 Commit Message Convention

### Format
```
<type>: <description>

[optional body]
```

### Types
- `test`: Adding or modifying tests (Red phase)
- `feat`: Adding new features (Green phase)
- `refactor`: Code refactoring (Refactor phase)
- `fix`: Bug fixes
- `docs`: Documentation changes
- `chore`: Build process or tooling changes

### Examples

**Red Phase:**
```
test: add failing tests for point charge minimum amount validation
test: add failing tests for concurrent point usage scenarios
```

**Green Phase:**
```
feat: implement point charge minimum amount validation (minimal)
feat: implement concurrency control for point operations (minimal)
```

**Refactor Phase:**
```
refactor: improve point charge validation error handling
refactor: extract validation logic to separate class
```

**Other:**
```
fix: correct point history timestamp generation
docs: update README with concurrency control explanation
chore: update jest configuration for coverage reporting
```

## 🧪 Testing Strategy

### Test Doubles: Mock vs Stub
**Understanding the distinction is crucial for writing clear, maintainable tests:**

#### Stub (스텁)
- **Purpose**: Provides predetermined responses to method calls
- **Usage**: Use when you need to **provide data** for the test
- **Verification**: NO verification on stub calls
- **Comment in code**: `// Stub: Provides predetermined return value`

#### Mock (모의 객체)
- **Purpose**: Verifies that methods were called with correct parameters
- **Usage**: Use when you need to **verify behavior**
- **Verification**: YES - explicitly verify calls with `expect().toHaveBeenCalledWith()`
- **Comment in code**: `// Mock: Verify this method was called correctly`

**Key Rule**:
- Use **Stub** when testing return values and data flow
- Use **Mock** when testing interactions and method calls

### Unit Tests
- **Purpose**: Test individual functions/methods in isolation
- **When**: STEP1 (primary), STEP2 (as needed)
- **Approach**:
  - Use Jest test doubles (`jest.fn()`, `jest.spyOn()`)
  - Use **Stubs** for providing data
  - Use **Mocks** for verifying behavior
  - Clearly annotate which is which in comments
  - Test business logic independently
  - Fast execution, no I/O operations
- **Location**: `*.spec.ts` files alongside implementation

### Test Code Style

**테스트 코드 작성 규칙:**
1. **Given-When-Then 패턴** 사용 (주석으로 명시)
2. **테스트 케이스 설명은 한글로** 작성 (it 문의 description)
3. **Stub과 Mock을 명확히 구분**하여 주석 작성
4. **과도한 주석은 지양**, 필요한 부분만 간결하게

**Example:**
```typescript
describe('PointService', () => {
  let service: PointService;
  let userPointTable: jest.Mocked<UserPointTable>;
  let pointHistoryTable: jest.Mocked<PointHistoryTable>;

  beforeEach(async () => {
    const mockUserPointTable = {
      selectById: jest.fn(),
      insertOrUpdate: jest.fn(),
    };

    const mockPointHistoryTable = {
      insert: jest.fn(),
      selectAllByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        { provide: UserPointTable, useValue: mockUserPointTable },
        { provide: PointHistoryTable, useValue: mockPointHistoryTable },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointTable = module.get(UserPointTable);
    pointHistoryTable = module.get(PointHistoryTable);
  });

  it('포인트를 정상적으로 충전한다', async () => {
    // given: 현재 포인트 1000원인 사용자
    userPointTable.selectById.mockResolvedValue({
      id: 1,
      point: 1000,
      updateMillis: Date.now(),
    });
    userPointTable.insertOrUpdate.mockResolvedValue({
      id: 1,
      point: 2000,
      updateMillis: Date.now(),
    });

    // when: 1000원을 충전하면
    const result = await service.chargePoint(1, 1000);

    // then: 포인트가 2000원이 된다
    expect(result.point).toBe(2000);

    // then: 테이블 메서드들이 올바르게 호출된다
    expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 2000);
    expect(pointHistoryTable.insert).toHaveBeenCalledWith(
      1,
      1000,
      TransactionType.CHARGE,
      expect.any(Number),
    );
  });
});
```

### Integration Tests
- **Purpose**: Test complete business flow from API to data layer
- **When**: STEP2 (primary focus)
- **Approach**:
  - Test from controller through service to table
  - Use actual in-memory table implementations
  - No mocking of table classes
  - Test realistic scenarios
- **Location**: `*.spec.ts` or `*.e2e-spec.ts` files

**Example:**
```typescript
describe('PointController Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [PointModule, DatabaseModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should handle full charge flow', async () => {
    // Test complete flow without mocks
  });
});
```

### Concurrency Tests (STEP2)
- **Purpose**: Verify concurrent operations are handled correctly
- **Approach**:
  - Use `Promise.all()` to simulate concurrent requests
  - Test same user, multiple operations
  - Verify data consistency
  - Test race conditions

**Example:**
```typescript
it('should handle concurrent point usage correctly', async () => {
  const userId = 1;

  // Execute multiple operations concurrently
  const results = await Promise.all([
    service.usePoint(userId, 1000),
    service.usePoint(userId, 2000),
    service.usePoint(userId, 1500),
  ]);

  // Verify final state is consistent
  const finalPoint = await service.getPoint(userId);
  expect(finalPoint.point).toBe(expectedAmount);
});
```

## 🏗️ Code Structure Guidelines

### Service Layer Pattern (Recommended)
Separate concerns into layers:

```
PointController (HTTP layer)
    ↓
PointService (Business logic & validation)
    ↓
UserPointTable / PointHistoryTable (Data layer)
```

### Testable Code Design
1. **Dependency Injection**: Use NestJS DI for all dependencies
2. **Single Responsibility**: Each class/function does one thing
3. **Interface-based Design**: Depend on abstractions, not implementations
4. **Avoid Static Methods**: Use instance methods for testability
5. **Pure Functions**: Prefer functions without side effects when possible

### Code Quality Standards
- **Coverage Target**: 80%+ overall, 100% for business logic
- **No TODO Comments**: In production code (OK in issue files)
- **Error Handling**: Always throw appropriate exceptions
- **Type Safety**: Use TypeScript strictly, avoid `any`
- **Naming**: Clear, descriptive names for variables, functions, classes

## 🚫 Important Constraints

### DO NOT Modify Database Classes
**NEVER modify these files:**
- `src/database/userpoint.table.ts`
- `src/database/pointhistory.table.ts`

**Only use their public APIs:**
- UserPointTable: `selectById()`, `insertOrUpdate()`
- PointHistoryTable: `insert()`, `selectAllByUserId()`

### DO NOT Skip TDD Phases
- ❌ Do not write implementation before tests
- ❌ Do not skip refactoring phase
- ❌ Do not batch multiple phase commits into one

### DO NOT Mix STEP1 and STEP2
- ❌ Do not add business rules in STEP1
- ❌ Do not add concurrency control in STEP1
- ❌ Do not start STEP2 before STEP1 is complete

## 📊 Coverage and Quality Checks

### Before Committing
```bash
# Run all tests
pnpm test

# Check coverage
pnpm test:coverage

# Run linting
pnpm lint

# Format code
pnpm format
```

### Coverage Targets
- Overall: 80%+
- Business Logic: 100%
- Controllers: 80%+
- Services: 100%

### Quality Report
```bash
# Generate SonarQube report
pnpm sonar
```

## 🔄 Development Workflow Summary

### For Each New Feature:

1. **Create Issue** → `context/issue/issueXXX.md`
2. **Red Phase** → Write failing tests → Commit
3. **Green Phase** → Minimal implementation → Commit
4. **Refactor Phase** → Improve code → Commit
5. **Verify** → Run tests, check coverage
6. **Update Issue** → Mark complete

### Complete STEP1 First:
1. Issue001: GET /point/:id
2. Issue002: GET /point/:id/histories
3. Issue003: PATCH /point/:id/charge
4. Issue004: PATCH /point/:id/use
5. Verify all STEP1 requirements met

### Then Start STEP2:
1. Issue005: Add business rules
2. Issue006: Add concurrency control
3. Issue007: Add integration tests
4. Issue008: Document concurrency approach

## 📚 Reference Documents

- **[context/requirements.md](requirements.md)**: Detailed feature specifications
- **[CLAUDE.md](../CLAUDE.md)**: Architecture and development commands
- **Issue Files**: Individual feature documentation

---

**Remember**: TDD is not just about writing tests. It's about designing better software through tests. Follow the Red-Green-Refactor cycle strictly to get the full benefits of TDD.
