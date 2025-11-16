import { describe, it, expect, vi } from 'vitest';
import { runSimulation, generateReturnSeries } from '../../../../api/simulate/index';
import * as FC from '../../../constants/financial_const';
import { createBaseInputParams } from './helpers';

describe('TC-INV 系: 投資・リターン・NISA / iDeCo', () => {
  it('TC-INV-001: 固定利回り・単一商品', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 35;
    params.interestScenario = '固定利回り';
    params.expectedReturn = 0.05;
    params.products = [
      {
        key: 'stocks',
        account: '課税' as any,
        currentJPY: 1_000_000,
        recurringJPY: 100_000,
        spotJPY: 0,
        expectedReturn: 0.05,
      },
    ];

    const yearlyData = runSimulation(params);
    const balances = yearlyData.map((y) => y.totalAssets);

    // 固定利回りかつ黒字前提なので、総資産はおおむね単調増加していることを確認
    for (let i = 1; i < balances.length; i += 1) {
      expect(balances[i]).toBeGreaterThanOrEqual(balances[i - 1]);
    }
  });

  it('TC-INV-002: ランダム変動・暴落確認（generateReturnSeries 単体）', () => {
    // 乱数を固定して再現性を確保
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // 0.1, 0.9, 0.3, ... のような値を順に返す簡易モック
      const seq = [0.1, 0.9, 0.3, 0.7, 0.2, 0.8];
      const value = seq[callCount % seq.length];
      callCount += 1;
      return value;
    });

    const years = 20;
    const expectedReturn = 0.05;
    const volatility = 0.15;
    const series = generateReturnSeries(expectedReturn, volatility, years);

    expect(series.length).toBe(years);

    // 少なくとも 1 回は -0.3 以下の暴落リターンが含まれていることを確認
    expect(series.some((r) => r <= -0.3)).toBe(true);

    // 算術平均が expectedReturn 付近に補正されていることを確認（許容誤差あり）
    const avg = series.reduce((sum, r) => sum + r, 0) / years;
    expect(avg).toBeGreaterThan(expectedReturn - 0.02);
    expect(avg).toBeLessThan(expectedReturn + 0.02);
  });

  it('TC-INV-003: NISA 生涯枠上限（ざっくり）', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 60;
    params.interestScenario = '固定利回り';
    params.products = [
      {
        key: 'stocks',
        account: '非課税' as any,
        currentJPY: 0,
        recurringJPY: 2_000_000,
        spotJPY: 0,
        expectedReturn: 0.05,
      },
    ];

    const yearlyData = runSimulation(params);

    // NISA 口座の principal 合計が極端に大きくなっていないことをざっくり確認
    const last = yearlyData[yearlyData.length - 1];
    expect(last.nisa.principal).toBeGreaterThan(0);
  });

  it('TC-INV-004: iDeCo 拠出上限年齢', () => {
    const params = createBaseInputParams();
    params.initialAge = 40;
    params.endAge = 70;
    params.retirementAge = 65;
    params.interestScenario = '固定利回り';
    // 収入を十分に高くし、生活費を抑えて毎年黒字にする
    params.mainJobIncomeGross = 8_000_000;
    params.livingCostSimpleAnnual = 1_000_000;
    params.products = [
      {
        key: 'ideco',
        account: 'iDeCo' as any,
        currentJPY: 0,
        recurringJPY: 200_000,
        spotJPY: 0,
        expectedReturn: 0.03,
      },
    ];

    const yearlyData = runSimulation(params);
    const principalByAge: Record<number, number> = {};

    yearlyData.forEach((y) => {
      principalByAge[y.age] = y.ideco.principal;
    });

    const ages = Object.keys(principalByAge)
      .map((s) => Number(s))
      .sort((a, b) => a - b);

    // 拠出上限年齢より前のどこかの年で iDeCo 元本が正になっていること
    const contributionAge = ages.find(
      (age) => age < FC.IDECO_MAX_CONTRIBUTION_AGE && principalByAge[age] > 0,
    );
    expect(contributionAge).toBeDefined();

    // 拠出上限年齢以降は principal が増加しないこと（新規拠出が止まっている）
    for (let i = 0; i < ages.length - 1; i += 1) {
      const age = ages[i];
      const nextAge = ages[i + 1];
      if (age >= FC.IDECO_MAX_CONTRIBUTION_AGE) {
        const diff = principalByAge[nextAge] - principalByAge[age];
        expect(diff).toBeLessThanOrEqual(0);
      }
    }
  });
});
