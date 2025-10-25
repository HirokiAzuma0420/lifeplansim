// Local minimal types to avoid '@vercel/node' runtime/type dependency
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

const SPECIFIC_ACCOUNT_TAX_RATE = 0.20315;
const NISA_CONTRIBUTION_CAP = 18_000_000; // 生涯上限（新NISAの成長投資枠+つみたて枠の合計目安として扱う）
// 年間上限（新NISA）
const NISA_RECURRING_ANNUAL_CAP = 1_200_000; // つみたて投資枠（年）
const NISA_SPOT_ANNUAL_CAP = 2_400_000;     // 成長投資枠（年）

interface InputParams {
  initialAge: number;
  spouseInitialAge?: number;
  endAge: number;
  retirementAge: number;
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

  care?: {
    assume: boolean;
    parentCurrentAge?: number;
    parentCareStartAge?: number;
    years?: number;
    monthly10kJPY?: number;
  };

  postRetirementLiving10kJPY: number;
  pensionMonthly10kJPY: number;

  currentSavingsJPY: number;
  monthlySavingsJPY: number;

  products?: InvestmentProduct[];
  stressTest: {
    enabled: boolean;
    seed?: number;
  };

  interestScenario: '固定利回り' | 'ランダム変動';
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
  products?: Record<string, number>;
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

  // 1. 目標とする算術平均を計算 (幾何平均からの変換)
  const targetArithmeticMean = averageReturn + (volatility ** 2) / 2;

  // 2. ひとまずランダムなリターン系列を生成
  const returns: number[] = [];
  for (let i = 0; i < years; i++) {
    // 平均0の乱数を生成し、後でシフトする方が数値的に安定することがあるが、ここでは直接生成する
    const yearReturn = generateNormalRandom(targetArithmeticMean, volatility);
    returns.push(yearReturn);
  }

  // 3. 生成された系列の実績の算術平均を計算
  const actualMean = returns.reduce((sum, val) => sum + val, 0) / years;

  // 4. 目標平均と実績平均の差分を計算
  const correction = targetArithmeticMean - actualMean;

  // 5. 各リターン値に差分を加えて補正する
  const correctedReturns = returns.map(r => r + correction);

