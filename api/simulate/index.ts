import type { VercelRequest, VercelResponse } from '@vercel/node';

type InvestmentTaxation = {
  nisa: {
    currentHoldingsJPY: number;
    annualRecurringContributionJPY: number;
    annualSpotContributionJPY: number;
  };
  taxable: {
    currentHoldingsJPY: number;
    annualRecurringContributionJPY: number;
    annualSpotContributionJPY: number;
  };
};

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

  currentInvestmentsJPY: number;
  yearlyRecurringInvestmentJPY: number;
  yearlySpotJPY: number;
  expectedReturn: number;
  investmentTaxation?: InvestmentTaxation;
  // 追加: 金融商品ごとの詳細（存在時は口座別集約ではなく商品別で計算）
  products?: InvestmentProduct[];
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
    investment: number;
    nisa: number;
    ideco: number;
  };
  // 追加: 商品別の年末残高（存在時のみ）
  products?: Record<string, number>;
}

// ユーティリティ関数
// シード付きPRNG（mulberry32）
function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 標準正規（Box-Muller）
function gaussian(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ベクトル標準化：平均0・標準偏差1
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

// 資産リスクプリセットと資産キー配列を定義。
const ASSET_SIGMA: Record<string, number> = {
  equity_jp_us: 0.20,
  fund_foreign: 0.18,
  ideco_foreign: 0.18,
  bond_dev: 0.04,
  btc: 0.70,
};
const ASSETS = Object.keys(ASSET_SIGMA); // 等ウェイト

// ローン返済額計算関数 (年額)
const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
  if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
    return 0;
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12; // 百分率を小数に変換し、月利に
  const totalMonths = years * 12;

  if (monthlyInterestRate === 0) {
    return principal / years; // 金利0の場合は元本を年数で割る
  }

  const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
  return monthlyPayment * 12; // 年額を返す
};

