﻿export type InvestmentProduct = {
  key: 'stocks' | 'trust' | 'bonds' | 'crypto' | 'other' | 'ideco';
  account: '課税' | '非課税' | 'iDeCo';
  currentJPY: number;
  recurringJPY: number; // 年間つみたて額（円/年）
  spotJPY: number;      // 年間スポット（円/年）
  expectedReturn: number; // 小数（例: 0.05）
};

export interface AccountBucket {
  principal: number;
  balance: number;
}

export interface YearlyData {
  year: number;
  age: number;
  income: number;
  totalExpense: number;
  totalInvestment: number;
  cashFlow: number;
  savings: number;
  nisa: AccountBucket;
  ideco: AccountBucket;
  taxable: AccountBucket;
  totalAssets: number;
  assetAllocation: {
    cash: number;
    investment: number;
    nisa: number;
    ideco: number;
  };
  // API拡張: 商品別の年末残高（存在時のみ）
  products: Record<string, AccountBucket>;
}

export interface PercentileData {
  p10: number[];
  p90: number[];
}

export interface CarePlan {
  id: string | number; // フロントエンドでの識別のためのID
  parentCurrentAge: number;
  parentCareStartAge: number;
  years: number;
  monthly10kJPY: number;
}

export interface SimulationInputParams {
  initialAge: number;
  spouseInitialAge?: number;
  endAge: number;
  retirementAge: number;
  spouseRetirementAge?: number;
  pensionStartAge: number;
  spousePensionStartAge?: number;

  mainJobIncomeGross: number;
  sideJobIncomeGross: number;
  spouseMainJobIncomeGross?: number;
  spouseSideJobIncomeGross?: number;
  incomeGrowthRate: number;
  spouseIncomeGrowthRate?: number;

  expenseMode: 'simple' | 'detailed';
  livingCostSimpleAnnual?: number;
  detailedFixedAnnual?: number;
  detailedVariableAnnual?: number;

  car: {
    priceJPY: number;
    firstAfterYears: number;
    frequencyYears: number;
    loan: {
      use: boolean;
      years?: number;
      type?: '銀行ローン' | 'ディーラーローン';
    };
    currentLoan?: {
      monthlyPaymentJPY: number;
      remainingMonths: number;
    };
  };

  housing: {
    type: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
    rentMonthlyJPY?: number;
    currentLoan?: {
      monthlyPaymentJPY: number;
      remainingYears: number;
    };
    purchasePlan?: { age: number; priceJPY: number; downPaymentJPY: number; years: number; rate: number; };
    renovations?: { age: number; costJPY: number; cycleYears?: number; }[];
  };

  marriage?: { age: number; engagementJPY: number; weddingJPY: number; honeymoonJPY: number; movingJPY: number; };
  children?: { count: number; firstBornAge: number; educationPattern: '公立中心' | '公私混合' | '私立中心'; };
  appliances?: { name: string; cycleYears: number; firstAfterYears: number; cost10kJPY: number; }[];
  cares?: CarePlan[];

  postRetirementLiving10kJPY: number;
  pensionMonthly10kJPY: number;
  spousePensionMonthly10kJPY?: number;

  currentSavingsJPY: number;
  monthlySavingsJPY: number;
  products?: InvestmentProduct[];
  stressTest: {
    enabled: boolean;
    seed?: number;
  };
  interestScenario: '固定利回り' | 'ランダム変動';
  emergencyFundJPY: number;
}

export interface SimulationNavigationState {
  yearlyData: YearlyData[];
  percentileData?: PercentileData;
  inputParams: SimulationInputParams;
  rawFormData?: Record<string, unknown>;
}
