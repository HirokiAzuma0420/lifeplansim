import type { CarePlan, SimulationNavigationState } from './simulation-types';
import type { InvestmentMonthlyAmounts } from './investment';

export interface RetirementIncome {
  amount: string | number;
  age: string | number;
  yearsOfService: string | number;
}

export type PersonalPensionType = 'lumpSum' | 'fixedTerm' | 'lifeTime';

export interface PersonalPensionPlan {
  id: number;
  type: PersonalPensionType;
  amount: string | number; // lumpSum: 総額, fixedTerm/lifeTime: 年額
  startAge: string | number;
  duration?: string | number; // fixedTermの場合
}

export interface OtherLumpSum {
  id: number;
  name: string;
  amount: string | number;
  age: string | number;
}

export type InvestmentCategory = 'stocks' | 'trust' | 'bonds' | 'ideco' | 'crypto' | 'other';

export interface InvestmentProduct {
  id: number; // useFieldArrayのためのユニークID
  category: InvestmentCategory;
  // 'bonds', 'ideco', 'crypto' では 'taxable' 固定
  accountType: 'nisa' | 'taxable';
  // ユーザーが任意で設定できる名前
  name: string;
  currentValue: string | number;
  monthlyInvestment: string | number;
  annualSpot: string | number;
  expectedRate: string | number;
  // NISA口座の場合のみ入力
  gainLossSign?: '+' | '-';
  gainLossRate?: string | number;
}

export interface FormDataState {
  familyComposition: '' | '独身' | '既婚';
  personAge: string | number;
  spouseAge: string | number;
  mainIncome: string | number;
  spouseMainIncome: string | number;
  sideJobIncome: string | number;
  spouseSideJobIncome: string | number;
  expenseMethod: '' | '簡単' | '詳細';
  livingCostSimple: string | number;
  housingCost: string | number;
  utilitiesCost: string | number;
  communicationCost: string | number;
  carCost: string | number;
  insuranceCost: string | number;
  educationCost: string | number;
  otherFixedCost: string | number;
  foodCost: string | number;
  dailyNecessitiesCost: string | number;
  transportationCost: string | number;
  clothingBeautyCost: string | number;
  socializingCost: string | number;
  hobbyEntertainmentCost: string | number;
  otherVariableCost: string | number;
  carPurchasePlan: '' | 'yes' | 'no';
  carFirstReplacementAfterYears: string | number;
  carPrice: string | number;
  carReplacementFrequency: string | number;
  carLoanUsage: '' | 'はい' | 'いいえ';
  carLoanYears: string | number;
  carLoanType: '' | '銀行ローン' | 'ディーラーローン';
  housingType: '' | '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
  carCurrentLoanInPayment: '' | 'yes' | 'no';
  carCurrentLoanMonthly: string | number;
  carCurrentLoanRemainingMonths: string | number;
  housePurchaseIntent: '' | 'yes' | 'no';
  housePurchasePlan: {
    age: number | '';
    price: number | '';
    downPayment: number | '';
    loanYears: number | '';
    interestRate: number | '';
  } | null;
  houseRenovationPlans: {
    age: number;
    cost: number;
    cycleYears?: number;
  }[];
  housePurchaseAge: string | number;
  housePurchasePrice: string | number;
  headDownPayment: string | number;
  housingLoanYears: string | number;
  housingLoanInterestRateType: '' | '固定' | '変動' | '指定';
  housingLoanInterestRate: string | number;
  housingLoanStatus: '' | 'これから借りる' | 'すでに返済中' | '借入予定なし';
  loanOriginalAmount: string | number;
  loanMonthlyPayment: string | number;
  loanRemainingYears: string | number;
  loanInterestRate: string | number;
  planToMarry: '' | 'する' | 'しない';
  spouseAgeAtMarriage: string | number;
  spouseIncomePattern: '' | 'パート' | '正社員' | 'カスタム';
  spouseCustomIncome: string | number;
  livingCostAfterMarriage: string | number;
  isLivingCostEdited: boolean;
  housingCostAfterMarriage: string | number;
  isHousingCostEdited: boolean;
  marriageAge: string | number;
  engagementCost: string;
  weddingCost: string;
  honeymoonCost: string;
  newHomeMovingCost: string;
  hasChildren: '' | 'はい' | 'いいえ';
  numberOfChildren: string | number;
  firstBornAge: string | number;
  educationPattern: '' | '公立中心' | '公私混合' | '私立中心';
  currentRentLoanPayment: string | number;
  otherLargeExpenses: string;
  parentCareAssumption: '' | 'はい' | '未定' | 'なし';
  parentCarePlans: (Omit<CarePlan, 'id'> & { id: number })[];
  retirementAge: string;
  postRetirementLivingCost: string;
  spouseRetirementAge: string;
  spousePensionStartAge: string;
  spousePensionAmount: string;
  pensionStartAge: string;
  pensionAmount: string;
  currentSavings: string | number;
  monthlySavings: string | number;
  hasInvestment: '' | 'はい' | 'いいえ';

