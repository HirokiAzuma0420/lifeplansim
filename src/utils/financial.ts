import * as FC from '../../src/constants/financial_const';

/**
 * 額面年収から手取り年収を概算します。
 * @param grossAnnualIncome 額面年収（円）
 * @returns 手取り年収（円）
 */
export function computeNetAnnual(grossAnnualIncome: number): number {
  const income = Number(grossAnnualIncome) || 0;
  if (income <= 0) return 0;

  let salaryIncomeDeduction: number;
  if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[0][0]) {
    salaryIncomeDeduction = FC.SALARY_INCOME_DEDUCTION_MIN;
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][1] - FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[4][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[4][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[4][2];
  } else {
    salaryIncomeDeduction = FC.SALARY_INCOME_DEDUCTION_MAX;
  }

  const socialInsurancePremium = income * FC.SOCIAL_INSURANCE_RATE;
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - FC.BASIC_DEDUCTION);

  let incomeTax: number;
  if (taxableIncome <= FC.INCOME_TAX_BRACKETS[0][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[0][1] - FC.INCOME_TAX_BRACKETS[0][2];
  } else if (taxableIncome <= FC.INCOME_TAX_BRACKETS[1][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[1][1] - FC.INCOME_TAX_BRACKETS[1][2];
  } else if (taxableIncome <= FC.INCOME_TAX_BRACKETS[2][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[2][1] - FC.INCOME_TAX_BRACKETS[2][2];
  } else if (taxableIncome <= FC.INCOME_TAX_BRACKETS[3][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[3][1] - FC.INCOME_TAX_BRACKETS[3][2];
  } else if (taxableIncome <= FC.INCOME_TAX_BRACKETS[4][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[4][1] - FC.INCOME_TAX_BRACKETS[4][2];
  } else if (taxableIncome <= FC.INCOME_TAX_BRACKETS[5][0]) {
    incomeTax = taxableIncome * FC.INCOME_TAX_BRACKETS[5][1] - FC.INCOME_TAX_BRACKETS[5][2];
  } else {
    incomeTax = taxableIncome * 0.45 - 4796000; // 4000万超
  }

  const residentTax = taxableIncome * FC.RESIDENT_TAX_RATE + FC.RESIDENT_TAX_FLAT_AMOUNT;
  const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

  return Math.max(0, netAnnualIncome);
}

/**
 * ローンの年間返済額と総返済額を計算します。
 * @param principal - 借入元本（円）
 * @param annualInterestRate - 年利（%）
 * @param years - 返済期間（年）
 * @returns 年間返済額と総返済額を含むオブジェクト
 */
export function calculateLoanPayment(principal: number, annualInterestRate: number, years: number): { annualPayment: number, totalPayment: number } {
  if (principal <= 0 || annualInterestRate < 0 || years <= 0) return { annualPayment: 0, totalPayment: 0 };

  const monthlyInterestRate = annualInterestRate / 100 / FC.MONTHS_PER_YEAR;
  const totalMonths = years * FC.MONTHS_PER_YEAR;

  if (monthlyInterestRate === 0) return { annualPayment: principal / years, totalPayment: principal };

  const monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths)) / (Math.pow(1 + monthlyInterestRate, totalMonths) - 1);
  const annualPayment = monthlyPayment * FC.MONTHS_PER_YEAR;
  const totalPayment = annualPayment * years;

  return { annualPayment, totalPayment };
}