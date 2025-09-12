import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      type?: '銀行ローン' | 'チE��ーラーローン';
    };
  };

  housing: {
    type: '賁E��' | '持ち家�E�ローン中�E�E | '持ち家�E�完済！E;
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
    educationPattern: '公立中忁E | '公私混吁E | '私立中忁E;
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

  currentInvestmentsJPY: number;
  yearlyRecurringInvestmentJPY: number;
  yearlySpotJPY: number;
  expectedReturn: number;
  stressTest: {
    enabled: boolean;
    seed?: number;
  };

  interestScenario: '固定利回り' | 'ランダム変動';
  emergencyFundJPY: number;
}

interface YearlyData {
  age: number;
  year: number;
  income: number;
  livingExpense: number;
  housingExpense: number;
  carExpense: number;
  applianceExpense: number;
  childExpense: number;
  marriageExpense: number;
  careExpense: number;
  medicalExpense: number;
  longTermCareExpense: number;
  retirementExpense: number;
  totalExpense: number;
  savings: number;
  nisa: number;
  ideco: number;
  totalAssets: number;
  investedPrincipal: number;
  assetAllocation: {
    cash: number;
    nisa: number;
    ideco: number;
  };
}

// ユーチE��リチE��関数
// シード付きPRNG�E�Eulberry32�E�Efunction mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 標準正規！Eox-Muller�E�Efunction gaussian(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ベクトル標準化�E�平坁E・標準偏差1
function standardize(xs: number[]): number[] {
  const n = xs.length;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  const s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1;
  return xs.map(z => (z - m) / s);
}

const n = (v: unknown): number => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

// 賁E��リスクプリセチE��と賁E��キー配�Eを定義、Econst ASSET_SIGMA: Record<string, number> = {
  equity_jp_us: 0.20,
  fund_foreign: 0.18,
  ideco_foreign: 0.18,
  bond_dev: 0.04,
  btc: 0.70,
};
const ASSETS = Object.keys(ASSET_SIGMA); // 等ウェイチE
// ローン返済額計算関数 (年顁E
const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
  if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
    return 0;
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12; // 百刁E��を小数に変換し、月利に
  const totalMonths = years * 12;

  if (monthlyInterestRate === 0) {
    return principal / years; // 金利0の場合�E允E��を年数で割めE  }

  const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
  return monthlyPayment * 12; // 年額を返す
};

