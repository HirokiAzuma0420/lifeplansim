export interface DebugInfo {
  replenishmentTriggered: boolean;
  savings_before_cashFlow?: number;
  savings_after_cashFlow?: number;
  savings_before_withdrawToCoverShortfall?: number;
  savings_before?: number;
  shortfall?: number;
  savings_after?: number;
  savings_after_withdrawToCoverShortfall?: number;
  savings_before_investment_reduction?: number;
  savings_after_investment_reduction?: number;
  savings_before_asset_growth?: number;
  savings_after_asset_growth?: number;
  totalInvestmentPrincipal_before_push?: number;
  savings_before_yearlyData_push?: number;
  savings_at_yearlyData_push_assignment?: number;
}

export type InvestmentProduct = {
  key: 'stocks' | 'trust' | 'bonds' | 'crypto' | 'other' | 'ideco' | 'world-stock';
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
  spouseAge?: number;
  income: number;
  incomeDetail: {
    self: number;
    spouse: number;
    investment: number;
    oneTime?: number;
    publicPension?: number;
    personalPension?: number;
  };
  expense: number;
  expenseDetail: {
    living: number; car: number; housing: number; marriage: number; children: number; appliances: number; care: number; retirementGap: number;
  };
  savings: number;
  nisa: AccountBucket;
  ideco: AccountBucket;
  taxable: AccountBucket;
  investmentPrincipal: number;
  totalAssets: number;
  balance: number;
  investedAmount: number;
  assetAllocation: {
    cash: number;
    investment: number;
    nisa: number;
    ideco: number;
  };
  products: Record<string, AccountBucket>;
  debug?: DebugInfo;
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

export interface RetirementIncomeParams {
  amountJPY: number;
  age: number;
  yearsOfService: number;
}

export type PersonalPensionType = 'lumpSum' | 'fixedTerm' | 'lifeTime';

export interface PersonalPensionPlanParams {
  type: PersonalPensionType;
  amountJPY: number; // lumpSum: 総額, fixedTerm/lifeTime: 年額
  startAge: number;
  duration?: number; // fixedTermの場合
}

export interface OtherLumpSumParams {
  name: string;
  amountJPY: number;
  age: number;
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

  marriage?: {
    age: number;
    engagementJPY: number;
    weddingJPY: number;
    honeymoonJPY: number;
    movingJPY: number;
    spouse?: { ageAtMarriage: number; incomeGross: number };
    newLivingCostAnnual?: number;
    newHousingCostAnnual?: number;
  };
  children?: { count: number; firstBornAge: number; educationPattern: '公立中心' | '公私混合' | '私立中心'; };
  appliances?: { name: string; cycleYears: number; firstAfterYears: number; cost10kJPY: number; }[];
  cares?: CarePlan[];

  postRetirementLiving10kJPY: number;
  pensionMonthly10kJPY: number;
  spousePensionMonthly10kJPY?: number;

  currentSavingsJPY: number;
  monthlySavingsJPY: number;
  products?: InvestmentProduct[];
  expectedReturn?: number;
  stressTest: {
    enabled: boolean;
    seed?: number;
  };
  interestScenario: '固定利回り' | 'ランダム変動';
  emergencyFundJPY: number;
  useSpouseNisa?: boolean;

  retirementIncome?: RetirementIncomeParams;
  spouseRetirementIncome?: RetirementIncomeParams;
  personalPensionPlans?: PersonalPensionPlanParams[];
  spousePersonalPensionPlans?: PersonalPensionPlanParams[];
  otherLumpSums?: OtherLumpSumParams[];
  spouseOtherLumpSums?: OtherLumpSumParams[];

  // 定年再雇用
  reemployment?: {
    startAge: number; // 60歳固定
    reductionRate: number; // 0.0 ~ 1.0 の数値 (例: 30%減給なら 0.3)
  };
  spouseReemployment?: {
    startAge: number; // 60歳固定
    reductionRate: number; // 0.0 ~ 1.0 の数値 (例: 30%減給なら 0.3)
  };
}

export interface SimulationNavigationState {
  yearlyData: YearlyData[];
  percentileData?: PercentileData;
  summary?: { bankruptcyRate: number };
  inputParams: SimulationInputParams;
  rawFormData?: Record<string, unknown>;
}
