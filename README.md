# 동시성 제어 방식 분석 및 선택 보고서

## 1. 동시성 문제 정의

### 문제 상황

동일한 사용자가 여러 포인트 작업(충전/사용)을 동시에 요청할 경우, **Race Condition**이 발생하여 데이터 일관성이 깨질 수 있습니다.

**Race Condition 예시:**

```
초기 잔액: 10,000원

동시 요청:
- 요청 1: 5,000원 충전
- 요청 2: 3,000원 사용

❌ Race Condition 발생 시:
  1. 요청 1과 요청 2가 동시에 현재 잔액 10,000원 조회
  2. 요청 1: 10,000 + 5,000 = 15,000원으로 업데이트
  3. 요청 2: 10,000 - 3,000 = 7,000원으로 업데이트
  4. 최종 잔액: 7,000원 (잘못됨!)

✅ 올바른 결과: 12,000원 (10,000 + 5,000 - 3,000)
```

### 요구사항

- 같은 사용자의 동시 요청은 **순차적으로 처리**하여 데이터 일관성 보장
- 다른 사용자의 요청은 **병렬 처리**하여 성능 유지
- In-memory 환경 (단일 서버, 분산 환경 고려 불필요)

---

## 2. 동시성 제어 방식 비교

### 방식 1: Promise Queue ✅ (채택)

#### 개념

사용자별로 Promise 체인을 유지하여 작업을 순차적으로 처리하는 방식입니다.
- `Map<userId, Promise>`로 각 사용자의 마지막 작업 추적
- 새로운 요청은 이전 Promise가 완료된 후 실행되도록 체이닝
- Promise 완료 시 자동으로 메모리 정리

#### 구현 코드

```typescript
@Injectable()
export class PointService {
  // 사용자별 Promise 큐
  private readonly userLocks: Map<number, Promise<unknown>> = new Map();

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    return this.executeWithLock(userId, () =>
      this.chargePointInternal(userId, amount),
    );
  }

  private async executeWithLock<T>(
    userId: number,
    task: () => Promise<T>,
  ): Promise<T> {
    // 1. 이전 작업 가져오기 (없으면 즉시 실행 가능)
    const previousTask = this.userLocks.get(userId) || Promise.resolve();

    // 2. 현재 작업을 이전 작업에 체이닝
    const currentTask = previousTask
      .then(() => task())
      .catch((error) => {
        throw error; // 에러 전파
      })
      .finally(() => {
        // 3. 작업 완료 후 메모리 정리
        if (this.userLocks.get(userId) === currentTask) {
          this.userLocks.delete(userId);
        }
      });

    // 4. 현재 작업을 Map에 저장
    this.userLocks.set(userId, currentTask);
    return currentTask;
  }

  private async chargePointInternal(
    userId: number,
    amount: number,
  ): Promise<UserPoint> {
    // 실제 충전 로직...
  }
}
```

#### 동작 흐름

```
사용자 1의 요청:
┌─────────┐    ┌─────────┐    ┌─────────┐
│ 요청 A  │───▶│ 요청 B  │───▶│ 요청 C  │
└─────────┘    └─────────┘    └─────────┘
   (완료 후 B 실행) (완료 후 C 실행)

사용자 2의 요청:
┌─────────┐
│ 요청 D  │  (사용자 1과 독립적으로 병렬 실행)
└─────────┘
```

#### 장점

| 항목 | 설명 |
|------|------|
| ✅ **의존성 없음** | 외부 라이브러리 불필요, 순수 TypeScript/Promise 사용 |
| ✅ **간결한 구현** | 약 20줄의 코드로 구현 가능 |
| ✅ **자동 메모리 관리** | Promise 완료 후 `finally`에서 자동으로 Map에서 제거 |
| ✅ **Node.js 친화적** | Promise는 JavaScript/TypeScript의 기본 패턴 |
| ✅ **성능 유지** | 다른 사용자의 요청은 병렬 처리 |
| ✅ **유지보수** | 코드가 단순하여 이해하기 쉬움 |

#### 단점

| 항목 | 설명 |
|------|------|
| ⚠️ **명시성 부족** | Lock/Unlock이 명시적으로 보이지 않아 동시성 제어 의도가 덜 명확 |
| ⚠️ **디버깅** | Promise 체인 추적이 Mutex보다 어려울 수 있음 |

---

### 방식 2: Mutex/Semaphore (async-mutex)

#### 개념

`async-mutex` 라이브러리를 사용한 명시적인 Lock/Unlock 방식입니다.
- Mutex를 acquire하여 임계 영역 진입
- try/finally로 확실한 release 보장
- 사용자별로 Mutex 인스턴스 관리

#### 구현 예시

```typescript
import { Mutex } from 'async-mutex';

@Injectable()
export class PointService {
  // 사용자별 Mutex 관리
  private readonly userMutexes: Map<number, Mutex> = new Map();

  private getUserMutex(userId: number): Mutex {
    if (!this.userMutexes.has(userId)) {
      this.userMutexes.set(userId, new Mutex());
    }
    return this.userMutexes.get(userId)!;
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    const mutex = this.getUserMutex(userId);
    const release = await mutex.acquire(); // Lock 획득

    try {
      // 임계 영역: 포인트 충전 로직
      this.validateChargeAmount(amount);
      const currentPoint = await this.userPointTable.selectById(userId);
      const newPoint = currentPoint.point + amount;
      // ... 충전 로직
      return updatedUserPoint;
    } finally {
      release(); // Lock 해제 (반드시 실행)
    }
  }
}
```

#### 동작 흐름

```
사용자 1의 요청:
┌─────────────────┐
│  Mutex.acquire  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ 임계 영역 │
    └────┬─────┘
         │
    ┌────▼─────┐
    │ release  │
    └──────────┘
```

