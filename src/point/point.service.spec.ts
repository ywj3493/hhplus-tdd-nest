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
});
