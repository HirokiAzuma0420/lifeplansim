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

interface MonthlyInvestmentAmounts {
  investmentStocksMonthly: number;
  investmentTrustMonthly: number;
  investmentBondsMonthly: number;
  investmentIdecoMonthly: number;
  investmentCryptoMonthly: number;
  investmentOtherMonthly: number;
}

interface InputParams {
  initialAge?: number;
  endAge?: number;
  currentSavings?: number; // 円
  mainJobIncome?: number; // 円
  incomeGrowthRate?: number; // 小数
  livingCost?: number; // 円/年
  spouseInitialAge?: number;
  spouseMainIncome?: number; // 円
  spouseIncomeGrowthRate?: number; // 小数
  sideJobIncome?: number; // 円
  spouseSideJobIncome?: number; // 円
  carPrice?: number; // 円
  carReplacementFrequency?: number;
  carLoanUsage?: 'はい' | 'いいえ';
  carLoanYears?: number;
  carLoanType?: '銀行ローン' | 'ディーラーローン';
  housingType?: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
  housePurchasePlan?: HousePurchasePlan | null;
  houseRenovationPlans?: HouseRenovationPlan[];
  loanMonthlyPayment?: number; // 円
  loanRemainingYears?: number;
  housingLoanInterestRateType?: string;
  housingLoanInterestRate?: number; // 小数
  monthlySavings?: number; // 円
  investmentStocksCurrent?: number; // 円
  investmentTrustCurrent?: number; // 円
  investmentBondsCurrent?: number; // 円
  investmentIdecoCurrent?: number; // 円
  investmentCryptoCurrent?: number; // 円
  investmentOtherCurrent?: number; // 円
  monthlyInvestmentAmounts?: MonthlyInvestmentAmounts;
  investmentStocksAnnualSpot?: number; // 円
  investmentTrustAnnualSpot?: number; // 円
  investmentBondsAnnualSpot?: number; // 円
  investmentIdecoAnnualSpot?: number; // 円
  investmentCryptoAnnualSpot?: number; // 円
  investmentOtherAnnualSpot?: number; // 円
  investmentStocksRate?: number; // 小数
  investmentTrustRate?: number; // 小数
  investmentBondsRate?: number; // 小数
  investmentIdecoRate?: number; // 小数
  investmentCryptoRate?: number; // 小数
  investmentOtherRate?: number; // 小数
  emergencyFund?: number; // 円
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
    console.log('Received inputParams:', inputParams);

    const initialAge = Number(inputParams.initialAge || 25);
    const endAge = Number(inputParams.endAge || 90);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const spouseInitialAge = Number(inputParams.spouseInitialAge || 0); // 将来拡張用
    let currentAssets = Number(inputParams.currentSavings || 0); // 円
    let mainJobIncome = Number(inputParams.mainJobIncome || 0); // 円
    const incomeGrowthRate = Number(inputParams.incomeGrowthRate || 0); // 小数
    let spouseMainIncome = Number(inputParams.spouseMainIncome || 0); // 円
    const spouseIncomeGrowthRate = Number(inputParams.spouseIncomeGrowthRate || 0); // 小数
    const sideJobIncome = Number(inputParams.sideJobIncome || 0); // 円
    const spouseSideJobIncome = Number(inputParams.spouseSideJobIncome || 0); // 円
    const livingCost = Number(inputParams.livingCost || 0); // 円/年

    // Car related inputs
    const carPrice = Number(inputParams.carPrice || 0); // 円
    const carReplacementFrequency = Number(inputParams.carReplacementFrequency || 0);
    const carLoanUsage = inputParams.carLoanUsage;
    const carLoanYears = Number(inputParams.carLoanYears || 0);
    const carLoanType = inputParams.carLoanType;

    // Housing related inputs
    const housingType = inputParams.housingType;
    const housePurchasePlan = inputParams.housePurchasePlan;
    const houseRenovationPlans = inputParams.houseRenovationPlans || [];
    const loanMonthlyPayment = Number(inputParams.loanMonthlyPayment || 0); // 円
    const loanRemainingYears = Number(inputParams.loanRemainingYears || 0);
    const housingLoanInterestRateType = inputParams.housingLoanInterestRateType;
    const housingLoanInterestRate = Number(inputParams.housingLoanInterestRate || 0); // 小数

