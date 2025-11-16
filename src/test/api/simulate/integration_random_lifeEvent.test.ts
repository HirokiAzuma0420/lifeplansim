import { describe, it, expect, vi } from 'vitest';
import handler, * as simulateModule from '../../../../api/simulate/index';
import { createBaseInputParams, createMockResponse } from './helpers';
import { computeNetAnnual } from '../../../utils/financial';
import type {
  SimulationInputParams,
  YearlyData,
} from '../../../types/simulation-types';

describe('API 総合テスト: ランダム変動＋ライフイベント年の yearlyData 厳密検証', () => {
  it('ランダム変動＋結婚イベント年の yearlyData を数式ベースで検証する', async () => {
    // 年次係数 yearFraction を 1 にするため、1 月 1 日に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));

    // ランダムリターン系列を固定：全期間 5% のリターン
    const generateReturnSeriesSpy = vi
      .spyOn(simulateModule, 'generateReturnSeries')
      .mockImplementation((_avg, _vol, years) => Array(years).fill(0.05));

    const base = createBaseInputParams();
    const params: SimulationInputParams = {
      ...base,
      initialAge: 35,
      endAge: 35,
      retirementAge: 65,
      pensionStartAge: 70,
      interestScenario: 'ランダム変動',
      emergencyFundJPY: 0,
      mainJobIncomeGross: 5_000_000,
      sideJobIncomeGross: 0,
      incomeGrowthRate: 0,
      expenseMode: 'simple',
      livingCostSimpleAnnual: 2_000_000,
      currentSavingsJPY: 1_000_000,
      monthlySavingsJPY: 0,
      car: {
        priceJPY: 0,
        firstAfterYears: 0,
        frequencyYears: 0,
        loan: { use: false, years: undefined, type: undefined },
        currentLoan: undefined,
      },
      housing: {
        type: '賃貸',
        rentMonthlyJPY: 0,
        currentLoan: undefined,
        purchasePlan: undefined,
        renovations: undefined,
      },
      marriage: {
        age: 35,
        engagementJPY: 300_000,
        weddingJPY: 3_000_000,
        honeymoonJPY: 500_000,
        movingJPY: 200_000,
        spouse: undefined,
        newLivingCostAnnual: 2_500_000,
        newHousingCostAnnual: 300_000,
      },
      children: undefined,
      appliances: undefined,
      cares: undefined,
      products: [
        {
          key: 'stocks',
          account: '課税',
          currentJPY: 1_000_000,
          recurringJPY: 0,
          spotJPY: 0,
          expectedReturn: 0.05,
        },
      ],
      stressTest: {
        enabled: false,
        seed: undefined,
      },
      retirementIncome: undefined,
      spouseRetirementIncome: undefined,
      personalPensionPlans: undefined,
      spousePersonalPensionPlans: undefined,
      otherLumpSums: undefined,
      spouseOtherLumpSums: undefined,
      reemployment: undefined,
      spouseReemployment: undefined,
      _testOverrides: undefined,
    };

    const { res, result } = createMockResponse();
    const req = {
      method: 'POST',
      body: { inputParams: params },
      query: { debug_run: 'true' },
    };

    await handler(req as never, res as never);

    expect(result.statusCode).toBe(200);
    const body = result.jsonBody as { yearlyData: YearlyData[] };
    expect(body).toBeTruthy();
    expect(Array.isArray(body.yearlyData)).toBe(true);
    expect(body.yearlyData.length).toBe(1);

    const y0 = body.yearlyData[0];

    // 期待値を数式ベースで計算
    const yearFraction = 1;
    const selfGrossIncome = params.mainJobIncomeGross;
    const idecoDeductionThisYear = 0;
    const spouseGrossIncome = 0;
    const netSelf = computeNetAnnual(
      selfGrossIncome - idecoDeductionThisYear,
    );
    const netSpouse = computeNetAnnual(spouseGrossIncome);

    // 結婚イベント年の支出（生活費＋住居＋結婚費）
    const livingExpenseExpected =
      params.marriage!.newLivingCostAnnual! * yearFraction;
    const housingExpenseExpected =
      params.marriage!.newHousingCostAnnual! * yearFraction;
    const marriageExpenseExpected =
      (params.marriage!.engagementJPY +
        params.marriage!.weddingJPY +
        params.marriage!.honeymoonJPY +
        params.marriage!.movingJPY) *
      yearFraction;

    const totalExpenseExpected =
      livingExpenseExpected + housingExpenseExpected + marriageExpenseExpected;

    // yearlyData の検証
    expect(y0.age).toBe(35);
    expect(y0.incomeDetail.self).toBe(Math.round(netSelf * yearFraction));
    expect(y0.incomeDetail.spouse).toBe(Math.round(netSpouse * yearFraction));
    expect(y0.incomeDetail.publicPension).toBe(0);
    expect(y0.incomeDetail.personalPension).toBe(0);
    expect(y0.incomeDetail.oneTime).toBe(0);

    expect(y0.expense).toBe(Math.round(totalExpenseExpected));
    expect(y0.expenseDetail.living).toBe(Math.round(livingExpenseExpected));
    expect(y0.expenseDetail.housing).toBe(Math.round(housingExpenseExpected));
    expect(y0.expenseDetail.marriage).toBe(
      Math.round(marriageExpenseExpected),
    );
    expect(y0.expenseDetail.children).toBe(0);
    expect(y0.expenseDetail.appliances).toBe(0);
    expect(y0.expenseDetail.care).toBe(0);
    expect(y0.expenseDetail.retirementGap).toBe(0);

    // NISA / iDeCo の残高が 0 であることを確認
    expect(y0.nisa.balance).toBe(0);
    expect(y0.ideco.balance).toBe(0);

    // totalAssets と assetAllocation は savings＋口座残高から再計算した値と整合していることのみ確認
    const recomputedTotalAssets =
      y0.savings +
      y0.taxable.balance +
      y0.nisa.balance +
      y0.ideco.balance;
    expect(y0.totalAssets).toBe(Math.round(recomputedTotalAssets));
    expect(y0.investedAmount).toBe(0);
    expect(y0.assetAllocation.cash).toBe(Math.round(y0.savings));
    expect(y0.assetAllocation.investment).toBe(
      Math.round(y0.taxable.balance),
    );
    expect(y0.assetAllocation.nisa).toBe(0);
    expect(y0.assetAllocation.ideco).toBe(0);

    generateReturnSeriesSpy.mockRestore();
    vi.useRealTimers();
  });
});

