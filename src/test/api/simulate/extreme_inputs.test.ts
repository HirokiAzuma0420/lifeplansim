import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';
import type {
  SimulationInputParams,
  YearlyData,
} from '../../../types/simulation-types';

const allFinite = (y: YearlyData): boolean => {
  const nums: number[] = [
    y.income,
    y.expense,
    y.savings,
    y.totalAssets,
    y.taxable.balance,
    y.nisa.balance,
    y.ideco.balance,
  ];
  return nums.every((v) => Number.isFinite(v));
};

describe('異常値・極端値テスト', () => {
  it('TC-EXTREME-001: 超高所得シナリオでもクラッシュしない', () => {
    const p = createBaseInputParams();
    const params: SimulationInputParams = {
      ...p,
      initialAge: 30,
      endAge: 65,
      retirementAge: 60,
      pensionStartAge: 65,
      pensionMonthly10kJPY: 50,
      mainJobIncomeGross: 100_000_000,
      sideJobIncomeGross: 20_000_000,
      incomeGrowthRate: 0.02,
      expenseMode: 'simple',
      livingCostSimpleAnnual: 10_000_000,
      currentSavingsJPY: 5_000_000,
    };

    const yearly = runSimulation(params);
    expect(yearly.length).toBeGreaterThan(0);
    yearly.forEach((y) => {
      expect(allFinite(y)).toBe(true);
    });
  });

  it('TC-EXTREME-002: ほぼ無収入でもクラッシュしない', () => {
    const p = createBaseInputParams();
    const params: SimulationInputParams = {
      ...p,
      initialAge: 30,
      endAge: 50,
      retirementAge: 60,
      pensionStartAge: 70,
      pensionMonthly10kJPY: 0,
      mainJobIncomeGross: 100_000,
      sideJobIncomeGross: 0,
      incomeGrowthRate: 0,
      expenseMode: 'simple',
      livingCostSimpleAnnual: 2_000_000,
      currentSavingsJPY: 1_000_000,
      emergencyFundJPY: 500_000,
    };

    const yearly = runSimulation(params);
    expect(yearly.length).toBeGreaterThan(0);
    yearly.forEach((y) => {
      expect(allFinite(y)).toBe(true);
    });
  });

  it('TC-EXTREME-003: 極端な利回りでも有限値を保つ', () => {
    const p = createBaseInputParams();
    const params: SimulationInputParams = {
      ...p,
      initialAge: 30,
      endAge: 60,
      retirementAge: 60,
      pensionStartAge: 65,
      pensionMonthly10kJPY: 10,
      mainJobIncomeGross: 5_000_000,
      sideJobIncomeGross: 0,
      expenseMode: 'simple',
      livingCostSimpleAnnual: 2_000_000,
      products: [
        {
          key: 'stocks',
          account: '課税',
          currentJPY: 1_000_000,
          recurringJPY: 500_000,
          spotJPY: 0,
          expectedReturn: 1.0, // 100%/年
        },
        {
          key: 'trust',
          account: '非課税',
          currentJPY: 1_000_000,
          recurringJPY: 500_000,
          spotJPY: 0,
          expectedReturn: 0.5, // 50%/年
        },
      ],
      interestScenario: 'ランダム変動',
      stressTest: {
        enabled: false,
        seed: undefined,
      },
    };

    const yearly = runSimulation(params);
    expect(yearly.length).toBeGreaterThan(0);
    yearly.forEach((y) => {
      expect(allFinite(y)).toBe(true);
    });
  });

  it('TC-EXTREME-004: 超長寿シナリオでもクラッシュしない', () => {
    const p = createBaseInputParams();
    const params: SimulationInputParams = {
      ...p,
      initialAge: 20,
      endAge: 110,
      retirementAge: 60,
      pensionStartAge: 65,
      pensionMonthly10kJPY: 15,
      mainJobIncomeGross: 4_000_000,
      sideJobIncomeGross: 0,
      expenseMode: 'simple',
      livingCostSimpleAnnual: 2_500_000,
    };

    const yearly = runSimulation(params);
    expect(yearly.length).toBe(110 - 20 + 1);
    yearly.forEach((y) => {
      expect(allFinite(y)).toBe(true);
    });
  });
});

