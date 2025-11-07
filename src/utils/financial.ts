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
    salaryIncomeDeduction = FC.SALARY_INCOME_DEDUCTION_BRACKETS[0][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[1][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[2][2];
  } else if (income <= FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][0]) {
    salaryIncomeDeduction = income * FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][1] + FC.SALARY_INCOME_DEDUCTION_BRACKETS[3][2];
  } else {
    salaryIncomeDeduction = FC.SALARY_INCOME_DEDUCTION_MAX;
  }

  const socialInsurancePremium = income * FC.SOCIAL_INSURANCE_RATE;
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - FC.BASIC_DEDUCTION);

  let incomeTax: number = 0;
  for (const bracket of FC.INCOME_TAX_BRACKETS) {
    if (taxableIncome <= bracket[0]) {
      incomeTax = taxableIncome * bracket[1] - bracket[2];
      break;
    }
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

/**
 * 退職所得にかかる税金（所得税・住民税）を計算します。
 * @param retirementIncomeAmount 退職所得の収入金額（円）
 * @param yearsOfService 勤続年数
 * @returns 所得税と住民税の合計額（円）
 */
export function calculateRetirementIncomeTax(retirementIncomeAmount: number, yearsOfService: number): number {
  const income = Number(retirementIncomeAmount) || 0;
  const years = Math.max(1, Math.floor(Number(yearsOfService) || 1)); // 勤続年数は最低1年

  if (income <= 0) return 0;

  // 1. 退職所得控除額の計算
  let deduction: number;
  if (years <= 20) {
    deduction = 400000 * years;
  } else {
    deduction = 8000000 + 700000 * (years - 20);
  }
  // 控除額が80万円に満たない場合は、80万円とする
  if (deduction < 800000) {
    deduction = 800000;
  }

  // 2. 課税退職所得金額の計算
  const taxableRetirementIncome = Math.max(0, (income - deduction) / 2);

  // 3. 所得税の計算
  let incomeTax = 0;
  for (const bracket of FC.INCOME_TAX_BRACKETS) {
    if (taxableRetirementIncome <= bracket[0]) {
      incomeTax = taxableRetirementIncome * bracket[1] - bracket[2];
      break;
    }
  }
  // 最後のブラケットを超える場合
  if (incomeTax === 0 && taxableRetirementIncome > 0) {
    const lastBracket = FC.INCOME_TAX_BRACKETS[FC.INCOME_TAX_BRACKETS.length - 1];
    incomeTax = taxableRetirementIncome * lastBracket[1] - lastBracket[2];
  }

  // 4. 住民税の計算
  const residentTax = taxableRetirementIncome * FC.RESIDENT_TAX_RATE;

  // 5. 所得税と住民税の合計を返す
  return Math.max(0, incomeTax + residentTax);
}