import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { TransactionType } from './point.model';

describe('PointController', () => {
  let controller: PointController;
  let service: jest.Mocked<PointService>;

  beforeEach(async () => {
    // Mock: PointService의 메서드 호출을 검증하기 위한 Mock 객체
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('point() - GET /point/:id', () => {
    it('userId로 service.getPoint()를 호출한다', async () => {
      // given
      const userId = 1;
      const mockUserPoint = { id: userId, point: 5000, updateMillis: Date.now() };
      service.getPoint.mockResolvedValue(mockUserPoint);

      // when
      await controller.point(userId.toString());

      // then
      expect(service.getPoint).toHaveBeenCalledWith(userId);
      expect(service.getPoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given
      const userId = 2;
      const mockUserPoint = { id: userId, point: 3000, updateMillis: 1234567890 };
      service.getPoint.mockResolvedValue(mockUserPoint);

      // when
      const result = await controller.point(userId.toString());

      // then
      expect(result).toEqual(mockUserPoint);
    });

    it('id 파라미터가 올바르게 숫자로 파싱된다', async () => {
      // given
      const userIdString = '42';
      const expectedUserId = 42;
      service.getPoint.mockResolvedValue({ id: expectedUserId, point: 1000, updateMillis: Date.now() });

      // when
      await controller.point(userIdString);

      // then
      expect(service.getPoint).toHaveBeenCalledWith(expectedUserId);
    });
  });

  describe('history() - GET /point/:id/histories', () => {
    it('userId로 service.getHistories()를 호출한다', async () => {
      // given
      const userId = 1;
      const mockHistories = [
        { id: 1, userId, type: TransactionType.CHARGE, amount: 1000, timeMillis: Date.now() },
      ];
      service.getHistories.mockResolvedValue(mockHistories);

      // when
      await controller.history(userId.toString());

      // then
      expect(service.getHistories).toHaveBeenCalledWith(userId);
      expect(service.getHistories).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 PointHistory 배열을 그대로 반환한다', async () => {
      // given
      const userId = 2;
      const mockHistories = [
        { id: 1, userId, type: TransactionType.CHARGE, amount: 1000, timeMillis: 1234567890 },
        { id: 2, userId, type: TransactionType.USE, amount: 500, timeMillis: 1234567900 },
      ];
      service.getHistories.mockResolvedValue(mockHistories);

      // when
      const result = await controller.history(userId.toString());

      // then
      expect(result).toEqual(mockHistories);
      expect(result).toHaveLength(2);
    });

    it('id 파라미터가 올바르게 숫자로 파싱된다', async () => {
      // given
      const userIdString = '99';
      const expectedUserId = 99;
      service.getHistories.mockResolvedValue([]);

      // when
      await controller.history(userIdString);

      // then
      expect(service.getHistories).toHaveBeenCalledWith(expectedUserId);
    });
  });

  describe('charge() - PATCH /point/:id/charge', () => {
    it('userId와 amount로 service.chargePoint()를 호출한다', async () => {
      // given
      const userId = 1;
      const amount = 1000;
      const mockUserPoint = { id: userId, point: 6000, updateMillis: Date.now() };
      service.chargePoint.mockResolvedValue(mockUserPoint);

      // when
      await controller.charge(userId.toString(), { amount });

      // then
      expect(service.chargePoint).toHaveBeenCalledWith(userId, amount);
      expect(service.chargePoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given
      const userId = 2;
      const amount = 2000;
      const mockUserPoint = { id: userId, point: 7000, updateMillis: 1234567890 };
      service.chargePoint.mockResolvedValue(mockUserPoint);

      // when
      const result = await controller.charge(userId.toString(), { amount });

      // then
      expect(result).toEqual(mockUserPoint);
    });

    it('DTO의 amount가 올바르게 전달된다', async () => {
      // given
      const userId = 3;
      const pointDto = { amount: 5000 };
      service.chargePoint.mockResolvedValue({ id: userId, point: 10000, updateMillis: Date.now() });

      // when
      await controller.charge(userId.toString(), pointDto);

      // then
      expect(service.chargePoint).toHaveBeenCalledWith(userId, pointDto.amount);
    });
  });

  describe('use() - PATCH /point/:id/use', () => {
    it('userId와 amount로 service.usePoint()를 호출한다', async () => {
      // given
      const userId = 1;
      const amount = 500;
      const mockUserPoint = { id: userId, point: 4500, updateMillis: Date.now() };
      service.usePoint.mockResolvedValue(mockUserPoint);

      // when
      await controller.use(userId.toString(), { amount });

      // then
      expect(service.usePoint).toHaveBeenCalledWith(userId, amount);
      expect(service.usePoint).toHaveBeenCalledTimes(1);
    });

    it('service에서 반환된 UserPoint를 그대로 반환한다', async () => {
      // given
      const userId = 2;
      const amount = 1000;
      const mockUserPoint = { id: userId, point: 2000, updateMillis: 1234567890 };
      service.usePoint.mockResolvedValue(mockUserPoint);

      // when
      const result = await controller.use(userId.toString(), { amount });

      // then
      expect(result).toEqual(mockUserPoint);
    });

    it('DTO의 amount가 올바르게 전달된다', async () => {
      // given
      const userId = 3;
      const pointDto = { amount: 1500 };
      service.usePoint.mockResolvedValue({ id: userId, point: 3500, updateMillis: Date.now() });

      // when
      await controller.use(userId.toString(), pointDto);

      // then
      expect(service.usePoint).toHaveBeenCalledWith(userId, pointDto.amount);
    });
  });
});
