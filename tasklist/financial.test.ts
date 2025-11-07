import { describe, it, expect } from 'vitest';
import { computeNetAnnual, calculateRetirementIncomeTax } from '../src/utils/financial';

describe('financial utils', () => {
  // UT-001, UT-002, UT-003
  describe('computeNetAnnual', () => {
    it('UT-001: 額面500万円の場合、約390万円の手取りを返す', () => {
      const grossIncome = 5000000;
      const netIncome = computeNetAnnual(grossIncome);
      // 正確な値は税制に依存するため、ここでは範囲でテスト
      expect(netIncome).toBeGreaterThan(3800000);
      expect(netIncome).toBeLessThan(4000000);
      // スナップショットテストも有効
      expect(netIncome).toMatchInlineSnapshot(`3876500`);
    });

    it('UT-002: 額面0円の場合、0円を返す', () => {
      expect(computeNetAnnual(0)).toBe(0);
    });

    it('UT-003: 所得税率が変わる境界値（695万円）で正しく計算される', () => {
      expect(computeNetAnnual(6950000)).toMatchInlineSnapshot(`5240250`);
    });
  });

  // UT-004, UT-005
  describe('calculateRetirementIncomeTax', () => {
    it('UT-004: 退職所得2000万円、勤続30年で正しく税額を計算する', () => {
      expect(calculateRetirementIncomeTax(20000000, 30)).toMatchInlineSnapshot(`402500`);
    });
  });
});