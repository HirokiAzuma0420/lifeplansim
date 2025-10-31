﻿// Local minimal types to avoid '@vercel/node' runtime/type dependency
type VercelRequest = { method?: string; body?: unknown; query?: Record<string, unknown> };
type VercelResponse = { status: (code: number) => { json: (data: unknown) => void } };

// 商品別投資の詳細（任意）
type InvestmentProduct = {
  key: 'stocks' | 'trust' | 'bonds' | 'crypto' | 'other' | 'ideco';
  account: '課税' | '非課税' | 'iDeCo';
  currentJPY: number;
  recurringJPY: number; // 年間つみたて額（円/年）
  spotJPY: number;      // 年間スポット（円/年）
  expectedReturn: number; // 小数（例: 0.05）
};

interface CarePlan {
  id: string | number;
  parentCurrentAge: number;
  parentCareStartAge: number;
  years: number;
  monthly10kJPY: number;
}

const SPECIFIC_ACCOUNT_TAX_RATE = 0.20315;
const NISA_CONTRIBUTION_CAP = 18_000_000; // 生涯上限（新NISAの成長投資枠+つみたて枠の合計目安として扱う）
// 年間上限（新NISA）
// const NISA_RECURRING_ANNUAL_CAP = 1_200_000; // つみたて投資枠（年）
// const NISA_SPOT_ANNUAL_CAP = 2_400_000;     // 成長投資枠（年）

interface InputParams {
  initialAge: number;
  spouseInitialAge?: number;
  endAge: number;
  retirementAge: number;
  spouseRetirementAge?: number;
  pensionStartAge: number;

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
      remainingMonths?: number;
      remainingYears?: number;
    };
  };

  housing: {
    type: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）';
    rentMonthlyJPY?: number;
    currentLoan?: {
      monthlyPaymentJPY: number;
      remainingYears: number;
    };
    purchasePlan?: {
      age: number;
      priceJPY: number;
      downPaymentJPY: number;
      years: number;
      rate: number;
    };
    renovations?: {
      age: number;
      costJPY: number;
      cycleYears?: number;
    }[];
  };

  marriage?: {
    age: number;
    engagementJPY: number;
    weddingJPY: number;
    honeymoonJPY: number;
    movingJPY: number;
    spouse: {
      ageAtMarriage: number;
      incomeGross: number;
    };
    newLivingCostAnnual: number;
    newHousingCostAnnual: number;
  };

  children?: {
    count: number;
    firstBornAge: number;
    educationPattern: '公立中心' | '公私混合' | '私立中心';
  };

  appliances?: {
    name: string;
    cycleYears: number;
    firstAfterYears: number;
    cost10kJPY: number;
  }[];

  cares?: CarePlan[];

  postRetirementLiving10kJPY: number;
  pensionMonthly10kJPY: number;
  spousePensionStartAge?: number;
  spousePensionMonthly10kJPY?: number;

  currentSavingsJPY: number;
  monthlySavingsJPY: number;

  products?: InvestmentProduct[];
  stressTest: {
    enabled: boolean;
    seed?: number;
  };

  interestScenario: '固定利回り' | 'ランダム変動';
  fixedInterestRate?: number;
  emergencyFundJPY: number;
}

interface AccountBucket {
  principal: number;
  balance: number;
}

interface YearlyData {
  year: number;
  age: number;
  income: number;
  totalExpense: number;
  livingExpense: number;
  housingExpense: number;
  carExpense: number;
  applianceExpense: number;
  childExpense: number;
  marriageExpense: number;
  careExpense: number;
  retirementExpense: number;
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
  products: Record<string, AccountBucket>;
}

// ユーティリティ関数
const n = (v: unknown): number => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

// ローン返済額計算関数 (年額)
const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
  if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
    return 0;
  }
  const monthlyInterestRate = annualInterestRate / 12;
  const totalMonths = years * 12;
  if (monthlyInterestRate === 0) {
    return principal / years;
  }
  const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
  return monthlyPayment * 12;
};

