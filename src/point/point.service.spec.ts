import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';

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
        {
          provide: UserPointTable,
          useValue: mockUserPointTable,
        },
        {
          provide: PointHistoryTable,
          useValue: mockPointHistoryTable,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointTable = module.get(UserPointTable);
    pointHistoryTable = module.get(PointHistoryTable);
  });

  describe('getPoint', () => {
    it('존재하는 사용자의 포인트를 정상적으로 조회한다', async () => {
      // given: 포인트가 5000원인 사용자
      const userId = 1;
      const expectedPoint = {
        id: userId,
        point: 5000,
        updateMillis: 1234567890,
      };
      userPointTable.selectById.mockResolvedValue(expectedPoint);

      // when: 포인트를 조회하면
      const result = await service.getPoint(userId);

      // then: 해당 사용자의 포인트 정보가 반환된다
      expect(result).toEqual(expectedPoint);
      expect(userPointTable.selectById).toHaveBeenCalledWith(userId);
      expect(userPointTable.selectById).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 사용자 조회 시 기본값(point: 0)을 반환한다', async () => {
      // given: 존재하지 않는 사용자 ID
      const userId = 999;
      const defaultPoint = {
        id: userId,
        point: 0,
        updateMillis: expect.any(Number),
      };
      userPointTable.selectById.mockResolvedValue(defaultPoint);

      // when: 포인트를 조회하면
      const result = await service.getPoint(userId);

      // then: 기본값(point: 0)이 반환된다
      expect(result).toMatchObject({
        id: userId,
        point: 0,
      });
      expect(result.updateMillis).toBeDefined();
      expect(userPointTable.selectById).toHaveBeenCalledWith(userId);
    });

    it('UserPointTable.selectById가 올바른 userId로 호출된다', async () => {
      // given: 특정 사용자 ID
      const userId = 42;
      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: 1000,
        updateMillis: Date.now(),
      });

      // when: 포인트를 조회하면
      await service.getPoint(userId);

      // then: 올바른 userId로 테이블 메서드가 호출된다
      expect(userPointTable.selectById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getHistories', () => {
    it('거래 내역이 있는 사용자의 내역을 정상적으로 조회한다', async () => {
      // given: 거래 내역이 있는 사용자
      const userId = 1;
      const expectedHistories = [
        {
          id: 1,
          userId: userId,
          type: 0,
          amount: 1000,
          timeMillis: 1234567890,
        },
        {
          id: 2,
          userId: userId,
          type: 1,
          amount: 500,
          timeMillis: 1234567900,
        },
      ];
      pointHistoryTable.selectAllByUserId.mockResolvedValue(expectedHistories);

      // when: 거래 내역을 조회하면
      const result = await service.getHistories(userId);

      // then: 해당 사용자의 거래 내역이 반환된다
      expect(result).toEqual(expectedHistories);
      expect(pointHistoryTable.selectAllByUserId).toHaveBeenCalledWith(userId);
      expect(pointHistoryTable.selectAllByUserId).toHaveBeenCalledTimes(1);
    });

    it('거래 내역이 없는 사용자 조회 시 빈 배열을 반환한다', async () => {
      // given: 거래 내역이 없는 사용자
      const userId = 999;
      pointHistoryTable.selectAllByUserId.mockResolvedValue([]);

      // when: 거래 내역을 조회하면
      const result = await service.getHistories(userId);

      // then: 빈 배열이 반환된다
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(pointHistoryTable.selectAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('PointHistoryTable.selectAllByUserId가 올바른 userId로 호출된다', async () => {
      // given: 특정 사용자 ID
      const userId = 42;
      pointHistoryTable.selectAllByUserId.mockResolvedValue([]);

      // when: 거래 내역을 조회하면
      await service.getHistories(userId);

      // then: 올바른 userId로 테이블 메서드가 호출된다
      expect(pointHistoryTable.selectAllByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('chargePoint', () => {
    it('포인트를 정상적으로 충전한다', async () => {
      // given: 현재 포인트가 1000원인 사용자
      const userId = 1;
      const currentPoint = 1000;
      const chargeAmount = 500;
      const expectedNewPoint = 1500;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: expectedNewPoint,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 1,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 500원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 포인트가 1500원이 된다
      expect(result.point).toBe(expectedNewPoint);
    });

    it('충전 후 새로운 포인트가 반환된다', async () => {
      // given: 포인트가 0원인 사용자
      const userId = 2;
      const chargeAmount = 1000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: 0,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: chargeAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 2,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 1000원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 충전된 포인트 정보가 반환된다
      expect(result).toMatchObject({
        id: userId,
        point: chargeAmount,
      });
      expect(result.updateMillis).toBeDefined();
    });

    it('UserPointTable.insertOrUpdate가 올바른 값으로 호출된다', async () => {
      // given: 현재 포인트가 2000원인 사용자
      const userId = 3;
      const currentPoint = 2000;
      const chargeAmount = 3000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: 5000,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 3,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 3000원을 충전하면
      await service.chargePoint(userId, chargeAmount);

      // then: insertOrUpdate가 올바른 새 포인트(5000)로 호출된다
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(userId, 5000);
    });

    it('PointHistoryTable.insert가 CHARGE 타입으로 호출된다', async () => {
      // given: 사용자와 충전 금액
      const userId = 4;
      const chargeAmount = 1500;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: 500,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: 2000,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 4,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 포인트를 충전하면
      await service.chargePoint(userId, chargeAmount);

      // then: PointHistoryTable.insert가 CHARGE(0) 타입으로 호출된다
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(
        userId,
        chargeAmount,
        0, // TransactionType.CHARGE
        expect.any(Number),
      );
    });

    it('0원 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 0원 충전 금액
      const userId = 5;
      const invalidAmount = 0;

      // when & then: 0원을 충전하려고 하면 에러가 발생한다
      await expect(service.chargePoint(userId, invalidAmount)).rejects.toThrow();
    });

    it('음수 금액 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 음수 충전 금액
      const userId = 6;
      const invalidAmount = -1000;

      // when & then: 음수 금액을 충전하려고 하면 에러가 발생한다
      await expect(service.chargePoint(userId, invalidAmount)).rejects.toThrow();
    });

    it('소수점 금액 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 소수점이 있는 충전 금액
      const userId = 7;
      const invalidAmount = 100.5;

      // when & then: 소수점 금액을 충전하려고 하면 에러가 발생한다
      await expect(service.chargePoint(userId, invalidAmount)).rejects.toThrow();
    });
  });
});