// 額面収�Eから手取り収入を計算する関数
function computeNetAnnual(grossAnnualIncome: number): number {
  const income = n(grossAnnualIncome);

  // 給与所得控除 (令咁E年以陁E
  let salaryIncomeDeduction: number;
  if (income <= 1625000) {
    salaryIncomeDeduction = 550000;
  } else if (income <= 1800000) {
    salaryIncomeDeduction = income * 0.4 - 100000;
  } else if (income <= 3600000) {
    salaryIncomeDeduction = income * 0.3 + 80000;
  } else if (income <= 6600000) {
    salaryIncomeDeduction = income * 0.2 + 440000;
  } else if (income <= 8500000) {
    salaryIncomeDeduction = income * 0.1 + 1100000;
  } else {
    salaryIncomeDeduction = 1950000;
  }

  // 社会保険斁E(健康保険、厚生年金、E��用保険) - 簡略化�Eため一征E5%とする
  const socialInsurancePremium = income * 0.15;

  // 基礎控除 (令咁E年以陁E
  const basicDeduction = 480000;

  // 課税所征E  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

  // 所得稁E  let incomeTax: number;
  if (taxableIncome <= 1950000) {
    incomeTax = taxableIncome * 0.05;
  } else if (taxableIncome <= 3300000) {
    incomeTax = taxableIncome * 0.1 - 97500;
  } else if (taxableIncome <= 6950000) {
    incomeTax = taxableIncome * 0.2 - 427500;
  } else if (taxableIncome <= 9000000) {
    incomeTax = taxableIncome * 0.23 - 636000;
  } else if (taxableIncome <= 18000000) {
    incomeTax = taxableIncome * 0.33 - 1536000;
  } else if (taxableIncome <= 40000000) {
    incomeTax = taxableIncome * 0.4 - 2796000;
  } else {
    incomeTax = taxableIncome * 0.45 - 4796000;
  }

  // 住民稁E(坁E��割5,000冁E+ 所得割10%) - 簡略匁E  const residentTax = taxableIncome * 0.1 + 5000;

  // 手取り収入 = 額面収�E - 社会保険斁E- 所得稁E- 住民稁E  const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

  return Math.max(0, netAnnualIncome);
}

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body: { inputParams: InputParams } = req.body;
    const {
      initialAge,
      
      endAge,
      retirementAge,
      pensionStartAge,
      mainJobIncomeGross,
      sideJobIncomeGross,
      spouseMainJobIncomeGross,
      spouseSideJobIncomeGross,
      incomeGrowthRate,
      spouseIncomeGrowthRate,
      expenseMode,
      livingCostSimpleAnnual,
      detailedFixedAnnual,
      detailedVariableAnnual,
      car,
      housing,
      marriage,
      children,
      appliances,
      care,
      postRetirementLiving10kJPY,
      pensionMonthly10kJPY,
      currentSavingsJPY,
      monthlySavingsJPY,
      currentInvestmentsJPY,
      yearlyRecurringInvestmentJPY,
      yearlySpotJPY,
      expectedReturn,
      interestScenario,
      emergencyFundJPY,
    } = body.inputParams;

    const stressTestEnabled = interestScenario === 'ランダム変動';

    const mu = Math.max(-1, Math.min(1, n(expectedReturn))); // 小数, 侁E.04
    const scenario = interestScenario || '固定利回り';
    const stEnabled = stressTestEnabled; // stressTestEnabled は既に定義済み
    const seedBase = n(body.inputParams.stressTest?.seed) || 123456789; // body.inputParams.stressTest?.seed を使用

    const yearlyData: YearlyData[] = [];

    let currentAge = initialAge;
    let savings = currentSavingsJPY;
    const nisa = 0; // NISAは今回はシミュレーション対象夁E    const ideco = 0; // iDeCoは今回はシミュレーション対象夁E    const currentInvestmentsJPY_corrected = n(currentInvestmentsJPY) * 10000; // 丁E�Eを�Eに変換
    let investedPrincipal = currentInvestmentsJPY_corrected; // 初期允E��

    // 家電の正規化�E�受信直後！E    const appliancesOnly = Array.isArray(appliances) ? appliances.filter(a =>
      a && String(a.name ?? '').trim().length > 0 &&
      Number(a.cost10kJPY) > 0 &&
      Number(a.cycleYears) > 0
    ) : [];

    const baseYear = new Date().getFullYear();
    const T = (endAge - initialAge) + 1; // ループ回数に合わせる
    const assetReturns: Record<string, number[]> = {};
    ASSETS.forEach((k, idx) => {
      const rand = mulberry32(seedBase + idx * 101);
      const zs = Array.from({ length: T }, () => gaussian(rand));
      const zstd = standardize(zs); // 平坁E, 刁E��1に補正�E�ここが「収束」�E鍵�E�E      const sigma = ASSET_SIGMA[k];
      const ra = zstd.map(z => {
        let r = mu + sigma * z;
        // 任愁E 過度な外れ値抑制�E�±3ρE��E        const lo = mu - 3 * sigma, hi = mu + 3 * sigma;
        if (r < lo) r = lo;
        if (r > hi) r = hi;
        return r;
      });
      assetReturns[k] = ra;
    });

    for (let i = 0; currentAge <= endAge; i++) {
      const year = baseYear + i;
      let annualIncome = 0;
      let livingExpense = 0;
      let housingExpense = 0;
      let carExpense = 0;
      let childExpense = 0;
      let marriageExpense = 0;
      let careExpense = 0;
      let retirementExpense = 0;

      // 1. 収�E計箁E      let selfGrossIncome = mainJobIncomeGross * Math.pow(1 + incomeGrowthRate, i) + sideJobIncomeGross;
      let spouseGrossIncome = (spouseMainJobIncomeGross ?? 0) * Math.pow(1 + (spouseIncomeGrowthRate ?? 0), i) + (spouseSideJobIncomeGross ?? 0);

      // 退職年齢以降�E収�E調整
      if (currentAge >= retirementAge) {
        selfGrossIncome = 0;
        spouseGrossIncome = 0;
      }

      annualIncome = computeNetAnnual(selfGrossIncome) + computeNetAnnual(spouseGrossIncome);

      // 2. 支出計箁E      if (expenseMode === 'simple') {
        livingExpense = livingCostSimpleAnnual ?? 0;
      } else {
        livingExpense = (detailedFixedAnnual ?? 0) + (detailedVariableAnnual ?? 0);
      }

      // 2a. 老後費用 (65歳以降�E生活費と年金�E差顁E
      if (currentAge >= retirementAge) {
        livingExpense = 0; // 退職年齢以降�ElivingExpenseめEにする
        const postRetirementLivingAnnual = postRetirementLiving10kJPY * 10000 * 12;
        const pensionAnnual = (currentAge >= pensionStartAge ? pensionMonthly10kJPY * 10000 * 12 : 0);
        retirementExpense = Math.max(0, postRetirementLivingAnnual - pensionAnnual);
      }

      // 2b. 子供費用
      if (children) {
        for (let c = 0; c < children.count; c++) {
          const childBirthAge = children.firstBornAge + c * 3; // 3年おきに生まれると仮宁E          const childAge = currentAge - childBirthAge;

          if (childAge >= 0 && childAge <= 21) {
            let educationCost = 0;
            switch (children.educationPattern) {
              case '公立中忁E: educationCost = 10000000 / 22; break;
              case '公私混吁E: educationCost = 16000000 / 22; break;
              case '私立中忁E: educationCost = 20000000 / 22; break;
            }
            childExpense += educationCost;
          }
        }
      }

      // 2c. 介護費用
      if (care?.assume && care.parentCurrentAge && care.parentCareStartAge && care.years && care.monthly10kJPY) {
        const parentAge = care.parentCurrentAge + i;
        if (parentAge >= care.parentCareStartAge && parentAge < care.parentCareStartAge + care.years) {
          careExpense = care.monthly10kJPY * 10000 * 12;
        }
      }

      // 2d. 結婚費用
      if (marriage && currentAge === marriage.age) {
        marriageExpense = marriage.engagementJPY + marriage.weddingJPY + marriage.honeymoonJPY + marriage.movingJPY;
      }

      // 2e. 家電費用
      let applianceExpense = 0;
      for (const a of appliancesOnly) {
        const firstAge = initialAge + Number(a.firstAfterYears ?? 0);
        if (currentAge >= firstAge) {
          const diff = currentAge - firstAge;
          const cyc = Number(a.cycleYears);
          if (diff === 0 || (cyc > 0 && diff % cyc === 0)) {
            applianceExpense += Number(a.cost10kJPY) * 10000;
          }
        }
      }

      // 2f. 車費用
      if (car.priceJPY > 0 && car.firstAfterYears >= 0 && car.frequencyYears > 0) {
        const base = initialAge + car.firstAfterYears;
        const yearsSinceFirst = currentAge - base;

        if (yearsSinceFirst >= 0) {
          for (let k = 0; k <= Math.floor(yearsSinceFirst / car.frequencyYears); k++) {
            const eventAge = base + k * car.frequencyYears;

            if (car.loan.use) {
              let annualRatePercent = 2.5;
              if (car.loan.type === '銀行ローン') annualRatePercent = 1.5;
              else if (car.loan.type === 'チE��ーラーローン') annualRatePercent = 4.5;

              const annualPay = calculateLoanPayment(car.priceJPY, annualRatePercent, car.loan.years ?? 0);
              if (currentAge >= eventAge && currentAge < eventAge + (car.loan.years ?? 0)) {
                carExpense += annualPay;
              }
            } else {
              if (currentAge === eventAge) {
                carExpense += car.priceJPY;
              }
            }
          }
        }
      }

      // 2g. 住まぁE��用
      if (housing.type === '持ち家�E�ローン中�E�E && housing.currentLoan?.monthlyPaymentJPY && housing.currentLoan?.remainingYears) {
        // ループ開始年を起点に「残存年数」だけ計丁E        if (i < housing.currentLoan.remainingYears) {
          housingExpense += housing.currentLoan.monthlyPaymentJPY * 12;
        }
      }
      if (housing.purchasePlan && currentAge >= housing.purchasePlan.age && currentAge < housing.purchasePlan.age + housing.purchasePlan.years) {
        if (currentAge === housing.purchasePlan.age) {
          housingExpense += housing.purchasePlan.downPaymentJPY; // 頭金一括
        }
        const loanPrincipal = housing.purchasePlan.priceJPY - housing.purchasePlan.downPaymentJPY;
        housingExpense += calculateLoanPayment(loanPrincipal, housing.purchasePlan.rate, housing.purchasePlan.years);
      }
      if (housing.renovations) {
        for (const renovation of housing.renovations) {
          const renovationAge = renovation.age;
          if (currentAge >= renovationAge) {
            const diff = currentAge - renovationAge;
            if (diff === 0 || (renovation.cycleYears && renovation.cycleYears > 0 && diff % renovation.cycleYears === 0)) {
              housingExpense += renovation.costJPY;
            }
          }
        }
      }

      // 詳細モード時の二重計上防止
      if (expenseMode === 'detailed') {
        carExpense = 0;
        housingExpense = 0;
        applianceExpense = 0;
        childExpense = 0;
      }

      // 吁E��費用の合訁E      const totalExpense =
        livingExpense +
        childExpense +
        careExpense +
        carExpense +
        housingExpense +
        marriageExpense +
        applianceExpense +
        retirementExpense;

      // ■ Investment logic
    const isRandom = (scenario === 'ランダム変動' && stEnabled);
    let currentReturn = mu;
    if (isRandom) {
      const w = 1 / ASSETS.length;
      currentReturn = ASSETS.reduce((acc, k) => acc + w * assetReturns[k][i], 0);
    }

    // 1. Calculate investment return on the principal *before* this year's contribution.
    const investmentReturn = investedPrincipal * currentReturn;
    annualIncome += investmentReturn;

    // 2. Add this year's contribution to the principal.
    const annualInvestment = yearlyRecurringInvestmentJPY + yearlySpotJPY;
    investedPrincipal += annualInvestment;

    // ■ Cash flow calculation
    // 3. Update cash flow, deducting the investment amount from savings.
    const cashFlow = annualIncome - totalExpense - annualInvestment + (monthlySavingsJPY * 12);
    savings += cashFlow;

      // 生活防衛賁E��の補填
      if (emergencyFundJPY > 0 && savings < emergencyFundJPY) {
        const shortfall = emergencyFundJPY - savings;
        const draw = Math.min(shortfall, investedPrincipal); // 允E��から取り崩ぁE        investedPrincipal -= draw;
        savings += draw;
      }

      // 賁E��配�E (今回は現金、NISA、iDeCoのみ)
      const totalAssets = savings + nisa + ideco + investedPrincipal;

      yearlyData.push({
        age: currentAge,
        year: year,
        income: Math.round(annualIncome),
        livingExpense: Math.round(livingExpense),
        housingExpense: Math.round(housingExpense),
        carExpense: Math.round(carExpense),
        applianceExpense: Math.round(applianceExpense),
        childExpense: Math.round(childExpense),
        marriageExpense: Math.round(marriageExpense),
        careExpense: Math.round(careExpense),
        medicalExpense: 0, // 今回は計算対象夁E        longTermCareExpense: 0, // 今回は計算対象夁E        retirementExpense: Math.round(retirementExpense),
        totalExpense: Math.round(totalExpense),
        savings: Math.round(savings),
        nisa: Math.round(nisa),
        ideco: Math.round(ideco),
        totalAssets: Math.round(totalAssets),
        investedPrincipal: Math.round(investedPrincipal),
        assetAllocation: {
          cash: Math.round(savings),
          nisa: Math.round(nisa),
          ideco: Math.round(ideco),
        },
      });

      const __applianceDebug = { year: year, age: currentAge, count: appliancesOnly.length, applianceExpense };
      console.debug('appliance-check', __applianceDebug);

      currentAge++;
      
    }

    res.status(200).json({ yearlyData });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