// 額面収入から手取り収入を計算する関数
function computeNetAnnual(grossAnnualIncome: number): number {
  const income = n(grossAnnualIncome);
  let salaryIncomeDeduction: number;
  if (income <= 1625000) { salaryIncomeDeduction = 550000; }
  else if (income <= 1800000) { salaryIncomeDeduction = income * 0.4 - 100000; }
  else if (income <= 3600000) { salaryIncomeDeduction = income * 0.3 + 80000; }
  else if (income <= 6600000) { salaryIncomeDeduction = income * 0.2 + 440000; }
  else if (income <= 8500000) { salaryIncomeDeduction = income * 0.1 + 1100000; }
  else { salaryIncomeDeduction = 1950000; }
  const socialInsurancePremium = income * 0.15;
  const basicDeduction = 480000;
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);
  let incomeTax: number;
  if (taxableIncome <= 1950000) { incomeTax = taxableIncome * 0.05; }
  else if (taxableIncome <= 3300000) { incomeTax = taxableIncome * 0.1 - 97500; }
  else if (taxableIncome <= 6950000) { incomeTax = taxableIncome * 0.2 - 427500; }
  else if (taxableIncome <= 9000000) { incomeTax = taxableIncome * 0.23 - 636000; }
  else if (taxableIncome <= 18000000) { incomeTax = taxableIncome * 0.33 - 1536000; }
  else if (taxableIncome <= 40000000) { incomeTax = taxableIncome * 0.4 - 2796000; }
  else { incomeTax = taxableIncome * 0.45 - 4796000; }
  const residentTax = taxableIncome * 0.1 + 5000;
  const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;
  return Math.max(0, netAnnualIncome);
}

// Helper function to generate normally distributed random numbers (Box-Muller transform)
function boxMullerTransform(): [number, number] {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const R = Math.sqrt(-2.0 * Math.log(u));
  const theta = 2.0 * Math.PI * v;
  return [R * Math.cos(theta), R * Math.sin(theta)];
}

function generateNormalRandom(mean: number, stdDev: number): number {
  // We generate two numbers, but only use one. Could be optimized to cache the second.
  const [z0] = boxMullerTransform();
  return z0 * stdDev + mean;
}

/**
 * Generates a series of annual returns for a given number of years, ensuring the arithmetic mean of the series matches the target.
 * @param averageReturn The expected average geometric mean return (e.g., 0.05 for 5%).
 * @param volatility The volatility (standard deviation) of the return (e.g., 0.15 for 15%).
 * @param years The number of years to generate returns for.
 * @returns An array of annual returns, corrected to match the target mean.
 */
function generateReturnSeries(
  averageReturn: number,
  volatility: number,
  years: number
): number[] {
  if (years <= 0) return [];

  // 1. 目標とする算術平均を定義 (幾何平均からの変換は行わず、入力値をそのまま目標算術平均とする)
  const targetArithmeticMean = averageReturn; // 幾何平均からの変換は行わず、入力値をそのまま目標算術平均とします

  // 2. ひとまずランダムなリターン系列を生成
  const returns: number[] = [];
  for (let i = 0; i < years; i++) {
    const yearReturn = generateNormalRandom(targetArithmeticMean, volatility);
    returns.push(yearReturn);
  }

  // 3. 暴落イベントをランダムに挿入
  const crashYears = new Set<number>();
  // 最初の暴落は3-5年後に設定
  let nextCrashYear = Math.floor(Math.random() * 3) + 3;
  while (nextCrashYear < years) {
    crashYears.add(nextCrashYear);
    // 次の暴落は8-10年後に設定
    nextCrashYear += Math.floor(Math.random() * 3) + 8;
  }

  crashYears.forEach(yearIndex => {
    // -30% から -60% の下落をランダムに生成
    const crashMagnitude = -(Math.random() * 0.3 + 0.3);
    returns[yearIndex] = crashMagnitude;
  });

  // 4. 暴落を含む系列全体の平均が目標値になるように補正
  const nonCrashYearIndices = returns.map((_, i) => i).filter(i => !crashYears.has(i));
  const sumOfCrashReturns = Array.from(crashYears).reduce((sum, i) => sum + returns[i], 0);
  const sumOfNonCrashReturns = nonCrashYearIndices.reduce((sum, i) => sum + returns[i], 0);

  const currentTotalSum = sumOfCrashReturns + sumOfNonCrashReturns;
  const targetTotalSum = targetArithmeticMean * years;
  const correction = (targetTotalSum - currentTotalSum) / nonCrashYearIndices.length;

  const correctedReturns = returns.map((r, i) => {
    return nonCrashYearIndices.includes(i) ? r + correction : r;
  });

  return correctedReturns;
}

