# Issue 003: PATCH /point/:id/charge - 포인트 충전

## Problem
특정 유저의 포인트를 충전하는 API를 구현해야 합니다.

## Plan
1. PointService.chargePoint() 메서드 구현
   - UserPointTable.selectById()로 현재 포인트 조회
   - 현재 포인트 + 충전 금액 계산
   - UserPointTable.insertOrUpdate()로 업데이트
   - PointHistoryTable.insert()로 CHARGE 타입 거래 기록
2. PointController의 charge() 메서드를 PointService를 사용하도록 수정
3. 단위 테스트 작성 (테이블들을 Mock으로 처리)

## Test Scenarios
- [ ] 포인트를 정상적으로 충전한다 (현재 포인트 + 충전 금액)
- [ ] 충전 후 새로운 포인트가 반환된다
- [ ] UserPointTable.selectById, insertOrUpdate가 올바르게 호출된다
- [ ] PointHistoryTable.insert가 CHARGE 타입으로 올바르게 호출된다
- [ ] 포인트가 0인 사용자도 충전할 수 있다

## Acceptance Criteria
- [ ] 단위 테스트 모두 통과
- [ ] UserPointTable, PointHistoryTable을 Mock으로 처리
- [ ] PointService.chargePoint() 메서드 구현 완료
- [ ] PointController에서 PointService 사용
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성
- [ ] STEP1에서는 비즈니스 규칙 검증 없음 (최소 충전 금액 등은 STEP2에서)

## TDD Phases
### Red Phase
- [x] 실패하는 테스트 작성
- [x] 커밋: `test: add failing tests for point charge` (c115e25)

### Green Phase
- [x] 최소 구현으로 테스트 통과
- [x] 커밋: `feat: implement point charge (minimal)` (396f034)

### Refactor Phase
- [x] 코드 개선 및 리팩토링
- [x] 커밋: `refactor: improve point charge implementation` (8e58a14)

### Controller Integration
- [x] Controller에서 Service 호출하도록 연결
- [x] 커밋: `feat: connect point charge to controller` (d678cfd)

## Status
- [x] Issue Created
- [x] Red Phase Complete
- [x] Green Phase Complete
- [x] Refactor Phase Complete
- [x] Controller Integration Complete
- [x] Issue Closed

## Results
- 총 4개 커밋 생성 (Red-Green-Refactor + Controller Integration)
- 7개 단위 테스트 작성 및 통과 (포인트 충전, 검증 포함)
- PATCH /point/:id/charge 엔드포인트 완성
- 금액 검증 로직 구현 (0 이하, 소수점 체크)
