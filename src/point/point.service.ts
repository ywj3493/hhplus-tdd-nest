import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint, PointHistory, TransactionType } from './point.model';

@Injectable()
export class PointService {
  constructor(
    private readonly userPointTable: UserPointTable,
    private readonly pointHistoryTable: PointHistoryTable,
  ) {}

  async getPoint(userId: number): Promise<UserPoint> {
    return this.userPointTable.selectById(userId);
  }

  async getHistories(userId: number): Promise<PointHistory[]> {
    return this.pointHistoryTable.selectAllByUserId(userId);
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    if (amount <= 0) {
      throw new Error('충전 금액은 0보다 커야 합니다');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('충전 금액은 정수여야 합니다');
    }
    if (amount < 1000) {
      throw new Error('최소 충전 금액은 1,000원입니다');
    }
    if (amount % 100 !== 0) {
      throw new Error('충전 금액은 100원 단위만 가능합니다');
    }
    if (amount > 200000) {
      throw new Error('최대 충전 금액은 200,000원입니다');
    }

    const currentPoint = await this.userPointTable.selectById(userId);
    const newPoint = currentPoint.point + amount;
    const updateMillis = Date.now();

    const updatedUserPoint = await this.userPointTable.insertOrUpdate(
      userId,
      newPoint,
    );

    await this.pointHistoryTable.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      updateMillis,
    );

    return updatedUserPoint;
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    if (amount <= 0) {
      throw new Error('사용 금액은 0보다 커야 합니다');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('사용 금액은 정수여야 합니다');
    }

    const currentPoint = await this.userPointTable.selectById(userId);

    if (currentPoint.point < 5000) {
      throw new Error('최소 5,000원 이상 있어야 사용할 수 있습니다');
    }

    if (currentPoint.point < amount) {
      throw new Error('잔액이 부족합니다');
    }

    const newPoint = currentPoint.point - amount;
    const updateMillis = Date.now();

    const updatedUserPoint = await this.userPointTable.insertOrUpdate(
      userId,
      newPoint,
    );

    await this.pointHistoryTable.insert(
      userId,
      amount,
      TransactionType.USE,
      updateMillis,
    );

    return updatedUserPoint;
  }
}