function runMonteCarloSimulation(params: InputParams, numberOfSimulations: number): YearlyData[] {
  const allSimulations: YearlyData[][] = [];

  // 1. runSimulationを100回実行
  for (let i = 0; i < numberOfSimulations; i++) {
    // 毎回異なるリターン系列を生成するために、シードを少し変更する
    // stressTestが有効でない場合でも、この関数が呼ばれたら有効にする
    const simParams: InputParams = {
      ...params,
      stressTest: {
        ...params.stressTest,
        enabled: true, // モンテカルロでは常にランダム変動を有効にする
        seed: (params.stressTest?.seed ?? Date.now()) + i,
      },
    };
    allSimulations.push(runSimulation(simParams));
  }

  if (allSimulations.length === 0) return [];

  // 2. 平均値を計算
  const firstSimulation = allSimulations[0];
  const numYears = firstSimulation.length;
  const averageYearlyData: YearlyData[] = [];

  for (let i = 0; i < numYears; i++) {
    // 最初のシミュレーション結果をベースに、各年の静的なデータをコピー
    const yearDataTemplate = { ...firstSimulation[i] };

    // 平均化するキーを定義
    const keysToAverage: (keyof YearlyData)[] = ['income', 'totalExpense', 'savings', 'totalAssets'];
    const bucketKeys: (keyof AccountBucket)[] = ['principal', 'balance'];

    const averagedYearData: YearlyData = { ...yearDataTemplate };

    // 各数値プロパティの平均を計算
    for (const key of keysToAverage) {
      const sum = allSimulations.reduce((acc, sim) => acc + (n(sim[i][key])), 0);
      (averagedYearData[key] as number) = sum / numberOfSimulations;
    }

    // 各口座の principal と balance の平均を計算
    for (const account of ['nisa', 'ideco', 'taxable'] as const) {
      for (const key of bucketKeys) {
        const sum = allSimulations.reduce((acc, sim) => acc + (n(sim[i][account]?.[key])), 0);
        averagedYearData[account][key] = sum / numberOfSimulations;
      }
    }

    // assetAllocation も平均化
    const assetAllocationSum = { cash: 0, investment: 0, nisa: 0, ideco: 0 };
    for (const sim of allSimulations) {
      assetAllocationSum.cash += n(sim[i].assetAllocation.cash);
      assetAllocationSum.investment += n(sim[i].assetAllocation.investment);
      assetAllocationSum.nisa += n(sim[i].assetAllocation.nisa);
      assetAllocationSum.ideco += n(sim[i].assetAllocation.ideco);
    }
    averagedYearData.assetAllocation.cash = assetAllocationSum.cash / numberOfSimulations;
    averagedYearData.assetAllocation.investment = assetAllocationSum.investment / numberOfSimulations;
    averagedYearData.assetAllocation.nisa = assetAllocationSum.nisa / numberOfSimulations;
    averagedYearData.assetAllocation.ideco = assetAllocationSum.ideco / numberOfSimulations;

    // 商品別残高(products)も平均化
    const productKeys = Object.keys(firstSimulation[i].products);
    const averagedProducts: Record<string, AccountBucket> = {};
    for (const productId of productKeys) {
      const principalSum = allSimulations.reduce((acc, sim) => acc + n(sim[i].products[productId]?.principal), 0);
      const balanceSum = allSimulations.reduce((acc, sim) => acc + n(sim[i].products[productId]?.balance), 0);
      averagedProducts[productId] = {
        principal: principalSum / numberOfSimulations,
        balance: balanceSum / numberOfSimulations,
      };
    }
    averagedYearData.products = averagedProducts;

    averageYearlyData.push(averagedYearData);
  }

  return averageYearlyData;
}

function isInputParamsBody(x: unknown): x is { inputParams: InputParams } {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (!('inputParams' in r)) return false;
  const ip = (r as { inputParams: unknown }).inputParams;
  if (!ip || typeof ip !== 'object') return false;
  const m = ip as Record<string, unknown>;
  return 'initialAge' in m && 'endAge' in m && 'retirementAge' in m;
}

