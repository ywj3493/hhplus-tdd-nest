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
      const chargeAmount = 5000;
      const expectedNewPoint = 6000;

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

      // when: 5000원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 포인트가 6000원이 된다
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
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow();
    });

    it('음수 금액 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 음수 충전 금액
      const userId = 6;
      const invalidAmount = -1000;

      // when & then: 음수 금액을 충전하려고 하면 에러가 발생한다
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow();
    });

    it('소수점 금액 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 소수점이 있는 충전 금액
      const userId = 7;
      const invalidAmount = 100.5;

      // when & then: 소수점 금액을 충전하려고 하면 에러가 발생한다
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow();
    });

    it('1,000원 미만 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 1,000원 미만 충전 금액
      const userId = 8;
      const invalidAmount = 999;

      // when & then: 1,000원 미만을 충전하려고 하면 에러가 발생한다
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow('최소 충전 금액은 1,000원입니다');
    });

    it('100원 단위가 아닌 금액 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 100원 단위가 아닌 충전 금액
      const userId = 9;
      const invalidAmount = 1050;

      // when & then: 100원 단위가 아닌 금액을 충전하려고 하면 에러가 발생한다
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow('충전 금액은 100원 단위만 가능합니다');
    });

    it('200,000원 초과 충전 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 200,000원 초과 충전 금액
      const userId = 10;
      const invalidAmount = 200100;

      // when & then: 200,000원을 초과하여 충전하려고 하면 에러가 발생한다
      await expect(
        service.chargePoint(userId, invalidAmount),
      ).rejects.toThrow('최대 충전 금액은 200,000원입니다');
    });

    it('1,000원 정확히 충전 성공한다', async () => {
      // given: 포인트가 0원인 사용자
      const userId = 11;
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
        id: 11,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 1,000원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 정상적으로 충전된다
      expect(result.point).toBe(chargeAmount);
    });

    it('200,000원 정확히 충전 성공한다', async () => {
      // given: 포인트가 50,000원인 사용자
      const userId = 12;
      const currentPoint = 50000;
      const chargeAmount = 200000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: currentPoint + chargeAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 12,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 200,000원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 정상적으로 충전된다
      expect(result.point).toBe(currentPoint + chargeAmount);
    });

    it('10,000원(100원 단위) 충전 성공한다', async () => {
      // given: 포인트가 5,000원인 사용자
      const userId = 13;
      const currentPoint = 5000;
      const chargeAmount = 10000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: currentPoint + chargeAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 13,
        userId: userId,
        type: 0,
        amount: chargeAmount,
        timeMillis: Date.now(),
      });

      // when: 10,000원을 충전하면
      const result = await service.chargePoint(userId, chargeAmount);

      // then: 정상적으로 충전된다
      expect(result.point).toBe(currentPoint + chargeAmount);
    });
  });

  describe('usePoint', () => {
    it('포인트를 정상적으로 사용한다', async () => {
      // given: 현재 포인트가 10000원인 사용자
      const userId = 1;
      const currentPoint = 10000;
      const useAmount = 2000;
      const expectedNewPoint = 8000;

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
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 2000원을 사용하면
      const result = await service.usePoint(userId, useAmount);

      // then: 포인트가 8000원이 된다
      expect(result.point).toBe(expectedNewPoint);
    });

    it('사용 후 새로운 포인트가 반환된다', async () => {
      // given: 포인트가 8000원인 사용자
      const userId = 2;
      const currentPoint = 8000;
      const useAmount = 3000;

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
        id: 2,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 3000원을 사용하면
      const result = await service.usePoint(userId, useAmount);

      // then: 사용 후 포인트 정보가 반환된다
      expect(result).toMatchObject({
        id: userId,
        point: 5000,
      });
      expect(result.updateMillis).toBeDefined();
    });

    it('UserPointTable.insertOrUpdate가 올바른 값으로 호출된다', async () => {
      // given: 현재 포인트가 5000원인 사용자
      const userId = 3;
      const currentPoint = 5000;
      const useAmount = 2000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: 3000,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 3,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 2000원을 사용하면
      await service.usePoint(userId, useAmount);

      // then: insertOrUpdate가 올바른 새 포인트(3000)로 호출된다
      expect(userPointTable.insertOrUpdate).toHaveBeenCalledWith(userId, 3000);
    });

    it('PointHistoryTable.insert가 USE 타입으로 호출된다', async () => {
      // given: 사용자와 사용 금액
      const userId = 4;
      const useAmount = 2000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: 7000,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: 5000,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 4,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 포인트를 사용하면
      await service.usePoint(userId, useAmount);

      // then: PointHistoryTable.insert가 USE(1) 타입으로 호출된다
      expect(pointHistoryTable.insert).toHaveBeenCalledWith(
        userId,
        useAmount,
        1, // TransactionType.USE
        expect.any(Number),
      );
    });

    it('0원 사용 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 0원 사용 금액
      const userId = 5;
      const invalidAmount = 0;

      // when & then: 0원을 사용하려고 하면 에러가 발생한다
      await expect(service.usePoint(userId, invalidAmount)).rejects.toThrow();
    });

    it('음수 금액 사용 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 음수 사용 금액
      const userId = 6;
      const invalidAmount = -500;

      // when & then: 음수 금액을 사용하려고 하면 에러가 발생한다
      await expect(service.usePoint(userId, invalidAmount)).rejects.toThrow();
    });

    it('소수점 금액 사용 시도 시 에러가 발생한다', async () => {
      // given: 사용자와 소수점이 있는 사용 금액
      const userId = 7;
      const invalidAmount = 50.5;

      // when & then: 소수점 금액을 사용하려고 하면 에러가 발생한다
      await expect(service.usePoint(userId, invalidAmount)).rejects.toThrow();
    });

    it('잔액보다 많은 금액 사용 시도 시 에러가 발생한다', async () => {
      // given: 현재 포인트가 1000원인 사용자
      const userId = 8;
      const currentPoint = 1000;
      const excessiveAmount = 1500;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });

      // when & then: 잔액보다 많은 금액을 사용하려고 하면 에러가 발생한다
      await expect(service.usePoint(userId, excessiveAmount)).rejects.toThrow();
    });

    it('잔액이 5,000원 미만일 때 사용 시도 시 에러가 발생한다', async () => {
      // given: 현재 포인트가 4,999원인 사용자
      const userId = 9;
      const currentPoint = 4999;
      const useAmount = 100;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });

      // when & then: 잔액이 5,000원 미만일 때 사용하려고 하면 에러가 발생한다
      await expect(service.usePoint(userId, useAmount)).rejects.toThrow(
        '최소 5,000원 이상 있어야 사용할 수 있습니다',
      );
    });

    it('잔액이 정확히 5,000원일 때 일부 사용 가능하다', async () => {
      // given: 현재 포인트가 정확히 5,000원인 사용자
      const userId = 10;
      const currentPoint = 5000;
      const useAmount = 1000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: currentPoint - useAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 10,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 1,000원을 사용하면
      const result = await service.usePoint(userId, useAmount);

      // then: 정상적으로 사용된다
      expect(result.point).toBe(4000);
    });

    it('잔액이 5,000원 이상일 때 정상 사용된다', async () => {
      // given: 현재 포인트가 10,000원인 사용자
      const userId = 11;
      const currentPoint = 10000;
      const useAmount = 3000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: currentPoint - useAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 11,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 3,000원을 사용하면
      const result = await service.usePoint(userId, useAmount);

      // then: 정상적으로 사용된다
      expect(result.point).toBe(7000);
    });

    it('사용 후 잔액이 5,000원 미만이 되어도 허용된다', async () => {
      // given: 현재 포인트가 6,000원인 사용자
      const userId = 12;
      const currentPoint = 6000;
      const useAmount = 3000;

      userPointTable.selectById.mockResolvedValue({
        id: userId,
        point: currentPoint,
        updateMillis: Date.now(),
      });
      userPointTable.insertOrUpdate.mockResolvedValue({
        id: userId,
        point: currentPoint - useAmount,
        updateMillis: Date.now(),
      });
      pointHistoryTable.insert.mockResolvedValue({
        id: 12,
        userId: userId,
        type: 1,
        amount: useAmount,
        timeMillis: Date.now(),
      });

      // when: 3,000원을 사용하면 (사용 후 잔액 3,000원)
      const result = await service.usePoint(userId, useAmount);

      // then: 정상적으로 사용된다 (사용 전 체크만 하므로)
      expect(result.point).toBe(3000);
    });
  });
});
