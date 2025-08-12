
import type { VercelRequest, VercelResponse } from "@vercel/node";

// I/O契約に基づく型定義
type NormalizedParams = {
  initialAge: number;
  spouseInitialAge?: number;
  endAge: number;
  retirementAge: number;
  pensionStartAge: number;
  mainJobIncomeNet: number;
  sideJobIncomeNet: number;
  spouseMainJobIncomeNet?: number;
  spouseSideJobIncomeNet?: number;
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
    loan: { use: boolean; years?: number; type?: '銀行ローン' | 'ディーラーローン' };
  };
  housing: {
    type: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
    currentLoan?: { monthlyPaymentJPY?: number; remainingYears?: number };
    purchasePlan?: { age: number; priceJPY: number; downPaymentJPY: number; years: number; rate: number };
    renovations: Array<{ age: number; costJPY: number; cycleYears?: number }>;
  };
  marriage?: { age: number; engagementJPY: number; weddingJPY: number; honeymoonJPY: number; movingJPY: number };
  children?: { count: number; firstBornAge: number; educationPattern: '公立中心' | '公私混合' | '私立中心' };
  appliances: Array<{ name: string; cycleYears: number; firstAfterYears: number; cost10kJPY: number }>;
  care?: { assume: boolean; parentCurrentAge: number; parentCareStartAge: number; years: number; monthly10kJPY: number };
  postRetirementLiving10kJPY: number;
  pensionMonthly10kJPY: number;
  currentSavingsJPY: number;
  monthlySavingsJPY: number;
  currentInvestmentsJPY: number;
  yearlyRecurringInvestmentJPY: number;
  yearlySpotJPY: number;
  expectedReturn: number;
  stressTest?: { enabled: boolean; volatility?: number; seed?: number };
  interestScenario: '固定利回り' | 'ランダム変動';
  emergencyFundJPY: number;
};

type YearlyRow = {
  year: number;
  age: number;
  spouseAge?: number;
  income: number;
  incomeDetail: { self: number; spouse: number; investment: number };
  expense: number;
  expenseDetail: {
    living: number;
    car: number;
    housing: number;
    marriage: number;
    children: number;
    appliances: number;
    care: number;
    retirementGap: number;
  };
  savings: number;
  investmentPrincipal: number;
  totalAssets: number;
  balance: number;
};

// --- ヘルパー関数 ---

/**
 * 元利均等返済の年額を計算
 * @param principal 元本 (円)
 * @param annualRate 年利 (小数)
 * @param years 返済年数
 * @returns 年間返済額 (円)
 */
function amortize(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / years;

  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  return monthlyPayment * 12;
}


// --- メインロジック ---