// --- 教育費用の年齢別重み付けテーブル ---
const EDUCATION_COST_TABLE = {
  '公立中心': { // 総額約1,000万円
    '0-6': 22,   // 22万円/年
    '7-12': 33,  // 33万円/年
    '13-15': 44, // 44万円/年
    '16-18': 55, // 55万円/年
    '19-22': 88, // 88万円/年
  },
  '公私混合': { // 総額約1,600万円
    '0-6': 35,
    '7-12': 53,
    '13-15': 70,
    '16-18': 88,
    '19-22': 141,
  },
  '私立中心': { // 総額約2,000万円
    '0-6': 44,
    '7-12': 66,
    '13-15': 88,
    '16-18': 110,
    '19-22': 176,
  },
};

function getAnnualChildCost(age: number, pattern: '公立中心' | '公私混合' | '私立中心'): number {
  const costTable = EDUCATION_COST_TABLE[pattern];
  let costInManYen = 0;

  if (age >= 0 && age <= 6) costInManYen = costTable['0-6'];
  else if (age >= 7 && age <= 12) costInManYen = costTable['7-12'];
  else if (age >= 13 && age <= 15) costInManYen = costTable['13-15'];
  else if (age >= 16 && age <= 18) costInManYen = costTable['16-18'];
  else if (age >= 19 && age <= 22) costInManYen = costTable['19-22'];

  return costInManYen * 10000; // 円に変換して返す
}


