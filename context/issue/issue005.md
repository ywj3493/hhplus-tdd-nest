# Issue 005: PointController 단위 테스트

## Problem
PointController의 단위 테스트가 작성되지 않았습니다. Controller 레이어가 Service를 올바르게 호출하고, 파라미터를 제대로 처리하는지 검증해야 합니다.

## Plan
1. `src/point/point.controller.spec.ts` 파일 생성
2. PointService를 Mock으로 처리하여 Controller만 독립적으로 테스트
3. 4개의 Controller 메서드에 대한 단위 테스트 작성:
   - `point(id)`: GET /point/:id
   - `history(id)`: GET /point/:id/histories
   - `charge(id, pointDto)`: PATCH /point/:id/charge
   - `use(id, pointDto)`: PATCH /point/:id/use
4. 각 메서드에 대해 Service 호출, 파라미터 파싱, 응답 반환을 검증

## Test Scenarios

### point() - GET /point/:id
- [ ] userId로 service.getPoint()를 호출한다
- [ ] service에서 반환된 UserPoint를 그대로 반환한다
- [ ] id 파라미터가 올바르게 숫자로 파싱된다

### history() - GET /point/:id/histories
- [ ] userId로 service.getHistories()를 호출한다
- [ ] service에서 반환된 PointHistory 배열을 그대로 반환한다
- [ ] id 파라미터가 올바르게 숫자로 파싱된다

### charge() - PATCH /point/:id/charge
- [ ] userId와 amount로 service.chargePoint()를 호출한다
- [ ] service에서 반환된 UserPoint를 그대로 반환한다
- [ ] DTO의 amount가 올바르게 전달된다

### use() - PATCH /point/:id/use
- [ ] userId와 amount로 service.usePoint()를 호출한다
- [ ] service에서 반환된 UserPoint를 그대로 반환한다
- [ ] DTO의 amount가 올바르게 전달된다

## Acceptance Criteria
- [ ] 단위 테스트 모두 통과 (총 12개 예상)
- [ ] PointService를 Mock으로 처리
- [ ] Controller 메서드가 Service를 올바른 파라미터로 호출하는지 검증
- [ ] Red-Green-Refactor 사이클로 3개 커밋 생성
- [ ] Given-When-Then 패턴 적용
- [ ] 한글 테스트 설명 사용

## TDD Phases
### Red Phase
- [ ] 실패하는 테스트 작성
- [ ] 커밋: `test: add failing tests for point controller`

### Green Phase
- [ ] 테스트가 통과하도록 조정
- [ ] 커밋: `test: verify point controller tests pass (green phase)`

### Refactor Phase
- [ ] 테스트 코드 리팩토링 및 개선
- [ ] 커밋: `refactor: improve point controller tests`

## Status
- [ ] Issue Created
- [ ] Red Phase Complete
- [ ] Green Phase Complete
- [ ] Refactor Phase Complete
- [ ] Issue Closed

## Notes
- ValidationPipe는 단위 테스트에서 테스트하지 않음 (통합 테스트 영역)
- Controller는 Service 호출 및 결과 반환만 담당
- 비즈니스 로직 검증은 Service 단위 테스트에서 이미 완료
