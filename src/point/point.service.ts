import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint, PointHistory } from './point.model';

@Injectable()
export class PointService {
  constructor(
    private readonly userPointTable: UserPointTable,
    private readonly pointHistoryTable: PointHistoryTable,
  ) {}

  async getPoint(userId: number): Promise<UserPoint> {
    return { id: userId, point: 0, updateMillis: Date.now() };
  }

  async getHistories(userId: number): Promise<PointHistory[]> {
    return [];
  }

  async chargePoint(userId: number, amount: number): Promise<UserPoint> {
    return { id: userId, point: amount, updateMillis: Date.now() };
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    return { id: userId, point: amount, updateMillis: Date.now() };
  }
}
