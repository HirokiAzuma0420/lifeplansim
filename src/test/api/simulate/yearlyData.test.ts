import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';

describe('TC-YEARLY 系: YearlyData 整合性', () => {
  it('TC-YEARLY-001: 配列長と年齢', () => {
    const params = createBaseInputParams();
    params.initialAge = 25;
    params.endAge = 30;

    const yearlyData = runSimulation(params);

    expect(yearlyData.length).toBe(6);

    for (let i = 1; i < yearlyData.length; i += 1) {
      expect(yearlyData[i].age).toBe(yearlyData[i - 1].age + 1);
      expect(yearlyData[i].year).toBe(yearlyData[i - 1].year + 1);
    }
  });

  it('TC-YEARLY-002: 合計資産整合性', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 32;
    params.products = [
      {
        key: 'stocks',
        account: '課税' as any,
        currentJPY: 500_000,
        recurringJPY: 100_000,
        spotJPY: 0,
        expectedReturn: 0.03,
      },
      {
        key: 'trust',
        account: '非課税' as any,
        currentJPY: 300_000,
        recurringJPY: 50_000,
        spotJPY: 0,
        expectedReturn: 0.03,
      },
    ];

    const yearlyData = runSimulation(params);

    yearlyData.forEach((y) => {
      const cash = y.savings;
      const taxable = y.taxable.balance;
      const nisa = y.nisa.balance;
      const ideco = y.ideco.balance;
      const sum = cash + taxable + nisa + ideco;

      expect(Math.round(y.totalAssets)).toBe(Math.round(sum));
    });
  });
});

