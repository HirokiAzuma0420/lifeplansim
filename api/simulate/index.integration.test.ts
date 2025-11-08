import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, { runSimulation } from './index';
import type { SimulationInputParams } from '../../src/types/simulation-types';

describe('結合テスト (Integration Tests)', () => {
  describe('IT-002: 定年再雇用シナリオ', () => {
    it('60歳から収入が指定の減給率で減少し、昇給が停止する', () => {
      // 1. 前提条件・入力
      const baseParams: SimulationInputParams = {
        initialAge: 58,
        endAge: 65,
        retirementAge: 65,
        mainJobIncomeGross: 10000000, // 58歳時点の年収1000万円
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0.02, // 昇給率2%
        expenseMode: 'simple',
        livingCostSimpleAnnual: 4000000,
        pensionStartAge: 65,
        pensionMonthly10kJPY: 15,
        currentSavingsJPY: 30000000,
        monthlySavingsJPY: 50000, // 必須プロパティを追加
        emergencyFundJPY: 5000000,
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        expectedReturn: 0,
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
        postRetirementLiving10kJPY: 25,
      };

      // 定年再雇用のパラメータを追加
      const paramsWithReemployment: SimulationInputParams = {
        ...baseParams,
        reemployment: {
          startAge: 60, // 60歳から再雇用
          reductionRate: 0.3, // 30%減給
        },
      };

      // 2. 実行
      const yearlyData = runSimulation(paramsWithReemployment);

      // 3. 検証
      // 59歳時点の年収を検証（まだ昇給は適用されない）
      const dataAt59 = yearlyData.find(d => d.age === 59);
      expect(dataAt59).toBeDefined();
      // computeNetAnnualを通した後の手取り額で比較
      // 59歳時点ではまだ昇給前なので、1000万円の手取り額を期待。
      expect(dataAt59?.incomeDetail.self).toBeCloseTo(7220500); 

      // 60歳時点の年収を計算（59歳時点の年収1000万から30%減給）
      const dataAt60 = yearlyData.find(d => d.age === 60);
      expect(dataAt60).toBeDefined();
      // 期待される年収は 1000万 * (1-0.3) = 700万円。
      // 700万円の手取り額を期待。
      const expectedNetIncomeAt60 = 5271500;
      expect(dataAt60?.incomeDetail.self).toBeCloseTo(expectedNetIncomeAt60);

      // 61歳時点の年収を検証（昇給が停止し、60歳と同じ年収になる）
      const dataAt61 = yearlyData.find(d => d.age === 61);
      expect(dataAt61).toBeDefined();
      expect(dataAt61?.incomeDetail.self).toBeCloseTo(expectedNetIncomeAt60);

      // 64歳時点の年収を検証（退職前年まで同じ年収が続く）
      const dataAt64 = yearlyData.find(d => d.age === 64);
      expect(dataAt64).toBeDefined();
      expect(dataAt64?.incomeDetail.self).toBeCloseTo(expectedNetIncomeAt60);

      // 65歳時点の年収を検証（退職したので給与収入は0になる）
      const dataAt65 = yearlyData.find(d => d.age === 65);
      expect(dataAt65).toBeDefined();
      expect(dataAt65?.incomeDetail.self).toBe(0);
    });
  });

  // Dateをモックして、テストが実行日時に依存しないようにする
  beforeEach(() => {
    // 2024年1月1日 00:00:00 に固定
    const mockDate = new Date(2024, 0, 1);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('IT-003: NISA夫婦利用シナリオ', () => {
    it('useSpouseNisa: trueの場合、NISA生涯非課税枠が3600万円に拡張される', () => {
      // 1. 前提条件・入力
      // NISAの年間上限額(360万円)を毎年投資し続けるシナリオ
      const baseParams: SimulationInputParams = {
        initialAge: 30,
        endAge: 50,
        retirementAge: 65,
        mainJobIncomeGross: 20000000, // 投資額を捻出するために高めの収入設定
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0,
        expenseMode: 'simple',
        livingCostSimpleAnnual: 5000000,
        pensionStartAge: 65,
        pensionMonthly10kJPY: 15,
        currentSavingsJPY: 50000000,
        monthlySavingsJPY: 0,
        emergencyFundJPY: 10000000,
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        expectedReturn: 0, // 投資元本のみを評価するため利回りは0に
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
        postRetirementLiving10kJPY: 25,
        products: [
          {
            key: 'trust',
            account: '非課税',
            currentJPY: 0,
            recurringJPY: 3600000, // 年間上限額を投資
            spotJPY: 0,
            expectedReturn: 0,
          },
        ],
      };

      // NISA夫婦利用のパラメータを追加
      const paramsWithSpouseNisa = { ...baseParams, useSpouseNisa: true };

      // 2. 実行
      const yearlyData = runSimulation(paramsWithSpouseNisa);

      // 3. 検証
      // 10年後 (39歳) には、360万円 * 10年 = 3600万円がNISAに投資されているはず
      const dataAt39 = yearlyData.find(d => d.age === 39);
      expect(dataAt39).toBeDefined();
      expect(dataAt39?.nisa.principal).toBe(36000000);
    });
  });

  describe('IT-004: 資産の年次引き継ぎ', () => {
    it('1年目の年末総資産が2年目の計算に正しく引き継がれる', () => {
      // 1. 前提条件・入力
      // 2年間のシンプルなシナリオ
      const params: SimulationInputParams = {
        initialAge: 30,
        endAge: 31,
        retirementAge: 65,
        mainJobIncomeGross: 10000000, // 年収1000万円
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0,
        expenseMode: 'simple',
        livingCostSimpleAnnual: 4000000, // 年間支出400万円
        pensionStartAge: 65,
        pensionMonthly10kJPY: 0,
        currentSavingsJPY: 10000000, // 初期貯金1000万円
        monthlySavingsJPY: 0,
        emergencyFundJPY: 0,
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        expectedReturn: 0.1, // 利回り10%
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
        postRetirementLiving10kJPY: 0,
        products: [{ key: 'stocks', account: '課税', currentJPY: 5000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0.1 }],
      };

      // 2. 実行
      const yearlyData = runSimulation(params);

      // 3. 検証
      // 1年目(30歳)のデータを確認
      const year1 = yearlyData.find(d => d.age === 30);
      expect(year1).toBeDefined();
      const year1_netIncome = 7101500; // 1000万円の手取り（現在の正しい計算値）
      const year1_cashFlow = year1_netIncome - 4000000; // 3101500
      const year1_investmentGrowth = 5000000 * 0.1; // 500000
      const year1_expectedEndAssets = 10000000 + 5000000 + year1_cashFlow + year1_investmentGrowth; // 15000000 + 3101500 + 500000 = 18601500
      expect(year1?.totalAssets).toBeCloseTo(year1_expectedEndAssets);

      // 2年目(31歳)のデータを確認
      const year2 = yearlyData.find(d => d.age === 31);
      expect(year2).toBeDefined();
      const year2_investmentGrowth = (5000000 + year1_investmentGrowth) * 0.1; // 550000
      const year2_expectedEndAssets = year1_expectedEndAssets + year1_cashFlow + year2_investmentGrowth; // 18601500 + 3101500 + 550000 = 22253000
      expect(year2?.totalAssets).toBeCloseTo(year2_expectedEndAssets);
    });
  });

  describe('IT-005: 生活防衛資金の補填ロジック', () => {
    it('年間収支が赤字になり現金が防衛資金を下回った場合、投資資産を取り崩して補填する', () => {
      // 1. 前提条件・入力
      // 収入より支出が多く、現金が生活防衛資金を割り込むシナリオ
      const emergencyFund = 3000000;
      const params: SimulationInputParams = {
        initialAge: 30,
        endAge: 31,
        retirementAge: 65,
        mainJobIncomeGross: 5000000, // 手取り約387万円
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0,
        expenseMode: 'simple',
        livingCostSimpleAnnual: 5000000, // 年間支出500万円（赤字確定）
        pensionStartAge: 65,
        pensionMonthly10kJPY: 0,
        currentSavingsJPY: 2000000, // 初期貯金200万円
        monthlySavingsJPY: 0,
        emergencyFundJPY: emergencyFund, // 生活防衛資金300万円
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        expectedReturn: 0, // 計算を単純化するため利回り0
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
        postRetirementLiving10kJPY: 0,
        products: [
          { key: 'stocks', account: '課税', currentJPY: 2000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0 },
          { key: 'trust', account: '非課税', currentJPY: 2000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0 },
        ],
      };

      // 2. 実行
      const yearlyData = runSimulation(params);

      // 3. 検証
      const year1 = yearlyData.find(d => d.age === 30);
      expect(year1).toBeDefined();

      // 3a. 補填ロジックが作動したことを確認
      expect(year1?.debug?.replenishmentTriggered).toBe(true);

      // 3b. 現金預金が生活防衛資金まで回復したことを確認
      expect(year1?.savings).toBe(emergencyFund);

      // 3c. 資産が取り崩されたことを確認
      // 年間収支: 3,876,500 (手取り) - 5,000,000 (支出) = -1,123,500
      // 収支適用後の現金: 2,000,000 - 1,123,500 = 876,500
      // 不足額: 3,000,000 (防衛資金) - 876,500 = 2,123,500
      // 課税口座(200万)を全額取り崩し、残り不足額(123,500)をNISAから取り崩す
      const expectedTaxableBalance = 0;
      const expectedNisaBalance = 2000000 - 123500;
      expect(year1?.taxable.balance).toBe(expectedTaxableBalance);
      expect(year1?.nisa.balance).toBe(expectedNisaBalance);
    });
  });

  describe('IT-006: NISA売却枠の翌年復活', () => {
    it('1年目にNISAを売却した場合、2年目の投資可能枠がその分だけ回復する', () => {

      const params: SimulationInputParams = {
        initialAge: 30,
        endAge: 31,
        retirementAge: 65,
        mainJobIncomeGross: 5000000, // 1年目の収入
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0, // 昇給なし
        expenseMode: 'simple',
        livingCostSimpleAnnual: 5000000, // 1年目の支出
        pensionStartAge: 65,
        pensionMonthly10kJPY: 0,
        currentSavingsJPY: 2000000,
        monthlySavingsJPY: 0,
        emergencyFundJPY: 3000000,
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        expectedReturn: 0,
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
        postRetirementLiving10kJPY: 0,
        products: [
          // 1年目は課税口座から取り崩し、2年目はNISAに投資
          { key: 'stocks', account: '課税', currentJPY: 2000000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0 }, // 1年目の取り崩し用
          { key: 'trust', account: '非課税', currentJPY: 2000000, recurringJPY: 3000000, spotJPY: 0, expectedReturn: 0 }, // 2年目の投資用
        ],
        // テスト用の収支上書き
        _testOverrides: {
          income: {
            31: 10000000, // 2年目(31歳)の収入を1000万円に設定し、黒字にする
          },
        },
      };

      // 2. 実行
      const yearlyData = runSimulation(params);

      // 3. 検証
      // 1年目: NISAが取り崩され、リサイクル枠が記録される
      const year1 = yearlyData.find(d => d.age === 30);
      expect(year1).toBeDefined();
      expect(year1?.debug?.replenishmentTriggered).toBe(true);
      // 1年目の収支: 3,876,500 (手取り) - 5,000,000 (支出) = -1,123,500
      // 収支適用後の現金: 2,000,000 (初期貯金) - 1,123,500 = 876,500
      // 防衛資金までの不足額: 3,000,000 - 876,500 = 2,123,500
      // NISAからの取り崩し額: 2,123,500 - 2,000,000 (課税口座) = 123,500
      const expectedNisaBalanceAfterYear1 = 2000000 - 123500;
      expect(year1?.nisa.balance).toBeCloseTo(expectedNisaBalanceAfterYear1);

      // 2年目: NISA投資枠が復活し、再投資される
      const year2 = yearlyData.find(d => d.age === 31);
      expect(year2).toBeDefined();
      // 2年目のNISA元本 = 1年目末のNISA元本 + 2年目の投資額
      // 1年目末のNISA元本(1,876,500) + 2年目の投資額(3,000,000) = 4,876,500
      const expectedNisaPrincipal = expectedNisaBalanceAfterYear1 + 3000000;
      expect(year2?.nisa.principal).toBe(expectedNisaPrincipal);
    });
  });

  describe('IT-007: APIエンドポイントの異常系入力', () => {
    it('不正なパラメータでAPIを呼び出すと、ステータス400とエラーメッセージを返す', async () => {
      // 1. 前提条件・入力
      // 終了年齢が開始年齢より前の、不正なパラメータ
      const invalidParams: SimulationInputParams = {
        initialAge: 40,
        endAge: 30, // Invalid value
        retirementAge: 65,
        mainJobIncomeGross: 10000000,
        sideJobIncomeGross: 0,
        incomeGrowthRate: 0,
        expenseMode: 'simple',
        livingCostSimpleAnnual: 4000000,
        currentSavingsJPY: 10000000,
        monthlySavingsJPY: 50000,
        emergencyFundJPY: 3000000,
        pensionStartAge: 65,
        pensionMonthly10kJPY: 15,
        postRetirementLiving10kJPY: 25,
        stressTest: { enabled: false },
        interestScenario: '固定利回り',
        housing: { type: '持ち家（完済）' },
        car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
      };

      // VercelのRequest/Responseオブジェクトをモック
      const mockReq = {
        method: 'POST',
        body: { inputParams: invalidParams },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const mockRes = { status };

      // 2. 実行
      // Vercelの型と完全に一致しないため、型エラーを無視
      await handler(mockReq, mockRes);

      // 3. 検証
      // ステータスコード400が設定されたか
      expect(status).toHaveBeenCalledWith(400);
      // エラーメッセージがJSONで返されたか
      expect(json).toHaveBeenCalledWith({ message: expect.stringContaining('シミュレーション終了年齢は開始年齢より後である必要があります。') });
    });
  });
});