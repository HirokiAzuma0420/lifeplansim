import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';

describe('境界条件テスト: 退職年・年金開始年・NISA/iDeCo', () => {
  it('TC-BOUND-001: 退職年境界で給与が停止する', () => {
    const params = createBaseInputParams();
    params.initialAge = 59;
    params.endAge = 61;
    params.retirementAge = 60;
    params.pensionStartAge = 70;
    params.pensionMonthly10kJPY = 0;
    params.mainJobIncomeGross = 5_000_000;
    params.incomeGrowthRate = 0;

    const yearly = runSimulation(params);
    const byAge = new Map(yearly.map((y) => [y.age, y]));

    const age59 = byAge.get(59)!;
    const age60 = byAge.get(60)!;
    const age61 = byAge.get(61)!;

    expect(age59.incomeDetail.self).toBeGreaterThan(0);
    expect(age60.incomeDetail.self).toBe(0);
    expect(age61.incomeDetail.self).toBe(0);
  });

  it('TC-BOUND-002: 年金開始年境界で年金が開始する', () => {
    const params = createBaseInputParams();
    params.initialAge = 64;
    params.endAge = 66;
    params.retirementAge = 60;
    params.pensionStartAge = 65;
    params.pensionMonthly10kJPY = 20;
    params.mainJobIncomeGross = 0;
    params.incomeGrowthRate = 0;

    const yearly = runSimulation(params);
    const byAge = new Map(yearly.map((y) => [y.age, y]));

    const age64 = byAge.get(64)!;
    const age65 = byAge.get(65)!;
    const age66 = byAge.get(66)!;

    expect(age64.incomeDetail.publicPension).toBe(0);
    expect(age65.incomeDetail.publicPension).toBeGreaterThan(0);
    expect(age66.incomeDetail.publicPension).toBeGreaterThan(0);
  });
});

