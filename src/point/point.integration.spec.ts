import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { TransactionType } from './point.model';

describe('Point Integration Tests', () => {
  let controller: PointController;
  let service: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [PointService, UserPointTable, PointHistoryTable],
    }).compile();

    controller = module.get<PointController>(PointController);
    service = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
  });

  describe('GET /point/:id - 포인트 조회', () => {
    it('존재하는 사용자의 포인트 조회가 정상 작동한다', async () => {
      // given: 10,000원을 가진 사용자
      const userId = 1;
      await userPointTable.insertOrUpdate(userId, 10000);

      // when: 포인트를 조회하면
      const result = await controller.point(userId);

      // then: 10,000원이 반환된다
      expect(result.id).toBe(userId);
      expect(result.point).toBe(10000);
      expect(result.updateMillis).toBeDefined();
    });

    it('존재하지 않는 사용자 조회 시 기본값을 반환한다', async () => {
      // given: 존재하지 않는 사용자 ID
      const userId = 999;

      // when: 포인트를 조회하면
      const result = await controller.point(userId);

      // then: 기본값(0원)이 반환된다
      expect(result.id).toBe(userId);
      expect(result.point).toBe(0);
    });
  });

  describe('GET /point/:id/histories - 거래 내역 조회', () => {
    it('거래 내역이 있는 사용자의 내역을 정상 조회한다', async () => {
      // given: 충전과 사용 내역이 있는 사용자
      const userId = 2;
      await userPointTable.insertOrUpdate(userId, 10000);
      await service.chargePoint(userId, 5000);
      await service.usePoint(userId, 3000);

      // when: 거래 내역을 조회하면
      const result = await controller.history(userId);

      // then: 2개의 거래 내역이 반환된다
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(TransactionType.CHARGE);
      expect(result[0].amount).toBe(5000);
      expect(result[1].type).toBe(TransactionType.USE);
      expect(result[1].amount).toBe(3000);
    });

    it('거래 내역이 없는 사용자 조회 시 빈 배열을 반환한다', async () => {
      // given: 거래 내역이 없는 사용자
      const userId = 3;

      // when: 거래 내역을 조회하면
      const result = await controller.history(userId);

      // then: 빈 배열이 반환된다
      expect(result).toEqual([]);
    });
  });

  describe('PATCH /point/:id/charge - 포인트 충전', () => {
    it('포인트 충전이 정상적으로 동작한다', async () => {
      // given: 0원을 가진 사용자
      const userId = 4;
      await userPointTable.insertOrUpdate(userId, 0);

      // when: 10,000원을 충전하면
      const result = await controller.charge(userId, { amount: 10000 });

      // then: 잔액이 10,000원이 된다
      expect(result.point).toBe(10000);

      // then: 실제 테이블에도 반영된다
      const userPoint = await userPointTable.selectById(userId);
      expect(userPoint.point).toBe(10000);
    });

    it('충전 후 거래 내역이 기록된다', async () => {
      // given: 5,000원을 가진 사용자
      const userId = 5;
      await userPointTable.insertOrUpdate(userId, 5000);

      // when: 10,000원을 충전하면
      await controller.charge(userId, { amount: 10000 });

      // then: 거래 내역이 기록된다
      const histories = await pointHistoryTable.selectAllByUserId(userId);
      expect(histories).toHaveLength(1);
      expect(histories[0].type).toBe(TransactionType.CHARGE);
      expect(histories[0].amount).toBe(10000);
    });

    it('1,000원 미만 충전 시 에러가 발생한다', async () => {
      // given: 사용자
      const userId = 6;

      // when & then: 999원 충전 시도 시 에러 발생
      await expect(controller.charge(userId, { amount: 999 })).rejects.toThrow(
        '최소 충전 금액은 1,000원입니다',
      );
    });

    it('100원 단위가 아닌 충전 시 에러가 발생한다', async () => {
      // given: 사용자
      const userId = 7;

      // when & then: 1,050원 충전 시도 시 에러 발생
      await expect(
        controller.charge(userId, { amount: 1050 }),
      ).rejects.toThrow('충전 금액은 100원 단위만 가능합니다');
    });

    it('200,000원 초과 충전 시 에러가 발생한다', async () => {
      // given: 사용자
      const userId = 8;

      // when & then: 200,100원 충전 시도 시 에러 발생
      await expect(
        controller.charge(userId, { amount: 200100 }),
      ).rejects.toThrow('최대 충전 금액은 200,000원입니다');
    });
  });

  describe('PATCH /point/:id/use - 포인트 사용', () => {
    it('포인트 사용이 정상적으로 동작한다', async () => {
      // given: 15,000원을 가진 사용자
      const userId = 9;
      await userPointTable.insertOrUpdate(userId, 15000);

      // when: 5,000원을 사용하면
      const result = await controller.use(userId, { amount: 5000 });

      // then: 잔액이 10,000원이 된다
      expect(result.point).toBe(10000);

      // then: 실제 테이블에도 반영된다
      const userPoint = await userPointTable.selectById(userId);
      expect(userPoint.point).toBe(10000);
    });

    it('사용 후 거래 내역이 기록된다', async () => {
      // given: 20,000원을 가진 사용자
      const userId = 10;
      await userPointTable.insertOrUpdate(userId, 20000);

      // when: 8,000원을 사용하면
      await controller.use(userId, { amount: 8000 });

      // then: 거래 내역이 기록된다
      const histories = await pointHistoryTable.selectAllByUserId(userId);
      expect(histories).toHaveLength(1);
      expect(histories[0].type).toBe(TransactionType.USE);
      expect(histories[0].amount).toBe(8000);
    });

    it('잔액이 5,000원 미만일 때 에러가 발생한다', async () => {
      // given: 4,999원을 가진 사용자
      const userId = 11;
      await userPointTable.insertOrUpdate(userId, 4999);

      // when & then: 사용 시도 시 에러 발생
      await expect(controller.use(userId, { amount: 1000 })).rejects.toThrow(
        '최소 5,000원 이상 있어야 사용할 수 있습니다',
      );
    });

    it('잔액 부족 시 에러가 발생한다', async () => {
      // given: 8,000원을 가진 사용자
      const userId = 12;
      await userPointTable.insertOrUpdate(userId, 8000);

      // when & then: 10,000원 사용 시도 시 에러 발생
      await expect(controller.use(userId, { amount: 10000 })).rejects.toThrow(
        '잔액이 부족합니다',
      );
    });
  });

  describe('동시성 통합 테스트 (실제 Table 사용)', () => {
    it('실제 Table을 사용한 동시 충전이 정확하게 처리된다', async () => {
      // given: 10,000원을 가진 사용자
      const userId = 13;
      await userPointTable.insertOrUpdate(userId, 10000);

      // when: 동시에 3번 충전 (각 5,000원)
      await Promise.all([
        service.chargePoint(userId, 5000),
        service.chargePoint(userId, 5000),
        service.chargePoint(userId, 5000),
      ]);

      // then: 최종 잔액이 25,000원이다
      const finalPoint = await userPointTable.selectById(userId);
      expect(finalPoint.point).toBe(25000);

      // then: 거래 내역이 3개 기록되었다
      const histories = await pointHistoryTable.selectAllByUserId(userId);
      expect(histories).toHaveLength(3);
      expect(histories.every((h) => h.type === TransactionType.CHARGE)).toBe(
        true,
      );
    });

    it('실제 Table을 사용한 동시 사용이 정확하게 처리된다', async () => {
      // given: 20,000원을 가진 사용자
      const userId = 14;
      await userPointTable.insertOrUpdate(userId, 20000);

      // when: 동시에 3번 사용 (각 3,000원)
      await Promise.all([
        service.usePoint(userId, 3000),
        service.usePoint(userId, 3000),
        service.usePoint(userId, 3000),
      ]);

      // then: 최종 잔액이 11,000원이다
      const finalPoint = await userPointTable.selectById(userId);
      expect(finalPoint.point).toBe(11000);

      // then: 거래 내역이 3개 기록되었다
      const histories = await pointHistoryTable.selectAllByUserId(userId);
      expect(histories).toHaveLength(3);
      expect(histories.every((h) => h.type === TransactionType.USE)).toBe(true);
    });

    it('실제 Table을 사용한 혼합 동시 요청이 정확하게 처리된다', async () => {
      // given: 10,000원을 가진 사용자
      const userId = 15;
      await userPointTable.insertOrUpdate(userId, 10000);

      // when: 충전 2번, 사용 1번을 동시 요청
      await Promise.all([
        service.chargePoint(userId, 10000),
        service.usePoint(userId, 5000),
        service.chargePoint(userId, 5000),
      ]);

      // then: 최종 잔액이 20,000원이다 (10,000 + 10,000 - 5,000 + 5,000)
      const finalPoint = await userPointTable.selectById(userId);
      expect(finalPoint.point).toBe(20000);

      // then: 거래 내역이 3개 기록되었다
      const histories = await pointHistoryTable.selectAllByUserId(userId);
      expect(histories).toHaveLength(3);

      // then: CHARGE 2개, USE 1개
      const charges = histories.filter((h) => h.type === TransactionType.CHARGE);
      const uses = histories.filter((h) => h.type === TransactionType.USE);
      expect(charges).toHaveLength(2);
      expect(uses).toHaveLength(1);
    });
  });
});
