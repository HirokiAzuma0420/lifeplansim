import { describe, it, expect } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';

describe('TC-INCOME 系: 収入・退職・年金', () => {
  it('TC-INCOME-001: 定常給与のみ（収入が各年で同額）', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 32;
    params.retirementAge = 65;
    params.mainJobIncomeGross = 5_000_000;
    params.sideJobIncomeGross = 0;
    params.incomeGrowthRate = 0;
    params.pensionStartAge = 70; // テスト範囲外にして年金を発生させない

    const yearlyData = runSimulation(params);

    const incomes = yearlyData.map((y) => y.income);
    expect(incomes.length).toBe(3);
    expect(incomes[0]).toBeGreaterThan(0);
    // 初年度は yearFraction の影響で部分年となるが、2年目以降は同額になる想定
    expect(incomes[1]).toBeGreaterThan(incomes[0]);
    expect(incomes[2]).toBe(incomes[1]);

    // 支出 0 に近い状態では貯蓄が単調増加する想定
    // （base の生活費をほぼゼロにして確認）
    const paramsLowExpense = createBaseInputParams();
    paramsLowExpense.initialAge = 30;
    paramsLowExpense.endAge = 32;
    paramsLowExpense.retirementAge = 65;
    paramsLowExpense.mainJobIncomeGross = 5_000_000;
    paramsLowExpense.livingCostSimpleAnnual = 0;

    const yearlyDataLowExpense = runSimulation(paramsLowExpense);
    const savingsList = yearlyDataLowExpense.map((y) => y.savings);
    expect(savingsList[1]).toBeGreaterThanOrEqual(savingsList[0]);
    expect(savingsList[2]).toBeGreaterThanOrEqual(savingsList[1]);
  });

  it('TC-INCOME-002: 退職後に給与が停止し年金のみになる', () => {
    const params = createBaseInputParams();
    params.initialAge = 58;
    params.endAge = 66;
    params.retirementAge = 60;
    params.pensionStartAge = 65;
    params.pensionMonthly10kJPY = 20; // 65 歳以降に年金収入を発生させる
    params.mainJobIncomeGross = 5_000_000;
    params.sideJobIncomeGross = 0;
    params.incomeGrowthRate = 0;

    const yearlyData = runSimulation(params);

    const byAge = new Map(yearlyData.map((y) => [y.age, y]));
    const incomeAt59 = byAge.get(59)?.income ?? 0;
    const incomeAt60 = byAge.get(60)?.income ?? 0;
    const incomeAt62 = byAge.get(62)?.income ?? 0;
    const incomeAt65 = byAge.get(65)?.income ?? 0;

    // 59 歳までは給与収入あり
    expect(incomeAt59).toBeGreaterThan(0);

    // 60〜64 歳は給与も年金も発生しない前提で、収入が大きく減っていることをざっくり確認
    expect(incomeAt60).toBeLessThan(incomeAt59);
    expect(incomeAt62).toBeLessThan(incomeAt59);

    // 65 歳以降は年金のみが収入として計上されるため、60〜64 歳よりは増える想定
    expect(incomeAt65).toBeGreaterThan(incomeAt60);
  });
});
