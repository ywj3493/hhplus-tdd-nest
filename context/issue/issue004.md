# Issue 004: PATCH /point/:id/use - 포인트 사용

## Problem
특정 유저의 포인트를 사용하는 API를 구현해야 합니다.

## Plan
1. PointService.usePoint() 메서드 구현
   - UserPointTable.selectById()로 현재 포인트 조회
   - 현재 포인트 - 사용 금액 계산
   - UserPointTable.insertOrUpdate()로 업데이트
   - PointHistoryTable.insert()로 USE 타입 거래 기록
2. PointController의 use() 메서드를 PointService를 사용하도록 수정
3. 단위 테스트 작성 (테이블들을 Mock으로 처리)

## Test Scenarios
- [ ] 포인트를 정상적으로 사용한다 (현재 포인트 - 사용 금액)
- [ ] 사용 후 새로운 포인트가 반환된다
- [ ] UserPointTable.selectById, insertOrUpdate가 올바르게 호출된다
- [ ] PointHistoryTable.insert가 USE 타입으로 올바르게 호출된다
- [ ] 0원 사용 시도 시 에러가 발생한다
- [ ] 음수 금액 사용 시도 시 에러가 발생한다
- [ ] 소수점 금액 사용 시도 시 에러가 발생한다
- [ ] 잔액보다 많은 금액 사용 시도 시 에러가 발생한다

## Acceptance Criteria
- [ ] 단위 테스트 모두 통과
- [ ] UserPointTable, PointHistoryTable을 Mock으로 처리
- [ ] PointService.usePoint() 메서드 구현 완료
- [ ] PointController에서 PointService 사용
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성
- [ ] STEP1에서는 기본 검증만 (잔액 부족 체크는 간단히 구현)

## TDD Phases
### Red Phase
- [x] 실패하는 테스트 작성
- [x] 커밋: `test: add failing tests for point use` (70ff979)

### Green Phase
- [x] 최소 구현으로 테스트 통과
- [x] 커밋: `feat: implement point use (minimal)` (ba09257)

### Refactor Phase
- [x] 코드 개선 및 리팩토링
- [x] 커밋: `refactor: improve point use implementation` (10014ee)

### Controller Integration
- [x] Controller에서 Service 호출하도록 연결
- [x] 커밋: `feat: connect point use to controller` (5f68aa3)

## Status
- [x] Issue Created
- [x] Red Phase Complete
- [x] Green Phase Complete
- [x] Refactor Phase Complete
- [x] Controller Integration Complete
- [x] Issue Closed

## Results
- 총 4개 커밋 생성 (Red-Green-Refactor + Controller Integration)
- 8개 단위 테스트 작성 및 통과 (포인트 사용, 검증 포함)
- PATCH /point/:id/use 엔드포인트 완성
- 금액 검증 로직 구현 (0 이하, 소수점, 잔액 부족 체크)
