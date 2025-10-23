import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint, PointHistory, TransactionType } from './point.model';

@Injectable()
export class PointService {
  // 비즈니스 룰 상수
  private readonly MIN_CHARGE_AMOUNT = 1000;
  private readonly MAX_CHARGE_AMOUNT = 200000;
  private readonly CHARGE_UNIT = 100;
  private readonly MIN_BALANCE_FOR_USE = 5000;

  /**
   * 동시성 제어를 위한 사용자별 Promise 큐
   * - Key: 사용자 ID
   * - Value: 해당 사용자의 마지막 작업 Promise
   * - 같은 사용자의 요청은 순차 처리, 다른 사용자는 병렬 처리
   */
  private readonly userLocks: Map<number, Promise<unknown>> = new Map();

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
    return this.executeWithLock(userId, () =>
      this.chargePointInternal(userId, amount),
    );
  }

  async usePoint(userId: number, amount: number): Promise<UserPoint> {
    return this.executeWithLock(userId, () =>
      this.usePointInternal(userId, amount),
    );
  }

  /**
   * 사용자별 동시성 제어를 위한 락 메커니즘 (Promise Queue 방식)
   *
   * 동작 원리:
   * 1. 이전 작업(previousTask)이 있으면 그것이 완료될 때까지 대기
   * 2. 이전 작업 완료 후 현재 작업(task) 실행
   * 3. 작업 완료 후 메모리 정리 (finally)
   *
   * 장점:
   * - 같은 사용자의 동시 요청은 순차 처리 (데이터 일관성 보장)
   * - 다른 사용자의 요청은 병렬 처리 (성능 유지)
   * - 외부 라이브러리 의존성 없음
   *
   * @param userId 사용자 ID
   * @param task 실행할 작업
   * @returns 작업 실행 결과
   */
  private async executeWithLock<T>(
    userId: number,
    task: () => Promise<T>,
  ): Promise<T> {
    // 이전 작업이 없으면 즉시 실행 가능한 Promise 반환
    const previousTask = this.userLocks.get(userId) || Promise.resolve();

    // 현재 작업을 이전 작업에 체이닝
    const currentTask = previousTask
      .then(() => task())
      .catch((error) => {
        // 에러를 다시 throw하여 호출자에게 전파
        throw error;
      })
      .finally(() => {
        // 작업 완료 후 메모리 정리 (마지막 작업인 경우에만 삭제)
        if (this.userLocks.get(userId) === currentTask) {
          this.userLocks.delete(userId);
        }
      });

    // 현재 작업을 Map에 저장
    this.userLocks.set(userId, currentTask);
    return currentTask;
  }

  private async chargePointInternal(
    userId: number,
    amount: number,
  ): Promise<UserPoint> {
    this.validateChargeAmount(amount);

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

  private validateChargeAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('충전 금액은 0보다 커야 합니다');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('충전 금액은 정수여야 합니다');
    }
    if (amount < this.MIN_CHARGE_AMOUNT) {
      throw new Error('최소 충전 금액은 1,000원입니다');
    }
    if (amount % this.CHARGE_UNIT !== 0) {
      throw new Error('충전 금액은 100원 단위만 가능합니다');
    }
    if (amount > this.MAX_CHARGE_AMOUNT) {
      throw new Error('최대 충전 금액은 200,000원입니다');
    }
  }

  private async usePointInternal(
    userId: number,
    amount: number,
  ): Promise<UserPoint> {
    this.validateUseAmount(amount);

    const currentPoint = await this.userPointTable.selectById(userId);
    this.validateBalance(currentPoint.point, amount);

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

  private validateUseAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('사용 금액은 0보다 커야 합니다');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('사용 금액은 정수여야 합니다');
    }
  }

  private validateBalance(currentBalance: number, useAmount: number): void {
    if (currentBalance < this.MIN_BALANCE_FOR_USE) {
      throw new Error('최소 5,000원 이상 있어야 사용할 수 있습니다');
    }
    if (currentBalance < useAmount) {
      throw new Error('잔액이 부족합니다');
    }
  }
}
