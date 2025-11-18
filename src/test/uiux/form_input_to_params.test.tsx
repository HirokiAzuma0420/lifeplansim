import { describe, it, expect } from 'vitest';

import { createApiParams } from '@/utils/api-adapter';
import { createDefaultFormData } from '@/hooks/useFormState';
import type { SimulationInputParams } from '@/types/simulation-types';
import type { FormDataState } from '@/types/form-types';
import * as FC from '@/constants/financial_const';

// このテストファイルは、フォーム入力値（FormDataState）が
// createApiParams によって SimulationInputParams へ正しく変換されているかを検証する

describe('TC-FORM-100: 入力値の正常受付と API パラメータ変換', () => {
  it('基本的な収入・生活費入力が SimulationInputParams に期待どおりマッピングされる', () => {
    const base: FormDataState = createDefaultFormData();

    const formData: FormDataState = {
      ...base,
      familyComposition: '独身',
      personAge: '35',
      mainIncome: '600',        // 万円
      sideJobIncome: '50',      // 万円
      expenseMethod: '簡単',
      livingCostSimple: '250000', // 月額の生活費（円）
      currentSavings: '800',      // 万円
      emergencyFund: '300',       // 万円
      annualRaiseRate: '1.5',
    };

    const params: SimulationInputParams = createApiParams(formData);

    // 収入の変換: 万円 → 円、昇給率: パーセント文字列 → 小数
    expect(params.mainJobIncomeGross).toBe(600 * FC.YEN_PER_MAN);
    expect(params.sideJobIncomeGross).toBe(50 * FC.YEN_PER_MAN);
    expect(params.spouseMainJobIncomeGross).toBe(0);
    expect(params.spouseSideJobIncomeGross).toBe(0);
    expect(params.incomeGrowthRate).toBeCloseTo(0.015);

    // 生活費の変換: 月額（円） → 年額（円）
    expect(params.livingCostSimpleAnnual).toBe(250000 * FC.MONTHS_PER_YEAR);

    // 貯蓄と生活防衛資金: 万円 → 円
    expect(params.currentSavingsJPY).toBe(800 * FC.YEN_PER_MAN);
    expect(params.emergencyFundJPY).toBe(300 * FC.YEN_PER_MAN);
  });
});

describe('TC-FORM-101: 詳細生活費モードと annual の整合', () => {
  it('詳細生活費モードで totalExpenses 相当と detailedAnnual が整合している', () => {
    const base: FormDataState = createDefaultFormData();

    const formData: FormDataState = {
      ...base,
      expenseMethod: '詳細',
      utilitiesCost: '10000',
      communicationCost: '20000',
      insuranceCost: '30000',
      educationCost: '40000',
      otherFixedCost: '5000',
      foodCost: '60000',
      dailyNecessitiesCost: '7000',
      transportationCost: '8000',
      clothingBeautyCost: '9000',
      socializingCost: '10000',
      hobbyEntertainmentCost: '11000',
      otherVariableCost: '12000',
      // 車コスト（万円単位）: detailedFixedAnnual のみに加算される
      carCost: '2',
    };

    const params: SimulationInputParams = createApiParams(formData);

    expect(params.detailedFixedAnnual).not.toBeUndefined();
    expect(params.detailedVariableAnnual).not.toBeUndefined();

    const detailedFixedAnnual = params.detailedFixedAnnual ?? 0;
    const detailedVariableAnnual = params.detailedVariableAnnual ?? 0;

    // 期待される月額の詳細固定費
    const expectedMonthlyFixed =
      Number(formData.utilitiesCost || 0) +
      Number(formData.communicationCost || 0) +
      Number(formData.insuranceCost || 0) +
      Number(formData.educationCost || 0) +
      Number(formData.otherFixedCost || 0) +
      // 車コスト（月額・円）
      Number(formData.carCost || 0) * FC.YEN_PER_MAN;

    // 期待される月額の詳細変動費
    const expectedMonthlyVariable =
      Number(formData.foodCost || 0) +
      Number(formData.dailyNecessitiesCost || 0) +
      Number(formData.transportationCost || 0) +
      Number(formData.clothingBeautyCost || 0) +
      Number(formData.socializingCost || 0) +
      Number(formData.hobbyEntertainmentCost || 0) +
      Number(formData.otherVariableCost || 0);

    const expectedFixedAnnual = expectedMonthlyFixed * FC.MONTHS_PER_YEAR;
    const expectedVariableAnnual = expectedMonthlyVariable * FC.MONTHS_PER_YEAR;

    expect(detailedFixedAnnual).toBe(expectedFixedAnnual);
    expect(detailedVariableAnnual).toBe(expectedVariableAnnual);
  });
});