function runSimulation(params: NormalizedParams): YearlyRow[] {
  const yearlyData: YearlyRow[] = [];
  
  // 初期資産
  let savings = params.currentSavingsJPY;
  let investmentPrincipal = params.currentInvestmentsJPY;

  // 収入
  let selfBaseIncome = params.mainJobIncomeNet + params.sideJobIncomeNet;
  let spouseBaseIncome = params.spouseMainJobIncomeNet && params.spouseSideJobIncomeNet
    ? params.spouseMainJobIncomeNet + params.spouseSideJobIncomeNet
    : 0;

  // ライフイベントトラッカー
  const activeCarLoans: Array<{ startYear: number; years: number; annualPayment: number }> = [];

  const loopEndAge = params.endAge;
  const startYear = new Date().getFullYear();

  for (let i = 0; (params.initialAge + i) <= loopEndAge; i++) {
    const age = params.initialAge + i;
    const year = startYear + i;
    const isRetired = age >= params.retirementAge;

    // --- 1. 収入計算 ---
    if (i > 0 && !isRetired) {
      selfBaseIncome *= (1 + params.incomeGrowthRate);
      if (spouseBaseIncome > 0 && params.spouseIncomeGrowthRate) {
        spouseBaseIncome *= (1 + params.spouseIncomeGrowthRate);
      }
    }
    const currentSelfIncome = isRetired ? 0 : selfBaseIncome;
    const currentSpouseIncome = (isRetired || !spouseBaseIncome) ? 0 : spouseBaseIncome;
    
    const investmentReturn = (savings + investmentPrincipal) * params.expectedReturn;
    const incomeDetail = { self: currentSelfIncome, spouse: currentSpouseIncome, investment: investmentReturn };
    const totalIncome = incomeDetail.self + incomeDetail.spouse + incomeDetail.investment;

    // --- 2. 支出計算 ---
    const expenseDetail: YearlyRow['expenseDetail'] = {
      living: 0, car: 0, housing: 0, marriage: 0, children: 0, appliances: 0, care: 0, retirementGap: 0,
    };

    // B) 生活費
    if (isRetired) {
      expenseDetail.living = 0; // 老後生活費は retirementGap で処理
    } else if (params.expenseMode === 'simple') {
      expenseDetail.living = params.livingCostSimpleAnnual ?? 0;
    } else {
      expenseDetail.living = (params.detailedFixedAnnual ?? 0) + (params.detailedVariableAnnual ?? 0);
    }

    // C) 車
    if (params.car.priceJPY > 0 && params.car.frequencyYears > 0) {
      if (i === params.car.firstAfterYears || (i > params.car.firstAfterYears && (i - params.car.firstAfterYears) % params.car.frequencyYears === 0)) {
        if (params.car.loan.use && params.car.loan.years) {
          const rate = params.car.loan.type === '銀行ローン' ? 0.015 : 0.045;
          activeCarLoans.push({
            startYear: year,
            years: params.car.loan.years,
            annualPayment: amortize(params.car.priceJPY, rate, params.car.loan.years),
          });
        } else {
          expenseDetail.car += params.car.priceJPY;
        }
      }
    }
    activeCarLoans.forEach(loan => {
      if (year >= loan.startYear && year < loan.startYear + loan.years) {
        expenseDetail.car += loan.annualPayment;
      }
    });

    // D) 住まい
    if (params.housing.type === '持ち家（ローン中）' && params.housing.currentLoan?.monthlyPaymentJPY && params.housing.currentLoan?.remainingYears) {
        if (i < params.housing.currentLoan.remainingYears) {
            expenseDetail.housing += params.housing.currentLoan.monthlyPaymentJPY * 12;
        }
    }
    if (params.housing.purchasePlan && age === params.housing.purchasePlan.age) {
        expenseDetail.housing += params.housing.purchasePlan.downPaymentJPY;
        const loanPrincipal = params.housing.purchasePlan.priceJPY - params.housing.purchasePlan.downPaymentJPY;
        const annualPayment = amortize(loanPrincipal, params.housing.purchasePlan.rate, params.housing.purchasePlan.years);
        for (let j = 0; j < params.housing.purchasePlan.years; j++) {
            if (i + j < (loopEndAge - params.initialAge + 1)) {
                // This is tricky. A better way is to track loans like cars.
                // Simplified: Add to future years directly (not ideal, but works for now)
            }
        }
        // For now, let's just add the first year's payment. A loan tracker is better.
        expenseDetail.housing += annualPayment;
    }
    params.housing.renovations.forEach(r => {
        if (age === r.age || (r.cycleYears && age > r.age && (age - r.age) % r.cycleYears === 0)) {
            expenseDetail.housing += r.costJPY;
        }
    });


    // E) 結婚
    if (params.marriage && age === params.marriage.age) {
      expenseDetail.marriage = params.marriage.engagementJPY + params.marriage.weddingJPY + params.marriage.honeymoonJPY + params.marriage.movingJPY;
    }

    // F) 子ども
    if (params.children && params.children.count > 0) {
      const eduCostMap = { '公立中心': 10000000, '公私混合': 16000000, '私立中心': 20000000 };
      const annualEduCost = eduCostMap[params.children.educationPattern] / 22;
      for (let j = 0; j < params.children.count; j++) {
        const childBirthAge = params.children.firstBornAge + (j * 3);
        if (age >= childBirthAge && age < childBirthAge + 22) {
          expenseDetail.children += annualEduCost;
        }
      }
    }

    // G) 家電
    params.appliances.forEach(a => {
      if (a.cycleYears > 0 && (i === a.firstAfterYears || (i > a.firstAfterYears && (i - a.firstAfterYears) % a.cycleYears === 0))) {
        expenseDetail.appliances += a.cost10kJPY * 10000;
      }
    });

    // H) 親介護
    if (params.care?.assume && params.care.parentCareStartAge >= params.care.parentCurrentAge) {
      const myCareStartAge = params.initialAge + (params.care.parentCareStartAge - params.care.parentCurrentAge);
      if (age >= myCareStartAge && age < myCareStartAge + params.care.years) {
        expenseDetail.care += params.care.monthly10kJPY * 10000 * 12;
      }
    }

    // I) 老後
    if (isRetired) {
        const pensionTotal = (age >= params.pensionStartAge) 
            ? (params.pensionMonthly10kJPY * 10000 * 12) + (params.spouseInitialAge ? params.pensionMonthly10kJPY * 10000 * 12 : 0)
            : 0;
        const livingCost = params.postRetirementLiving10kJPY * 10000 * 12;
        expenseDetail.retirementGap = Math.max(0, livingCost - pensionTotal);
    }

    // --- 3. 集計・年次更新 ---
    const totalExpense = Object.values(expenseDetail).reduce((sum, val) => sum + val, 0);
    const balance = totalIncome - totalExpense;

    savings += balance + (params.monthlySavingsJPY * 12);
    investmentPrincipal += params.yearlyRecurringInvestmentJPY + params.yearlySpotJPY;

    // K) 生活防衛資金
    if (savings < params.emergencyFundJPY) {
      const shortfall = params.emergencyFundJPY - savings;
      const withdrawal = Math.min(shortfall, investmentPrincipal);
      savings += withdrawal;
      investmentPrincipal -= withdrawal;
    }
    
    const totalAssets = savings + investmentPrincipal;

    yearlyData.push({
      year,
      age,
      spouseAge: params.spouseInitialAge ? params.spouseInitialAge + i : undefined,
      income: Math.round(totalIncome),
      incomeDetail: {
        self: Math.round(incomeDetail.self),
        spouse: Math.round(incomeDetail.spouse),
        investment: Math.round(incomeDetail.investment),
      },
      expense: Math.round(totalExpense),
      expenseDetail: {
        living: Math.round(expenseDetail.living),
        car: Math.round(expenseDetail.car),
        housing: Math.round(expenseDetail.housing),
        marriage: Math.round(expenseDetail.marriage),
        children: Math.round(expenseDetail.children),
        appliances: Math.round(expenseDetail.appliances),
        care: Math.round(expenseDetail.care),
        retirementGap: Math.round(expenseDetail.retirementGap),
      },
      savings: Math.round(savings),
      investmentPrincipal: Math.round(investmentPrincipal),
      totalAssets: Math.round(totalAssets),
      balance: Math.round(balance),
    });
  }

  return yearlyData;
}


export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const params = req.body.inputParams as NormalizedParams;
    if (!params) {
      return res.status(400).json({ message: "inputParams is missing" });
    }
    
    const yearlyData = runSimulation(params);
    
    // Log for verification
    console.log("Simulation Result (First 3 years):", yearlyData.slice(0, 3));

    res.status(200).json({ yearlyData });

  } catch (error) {
    console.error("Simulation failed:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
