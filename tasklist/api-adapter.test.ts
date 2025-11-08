import { describe, it, expect } from 'vitest';
import { createApiParams } from '../src/utils/api-adapter';
import type { FormDataState } from '../src/types/form-types';
import type { SimulationInputParams, InvestmentProduct } from '../src/types/simulation-types';
import * as FC from '../src/constants/financial_const';

describe('IT-001: フォーム入力 → APIパラメータ変換 (api-adapter.ts)', () => {
  it('正常系: 全てのフォーム項目が正しくAPIパラメータに変換される', () => {
    // 前提条件・入力: ユーザーが入力するであろうフォームデータを模したモック
    const mockFormData: FormDataState = {
      // 基本情報
      personAge: '35',
      spouseAge: '34',
      simulationPeriodAge: '100',
      familyComposition: '既婚',
      planToMarry: 'しない',
      marriageAge: '',
      spouseAgeAtMarriage: '',
      spouseIncomePattern: 'パート',
      spouseCustomIncome: '',

      // 家族構成
      hasChildren: 'はい',
      numberOfChildren: '2',
      firstBornAge: '37',
      educationPattern: '公立中心',

      // 収入
      mainIncome: '600',
      sideJobIncome: '50',
      spouseMainIncome: '400',
      spouseSideJobIncome: '0',
      annualRaiseRate: '2.0',
      spouseAnnualRaiseRate: '1.5',
      assumeReemployment: false,
      reemploymentReductionRate: '30',
      spouseAssumeReemployment: false,
      spouseReemploymentReductionRate: '30',

      // 支出
      expenseMethod: '簡単',
      livingCostSimple: '250000',
      housingCost: '',
      carPurchasePlan: '',
      housePurchaseIntent: '',
      housingLoanStatus: '',
      housingLoanInterestRateType: '',
      housingLoanInterestRate: '',
      headDownPayment: '',
      housePurchaseAge: '',
      housePurchasePrice: '',
      housingLoanYears: '',
      loanOriginalAmount: '',
      utilitiesCost: '',
      communicationCost: '',
      insuranceCost: '',
      educationCost: '',
      otherFixedCost: '',
      foodCost: '',
      dailyNecessitiesCost: '',
      transportationCost: '',
      clothingBeautyCost: '',
      socializingCost: '',
      hobbyEntertainmentCost: '',
      otherVariableCost: '',
      carCost: '',
      livingCostAfterMarriage: '',
      isLivingCostEdited: false,
      housingCostAfterMarriage: '',
      isHousingCostEdited: false,

      // ライフイベント
      housingType: '持ち家（ローン中）',
      currentRentLoanPayment: '',
      loanMonthlyPayment: '100000',
      loanRemainingYears: '30',
      housePurchasePlan: { age: 40, price: 5000, downPayment: 1000, loanYears: 35, interestRate: 1.5 },
      loanInterestRate: '',
      houseRenovationPlans: [],
      carPrice: '',
      carFirstReplacementAfterYears: '',
      carReplacementFrequency: '',
      carLoanUsage: 'いいえ',
      carLoanYears: '',
      carLoanType: '銀行ローン',
      carCurrentLoanInPayment: '',
      carCurrentLoanMonthly: '',
      carCurrentLoanRemainingMonths: '',
      engagementCost: '',
      weddingCost: '',
      honeymoonCost: '',
      newHomeMovingCost: '',
      appliances: [],
      otherLargeExpenses: '',
      parentCareAssumption: 'なし',
      parentCarePlans: [],

      // 老後
      retirementAge: '65',
      spouseRetirementAge: '65',
      spousePensionStartAge: '65',
      postRetirementLivingCost: '20',
      retirementIncome: { amount: 1000, age: 65, yearsOfService: 38 },
      spouseRetirementIncome: { amount: 500, age: 65, yearsOfService: 38 },
      pensionStartAge: '65',
      pensionAmount: '15',
      spousePensionAmount: '10',
      personalPensionPlans: [],
      spousePersonalPensionPlans: [],
      otherLumpSums: [],
      spouseOtherLumpSums: [],

      // 貯蓄・投資
      currentSavings: '800',
      monthlySavings: '50000',
      hasInvestment: 'はい',
      investmentStocksCurrent: '300',
      investmentStocksAccountType: 'nisa',
      investmentStocksRate: '5.0',
      investmentStocksAnnualSpot: '',
      investmentTrustCurrent: '',
      investmentTrustAccountType: 'nisa',
      investmentTrustRate: '4.0',
      investmentTrustAnnualSpot: '',
      investmentBondsCurrent: '',
      investmentBondsRate: '1.0',
      investmentBondsAnnualSpot: '',
      investmentIdecoCurrent: '120',
      investmentIdecoRate: '4.0',
      investmentIdecoAnnualSpot: '',
      investmentCryptoCurrent: '',
      investmentCryptoRate: '10.0',
      investmentCryptoAnnualSpot: '',
      investmentOtherCurrent: '',
      investmentOtherAccountType: 'nisa',
      investmentOtherRate: '3.0',
      investmentOtherAnnualSpot: '',
      monthlyInvestmentAmounts: {
        investmentStocksMonthly: '30000',
        investmentTrustMonthly: '',
        investmentBondsMonthly: '',
        investmentIdecoMonthly: '23000',
        investmentCryptoMonthly: '',
        investmentOtherMonthly: '',
      },

      // シミュレーション設定
      interestRateScenario: 'ランダム変動',
      fixedInterestRate: '3.0',
      stressTestSeed: '',
      emergencyFund: '300',
      useSpouseNisa: true,
    };

    // 実行
    const result: SimulationInputParams = createApiParams(mockFormData);

    // 検証: 期待される結果
    // 1. 単位変換（万円→円、%→小数）が正しく行われているか
    expect(result.mainJobIncomeGross).toBe(600 * FC.YEN_PER_MAN);
    expect(result.sideJobIncomeGross).toBe(50 * FC.YEN_PER_MAN);
    expect(result.spouseMainJobIncomeGross).toBe(400 * FC.YEN_PER_MAN);
    expect(result.incomeGrowthRate).toBe(0.02);
    expect(result.spouseIncomeGrowthRate).toBe(0.015);
    expect(result.livingCostSimpleAnnual).toBe(250000 * 12);
    expect(result.currentSavingsJPY).toBe(800 * FC.YEN_PER_MAN);
    expect(result.emergencyFundJPY).toBe(300 * FC.YEN_PER_MAN);

    // 2. オブジェクト構造が正しく生成されているか
    expect(result.housing.purchasePlan).toBeDefined();
    if (result.housing.purchasePlan) {
      expect(result.housing.purchasePlan.age).toBe(40);
      expect(result.housing.purchasePlan.priceJPY).toBe(5000 * FC.YEN_PER_MAN);
      expect(result.housing.purchasePlan.rate).toBe(0.015);
    }

    expect(result.children).toBeDefined();
    if (result.children) {
      expect(result.children.count).toBe(2);
      expect(result.children.educationPattern).toBe('公立中心');
    }

    // 3. 投資商品の配列が正しく生成されているか
    expect(result.products).toBeDefined();
    if (result.products) {
      expect(result.products.length).toBeGreaterThan(0);
      const stockProduct = result.products.find((p: InvestmentProduct) => p.key === 'stocks');
      expect(stockProduct).toBeDefined();
      expect(stockProduct?.currentJPY).toBe(300 * FC.YEN_PER_MAN);
      expect(stockProduct?.recurringJPY).toBe(30000 * 12);
      expect(stockProduct?.account).toBe('非課税');
      expect(stockProduct?.expectedReturn).toBe(0.05);

      const idecoProduct = result.products.find((p: InvestmentProduct) => p.key === 'ideco');
      expect(idecoProduct).toBeDefined();
      expect(idecoProduct?.currentJPY).toBe(120 * FC.YEN_PER_MAN);
      expect(idecoProduct?.recurringJPY).toBe(23000 * 12);
      expect(idecoProduct?.account).toBe('iDeCo');
    }

    // 4. 真偽値が正しく設定されているか
    expect(result.useSpouseNisa).toBe(true);
  });
});