    // Savings and Investment related inputs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const monthlySavings = Number(inputParams.monthlySavings || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentStocksCurrent = Number(inputParams.investmentStocksCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentTrustCurrent = Number(inputParams.investmentTrustCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentBondsCurrent = Number(inputParams.investmentBondsCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentIdecoCurrent = Number(inputParams.investmentIdecoCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentCryptoCurrent = Number(inputParams.investmentCryptoCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentOtherCurrent = Number(inputParams.investmentOtherCurrent || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const monthlyInvestmentAmounts = inputParams.monthlyInvestmentAmounts || {
      investmentStocksMonthly: 0,
      investmentTrustMonthly: 0,
      investmentBondsMonthly: 0,
      investmentIdecoMonthly: 0,
      investmentCryptoMonthly: 0,
      investmentOtherMonthly: 0,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentStocksAnnualSpot = Number(inputParams.investmentStocksAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentTrustAnnualSpot = Number(inputParams.investmentTrustAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentBondsAnnualSpot = Number(inputParams.investmentBondsAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentIdecoAnnualSpot = Number(inputParams.investmentIdecoAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentCryptoAnnualSpot = Number(inputParams.investmentCryptoAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentOtherAnnualSpot = Number(inputParams.investmentOtherAnnualSpot || 0); // 円
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentStocksRate = Number(inputParams.investmentStocksRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentTrustRate = Number(inputParams.investmentTrustRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentBondsRate = Number(inputParams.investmentBondsRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentIdecoRate = Number(inputParams.investmentIdecoRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentCryptoRate = Number(inputParams.investmentCryptoRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const investmentOtherRate = Number(inputParams.investmentOtherRate || 0); // 小数
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emergencyFund = Number(inputParams.emergencyFund || 0); // 円

    // Helper function for loan calculation
    const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
      if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
        return 0;
      }
      const monthlyInterestRate = annualInterestRate / 12; // annualInterestRate is already decimal
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
          let annualRate = 0.025; // default decimal
          if (carLoanType === '銀行ローン') annualRate = 0.015;
          else if (carLoanType === 'ディーラーローン') annualRate = 0.045;
          carExpense = calculateLoanPayment(carPrice, annualRate, carLoanYears);
        } else {
          carExpense = carPrice;
        }
        currentYearExpense += carExpense;
      }

      // Housing expense calculation
      if (housingType === '賃貸' && housePurchasePlan && age === housePurchasePlan.age) {
        const principal = Number(housePurchasePlan.price) - Number(housePurchasePlan.downPayment);
        let interestRate = 0.015; // Default general interest rate decimal
        if (housingLoanInterestRateType === '指定') {
          interestRate = housingLoanInterestRate;
        }
        housingExpense = calculateLoanPayment(principal, interestRate, Number(housePurchasePlan.loanYears));
        currentYearExpense += housingExpense;
      } else if (housingType === '持ち家（ローン中）' && loanMonthlyPayment > 0 && loanRemainingYears > 0) {
        // Assuming loanMonthlyPayment is monthly, convert to annual
        housingExpense = loanMonthlyPayment * 12;
        currentYearExpense += housingExpense;
      }

      // House renovation expense calculation
      houseRenovationPlans.forEach(plan => {
        if (age === Number(plan.age) || (Number(plan.cycleYears) && (age - Number(plan.age)) % Number(plan.cycleYears) === 0 && age > Number(plan.age))) {
          currentYearExpense += Number(plan.cost);
          housingExpense += Number(plan.cost);
        }
      });

      // Type and NaN checks before asset calculation
      if (typeof currentAssets !== 'number' || isNaN(currentAssets)) throw new Error(`Invalid currentAssets type or NaN at age ${age}: ${currentAssets}`);
      if (typeof currentYearIncome !== 'number' || isNaN(currentYearIncome)) throw new Error(`Invalid currentYearIncome type or NaN at age ${age}: ${currentYearIncome}`);
      if (typeof currentYearExpense !== 'number' || isNaN(currentYearExpense)) throw new Error(`Invalid currentYearExpense type or NaN at age ${age}: ${currentYearExpense}`);

      currentAssets = currentAssets + currentYearIncome - currentYearExpense;

      console.log(`Age: ${age}, Income: ${currentYearIncome}, Expense: ${currentYearExpense}, Assets: ${currentAssets}, CarExpense: ${carExpense}, HousingExpense: ${housingExpense}`);
      console.log(`Types - Income: ${typeof currentYearIncome}, Expense: ${typeof currentYearExpense}, Assets: ${typeof currentAssets}`);

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