function runSimulation(params: InputParams): YearlyData[] {

  // --- シミュレーション準備 ---
  const yearlyData: YearlyData[] = [];
  let currentAge = params.initialAge;
  const now = new Date();
  const baseYear = now.getFullYear();
  const startMonth = now.getMonth(); // 0-indexed (0-11)
  const firstYearRemainingMonths = 12 - startMonth;
  let productList: InvestmentProduct[] = Array.isArray(params.products) ? params.products : [];
  const simulationYears = params.endAge - params.initialAge + 1;

  // --- 資産とリターンの初期化 ---
  let savings = n(params.currentSavingsJPY);
  const productBalances: Record<string, AccountBucket> = {};
  productList.forEach((p, index) => {
    const productId = `${p.key}-${index}`;
    const current = n(p.currentJPY);
    productBalances[productId] = { principal: current, balance: current };
  });

  let cumulativeNisaContribution = productList
    .filter(p => p.account === '非課税')
    .reduce((sum, p) => sum + n(p.currentJPY), 0);

  const idecoCashOutAge = Math.min(params.retirementAge, 75);

  // --- リターン系列の事前生成 ---
  const stressTestEnabled = params.stressTest?.enabled ?? false;
  const VOLATILITY_MAP: Record<InvestmentProduct['key'], number> = {
    stocks: 0.20, trust: 0.18, bonds: 0.05, crypto: 0.80, ideco: 0.18, other: 0.10,
  };
  const productReturnSeries = new Map<string, number[]>();
  if (params.interestScenario === '固定利回り' && params.fixedInterestRate != null) {
    // 固定利回りの場合、全商品の期待リターンを上書き
    productList = productList.map(p => ({
      ...p,
      expectedReturn: params.fixedInterestRate as number,
    }));
  } else if (params.interestScenario === 'ランダム変動' || stressTestEnabled) {
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const volatility = VOLATILITY_MAP[p.key] ?? 0.15;
      const series = generateReturnSeries(n(p.expectedReturn), volatility, simulationYears);
      productReturnSeries.set(productId, series);
    });
  }

  // --- ループで変化する状態変数 ---
  let carCurrentLoanMonthsRemaining = Math.max(0, n(params.car?.currentLoan?.remainingMonths));
  const appliancesOnly = Array.isArray(params.appliances) ? params.appliances.filter(a => a && String(a.name ?? '').trim().length > 0 && Number(a.cost10kJPY) > 0 && Number(a.cycleYears) > 0) : [];

  // --- シミュレーションループ ---
  // ループ内で変更される状態変数
  let currentLivingExpense = params.expenseMode === 'simple' ? n(params.livingCostSimpleAnnual) : (n(params.detailedFixedAnnual) + n(params.detailedVariableAnnual));
  let currentHousingExpense = params.housing?.type === '賃貸' ? (n(params.housing.rentMonthlyJPY) * 12) : 0;

  for (let i = 0; currentAge <= params.endAge; i++, currentAge++) {
    const year = baseYear + i;
    const yearFraction = (i === 0) ? firstYearRemainingMonths / 12 : 1;
    const spouseCurrentAge = params.spouseInitialAge ? params.initialAge + i + (params.spouseInitialAge - params.initialAge) : undefined;

    // --- 0. iDeCo現金化 (イベント) ---
    // 収支計算の前に処理し、その年の現金を増やしておく
    if (currentAge === idecoCashOutAge) {
      let idecoTotalBalance = 0;
      productList.forEach((p, index) => {
        if (p.account === 'iDeCo') {
          const productId = `${p.key}-${index}`;
          idecoTotalBalance += productBalances[productId]?.balance ?? 0;
          productBalances[productId] = { principal: 0, balance: 0 };
        }
      });
      savings += idecoTotalBalance;
    }

    // --- 結婚イベント ---
    if (params.marriage && currentAge === n(params.marriage.age)) {
      // 配偶者情報を更新
      params.spouseInitialAge = params.marriage.spouse.ageAtMarriage;
      params.spouseMainJobIncomeGross = params.marriage.spouse.incomeGross;
      // 生活費・住居費を更新
      currentLivingExpense = params.marriage.newLivingCostAnnual;
      currentHousingExpense = params.marriage.newHousingCostAnnual;
    }

    // --- 1. 収支計算 (Cash Flow) ---
    // 1a. 収入
    let selfGrossIncome = 0;
    if (currentAge < params.retirementAge) {
      selfGrossIncome = (n(params.mainJobIncomeGross) * Math.pow(1 + n(params.incomeGrowthRate), i) + n(params.sideJobIncomeGross));
    }

    let spouseGrossIncome = 0;
    // 結婚後は spouseCurrentAge が定義される
    if (spouseCurrentAge !== undefined && spouseCurrentAge < n(params.spouseRetirementAge)) {
      spouseGrossIncome = ((n(params.spouseMainJobIncomeGross) ?? 0) * Math.pow(1 + (n(params.spouseIncomeGrowthRate) ?? 0), i) + (n(params.spouseSideJobIncomeGross) ?? 0));
    }
    let pensionAnnual = currentAge >= params.pensionStartAge ? n(params.pensionMonthly10kJPY) * 10000 * 12 : 0;
    if (spouseCurrentAge !== undefined && spouseCurrentAge >= n(params.spousePensionStartAge)) {
      pensionAnnual += n(params.spousePensionMonthly10kJPY) * 10000 * 12;
    }
    let idecoDeductionThisYear = 0;
    if (currentAge < idecoCashOutAge) {
      productList.filter(p => p.account === 'iDeCo').forEach(p => {
        idecoDeductionThisYear += (n(p.recurringJPY) + n(p.spotJPY)) * yearFraction;
      });
    }
    const annualIncome = (computeNetAnnual(selfGrossIncome - idecoDeductionThisYear) + computeNetAnnual(spouseGrossIncome)) * yearFraction + pensionAnnual;

    // 1b. 支出
    let livingExpense = 0;
    let retirementExpense = 0;
    if (currentAge >= params.retirementAge) {
      retirementExpense = n(params.postRetirementLiving10kJPY) * 10000 * 12 * yearFraction;
    } else {
      livingExpense = currentLivingExpense * yearFraction;
    }
    let childExpense = 0;
    if (params.children) {
      const { count, firstBornAge, educationPattern } = params.children;
      if (educationPattern === '公立中心' || educationPattern === '公私混合' || educationPattern === '私立中心') {
        for (let j = 0; j < n(count); j++) {
          const childBirthYearInSim = n(firstBornAge) - params.initialAge + j * 3;
          const childAge = i - childBirthYearInSim;
          if (childAge >= 0 && childAge <= 22) {
            childExpense += getAnnualChildCost(childAge, educationPattern) * yearFraction;
          }
        }
      }
    }
    let careExpense = 0;
    if (Array.isArray(params.cares)) {
      params.cares.forEach(plan => {
        const parentAge = n(plan.parentCurrentAge) + i;
        const careStartAge = n(plan.parentCareStartAge);
        if (parentAge >= careStartAge && parentAge < careStartAge + n(plan.years)) {
          careExpense += n(plan.monthly10kJPY) * 10000 * 12 * yearFraction;
        }
      });
    }
    let marriageExpense = 0;
    if (params.marriage && currentAge === n(params.marriage.age)) {
      marriageExpense = (n(params.marriage.engagementJPY) + n(params.marriage.weddingJPY) + n(params.marriage.honeymoonJPY) + n(params.marriage.movingJPY)) * yearFraction;
    }
    let applianceExpense = 0;
    for (const a of appliancesOnly) {
      const firstAge = params.initialAge + n(a.firstAfterYears);
      if (currentAge >= firstAge) {
        const diff = currentAge - firstAge;
        const cycle = n(a.cycleYears);
        if (diff === 0 || (cycle > 0 && diff % cycle === 0)) {
          applianceExpense += n(a.cost10kJPY) * 10000;
        }
      }
    }
    let carExpense = 0;
    if (params.car) {
      let carRecurring = 0;
      let carOneOff = 0;
      if (carCurrentLoanMonthsRemaining > 0) {
        const monthsThisYear = (i === 0) ? Math.min(firstYearRemainingMonths, carCurrentLoanMonthsRemaining) : Math.min(12, carCurrentLoanMonthsRemaining);
        carRecurring += n(params.car.currentLoan?.monthlyPaymentJPY) * monthsThisYear;
        carCurrentLoanMonthsRemaining -= monthsThisYear;
      }
      if (n(params.car.priceJPY) > 0 && n(params.car.firstAfterYears) >= 0 && n(params.car.frequencyYears) > 0) {
        const base = params.initialAge + n(params.car.firstAfterYears);
        if (currentAge >= base) {
          const yearsSinceFirst = currentAge - base;
          const cycle = n(params.car.frequencyYears);
          if (cycle > 0 && yearsSinceFirst % cycle === 0) {
            if (params.car.loan.use) {
              const loanYears = n(params.car.loan.years);
              if (loanYears > 0) {
                let annualRate = 0.025;
                if (params.car.loan.type === '銀行ローン') annualRate = 0.015;
                else if (params.car.loan.type === 'ディーラーローン') annualRate = 0.045;
                const annualPayment = calculateLoanPayment(n(params.car.priceJPY), annualRate, loanYears);
                carRecurring += annualPayment * yearFraction;
              }
            } else {
              carOneOff += n(params.car.priceJPY);
            }
          }
        }
      }
      carExpense = carRecurring + carOneOff;
    }
    let housingExpense = 0;
    if (params.housing) {
      if (params.housing.type === '賃貸' && currentHousingExpense > 0) {
        const willBuyHouse = !!params.housing.purchasePlan;
        const purchaseAge = params.housing.purchasePlan?.age ?? Infinity;
        if (!willBuyHouse || currentAge < purchaseAge) {
          housingExpense += currentHousingExpense * yearFraction;
        }
      }
      if (params.housing.type === '持ち家（ローン中）' && params.housing.currentLoan && currentAge < params.initialAge + n(params.housing.currentLoan.remainingYears)) {
        housingExpense += n(params.housing.currentLoan.monthlyPaymentJPY) * 12 * yearFraction;
      }
      if (params.housing.purchasePlan && currentAge >= n(params.housing.purchasePlan.age)) {
        if (currentAge === n(params.housing.purchasePlan.age)) {
          housingExpense += n(params.housing.purchasePlan.downPaymentJPY);
        }
        if (currentAge < n(params.housing.purchasePlan.age) + n(params.housing.purchasePlan.years)) {
          const loanPrincipal = n(params.housing.purchasePlan.priceJPY) - n(params.housing.purchasePlan.downPaymentJPY);
          housingExpense += calculateLoanPayment(loanPrincipal, n(params.housing.purchasePlan.rate), n(params.housing.purchasePlan.years)) * yearFraction;
        }
      }
      if (params.housing.renovations) {
        for (const renovation of params.housing.renovations) {
          if (currentAge >= n(renovation.age)) {
            const diff = currentAge - n(renovation.age);
            if (diff === 0 || (n(renovation.cycleYears) > 0 && diff % n(renovation.cycleYears) === 0)) {
              housingExpense += n(renovation.costJPY);
            }
          }
        }
      }
    }
    const totalExpense = livingExpense + retirementExpense + childExpense + careExpense + marriageExpense + applianceExpense + carExpense + housingExpense;

    // 1c. 現金残高の更新
    const cashFlow = annualIncome - totalExpense;
    savings += cashFlow;

    // --- 2. 資産の取り崩し (赤字補填) ---
    // 生活防衛資金を下回った場合に、投資資産を売却して現金を補填する
    if (savings < n(params.emergencyFundJPY)) {
      let shortfall = n(params.emergencyFundJPY) - savings;
      const withdrawalOrder: ('課税' | '非課税')[] = ['課税', '非課税'];

      for (const accountType of withdrawalOrder) {
        if (shortfall <= 0) break;

        const productsInAccount = productList.filter(p => p.account === accountType);
        if (productsInAccount.length === 0) continue;

        let totalBalanceInAccount = 0;
        productsInAccount.forEach(p => {
          const originalIndex = productList.indexOf(p);
          const productId = `${p.key}-${originalIndex}`;
          totalBalanceInAccount += productBalances[productId]?.balance ?? 0;
        });

        if (totalBalanceInAccount <= 0) continue;

        const totalWithdrawalAmount = Math.min(totalBalanceInAccount, shortfall); // ここでは税金を考慮せず、必要額をそのまま引き出す
        let netProceeds = totalWithdrawalAmount;

        // 課税口座の場合、売却益に課税
        if (accountType === '課税') {
            let totalPrincipalInAccount = 0;
            productsInAccount.forEach(p => {
                const originalIndex = productList.indexOf(p);
                const productId = `${p.key}-${originalIndex}`;
                totalPrincipalInAccount += productBalances[productId]?.principal ?? 0;
            });
            const gains = Math.max(0, totalBalanceInAccount - totalPrincipalInAccount);
            const gainsRatio = totalBalanceInAccount > 0 ? gains / totalBalanceInAccount : 0;
            const taxOnWithdrawal = totalWithdrawalAmount * gainsRatio * SPECIFIC_ACCOUNT_TAX_RATE;
            netProceeds = totalWithdrawalAmount - taxOnWithdrawal;
        }

        // 各商品から按分して取り崩す
        productsInAccount.forEach(p => {
          const originalIndex = productList.indexOf(p);
          const productId = `${p.key}-${originalIndex}`;
          const productBucket = productBalances[productId];
          if (!productBucket || totalBalanceInAccount <= 0 || productBucket.balance <= 0) return;

          const proportion = productBucket.balance / totalBalanceInAccount;
          const withdrawalAmount = totalWithdrawalAmount * proportion;
          const principalRatio = productBucket.balance > 0 ? productBucket.principal / productBucket.balance : 1;
          
          productBucket.principal -= withdrawalAmount * principalRatio;
          productBucket.balance -= withdrawalAmount;
        });

        savings += netProceeds;
        shortfall -= netProceeds;
      }
    }

    // --- 3. 投資の実行 (黒字の場合) ---
    let totalInvestmentOutflow = 0;
    const canInvest = currentAge < params.retirementAge;
    if (canInvest) { // 退職するまでは投資を継続
      // 投資原資 = (現金残高 - 生活防衛資金)の余剰分
      const investableAmount = Math.max(0, savings - n(params.emergencyFundJPY));
      let investedThisYear = 0;
      let remainingNisaAllowance = Math.max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution);

      for (const p of productList) {
        if (investedThisYear >= investableAmount) break;

        const productId = `${p.key}-${productList.indexOf(p)}`;
        const contribution = (n(p.recurringJPY) + n(p.spotJPY)) * yearFraction;
        const actualContribution = Math.min(contribution, investableAmount - investedThisYear);

        if (actualContribution <= 0) continue;

        let investmentApplied = 0;
        if (p.account === '非課税' && remainingNisaAllowance > 0) {
          const nisaAllowed = Math.min(actualContribution, remainingNisaAllowance);
          productBalances[productId].principal += nisaAllowed;
          productBalances[productId].balance += nisaAllowed;
          cumulativeNisaContribution += nisaAllowed;
          remainingNisaAllowance -= nisaAllowed;
          investmentApplied = nisaAllowed;
        } else if (p.account === '課税') { // NISA枠がない、または課税口座指定の場合
          productBalances[productId].principal += actualContribution;
          productBalances[productId].balance += actualContribution;
          investmentApplied = actualContribution;
        } else if (p.account === 'iDeCo' && currentAge < 60) { // iDeCoは60歳まで
          productBalances[productId].principal += actualContribution;
          productBalances[productId].balance += actualContribution;
          investmentApplied = actualContribution;
        }
        investedThisYear += investmentApplied;
      }
      savings -= investedThisYear;
      totalInvestmentOutflow = investedThisYear;
    }

    // --- 4. 資産の成長 (利回り反映) ---
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
      if (productBucket.balance <= 0) return;

      let yearlyReturn = 0;
      if (params.interestScenario === 'ランダム変動' || stressTestEnabled) {
        yearlyReturn = productReturnSeries.get(productId)?.[i] ?? n(p.expectedReturn); // ランダム変動
      } else { // 固定利回り
        yearlyReturn = n(p.expectedReturn);
      }
      productBucket.balance *= ((1 + yearlyReturn) ** yearFraction);
    });

    // --- 5. 年間データの集計と記録 ---
    const nisa = { principal: 0, balance: 0 };
    const ideco = { principal: 0, balance: 0 };
    const taxable = { principal: 0, balance: 0 };
    const productsForYear: Record<string, AccountBucket> = {};

    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
      const roundedBucket = {
        principal: Math.round(productBucket.principal),
        balance: Math.round(productBucket.balance),
      };
      productsForYear[productId] = roundedBucket;

      if (p.account === '非課税') {
        nisa.principal += productBucket.principal;
        nisa.balance += productBucket.balance;
      } else if (p.account === 'iDeCo') {
        ideco.principal += productBucket.principal;
        ideco.balance += productBucket.balance;
      } else { // 課税
        taxable.principal += productBucket.principal;
        taxable.balance += productBucket.balance;
      }
    });

    const totalAssets = savings + nisa.balance + ideco.balance + taxable.balance;

    yearlyData.push({
      year,
      age: currentAge,
      income: Math.round(annualIncome),
      totalExpense: Math.round(totalExpense),
      livingExpense: Math.round(livingExpense),
      housingExpense: Math.round(housingExpense),
      carExpense: Math.round(carExpense),
      applianceExpense: Math.round(applianceExpense),
      childExpense: Math.round(childExpense),
      marriageExpense: Math.round(marriageExpense),
      careExpense: Math.round(careExpense),
      retirementExpense: Math.round(retirementExpense),
      savings: Math.round(savings),
      totalInvestment: Math.round(totalInvestmentOutflow),
      cashFlow: Math.round(cashFlow),
      nisa: { principal: Math.round(nisa.principal), balance: Math.round(nisa.balance) },
      ideco: { principal: Math.round(ideco.principal), balance: Math.round(ideco.balance) },
      taxable: { principal: Math.round(taxable.principal), balance: Math.round(taxable.balance) },
      totalAssets: Math.round(totalAssets),
      assetAllocation: {
        cash: Math.round(savings),
        investment: Math.round(taxable.balance),
        nisa: Math.round(nisa.balance),
        ideco: Math.round(ideco.balance),
      },
      products: productsForYear,
    });
  }

  return yearlyData;
}

export default async function(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let rawBody: unknown = req.body;
  try {
    if (typeof rawBody === 'string') {
      rawBody = JSON.parse(rawBody);
    }
  } catch {
    return res.status(400).json({ message: 'invalid JSON body' });
  }

  if (!isInputParamsBody(rawBody)) {
    return res.status(400).json({ message: 'invalid body: expected { inputParams }' });
  }
  const params = rawBody.inputParams;

  let resultData: YearlyData[];

  if (params.interestScenario === '固定利回り') {
    resultData = runSimulation(params);
  } else {
    resultData = runMonteCarloSimulation(params, 100);
  }

  res.status(200).json({ yearlyData: resultData });
}
