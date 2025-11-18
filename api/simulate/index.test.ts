import { describe, it, expect, vi } from 'vitest';
import * as FC from '../../src/constants/financial_const';
import type { InvestmentProduct, AccountBucket } from '../../src/types/simulation-types';
import {
  getAnnualChildCost,
  withdrawToCoverShortfall,
  generateReturnSeries
} from './index'; // Assuming these are exported for testing


// Math.randomをモック化して、テストの再現性を確保
vi.spyOn(Math, 'random').mockReturnValue(0.5);

describe('api/simulate/index.ts', () => {
  // UT-006
  describe('getAnnualChildCost', () => {
    it('正常系: 子供の年齢に応じた教育費を計算する', () => {
      // 前提: 16歳、私立中心
      const age = 16;
      const pattern = '私立中心';
      const expectedCost = FC.EDUCATION_COST_TABLE[pattern]['16-18'] * FC.YEN_PER_MAN;

      const result = getAnnualChildCost(age, pattern);
      expect(result).toBe(expectedCost);
    });

    it('境界値: 0歳の場合の教育費を計算する', () => {
      const age = 0;
      const pattern = '公立中心';
      const expectedCost = FC.EDUCATION_COST_TABLE[pattern]['0-6'] * FC.YEN_PER_MAN;

      const result = getAnnualChildCost(age, pattern);
      expect(result).toBe(expectedCost);
    });

    it('境界値: 範囲外の年齢の場合、0を返す', () => {
      const age = 23;
      const pattern = '私立中心';

      const result = getAnnualChildCost(age, pattern);
      expect(result).toBe(0);
    });
  });

  // UT-007
  describe('withdrawToCoverShortfall', () => {
    it('正常系: 課税口座→NISA口座の順で資産を取り崩す', () => {
      // 前提
      const shortfall = 3000000; // 300万円の不足
      const savings = 2000000; // 現金200万円
      const productList: InvestmentProduct[] = [
        { key: 'world-stock', account: '課税', currentJPY: 2000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0.05 },
        { key: 'world-stock', account: '非課税', currentJPY: 5000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0.05 },
      ];
      const productBalances: Record<string, AccountBucket> = {
        'world-stock-0': { principal: 1800000, balance: 2000000 }, // 課税口座
        'world-stock-1': { principal: 4500000, balance: 5000000 }, // NISA口座
      };

      // 実行
      const { newSavings, newProductBalances, nisaRecycleAmount, taxPaid } = withdrawToCoverShortfall(
        shortfall,
        savings,
        productList,
        productBalances
      );

      // 検証
      // 1. 課税口座から全額(200万)取り崩し。利益10%に課税(20万*0.2=4万)され、手取りは196万円。
      //    不足額は 300 - 196 = 104万円に。
      const taxableGainRatio = (2000000 - 1800000) / 2000000; // 0.1
      const tax = 2000000 * taxableGainRatio * FC.SPECIFIC_ACCOUNT_TAX_RATE; // 2000000 * 0.1 * 0.20315 = 40630
      const netFromTaxable = 2000000 - tax; // 1959370
      const remainingShortfall = shortfall - netFromTaxable; // 3000000 - 1959370 = 1040630

      // 2. NISA口座から残り不足額(約104万)を取り崩し。
      const nisaPrincipalRatio = 4500000 / 5000000; // 0.9
      const nisaPrincipalWithdrawn = remainingShortfall * nisaPrincipalRatio; // 1040630 * 0.9 = 936567

      // 課税口座は0になる
      expect(newProductBalances['world-stock-0'].balance).toBeCloseTo(0);
      // NISA口座は残り不足額分だけ減少
      expect(newProductBalances['world-stock-1'].balance).toBeCloseTo(5000000 - remainingShortfall);
      // 現金は不足額が補填される
      expect(newSavings).toBeCloseTo(savings + netFromTaxable + remainingShortfall);
      // NISAの売却元本分がリサイクル枠になる
      expect(nisaRecycleAmount).toBeCloseTo(nisaPrincipalWithdrawn);
      expect(taxPaid).toBeCloseTo(tax);
    });
  });

  // UT-008
  describe('generateReturnSeries', () => {
    it('正常系: 指定した年数と平均リターンでリターン系列を生成する', () => {
      const averageReturn = 0.05;
      const volatility = 0.15;
      const years = 30;

      const series = generateReturnSeries(averageReturn, volatility, years);

      // 1. 長さ30の配列が返る
      expect(series).toHaveLength(years);

      // 2. 配列の算術平均が目標値に近くなる
      const sum = series.reduce((acc: number, val: number) => acc + val, 0);
      const mean = sum / years;
      expect(mean).toBeCloseTo(averageReturn, 5); // 浮動小数点誤差を考慮

      // 3. 暴落イベントが注入されている (Math.randomをモックしているため、再現性がある)
      // 最初の暴落は 3-5年目 -> floor(0.5 * (5-3+1)) + 3 = 4年目
      const expectedCrashYearIndex = Math.floor(0.5 * (FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MAX - FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MIN + 1)) + FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MIN;
      expect(series[expectedCrashYearIndex]).toBeLessThan(0);
    });
  });
});
