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
- [ ] 실패하는 테스트 작성
- [ ] 커밋: `test: add failing tests for point use`

### Green Phase
- [ ] 최소 구현으로 테스트 통과
- [ ] 커밋: `feat: implement point use (minimal)`

### Refactor Phase
- [ ] 코드 개선 및 리팩토링
- [ ] 커밋: `refactor: improve point use implementation`

### Controller Integration
- [ ] Controller에서 Service 호출하도록 연결
- [ ] 커밋: `feat: connect point use to controller`

## Status
- [x] Issue Created
- [ ] Red Phase Complete
- [ ] Green Phase Complete
- [ ] Refactor Phase Complete
- [ ] Controller Integration Complete
- [ ] Issue Closed
