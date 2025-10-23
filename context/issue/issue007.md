# Issue 007: Concurrency Control Implementation

## Problem
동일한 사용자에 대한 동시 요청이 발생할 때 데이터 일관성 문제가 발생할 수 있습니다. 예를 들어, 같은 사용자가 동시에 포인트를 사용하는 경우 race condition이 발생하여 잘못된 잔액이 계산될 수 있습니다.

## Plan
1. PointService에 사용자별 동시성 제어 메커니즘 추가
   - Promise 큐 방식 사용 (Node.js 환경에 적합)
   - 사용자 ID별로 작업을 순차적으로 처리
2. chargePoint(), usePoint() 메서드에 동시성 제어 적용
3. 동시성 테스트 작성
   - Promise.all()을 사용한 동시 요청 시뮬레이션
   - 최종 잔액의 정확성 검증

## Implementation Approach
**Promise Queue 방식 (선택)**
- 사용자별로 Promise 체인을 유지
- 새로운 요청은 이전 요청이 완료된 후 실행
- Map<userId, Promise>로 각 사용자의 작업 큐 관리

## Test Scenarios

### 동시 충전 테스트
- [ ] 동일 사용자가 동시에 3번 충전 시 모든 충전이 순차적으로 처리됨
- [ ] 최종 잔액이 정확함 (초기잔액 + 충전1 + 충전2 + 충전3)

### 동시 사용 테스트
- [ ] 동일 사용자가 동시에 3번 사용 시 모든 사용이 순차적으로 처리됨
- [ ] 최종 잔액이 정확함 (초기잔액 - 사용1 - 사용2 - 사용3)

### 혼합 동시 요청 테스트
- [ ] 동일 사용자가 충전과 사용을 동시에 요청 시 순차 처리됨
- [ ] 최종 잔액이 정확함
- [ ] 잔액 부족 시 에러가 올바르게 발생함

### 다른 사용자 동시 요청
- [ ] 서로 다른 사용자의 요청은 동시 처리됨 (블로킹 없음)

### 통합 테스트 (실제 Table 사용)
- [ ] 실제 UserPointTable, PointHistoryTable을 사용한 동시성 테스트
- [ ] 거래 내역이 모두 정확하게 기록됨

## Acceptance Criteria
- [ ] 동시성 제어 메커니즘 구현 완료
- [ ] 동시성 테스트 모두 통과
- [ ] 다른 사용자 간 블로킹 없음
- [ ] 기존 테스트가 모두 통과함
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성
- [ ] Given-When-Then 패턴 적용
- [ ] 한글 테스트 설명 사용

## TDD Phases
### Red Phase
- [x] 실패하는 동시성 테스트 작성
- [x] 커밋: `test: add failing tests for concurrency control` (05c3675)

### Green Phase
- [x] 최소 구현으로 테스트 통과
- [x] 커밋: `feat: implement concurrency control (minimal)` (a1c818b)

### Refactor Phase
- [x] 코드 개선 및 리팩토링
- [x] 커밋: `refactor: improve concurrency control implementation` (960bfc8)

## Status
- [x] Issue Created
- [x] Red Phase
- [x] Green Phase
- [x] Refactor Phase
- [x] Completed

## Results
- 총 3개 커밋 생성 (Red-Green-Refactor)
- 5개의 새로운 동시성 테스트 추가
- 전체 49개 테스트 모두 통과
- Promise Queue 방식으로 동시성 제어 구현 완료
- 같은 사용자 요청은 순차 처리, 다른 사용자는 병렬 처리
- 외부 라이브러리 의존성 없음 (순수 TypeScript/Promise 사용)
- 상세한 주석 추가로 코드 이해도 향상

## Notes
- Node.js는 싱글 스레드이지만 비동기 작업 중 race condition 발생 가능
- 간단한 in-memory 락 메커니즘으로 충분 (분산 환경 고려 불필요)
- 성능보다 데이터 정확성이 우선
- README.md에 선택한 방식의 장단점 문서화 필요 (Issue 009에서)