// 額面収入から手取り収入を計算する関数
function computeNetAnnual(grossAnnualIncome: number): number {
  const income = n(grossAnnualIncome);

  // 給与所得控除 (令和2年以降)
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

  // 社会保険料 (健康保険、厚生年金、雇用保険) - 簡略化のため一律15%とする.
  const socialInsurancePremium = income * 0.15;

  // 基礎控除 (令和2年以降)
  const basicDeduction = 480000;

  // 課税所得
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

  // 所得税
  let incomeTax: number;
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

  // 住民税 (均等割5,000円 + 所得割10%) - 簡略化
  const residentTax = taxableIncome * 0.1 + 5000;

  // 手取り収入 = 額面収入 - 社会保険料 - 所得税 - 住民税
  const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

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
      investmentTaxation,
      interestScenario,
      emergencyFundJPY,
    } = body.inputParams;

    // ラベル正規化（UIとAPI内部の表記揺れ対策）
    if (car?.loan) {
      type LoanType = InputParams['car']['loan']['type'];
      const dealerOld = 'ディーラーローン' as LoanType;
      const dealerNew = 'ディーラーローン' as LoanType;
      if (car.loan.type === dealerNew) {
        (car as InputParams['car']).loan.type = dealerOld;
      }
    }
    if (children) {
      type Edu = NonNullable<InputParams['children']>['educationPattern'];
      const map: Record<string, Edu> = {
        '公立中心': '公立中心' as unknown as Edu,
        '公私混合': '公私混合' as unknown as Edu,
        '私立中心': '私立中心' as unknown as Edu,
      };
      const epStr = (children.educationPattern as unknown as string);
      const mapped = map[epStr];
      if (mapped) {
        (children as NonNullable<InputParams['children']>).educationPattern = mapped;
      }
    }

    const stressTestEnabled = body.inputParams.stressTest?.enabled ?? (interestScenario === 'ランダム変動');

    const mu = Math.max(-1, Math.min(1, n(expectedReturn))); // 小数, 例0.04
    const scenario = interestScenario || '固定利回り';
    const stEnabled = stressTestEnabled; // stressTestEnabled は既に定義済み
    const seedBase = n(body.inputParams.stressTest?.seed) || 123456789; // body.inputParams.stressTest?.seed を使用

    // 入力検証
    if (!Number.isFinite(initialAge) || !Number.isFinite(endAge) || endAge < initialAge) {
      return res.status(400).json({ message: 'invalid age range' });
    }

    const yearlyData: YearlyData[] = [];
    const carCurrentLoanMonthly = n(car?.currentLoan?.monthlyPaymentJPY ?? 0);
    let carCurrentLoanMonthsRemaining = Math.max(
      0,
      Math.floor(
        n(
          car?.currentLoan?.remainingMonths ??
          ((car?.currentLoan?.remainingYears ?? 0) * 12)
        ),
      ),
    );

    let currentAge = initialAge;
    let savings = currentSavingsJPY;
    let nisa = n(investmentTaxation?.nisa?.currentHoldingsJPY ?? 0);
    let cumulativeNisaContribution = Math.max(0, n(investmentTaxation?.nisa?.currentHoldingsJPY ?? 0));
    let ideco = 0; // iDeCoは今回はシミュレーション対象外（後続でproductsがあれば上書き）
    const fallbackCurrentInvestmentsJPY = n(currentInvestmentsJPY);
    const fallbackTaxableCurrent = fallbackCurrentInvestmentsJPY - nisa;
    let investedPrincipal = n(investmentTaxation?.taxable?.currentHoldingsJPY ?? fallbackTaxableCurrent);
    if (investedPrincipal < 0) {
      investedPrincipal = 0;
    }

    const fallbackRecurring = n(yearlyRecurringInvestmentJPY);
    const fallbackSpot = n(yearlySpotJPY);
    const baseAnnualNisaRecurring = n(investmentTaxation?.nisa?.annualRecurringContributionJPY ?? 0);
    const baseAnnualNisaSpot = n(investmentTaxation?.nisa?.annualSpotContributionJPY ?? 0);
    let baseAnnualTaxableRecurring = n(investmentTaxation?.taxable?.annualRecurringContributionJPY ?? (fallbackRecurring - baseAnnualNisaRecurring));
    let baseAnnualTaxableSpot = n(investmentTaxation?.taxable?.annualSpotContributionJPY ?? (fallbackSpot - baseAnnualNisaSpot));
    if (baseAnnualTaxableRecurring < 0) baseAnnualTaxableRecurring = 0;
    if (baseAnnualTaxableSpot < 0) baseAnnualTaxableSpot = 0;

    // Optional: 商品別詳細が来ていればこちらを優先
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const productList: InvestmentProduct[] = Array.isArray((body as any).inputParams?.products)
      ? ((body as any).inputParams.products as any[]).map((p) => ({
          key: (p.key ?? 'other') as InvestmentProduct['key'],
          account: (p.account ?? '課税') as InvestmentProduct['account'],
          currentJPY: n(p.currentJPY),
          recurringJPY: n(p.recurringJPY),
          spotJPY: n(p.spotJPY),
          expectedReturn: Math.max(-1, Math.min(1, Number(p.expectedReturn ?? mu))),
        }))
      : [];
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const useProducts = productList.length > 0;
    const productBalances: Record<string, number> = {};
    if (useProducts) {
      for (const p of productList) {
        if (p.account === 'iDeCo') {
          ideco += Math.max(0, p.currentJPY);
        } else if (p.account === '非課税') {
          nisa += Math.max(0, p.currentJPY);
          cumulativeNisaContribution += Math.max(0, p.currentJPY);
        } else {
          productBalances[p.key] = Math.max(0, p.currentJPY);
        }
      }
    }

    // 家電の正規化: 受信直後のみフィルタリング
    const appliancesOnly = Array.isArray(appliances) ? appliances.filter(a =>
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
      const zstd = standardize(zs); // 平均0, 分散1に補正（ここが「収束」の鍵）
      const sigma = ASSET_SIGMA[k];
      const ra = zstd.map(z => {
        let r = mu + sigma * z;
        // 任意: 過度な外れ値抑制（±3σ）
        const lo = mu - 3 * sigma, hi = mu + 3 * sigma;
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
      let childExpense = 0;
      let marriageExpense = 0;
      let careExpense = 0;
      let retirementExpense = 0;

      // 1. 収入計算
      let selfGrossIncome = mainJobIncomeGross * Math.pow(1 + incomeGrowthRate, i) + sideJobIncomeGross;
      let spouseGrossIncome = (spouseMainJobIncomeGross ?? 0) * Math.pow(1 + (spouseIncomeGrowthRate ?? 0), i) + (spouseSideJobIncomeGross ?? 0);

      // 退職年齢以降の収入調整
      if (currentAge >= retirementAge) {
        selfGrossIncome = 0;
        spouseGrossIncome = 0;
      }

      // 車費用の合算（恒常+一時）
      // carExpense is derived after computing carRecurring/carOneOff below

      // iDeCo拠出は所得控除：productsモード時のみ厳密適用
      let idecoDeductionThisYear = 0;
      if (useProducts && currentAge < retirementAge) {
        for (const p of productList) {
          if (p.account === 'iDeCo') {
            idecoDeductionThisYear += Math.max(0, p.recurringJPY + p.spotJPY);
          }
        }
      }
      const taxableSelf = Math.max(0, selfGrossIncome - idecoDeductionThisYear);
      const taxableSpouse = Math.max(0, spouseGrossIncome);
      annualIncome = computeNetAnnual(taxableSelf) + computeNetAnnual(taxableSpouse);

      // 2. 支出計算
      if (expenseMode === 'simple') {
        livingExpense = livingCostSimpleAnnual ?? 0;
      } else {
        livingExpense = (detailedFixedAnnual ?? 0) + (detailedVariableAnnual ?? 0);
      }

      // 2a. 老後費用 (65歳以降の生活費と年金の差額)
      if (currentAge >= retirementAge) {
        livingExpense = 0; // 退職年齢以降はlivingExpenseを0にする
        const postRetirementLivingAnnual = postRetirementLiving10kJPY * 10000 * 12;
        const pensionAnnual = (currentAge >= pensionStartAge ? pensionMonthly10kJPY * 10000 * 12 : 0);
        retirementExpense = Math.max(0, postRetirementLivingAnnual - pensionAnnual);
      }

      // 2b. 子供費用
      if (children) {
        for (let c = 0; c < children.count; c++) {
          const childBirthAge = children.firstBornAge + c * 3; // 3年おきに生まれると仮定
          const childAge = currentAge - childBirthAge;

          if (childAge >= 0 && childAge <= 21) {
            let educationCost = 0;
            switch (children.educationPattern) {
              case '公立中心': educationCost = 10000000 / 22; break;
              case '公私混合': educationCost = 16000000 / 22; break;
              case '私立中心': educationCost = 20000000 / 22; break;
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
      let carOneOff = 0;
      let carRecurring = 0;
      // 現在の車ローン返済（残回数ベース）
      if (carCurrentLoanMonthly > 0 && carCurrentLoanMonthsRemaining > 0) {
        const monthsThisYear = Math.min(12, carCurrentLoanMonthsRemaining);
        carRecurring += carCurrentLoanMonthly * monthsThisYear;
        carCurrentLoanMonthsRemaining -= monthsThisYear;
      }
      if (car.priceJPY > 0 && car.firstAfterYears >= 0 && car.frequencyYears > 0) {
        const base = initialAge + car.firstAfterYears;
        const yearsSinceFirst = currentAge - base;

        if (yearsSinceFirst >= 0) {
          for (let k = 0; k <= Math.floor(yearsSinceFirst / car.frequencyYears); k++) {
            const eventAge = base + k * car.frequencyYears;

            if (car.loan.use) {
              let annualRatePercent = 2.5;
              if (car.loan.type === '銀行ローン') annualRatePercent = 1.5;
              else if (car.loan.type === 'ディーラーローン') annualRatePercent = 4.5;

              const annualPay = calculateLoanPayment(car.priceJPY, annualRatePercent, car.loan.years ?? 0);
              if (currentAge >= eventAge && currentAge < eventAge + (car.loan.years ?? 0)) {
                carRecurring += annualPay;
              }
            } else {
              if (currentAge === eventAge) {
                carOneOff += car.priceJPY;
              }
            }
          }
        }
      }

      // 2g. 住まい費用
      if (housing.type === '持ち家（ローン中）' && housing.currentLoan?.monthlyPaymentJPY && housing.currentLoan?.remainingYears) {
        // ループ開始年を起点に「残存年数」だけ計上
        if (i < housing.currentLoan.remainingYears) {
          housingExpense += housing.currentLoan.monthlyPaymentJPY * 12;
        }
      }
      // 現在の住宅ローン（typeに依存せずcurrentLoanがあれば計上）
      if (housing.currentLoan?.monthlyPaymentJPY && housing.currentLoan?.remainingYears) {
        if (i < housing.currentLoan.remainingYears) {
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
      // 賃貸家賃（月次）: 購入期間や現ローンがない期間のみ加算（重複防止）
      {
        const purchasePlan = housing.purchasePlan;
        const __inPurchase = !!(purchasePlan && currentAge >= purchasePlan.age && currentAge < purchasePlan.age + purchasePlan.years);
        const __hasCurrentLoan = !!(housing.currentLoan?.monthlyPaymentJPY && i < (housing.currentLoan?.remainingYears ?? 0));
        const purchaseStarted = !!(purchasePlan && currentAge >= purchasePlan.age);
        if (!__inPurchase && !__hasCurrentLoan && !purchaseStarted && housing.rentMonthlyJPY) {
          housingExpense += housing.rentMonthlyJPY * 12;
        }
      }

      // 住居: 賃貸家賃（詳細モード時のみ加算）
      if (expenseMode === 'detailed' && housing.rentMonthlyJPY) {
        // housingExpense += ((housing as any).rentMonthlyJPY as number) * 12; // 統合ロジックへ移行
      }

      // 詳細モード時の二重計上防止
      if (expenseMode === 'detailed') {
        // 住居の恒常費は詳細生活費に含まれる想定。ここでは既存ロジック互換として住居費は除外
        // housingExpense = 0; // 詳細モードでも住まい費用は別集計として保持
        // 車は詳細固定費に含まれる想定だが、一時費用を残すには別集計が必要
        // 互換のため現状は車費用を除外（将来: 一時費用のみ残す）
        // carExpense = 0; // 詳細モードでも車費用は別集計として保持
        // 教育費は詳細固定費に含む想定
        // childExpense = 0; // 詳細モードでも教育費の扱いは別途検討
        // 家電は一時費用として残す
      }

      // 各種費用の合計
      const totalExpense =
        livingExpense +
        childExpense +
        careExpense +
        (carRecurring + carOneOff) +
        housingExpense +
        marriageExpense +
        applianceExpense +
        retirementExpense;

      // ■ Investment logic（複利・運用益は収入に計上しない）
      const isRandom = (scenario === 'ランダム変動' && stEnabled);
      let currentReturn = mu;
      if (isRandom) {
        const w = 1 / ASSETS.length;
        currentReturn = ASSETS.reduce((acc, k) => acc + w * assetReturns[k][i], 0);
      }

      let combinedContribution = 0;

      // 商品別モード：拠出とリターンを商品ごとに適用
      if (useProducts) {
        if (currentAge >= retirementAge) {
          // 退職以降は拠出停止、運用のみ
          for (const p of productList) {
            if (p.account === 'iDeCo') {
              ideco = ideco * (1 + p.expectedReturn);
            } else if (p.account === '非課税') {
              nisa = nisa * (1 + p.expectedReturn);
            } else {
              productBalances[p.key] = (productBalances[p.key] ?? 0) * (1 + p.expectedReturn);
            }
          }
        } else {
          // 現役期：拠出 + 運用
          let remainingNisaAllowance = Math.max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution);
          for (const p of productList) {
            const recur = Math.max(0, p.recurringJPY);
            const spot = Math.max(0, p.spotJPY);
            if (p.account === 'iDeCo') {
              const add = recur + spot;
              ideco = ideco * (1 + p.expectedReturn) + add;
              combinedContribution += add;
            } else if (p.account === '非課税') {
              const allowR = Math.max(0, Math.min(NISA_RECURRING_ANNUAL_CAP, remainingNisaAllowance));
              const usedR = Math.min(recur, allowR);
              remainingNisaAllowance -= usedR;
              const allowS = Math.max(0, Math.min(NISA_SPOT_ANNUAL_CAP, remainingNisaAllowance));
              const usedS = Math.min(spot, allowS);
              remainingNisaAllowance -= usedS;
              const add = usedR + usedS;
              nisa = nisa * (1 + p.expectedReturn) + add;
              cumulativeNisaContribution += add;
              combinedContribution += add;
            } else {
              const add = recur + spot;
              productBalances[p.key] = (productBalances[p.key] ?? 0) * (1 + p.expectedReturn) + add;
              combinedContribution += add;
            }
          }
        }
      }

      let taxableRecurringThisYear = baseAnnualTaxableRecurring;
      let taxableSpotThisYear = baseAnnualTaxableSpot;
      // NISAの年間上限をまず適用（その後、生涯残枠でさらに制限）
      let nisaRecurringThisYear = Math.max(0, Math.min(baseAnnualNisaRecurring, NISA_RECURRING_ANNUAL_CAP));
      let nisaSpotThisYear = Math.max(0, Math.min(baseAnnualNisaSpot, NISA_SPOT_ANNUAL_CAP));

      if (currentAge >= retirementAge) {
        taxableRecurringThisYear = 0;
        taxableSpotThisYear = 0;
        nisaRecurringThisYear = 0;
        nisaSpotThisYear = 0;
      }

      // 生涯拠出枠に到達していれば以降のNISA拠出は停止
      if (cumulativeNisaContribution >= NISA_CONTRIBUTION_CAP) {
        nisaRecurringThisYear = 0;
        nisaSpotThisYear = 0;
      }

      let appliedNisaRecurring = 0;
      let appliedNisaSpot = 0;
      let remainingNisaAllowance = Math.max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution);

      if (remainingNisaAllowance > 0) {
        appliedNisaRecurring = Math.min(nisaRecurringThisYear, remainingNisaAllowance);
        remainingNisaAllowance -= appliedNisaRecurring;
        appliedNisaSpot = Math.min(nisaSpotThisYear, remainingNisaAllowance);
      }

      const taxableContribution = Math.max(0, taxableRecurringThisYear + taxableSpotThisYear);
      const nisaContribution = Math.max(0, appliedNisaRecurring + appliedNisaSpot);
      cumulativeNisaContribution += nisaContribution;
      if (!useProducts) {
        combinedContribution = taxableContribution + nisaContribution;
        investedPrincipal = investedPrincipal * (1 + currentReturn) + taxableContribution;
        nisa = nisa * (1 + currentReturn) + nisaContribution;
      }

      // Cash flow calculation
      const annualSavings = currentAge < retirementAge ? (monthlySavingsJPY * 12) : 0;
      const totalInvestmentOutflow = combinedContribution;
      const cashFlow = annualIncome - totalExpense - totalInvestmentOutflow + annualSavings;
      savings += cashFlow;

      // 生活防衛資金の補填
      if (emergencyFundJPY > 0 && savings < emergencyFundJPY) {
        let remainingShortfall = emergencyFundJPY - savings;

        if (remainingShortfall > 0 && investedPrincipal > 0) {
          const maxNetFromTaxable = investedPrincipal * (1 - SPECIFIC_ACCOUNT_TAX_RATE);
          const netFromTaxable = Math.min(remainingShortfall, maxNetFromTaxable);
          if (netFromTaxable > 0) {
            const grossRequired = netFromTaxable / (1 - SPECIFIC_ACCOUNT_TAX_RATE);
            investedPrincipal = Math.max(0, investedPrincipal - grossRequired);
            savings += netFromTaxable;
            remainingShortfall -= netFromTaxable;
          }
        }

        if (remainingShortfall > 0 && nisa > 0) {
          const drawFromNisa = Math.min(remainingShortfall, nisa);
          nisa -= drawFromNisa;
          savings += drawFromNisa;
          remainingShortfall -= drawFromNisa;
        }
      }


      // 資産配分 (今回は現金、NISA、iDeCoのみ)
      const totalAssets = savings + nisa + ideco + investedPrincipal;
      const productsOut = useProducts ? Object.fromEntries(Object.entries(productBalances).map(([k, v]) => [k, Math.round(v)])) : undefined;

      yearlyData.push({
        age: currentAge,
        year: year,
        income: Math.round(annualIncome),
        livingExpense: Math.round(livingExpense),
        housingExpense: Math.round(housingExpense),
        carExpense: Math.round(carRecurring + carOneOff),
        applianceExpense: Math.round(applianceExpense),
        childExpense: Math.round(childExpense),
        marriageExpense: Math.round(marriageExpense),
        careExpense: Math.round(careExpense),
        medicalExpense: 0, // 今回は計算対象外
        longTermCareExpense: 0, // 今回は計算対象外
        retirementExpense: Math.round(retirementExpense),
        totalExpense: Math.round(totalExpense),
        savings: Math.round(savings),
        nisa: Math.round(nisa),
        ideco: Math.round(ideco),
        totalAssets: Math.round(totalAssets),
        investedPrincipal: Math.round(investedPrincipal),
        assetAllocation: {
          cash: Math.round(savings),
          investment: Math.round(investedPrincipal),
          nisa: Math.round(nisa),
          ideco: Math.round(ideco),
        },
        products: productsOut,
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

