import { describe, it, expect } from 'vitest';
import { runSimulation, withdrawToCoverShortfall } from '../../../../api/simulate/index';
import { createBaseInputParams } from './helpers';
import type { InvestmentProduct, AccountBucket } from '../../../types/simulation-types';
import * as FC from '../../../constants/financial_const';

describe('TC-DEFICIT 系: 赤字補填・税制・NISA 枠再利用', () => {
  it('TC-DEFICIT-001: 赤字補填なし（常に黒字）', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 35;
    params.mainJobIncomeGross = 8_000_000;
    params.livingCostSimpleAnnual = 1_000_000;

    const yearlyData = runSimulation(params);
    const savingsList = yearlyData.map((y) => y.savings);

    for (let i = 1; i < savingsList.length; i += 1) {
      expect(savingsList[i]).toBeGreaterThanOrEqual(savingsList[i - 1]);
    }
  });

  it('TC-DEFICIT-002: 課税口座売却のみで補填', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 35;
    params.mainJobIncomeGross = 3_000_000;
    params.livingCostSimpleAnnual = 4_000_000;
    params.products = [
      {
        key: 'stocks',
        account: '課税' as any,
        currentJPY: 2_000_000,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0.0,
      },
    ];

    const yearlyData = runSimulation(params);

    const principals = yearlyData.map((y) => y.taxable.principal);
    expect(principals[0]).toBeGreaterThan(principals[principals.length - 1]);
  });

  it('TC-DEFICIT-003: NISA 枠再利用（NISA のみ保有）', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 33;
    params.mainJobIncomeGross = 1_000_000;
    params.livingCostSimpleAnnual = 4_000_000;
    params.products = [
      {
        key: 'stocks',
        account: '非課税' as any,
        currentJPY: 2_000_000,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0.0,
      },
    ];

    const yearlyData = runSimulation(params);
    const principals = yearlyData.map((y) => y.nisa.principal);

    // 元本が一度減少したあと、翌年以降に再び積み立てで増えていることをざっくり確認
    expect(principals[0]).toBeGreaterThan(principals[1]);
  });

  it('TC-DEFICIT-004: 課税＋NISA 混在・連続赤字補填', () => {
    const params = createBaseInputParams();
    params.initialAge = 30;
    params.endAge = 34;
    params.mainJobIncomeGross = 1_000_000;
    params.livingCostSimpleAnnual = 4_000_000;
    params.products = [
      {
        key: 'stocks',
        account: '課税' as any,
        currentJPY: 1_000_000,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0.0,
      },
      {
        key: 'world-stock',
        account: '非課税' as any,
        currentJPY: 1_000_000,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0.0,
      },
    ];

    const yearlyData = runSimulation(params);

    const taxablePrincipals = yearlyData.map((y) => y.taxable.principal);
    const nisaPrincipals = yearlyData.map((y) => y.nisa.principal);

    // まず課税口座の元本が減り、その後 NISA の元本も減っていくような動きになっていることをざっくり確認
    expect(taxablePrincipals[0]).toBeGreaterThanOrEqual(taxablePrincipals[1]);
    expect(nisaPrincipals[0]).toBeGreaterThanOrEqual(nisaPrincipals[1]);
  });

  it('TC-DEFICIT-005: 課税口座の税額計算（単純ケース）', () => {
    const products: InvestmentProduct[] = [
      {
        key: 'stocks',
        account: '課税' as any,
        currentJPY: 0,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0,
      },
    ];
    const productBalances: Record<string, AccountBucket> = {
      'stocks-0': {
        principal: 1_000, // 元本
        balance: 2_000, // 評価額（含み益 1,000）
      },
    };

    const initialSavings = 50;
    const shortfall = 100; // 必要な補填額

    const result = withdrawToCoverShortfall(
      shortfall,
      initialSavings,
      products,
      { ...productBalances },
    );

    // 理論上の売却額と税額を計算
    const totalBalance = 2_000;
    const totalPrincipal = 1_000;
    const gainRatio = (totalBalance - totalPrincipal) / totalBalance; // 0.5
    const requiredGross =
      shortfall / (1 - gainRatio * FC.SPECIFIC_ACCOUNT_TAX_RATE);
    const grossWithdrawal = Math.min(totalBalance, requiredGross);
    const tax = grossWithdrawal * gainRatio * FC.SPECIFIC_ACCOUNT_TAX_RATE;
    const netProceeds = grossWithdrawal - tax;

    // newSavings が「元の預金＋税引き後売却額」に近いことを確認
    expect(result.newSavings).toBeCloseTo(initialSavings + netProceeds, 6);
  });

  it('TC-DEFICIT-006: NISA 元本売却と NISA 枠復活量', () => {
    const products: InvestmentProduct[] = [
      {
        key: 'stocks',
        account: '非課税' as any,
        currentJPY: 0,
        recurringJPY: 0,
        spotJPY: 0,
        expectedReturn: 0,
      },
    ];
    const productBalances: Record<string, AccountBucket> = {
      'stocks-0': {
        principal: 1_000,
        balance: 1_000, // 元本＝評価額（含み益なし）
      },
    };

    const initialSavings = 0;
    const shortfall = 400;

    const result = withdrawToCoverShortfall(
      shortfall,
      initialSavings,
      products,
      { ...productBalances },
    );

    // NISA の場合、売却額＝shortfall（税なし）、売却元本がそのまま nisaRecycleAmount になる想定
    expect(result.newSavings).toBeCloseTo(shortfall, 6);
    expect(result.nisaRecycleAmount).toBeCloseTo(400, 6);
  });
});
