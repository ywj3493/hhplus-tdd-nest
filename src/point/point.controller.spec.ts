import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { TransactionType } from './point.model';

describe('PointController', () => {
  let controller: PointController;
  let service: jest.Mocked<PointService>;

  beforeEach(async () => {
    const mockPointService = {
      getPoint: jest.fn(),
      getHistories: jest.fn(),
      chargePoint: jest.fn(),
      usePoint: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        {
          provide: PointService,
          useValue: mockPointService,
        },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
    service = module.get(PointService);
  });

  describe('point() - GET /point/:id', () => {
    it('userId로 service.getPoint()를 호출한다', async () => {
      // given: 사용자 ID
      const userId = 1;
      const expectedPoint = {
        id: userId,
        point: 5000,
        updateMillis: Date.now(),
      };
      service.getPoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 조회하면
      await controller.point(userId.toString());

      // then: service.getPoint가 올바른 userId로 호출된다
      expect(service.getPoint).toHaveBeenCalledWith(userId);
      expect(service.getPoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given: service가 UserPoint를 반환
      const userId = 2;
      const expectedPoint = {
        id: userId,
        point: 3000,
        updateMillis: 1234567890,
      };
      service.getPoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 조회하면
      const result = await controller.point(userId.toString());

      // then: service가 반환한 값이 그대로 반환된다
      expect(result).toEqual(expectedPoint);
    });

    it('id 파라미터가 올바르게 숫자로 파싱된다', async () => {
      // given: 문자열 형태의 userId
      const userIdString = '42';
      const expectedUserId = 42;
      service.getPoint.mockResolvedValue({
        id: expectedUserId,
        point: 1000,
        updateMillis: Date.now(),
      });

      // when: 포인트를 조회하면
      await controller.point(userIdString);

      // then: 숫자로 파싱되어 service에 전달된다
      expect(service.getPoint).toHaveBeenCalledWith(expectedUserId);
    });
  });

  describe('history() - GET /point/:id/histories', () => {
    it('userId로 service.getHistories()를 호출한다', async () => {
      // given: 사용자 ID
      const userId = 1;
      const expectedHistories = [
        {
          id: 1,
          userId: userId,
          type: TransactionType.CHARGE,
          amount: 1000,
          timeMillis: Date.now(),
        },
      ];
      service.getHistories.mockResolvedValue(expectedHistories);

      // when: 거래 내역을 조회하면
      await controller.history(userId.toString());

      // then: service.getHistories가 올바른 userId로 호출된다
      expect(service.getHistories).toHaveBeenCalledWith(userId);
      expect(service.getHistories).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 PointHistory 배열을 그대로 반환한다', async () => {
      // given: service가 PointHistory 배열을 반환
      const userId = 2;
      const expectedHistories = [
        {
          id: 1,
          userId: userId,
          type: TransactionType.CHARGE,
          amount: 1000,
          timeMillis: 1234567890,
        },
        {
          id: 2,
          userId: userId,
          type: TransactionType.USE,
          amount: 500,
          timeMillis: 1234567900,
        },
      ];
      service.getHistories.mockResolvedValue(expectedHistories);

      // when: 거래 내역을 조회하면
      const result = await controller.history(userId.toString());

      // then: service가 반환한 배열이 그대로 반환된다
      expect(result).toEqual(expectedHistories);
      expect(result).toHaveLength(2);
    });

    it('id 파라미터가 올바르게 숫자로 파싱된다', async () => {
      // given: 문자열 형태의 userId
      const userIdString = '99';
      const expectedUserId = 99;
      service.getHistories.mockResolvedValue([]);

      // when: 거래 내역을 조회하면
      await controller.history(userIdString);

      // then: 숫자로 파싱되어 service에 전달된다
      expect(service.getHistories).toHaveBeenCalledWith(expectedUserId);
    });
  });

  describe('charge() - PATCH /point/:id/charge', () => {
    it('userId와 amount로 service.chargePoint()를 호출한다', async () => {
      // given: 사용자 ID와 충전 금액
      const userId = 1;
      const amount = 1000;
      const expectedPoint = {
        id: userId,
        point: 6000,
        updateMillis: Date.now(),
      };
      service.chargePoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 충전하면
      await controller.charge(userId.toString(), { amount });

      // then: service.chargePoint가 올바른 파라미터로 호출된다
      expect(service.chargePoint).toHaveBeenCalledWith(userId, amount);
      expect(service.chargePoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given: service가 UserPoint를 반환
      const userId = 2;
      const amount = 2000;
      const expectedPoint = {
        id: userId,
        point: 7000,
        updateMillis: 1234567890,
      };
      service.chargePoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 충전하면
      const result = await controller.charge(userId.toString(), { amount });

      // then: service가 반환한 값이 그대로 반환된다
      expect(result).toEqual(expectedPoint);
    });

    it('DTO의 amount가 올바르게 전달된다', async () => {
      // given: PointDto의 amount
      const userId = 3;
      const pointDto = { amount: 5000 };
      service.chargePoint.mockResolvedValue({
        id: userId,
        point: 10000,
        updateMillis: Date.now(),
      });

      // when: 포인트를 충전하면
      await controller.charge(userId.toString(), pointDto);

      // then: DTO의 amount가 올바르게 전달된다
      expect(service.chargePoint).toHaveBeenCalledWith(userId, pointDto.amount);
    });
  });

  describe('use() - PATCH /point/:id/use', () => {
    it('userId와 amount로 service.usePoint()를 호출한다', async () => {
      // given: 사용자 ID와 사용 금액
      const userId = 1;
      const amount = 500;
      const expectedPoint = {
        id: userId,
        point: 4500,
        updateMillis: Date.now(),
      };
      service.usePoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 사용하면
      await controller.use(userId.toString(), { amount });

      // then: service.usePoint가 올바른 파라미터로 호출된다
      expect(service.usePoint).toHaveBeenCalledWith(userId, amount);
      expect(service.usePoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given: service가 UserPoint를 반환
      const userId = 2;
      const amount = 1000;
      const expectedPoint = {
        id: userId,
        point: 2000,
        updateMillis: 1234567890,
      };
      service.usePoint.mockResolvedValue(expectedPoint);

      // when: 포인트를 사용하면
      const result = await controller.use(userId.toString(), { amount });

      // then: service가 반환한 값이 그대로 반환된다
      expect(result).toEqual(expectedPoint);
    });

    it('DTO의 amount가 올바르게 전달된다', async () => {
      // given: PointDto의 amount
      const userId = 3;
      const pointDto = { amount: 1500 };
      service.usePoint.mockResolvedValue({
        id: userId,
        point: 3500,
        updateMillis: Date.now(),
      });

      // when: 포인트를 사용하면
      await controller.use(userId.toString(), pointDto);

      // then: DTO의 amount가 올바르게 전달된다
      expect(service.usePoint).toHaveBeenCalledWith(userId, pointDto.amount);
    });
  });
});
