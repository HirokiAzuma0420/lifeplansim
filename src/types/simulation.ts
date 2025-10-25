export interface AccountBucket {
  principal: number;
  balance: number;
}

export interface YearlyData {
  year: number;
  age: number;
  income: number;
  totalExpense: number;
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
  products?: Record<string, number>;
}

export interface SimulationInputParams {
  initialAge: number;
  spouseInitialAge?: number;
  retirementAge: number;
  mainJobIncomeGross: number;
  sideJobIncomeGross: number;
  spouseMainJobIncomeGross?: number;
  spouseSideJobIncomeGross?: number;
  currentSavingsJPY: number;
  monthlySavingsJPY: number;
  currentInvestmentsJPY: number;
  yearlyRecurringInvestmentJPY: number;
  yearlySpotJPY: number;
  expectedReturn: number;
  emergencyFundJPY: number;
}

export interface SimulationNavigationState {
  yearlyData: YearlyData[];
  inputParams: SimulationInputParams;
}