#### 장점

| 항목 | 설명 |
|------|------|
| ✅ **명시적 의도** | Lock/Unlock이 코드에서 명확히 보임 |
| ✅ **검증된 라이브러리** | async-mutex는 널리 사용되고 안정적 |
| ✅ **에러 처리** | try/finally로 확실한 unlock 보장 |
| ✅ **가독성** | 동시성 제어 코드가 명확하여 이해하기 쉬움 |
| ✅ **타임아웃 지원** | Mutex acquire 시 타임아웃 설정 가능 |
| ✅ **우선순위 지원** | 요청에 우선순위 부여 가능 |

#### 단점

| 항목 | 설명 |
|------|------|
| ❌ **외부 의존성** | npm 패키지 추가 필요 (`async-mutex`) |
| ❌ **보일러플레이트** | try/finally 블록이 모든 메서드에 반복됨 |
| ❌ **메모리 관리** | Mutex 인스턴스의 수동 정리 필요 (사용자가 많아질 경우) |

---

## 3. 선택 이유: Promise Queue

### 주요 결정 요인

#### 1️⃣ 프로젝트 요구사항에 부합

- **단순한 In-Memory 동시성 제어만 필요**
  - 분산 환경 고려 불필요
  - 복잡한 타임아웃이나 우선순위 처리 불필요
  - 같은 사용자 순차 처리, 다른 사용자 병렬 처리만 구현하면 충분

#### 2️⃣ 의존성 최소화

- 외부 라이브러리 없이 순수 TypeScript로 구현
- 패키지 관리 부담 감소
- 번들 사이즈 최소화 (프로덕션 환경)

#### 3️⃣ 학습 목적

- Promise 체이닝 패턴 이해 및 활용
- JavaScript의 비동기 메커니즘 깊이 있는 학습
- 동시성 제어의 기본 원리를 직접 구현하여 이해

#### 4️⃣ 성능

- Mutex 방식과 비슷한 성능
- 다른 사용자 간 병렬 처리 지원
- 메모리 사용량 최소화 (자동 정리)

---

## 4. 검증 결과

### 테스트 시나리오

```typescript
describe('동시성 제어', () => {
  it('동일 사용자가 동시에 3번 충전 시 모든 충전이 순차적으로 처리된다', async () => {
    const userId = 100;
    const initialBalance = 10000;

    await Promise.all([
      service.chargePoint(userId, 5000),
      service.chargePoint(userId, 5000),
      service.chargePoint(userId, 5000),
    ]);

    expect(finalBalance).toBe(25000); // ✅ 통과
  });

  it('서로 다른 사용자의 요청은 독립적으로 처리된다', async () => {
    await Promise.all([
      service.chargePoint(user1Id, 5000),
      service.chargePoint(user2Id, 5000),
    ]);

    // ✅ 두 사용자 모두 정확한 잔액
  });
});
```

### 테스트 결과

```
✅ 동일 사용자가 동시에 3번 충전 시 모든 충전이 순차적으로 처리된다
✅ 동일 사용자가 동시에 3번 사용 시 모든 사용이 순차적으로 처리된다
✅ 동일 사용자가 충전과 사용을 동시에 요청 시 순차 처리된다
✅ 서로 다른 사용자의 요청은 독립적으로 처리된다
✅ 동시 요청 시 모든 거래 내역이 정확하게 기록된다

총 49개 테스트 모두 통과
```

---

## 5. 비교 요약표

| 항목 | Promise Queue | Mutex (async-mutex) |
|------|--------------|---------------------|
| **외부 의존성** | ✅ 없음 | ❌ 필요 (async-mutex) |
| **코드 복잡도** | ✅ 간단 (~20줄) | ⚠️ 보통 (try/finally 반복) |
| **명시성** | ⚠️ 암묵적 | ✅ 명시적 (Lock/Unlock) |
| **메모리 관리** | ✅ 자동 | ⚠️ 수동 |
| **에러 처리** | ✅ catch/finally | ✅ try/finally |
| **성능** | ✅ 동일 | ✅ 동일 |
| **타임아웃** | ❌ 미지원 | ✅ 지원 |
| **학습 곡선** | ⚠️ Promise 이해 필요 | ✅ 직관적 |
| **적합한 경우** | 단순한 순차 처리 | 복잡한 동기화 필요 시 |

---

## 6. 결론

### Promise Queue 선택이 적합한 이유

본 프로젝트의 요구사항은 다음과 같습니다:
- ✅ 같은 사용자의 동시 요청 순차 처리
- ✅ 다른 사용자의 요청 병렬 처리
- ✅ In-memory 환경 (분산 환경 X)

이러한 요구사항에 **Promise Queue**는 다음과 같은 이유로 최적의 선택입니다:

1. **단순성**: 20줄의 코드로 모든 요구사항 충족
2. **효율성**: 메모리 자동 관리, 병렬 처리 지원
3. **안정성**: 49개 테스트로 검증 완료
4. **학습 가치**: Promise 패턴 깊이 있는 이해

### Mutex 방식이 더 적합한 경우

다음과 같은 경우에는 Mutex 방식을 고려해야 합니다:

- ⚠️ **분산 환경**으로 확장 (Redis Lock 필요)
- ⚠️ **복잡한 타임아웃 정책** 필요
- ⚠️ **우선순위 기반 작업 처리** 필요
- ⚠️ **명시적인 Lock 관리**가 중요한 비즈니스 요구사항
- ⚠️ **팀 전체의 이해도**: Mutex가 더 직관적일 경우

### 최종 선택

**현재 프로젝트의 요구사항과 규모에서는 Promise Queue가 최적의 선택입니다.**

---

**작성일**: 2025-10-24
**프로젝트**: 포인트 관리 시스템 - 동시성 제어 구현