  return correctedReturns;
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

export default async function (req: VercelRequest, res: VercelResponse) {
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

  // --- シミュレーション準備 ---
  const yearlyData: YearlyData[] = [];
  let currentAge = params.initialAge;
  const baseYear = new Date().getFullYear();
  const productList: InvestmentProduct[] = Array.isArray(params.products) ? params.products : [];

  // ストレステスト用のリターン系列を事前に生成
  const stressTestEnabled = params.stressTest?.enabled ?? false;
  const simulationYears = params.endAge - params.initialAge + 1;
  const VOLATILITY = 0.15; // 固定のボラティリティ

  const productReturnSeries = new Map<string, number[]>();
  if (stressTestEnabled) {
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const series = generateReturnSeries(n(p.expectedReturn), VOLATILITY, simulationYears);
      productReturnSeries.set(productId, series);
    });
  }


  // --- 資産の初期化 ---
  let savings = n(params.currentSavingsJPY);
  const nisa: AccountBucket = { principal: 0, balance: 0 };
  const ideco: AccountBucket = { principal: 0, balance: 0 };
  const taxable: AccountBucket = { principal: 0, balance: 0 };

  // 商品別の残高を管理する新しいデータ構造
  const productBalances: Record<string, AccountBucket> = {};

  // 現在の資産を各バケットに振り分け
  productList.forEach((p, index) => {
    const productId = `${p.key}-${index}`; // 商品を一位に識別するID
    const current = n(p.currentJPY);

    // 新しいデータ構造を初期化
    productBalances[productId] = { principal: current, balance: current };
  });

  let cumulativeNisaContribution = nisa.principal;
  const idecoCashOutAge = Math.min(params.retirementAge, 75);

  // ループ外で状態を保持する変数
  let carCurrentLoanMonthsRemaining = Math.max(0, n(params.car?.currentLoan?.remainingMonths));
  const appliancesOnly = Array.isArray(params.appliances) ? params.appliances.filter(a => a && String(a.name ?? '').trim().length > 0 && Number(a.cost10kJPY) > 0 && Number(a.cycleYears) > 0) : [];

  // --- ループ開始 ---
  for (let i = 0; currentAge <= params.endAge; i++, currentAge++) {
    const year = baseYear + i;

    // --- 1. 収入計算 ---
    let selfGrossIncome = 0;
    let spouseGrossIncome = 0;
    if (currentAge < params.retirementAge) {
      selfGrossIncome = n(params.mainJobIncomeGross) * Math.pow(1 + n(params.incomeGrowthRate), i) + n(params.sideJobIncomeGross);
      spouseGrossIncome = (n(params.spouseMainJobIncomeGross) ?? 0) * Math.pow(1 + (n(params.spouseIncomeGrowthRate) ?? 0), i) + (n(params.spouseSideJobIncomeGross) ?? 0);
    }

    let idecoDeductionThisYear = 0;
    if (currentAge < idecoCashOutAge) {
      productList.filter(p => p.account === 'iDeCo').forEach(p => {
        idecoDeductionThisYear += n(p.recurringJPY) + n(p.spotJPY);
      });
    }
    const annualIncome = computeNetAnnual(selfGrossIncome - idecoDeductionThisYear) + computeNetAnnual(spouseGrossIncome);

    // --- 2. 支出計算 ---
    let livingExpense = 0;
    let retirementExpense = 0;
    if (currentAge >= params.retirementAge) {
      const postRetirementLivingAnnual = n(params.postRetirementLiving10kJPY) * 10000 * 12;
      const pensionAnnual = (currentAge >= params.pensionStartAge ? n(params.pensionMonthly10kJPY) * 10000 * 12 : 0);
      retirementExpense = Math.max(0, postRetirementLivingAnnual - pensionAnnual);
    } else {
      livingExpense = params.expenseMode === 'simple' ? n(params.livingCostSimpleAnnual) : (n(params.detailedFixedAnnual) + n(params.detailedVariableAnnual));
    }

    let childExpense = 0;
    if (params.children) {
      for (let c = 0; c < n(params.children.count); c++) {
        const childBirthAge = n(params.children.firstBornAge) + c * 3;
        const childAge = currentAge - childBirthAge;
        if (childAge >= 0 && childAge <= 21) {
          let educationCost = 0;
          switch (params.children.educationPattern) {
            case '公立中心': educationCost = 10000000 / 22; break;
            case '公私混合': educationCost = 16000000 / 22; break;
            case '私立中心': educationCost = 20000000 / 22; break;
          }
          childExpense += educationCost;
        }
      }
    }

    let careExpense = 0;
    if (params.care?.assume) {
      const parentAge = n(params.care.parentCurrentAge) + i;
      if (parentAge >= n(params.care.parentCareStartAge) && parentAge < n(params.care.parentCareStartAge) + n(params.care.years)) {
        careExpense = n(params.care.monthly10kJPY) * 10000 * 12;
      }
    }

    let marriageExpense = 0;
    if (params.marriage && currentAge === n(params.marriage.age)) {
      marriageExpense = n(params.marriage.engagementJPY) + n(params.marriage.weddingJPY) + n(params.marriage.honeymoonJPY) + n(params.marriage.movingJPY);
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
        const monthsThisYear = Math.min(12, carCurrentLoanMonthsRemaining);
        carRecurring += n(params.car.currentLoan?.monthlyPaymentJPY) * monthsThisYear;
        carCurrentLoanMonthsRemaining -= monthsThisYear;
      }
      if (n(params.car.priceJPY) > 0 && n(params.car.firstAfterYears) >= 0 && n(params.car.frequencyYears) > 0) {
        const base = params.initialAge + n(params.car.firstAfterYears);
        if (currentAge >= base) {
            const yearsSinceFirst = currentAge - base;
            if (yearsSinceFirst % n(params.car.frequencyYears) === 0) {
                if (params.car.loan.use) {
                    // This logic is complex, assuming loan payments start in the year of purchase
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
      if (params.housing.type === '賃貸' && params.housing.rentMonthlyJPY) {
        const willBuyHouse = !!params.housing.purchasePlan;
        const purchaseAge = params.housing.purchasePlan?.age ?? Infinity;
        if (!willBuyHouse || currentAge < purchaseAge) {
          housingExpense += n(params.housing.rentMonthlyJPY) * 12;
        }
      }
      if (params.housing.type === '持ち家（ローン中）' && params.housing.currentLoan) {
        if (i < n(params.housing.currentLoan.remainingYears)) {
          housingExpense += n(params.housing.currentLoan.monthlyPaymentJPY) * 12;
        }
      }
      if (params.housing.purchasePlan && currentAge >= n(params.housing.purchasePlan.age)) {
          if (currentAge === n(params.housing.purchasePlan.age)) {
              housingExpense += n(params.housing.purchasePlan.downPaymentJPY);
          }
          if (currentAge < n(params.housing.purchasePlan.age) + n(params.housing.purchasePlan.years)) {
              const loanPrincipal = n(params.housing.purchasePlan.priceJPY) - n(params.housing.purchasePlan.downPaymentJPY);
              housingExpense += calculateLoanPayment(loanPrincipal, n(params.housing.purchasePlan.rate), n(params.housing.purchasePlan.years));
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

    // --- 3. 投資の計算 (拠出と成長) ---
    let totalInvestmentOutflow = 0;
    if (currentAge < params.retirementAge) {
      let remainingNisaAllowance = Math.max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution);

      productList.forEach((p, index) => {
        const productId = `${p.key}-${index}`;
        const recur = n(p.recurringJPY);
        const spot = n(p.spotJPY);
        const contribution = recur + spot;

        if (p.account === '非課税') {
          const allowed = Math.min(contribution, remainingNisaAllowance);
          productBalances[productId].principal += allowed;
          productBalances[productId].balance += allowed;

          cumulativeNisaContribution += allowed;
          totalInvestmentOutflow += allowed;
        } else if (p.account === 'iDeCo' && currentAge < idecoCashOutAge) {
          productBalances[productId].principal += contribution;
          productBalances[productId].balance += contribution;

          totalInvestmentOutflow += contribution;
        } else if (p.account === '課税') {
          productBalances[productId].principal += contribution;
          productBalances[productId].balance += contribution;

          totalInvestmentOutflow += contribution;
        }
      });
    }

    // 資産の成長（商品ごと）
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
      if (productBucket.balance <= 0) return;

      let yearlyReturn = 0;
      if (stressTestEnabled) {
        yearlyReturn = productReturnSeries.get(productId)![i];
      } else {
        yearlyReturn = n(p.expectedReturn);
      }
      
      productBucket.balance *= (1 + yearlyReturn);
    });

    // 商品別残高を口座別残高に集計
    nisa.principal = 0; nisa.balance = 0;
    ideco.principal = 0; ideco.balance = 0;
    taxable.principal = 0; taxable.balance = 0;
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
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

    // --- 4. キャッシュフローと資産の変動 ---
    const annualSavings = currentAge < params.retirementAge ? (n(params.monthlySavingsJPY) * 12) : 0;
    const cashFlow = annualIncome - totalExpense - totalInvestmentOutflow + annualSavings;
    savings += cashFlow;

    // iDeCoの現金化 (60-75歳)
    if (currentAge === idecoCashOutAge) {
      savings += ideco.balance;
      ideco.principal = 0;
      ideco.balance = 0;
    }

    // 生活防衛資金の補填ロジック
    if (savings < n(params.emergencyFundJPY)) {
      let shortfall = n(params.emergencyFundJPY) - savings;

      // 1. 課税口座から引き出し
      if (shortfall > 0 && taxable.balance > 0) {
        const gains = taxable.balance - taxable.principal;
        const gainsRatio = gains > 0 ? gains / taxable.balance : 0;
        
        let grossWithdrawal = shortfall;
        if (gainsRatio > 0) {
          // 税金を考慮して、手取りがshortfallになるようにグロス額を計算
          grossWithdrawal = shortfall / (1 - gainsRatio * SPECIFIC_ACCOUNT_TAX_RATE);
        }

        const actualWithdrawal = Math.min(taxable.balance, grossWithdrawal);
        const netProceeds = actualWithdrawal * (1 - gainsRatio * SPECIFIC_ACCOUNT_TAX_RATE);

        savings += netProceeds;
        taxable.balance -= actualWithdrawal;
        taxable.principal -= actualWithdrawal * (1 - gainsRatio);
        shortfall -= netProceeds;
      }

      // 2. NISA口座から引き出し
      if (shortfall > 0 && nisa.balance > 0) {
        const withdrawal = Math.min(nisa.balance, shortfall);
        savings += withdrawal;
        const principalRatio = nisa.principal / nisa.balance;
        nisa.balance -= withdrawal;
        nisa.principal -= withdrawal * principalRatio;
        shortfall -= withdrawal;
      }
    }

    // --- 5. 年間データの記録 ---
    const totalAssets = savings + nisa.balance + ideco.balance + taxable.balance;
    yearlyData.push({
      year,
      age: currentAge,
      income: Math.round(annualIncome),
      totalExpense: Math.round(totalExpense),
      savings: Math.round(savings),
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
      // products: productBalances, // TODO: 商品別残高も更新する
    });
  }

  res.status(200).json({ yearlyData });
}



