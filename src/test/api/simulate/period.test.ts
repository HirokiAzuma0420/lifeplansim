import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';

describe('TC-PERIOD 系: 期間・年齢のループ制御', () => {
  it('TC-PERIOD-001: 単年シミュレーション（initialAge === endAge）', () => {
    const params = createBaseInputParams();
    params.initialAge = 40;
    params.endAge = 40;

    const yearlyData = runSimulation(params);

    expect(yearlyData.length).toBe(1);
    expect(yearlyData[0]?.age).toBe(40);
  });

  it('TC-PERIOD-002: 複数年シミュレーション（30〜35 歳）', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 35;

    const yearlyData = runSimulation(params);

    expect(yearlyData.length).toBe(6);

    const ages = yearlyData.map((y) => y.age);
    expect(ages).toEqual([30, 31, 32, 33, 34, 35]);

    const years = yearlyData.map((y) => y.year);
    for (let i = 1; i < years.length; i += 1) {
      expect(years[i]).toBe(years[i - 1] + 1);
    }
  });
});

