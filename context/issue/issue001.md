# Issue 001: GET /point/:id - 포인트 조회

## Problem
특정 유저의 현재 포인트를 조회하는 API를 구현해야 합니다.

## Plan
1. PointService.getPoint() 메서드 구현
   - UserPointTable.selectById()를 호출하여 사용자 포인트 조회
   - 존재하지 않는 사용자의 경우 테이블에서 기본값 반환 (point: 0)
2. PointController의 point() 메서드를 PointService를 사용하도록 수정
3. 단위 테스트 작성 (UserPointTable을 Mock으로 처리)

## Test Scenarios
- [ ] 존재하는 사용자의 포인트를 정상적으로 조회
- [ ] 존재하지 않는 사용자 조회 시 기본값(point: 0) 반환
- [ ] UserPointTable.selectById가 올바른 userId로 호출되는지 검증

## Acceptance Criteria
- [ ] 단위 테스트 모두 통과
- [ ] UserPointTable을 Mock으로 처리
- [ ] PointService.getPoint() 메서드 구현 완료
- [ ] PointController에서 PointService 사용
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성

## TDD Phases
### Red Phase
- [x] 실패하는 테스트 작성
- [x] 커밋: `test: add failing tests for point retrieval` (fb9e326)

### Green Phase
- [x] 최소 구현으로 테스트 통과
- [x] 커밋: `feat: implement point retrieval (minimal)` (12fd6a9)

### Refactor Phase
- [x] 코드 개선 및 리팩토링
- [x] 커밋: `refactor: improve point retrieval implementation` (809d933)

### Controller Integration
- [x] Controller에서 Service 호출하도록 연결
- [x] 커밋: `feat: connect point retrieval to controller` (a799f43)

## Status
- [x] Issue Created
- [x] Red Phase Complete
- [x] Green Phase Complete
- [x] Refactor Phase Complete
- [x] Controller Integration Complete
- [x] Issue Closed

## Results
- 총 4개 커밋 생성 (Red-Green-Refactor + Controller Integration)
- 3개 단위 테스트 작성 및 통과
- GET /point/:id 엔드포인트 완성
