import type { SimulationInputParams } from '../../../types/simulation-types';

export type MockResult = {
  statusCode?: number;
  jsonBody?: unknown;
};

// VercelResponse 互換のモックオブジェクトを生成する関数
export const createMockResponse = (): { res: unknown; result: MockResult } => {
  const result: MockResult = {};

  const res = {
    status(code: number) {
      result.statusCode = code;
      return {
        json(data: unknown) {
          result.jsonBody = data;
        },
      };
    },
  };

  return { res, result };
};

// テストで共通して使う最低限の SimulationInputParams を生成する関数
export const createBaseInputParams = (): SimulationInputParams => ({
  initialAge: 30,
  spouseInitialAge: undefined,
  endAge: 31,
  retirementAge: 65,
  spouseRetirementAge: undefined,
  pensionStartAge: 65,
  spousePensionStartAge: undefined,

  mainJobIncomeGross: 5_000_000,
  sideJobIncomeGross: 0,
  spouseMainJobIncomeGross: undefined,
  spouseSideJobIncomeGross: undefined,
  incomeGrowthRate: 0,
  spouseIncomeGrowthRate: undefined,

  expenseMode: 'simple',
  livingCostSimpleAnnual: 2_000_000,
  detailedFixedAnnual: undefined,
  detailedVariableAnnual: undefined,

  car: {
    priceJPY: 0,
    firstAfterYears: 0,
    frequencyYears: 0,
    loan: {
      use: false,
      years: undefined,
      type: undefined,
    },
    currentLoan: undefined,
  },

  housing: {
    type: '賃貸' as any,
    rentMonthlyJPY: 0,
    currentLoan: undefined,
    purchasePlan: undefined,
    renovations: undefined,
  },

  marriage: undefined,
  children: undefined,
  appliances: undefined,
  cares: undefined,

  postRetirementLiving10kJPY: 200,
  pensionMonthly10kJPY: 0,
  spousePensionAmount: undefined,

  currentSavingsJPY: 1_000_000,
  monthlySavingsJPY: 0,
  products: [],
  expectedReturn: 0.03,
  stressTest: {
    enabled: false,
    seed: undefined,
  },
  interestScenario: '固定利回り',
  emergencyFundJPY: 100_000,
  useSpouseNisa: undefined,

  retirementIncome: undefined,
  spouseRetirementIncome: undefined,
  personalPensionPlans: undefined,
  spousePersonalPensionPlans: undefined,
  otherLumpSums: undefined,
  spouseOtherLumpSums: undefined,

  reemployment: undefined,
  spouseReemployment: undefined,

  _testOverrides: undefined,
});