describe('TC-FORM-110: 結婚・住宅・介護ライフイベントの変換', () => {
  it('結婚・住宅・介護などのライフイベント入力が SimulationInputParams に反映される', () => {
    const base: FormDataState = createDefaultFormData();

    const formData: FormDataState = {
      ...base,
      // 結婚イベント
      planToMarry: 'する',
      marriageAge: '30',
      spouseAgeAtMarriage: '29',
      spouseIncomePattern: 'カスタム',
      spouseCustomIncome: '300',         // 万円
      livingCostAfterMarriage: '300000', // 円 / 月
      housingCostAfterMarriage: '80000', // 円 / 月
      // 住宅購入プラン
      housePurchasePlan: {
        age: 40,
        price: 5000,       // 万円
        downPayment: 1000, // 万円
        loanYears: 35,
        interestRate: 1.5,
      },
      // 子ども
      hasChildren: 'はい',
      numberOfChildren: '2',
      firstBornAge: '37',
      educationPattern: '公立中心',
      // 親の介護
      parentCareAssumption: 'はい',
      parentCarePlans: [
        {
          id: 1,
          parentCurrentAge: 65,
          parentCareStartAge: 70,
          monthly10kJPY: 20,
          years: 5,
        },
      ],
    };

    const params: SimulationInputParams = createApiParams(formData);

    // 結婚情報
    expect(params.marriage).toBeDefined();
    if (params.marriage && params.marriage.spouse) {
      const spouse = params.marriage.spouse;
      expect(params.marriage.age).toBe(30);
      expect(spouse.ageAtMarriage).toBe(29);
      expect(spouse.incomeGross).toBe(300 * FC.YEN_PER_MAN);
      expect(spouse.customIncomeJPY).toBe(300 * FC.YEN_PER_MAN);
      expect(params.marriage.newLivingCostAnnual).toBe(300000 * FC.MONTHS_PER_YEAR);
      expect(params.marriage.newHousingCostAnnual).toBe(80000 * FC.MONTHS_PER_YEAR);
    }

    // 住宅購入プラン
    expect(params.housing.purchasePlan).toBeDefined();
    if (params.housing.purchasePlan) {
      expect(params.housing.purchasePlan.age).toBe(40);
      expect(params.housing.purchasePlan.priceJPY).toBe(5000 * FC.YEN_PER_MAN);
      expect(params.housing.purchasePlan.downPaymentJPY).toBe(1000 * FC.YEN_PER_MAN);
      expect(params.housing.purchasePlan.years).toBe(35);
      expect(params.housing.purchasePlan.rate).toBeCloseTo(0.015);
    }

    // 子ども
    expect(params.children).toBeDefined();
    if (params.children) {
      expect(params.children.count).toBe(2);
      expect(params.children.firstBornAge).toBe(37);
      expect(params.children.educationPattern).toBe('公立中心');
    }

    // 親の介護
    const cares = params.cares ?? [];
    expect(cares.length).toBe(1);
    const care = cares[0];
    expect(care.parentCurrentAge).toBe(65);
    expect(care.parentCareStartAge).toBe(70);
    expect(care.years).toBe(5);
    expect(care.monthly10kJPY).toBe(20);
  });
});

