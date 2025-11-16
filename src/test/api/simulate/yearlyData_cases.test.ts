import { describe, it, expect, vi } from 'vitest';
import { runSimulation } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';
import { computeNetAnnual } from '../../../utils/financial';

describe('yearlyData 厳密検証ケース', () => {
  it('単純ケース: 給与と生活費のみ（1年分）のyearlyDataを厳密検証', () => {
    // 年次係数 yearFraction を 1 にするため、1 月 1 日に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1)); // 2025-01-01

    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 30;
    params.retirementAge = 65;
    params.pensionStartAge = 70; // 年金発生なし
    params.mainJobIncomeGross = 5_000_000;
    params.sideJobIncomeGross = 0;
    params.incomeGrowthRate = 0;
    params.expenseMode = 'simple';
    params.livingCostSimpleAnnual = 2_000_000;
    params.currentSavingsJPY = 1_000_000;
    params.monthlySavingsJPY = 0;
    params.products = [];

    const yearlyData = runSimulation(params);
    expect(yearlyData.length).toBe(1);
    const y0 = yearlyData[0];

    // 期待値計算
    const selfGrossIncome = params.mainJobIncomeGross;
    const idecoDeductionThisYear = 0;
    const spouseGrossIncome = 0;
    const pensionAnnual = 0;
    const personalPensionIncome = 0;
    const oneTimeIncomeThisYear = 0;
    const yearFraction = 1;

    const netSelf = computeNetAnnual(
      selfGrossIncome - idecoDeductionThisYear,
    );
    const netSpouse = computeNetAnnual(spouseGrossIncome);
    const annualIncomeExpected =
      (netSelf + netSpouse) * yearFraction +
      pensionAnnual +
      personalPensionIncome +
      oneTimeIncomeThisYear;

    const livingExpenseExpected =
      params.livingCostSimpleAnnual * yearFraction;
    const totalExpenseExpected = livingExpenseExpected;

    const initialSavings = params.currentSavingsJPY;
    const cashFlowExpected = annualIncomeExpected - totalExpenseExpected;
    const finalSavingsExpected = initialSavings + cashFlowExpected;

    const totalAssetsExpected = finalSavingsExpected;

    // yearlyData の厳密検証
    expect(y0.age).toBe(30);
    expect(y0.income).toBe(Math.round(annualIncomeExpected));
    expect(y0.incomeDetail.self).toBe(
      Math.round(netSelf * yearFraction),
    );
    expect(y0.incomeDetail.spouse).toBe(
      Math.round(netSpouse * yearFraction),
    );
    expect(y0.incomeDetail.publicPension).toBe(0);
    expect(y0.incomeDetail.personalPension).toBe(0);
    expect(y0.incomeDetail.oneTime).toBe(0);

    expect(y0.expense).toBe(Math.round(totalExpenseExpected));
    expect(y0.expenseDetail.living).toBe(
      Math.round(livingExpenseExpected),
    );
    expect(y0.expenseDetail.car).toBe(0);
    expect(y0.expenseDetail.housing).toBe(0);
    expect(y0.expenseDetail.marriage).toBe(0);
    expect(y0.expenseDetail.children).toBe(0);
    expect(y0.expenseDetail.appliances).toBe(0);
    expect(y0.expenseDetail.care).toBe(0);
    expect(y0.expenseDetail.retirementGap).toBe(0);

    expect(y0.savings).toBe(Math.round(finalSavingsExpected));
    expect(y0.taxable.balance).toBe(0);
    expect(y0.nisa.balance).toBe(0);
    expect(y0.ideco.balance).toBe(0);

    expect(y0.totalAssets).toBe(Math.round(totalAssetsExpected));

    vi.useRealTimers();
  });
});