  // 旧構成の投資フィールド（後方互換用）
  investmentStocksCurrent?: string | number;
  investmentTrustCurrent?: string | number;
  investmentBondsCurrent?: string | number;
  investmentIdecoCurrent?: string | number;
  investmentCryptoCurrent?: string | number;
  investmentOtherCurrent?: string | number;
  investmentStocksAccountType?: 'nisa' | 'taxable';
  investmentTrustAccountType?: 'nisa' | 'taxable';
  investmentOtherAccountType?: 'nisa' | 'taxable';
  monthlyInvestmentAmounts: InvestmentMonthlyAmounts;
  investmentStocksAnnualSpot?: string | number;
  investmentTrustAnnualSpot?: string | number;
  investmentBondsAnnualSpot?: string | number;
  investmentIdecoAnnualSpot?: string | number;
  investmentCryptoAnnualSpot?: string | number;
  investmentOtherAnnualSpot?: string | number;
  investmentStocksRate?: string | number;
  investmentTrustRate?: string | number;
  investmentBondsRate?: string | number;
  investmentIdecoRate?: string | number;
  investmentCryptoRate?: string | number;
  investmentOtherRate?: string | number;
  investmentStocksGainLossSign?: '+' | '-';
  investmentStocksGainLossRate?: string | number;
  investmentTrustGainLossSign?: '+' | '-';
  investmentTrustGainLossRate?: string | number;

  // 新構成: 配列ベース
  investmentProducts: InvestmentProduct[];

  simulationPeriodAge: string;
  interestRateScenario: '固定利回り' | 'ランダム変動';
  fixedInterestRate: string;
  emergencyFund: string;
  stressTestSeed: string | number;
  appliances: {
    name: string;
    cycle: number | string;
    cost: number | string;
    firstReplacementAfterYears?: number | string;
  }[];
  annualRaiseRate: string;
  spouseAnnualRaiseRate: string;
  useSpouseNisa: boolean;

  // 退職金・一時金
  retirementIncome?: RetirementIncome | null;
  spouseRetirementIncome?: RetirementIncome | null;

  // 個人年金
  personalPensionPlans: PersonalPensionPlan[];
  spousePersonalPensionPlans: PersonalPensionPlan[];

  // その他一時金
  otherLumpSums: OtherLumpSum[];
  spouseOtherLumpSums: OtherLumpSum[];

  // 定年再雇用
  assumeReemployment?: boolean;
  reemploymentReductionRate?: string;
  spouseAssumeReemployment?: boolean;
  spouseReemploymentReductionRate?: string;
}

export type FormLocationState = { rawFormData?: FormDataState; sectionIndex?: number };

export interface SimulationResult extends Partial<SimulationNavigationState> {
  message?: string;
}
