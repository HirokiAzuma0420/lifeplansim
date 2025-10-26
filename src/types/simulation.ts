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
  cares?: CarePlan[]; // 介護プランを配列で受け取る
  products?: InvestmentProduct[];
}

export interface SimulationNavigationState {
  yearlyData: YearlyData[];
  percentileData?: PercentileData;
  inputParams: SimulationInputParams;
  rawFormData?: Record<string, unknown>;
}
