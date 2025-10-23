# Issue 002: GET /point/:id/histories - 포인트 내역 조회

## Problem
특정 유저의 포인트 충전/사용 내역을 조회하는 API를 구현해야 합니다.

## Plan
1. PointService.getHistories() 메서드 구현
   - PointHistoryTable.selectAllByUserId()를 호출하여 사용자 거래 내역 조회
   - 내역이 없는 경우 빈 배열 반환
2. PointController의 history() 메서드를 PointService를 사용하도록 수정
3. 단위 테스트 작성 (PointHistoryTable을 Mock으로 처리)

## Test Scenarios
- [ ] 거래 내역이 있는 사용자의 내역을 정상적으로 조회
- [ ] 거래 내역이 없는 사용자 조회 시 빈 배열 반환
- [ ] PointHistoryTable.selectAllByUserId가 올바른 userId로 호출되는지 검증

## Acceptance Criteria
- [ ] 단위 테스트 모두 통과
- [ ] PointHistoryTable을 Mock으로 처리
- [ ] PointService.getHistories() 메서드 구현 완료
- [ ] PointController에서 PointService 사용
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성

## TDD Phases
### Red Phase
- [ ] 실패하는 테스트 작성
- [ ] 커밋: `test: add failing tests for point history retrieval`

### Green Phase
- [ ] 최소 구현으로 테스트 통과
- [ ] 커밋: `feat: implement point history retrieval (minimal)`

### Refactor Phase
- [ ] 코드 개선 및 리팩토링
- [ ] 커밋: `refactor: improve point history retrieval implementation`

### Controller Integration
- [ ] Controller에서 Service 호출하도록 연결
- [ ] 커밋: `feat: connect point history retrieval to controller`

## Status
- [x] Issue Created
- [ ] Red Phase Complete
- [ ] Green Phase Complete
- [ ] Refactor Phase Complete
- [ ] Controller Integration Complete
- [ ] Issue Closed
