import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HousePurchasePlan {
  age: number;
  price: number;
  downPayment: number;
  loanYears: number;
  interestRate: number;
}

interface HouseRenovationPlan {
  age: number;
  cost: number;
  cycleYears?: number;
}

interface InputParams {
  initialAge?: number;
  endAge?: number;
  currentSavings?: number;
  mainJobIncome?: number;
  incomeGrowthRate?: number;
  livingCost?: number;
  spouseInitialAge?: number;
  spouseMainIncome?: number;
  spouseIncomeGrowthRate?: number;
  sideJobIncome?: number;
  spouseSideJobIncome?: number;
  carPrice?: number;
  carReplacementFrequency?: number;
  carLoanUsage?: 'はい' | 'いいえ';
  carLoanYears?: number;
  carLoanType?: '銀行ローン' | 'ディーラーローン';
  housingType?: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
  housePurchasePlan?: HousePurchasePlan | null;
  houseRenovationPlans?: HouseRenovationPlan[];
  loanMonthlyPayment?: number;
  loanRemainingYears?: number;
  housingLoanInterestRateType?: string;
  housingLoanInterestRate?: number;
}

interface YearlyData {
  year: number;
  age: number;
  mainJobIncome: number;
  spouseMainIncome: number;
  sideJobIncome: number;
  spouseSideJobIncome: number;
  income: number;
  expense: number;
  carExpense: number;
  housingExpense: number;
  assets: number;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const inputParams: InputParams = req.body.inputParams || {};

    const initialAge = inputParams.initialAge ?? 25;
    const endAge = inputParams.endAge ?? 90;
    const spouseInitialAge = inputParams.spouseInitialAge; // 将来拡張用
    let currentAssets = inputParams.currentSavings ?? 1000000;
    let mainJobIncome = inputParams.mainJobIncome ?? 4000000;
    const incomeGrowthRate = inputParams.incomeGrowthRate ?? 0.02;
    let spouseMainIncome = inputParams.spouseMainIncome ?? 0;
    const spouseIncomeGrowthRate = inputParams.spouseIncomeGrowthRate ?? 0.02;
    const sideJobIncome = inputParams.sideJobIncome ?? 0;
    const spouseSideJobIncome = inputParams.spouseSideJobIncome ?? 0;
  const livingCost = inputParams.livingCost ?? 2000000;

  // Car related inputs
  const carPrice = inputParams.carPrice ?? 0;
  const carReplacementFrequency = inputParams.carReplacementFrequency ?? 0;
  const carLoanUsage = inputParams.carLoanUsage;
  const carLoanYears = inputParams.carLoanYears ?? 0;
  const carLoanType = inputParams.carLoanType;

  // Housing related inputs
  const housingType = inputParams.housingType;
  const housePurchasePlan = inputParams.housePurchasePlan;
  const houseRenovationPlans = inputParams.houseRenovationPlans ?? [];
  const loanMonthlyPayment = inputParams.loanMonthlyPayment ?? 0;
  const loanRemainingYears = inputParams.loanRemainingYears ?? 0;
  const housingLoanInterestRateType = inputParams.housingLoanInterestRateType;
  const housingLoanInterestRate = inputParams.housingLoanInterestRate ?? 0;

  // Helper function for loan calculation
  const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
    if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
      return 0;
    }
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const totalMonths = years * 12;

    if (monthlyInterestRate === 0) {
      return principal / years;
    }

    const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
    return monthlyPayment * 12;
  };

  const years: YearlyData[] = [];

    for (let age = initialAge; age <= endAge; age++) {
      const year = new Date().getFullYear() + (age - initialAge);

      const currentYearMainJobIncome = mainJobIncome;
      const currentYearSpouseMainJobIncome = spouseMainIncome;
      const currentYearSideJobIncome = sideJobIncome;
      const currentYearSpouseSideJobIncome = spouseSideJobIncome;

      const currentYearIncome = currentYearMainJobIncome + currentYearSpouseMainJobIncome + currentYearSideJobIncome + currentYearSpouseSideJobIncome;
      let currentYearExpense = livingCost;
      let carExpense = 0;
      let housingExpense = 0;

      // Car expense calculation
      if (carPrice > 0 && carReplacementFrequency > 0 && (age - initialAge) % carReplacementFrequency === 0) {
        if (carLoanUsage === 'はい') {
          let annualRate = 0.025; // default
          if (carLoanType === '銀行ローン') annualRate = 0.015;
          else if (carLoanType === 'ディーラーローン') annualRate = 0.045;
          carExpense = calculateLoanPayment(carPrice * 10000, annualRate, carLoanYears);
        } else {
          carExpense = carPrice * 10000;
        }
        currentYearExpense += carExpense;
      }

      // Housing expense calculation
      if (housingType === '賃貸' && housePurchasePlan && age === housePurchasePlan.age) {
        const principal = (housePurchasePlan.price - housePurchasePlan.downPayment) * 10000;
        let interestRate = 1.5; // Default general interest rate
        if (housingLoanInterestRateType === '指定') {
          interestRate = housingLoanInterestRate;
        }
        housingExpense = calculateLoanPayment(principal, interestRate, housePurchasePlan.loanYears);
        currentYearExpense += housingExpense;
      } else if (housingType === '持ち家（ローン中）' && loanMonthlyPayment > 0 && loanRemainingYears > 0) {
        // Assuming loanMonthlyPayment is monthly, convert to annual
        housingExpense = loanMonthlyPayment * 12;
        currentYearExpense += housingExpense;
      }

      // House renovation expense calculation
      houseRenovationPlans.forEach(plan => {
        if (age === plan.age || (plan.cycleYears && (age - plan.age) % plan.cycleYears === 0 && age > plan.age)) {
          currentYearExpense += plan.cost * 10000;
          housingExpense += plan.cost * 10000;
        }
      });

      currentAssets = currentAssets + currentYearIncome - currentYearExpense;

      years.push({
        year,
        age,
        mainJobIncome: Math.round(currentYearMainJobIncome / 1000) * 1000,
        spouseMainIncome: Math.round(currentYearSpouseMainJobIncome / 1000) * 1000,
        sideJobIncome: Math.round(currentYearSideJobIncome / 1000) * 1000,
        spouseSideJobIncome: Math.round(currentYearSpouseSideJobIncome / 1000) * 1000,
        income: Math.round(currentYearIncome / 1000) * 1000,
        expense: Math.round(currentYearExpense / 1000) * 1000,
        carExpense: Math.round(carExpense / 1000) * 1000,
        housingExpense: Math.round(housingExpense / 1000) * 1000,
        assets: Math.round(currentAssets / 1000) * 1000,
      });

      mainJobIncome *= (1 + incomeGrowthRate);
      spouseMainIncome *= (1 + spouseIncomeGrowthRate);
    }

    const finalAssets = Math.round(currentAssets / 1000) * 1000;

    res.status(200).json({ result: { years, finalAssets } });
  } catch (error: unknown) {
    console.error('Simulation error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
