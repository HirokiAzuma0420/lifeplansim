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
      type?: '驫陦後Ο繝ｼ繝ｳ' | '繝・ぅ繝ｼ繝ｩ繝ｼ繝ｭ繝ｼ繝ｳ';
    };
  };

  housing: {
    type: '雉・ｲｸ' | '謖√■螳ｶ・医Ο繝ｼ繝ｳ荳ｭ・・ | '謖√■螳ｶ・亥ｮ梧ｸ茨ｼ・;
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
    educationPattern: '蜈ｬ遶倶ｸｭ蠢・ | '蜈ｬ遘∵ｷｷ蜷・ | '遘∫ｫ倶ｸｭ蠢・;
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

  interestScenario: '蝗ｺ螳壼茜蝗槭ｊ' | '繝ｩ繝ｳ繝繝螟牙虚';
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

// 繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ髢｢謨ｰ
// 繧ｷ繝ｼ繝我ｻ倥″PRNG・・ulberry32・・function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 讓呎ｺ匁ｭ｣隕擾ｼ・ox-Muller・・function gaussian(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// 繝吶け繝医Ν讓呎ｺ門喧・壼ｹｳ蝮・繝ｻ讓呎ｺ門￥蟾ｮ1
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

// 雉・肇繝ｪ繧ｹ繧ｯ繝励Μ繧ｻ繝・ヨ縺ｨ雉・肇繧ｭ繝ｼ驟榊・繧貞ｮ夂ｾｩ縲・const ASSET_SIGMA: Record<string, number> = {
  equity_jp_us: 0.20,
  fund_foreign: 0.18,
  ideco_foreign: 0.18,
  bond_dev: 0.04,
  btc: 0.70,
};
const ASSETS = Object.keys(ASSET_SIGMA); // 遲峨え繧ｧ繧､繝・
// 繝ｭ繝ｼ繝ｳ霑疲ｸ磯｡崎ｨ育ｮ鈴未謨ｰ (蟷ｴ鬘・
const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): number => {
  if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
    return 0;
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12; // 逋ｾ蛻・紫繧貞ｰ乗焚縺ｫ螟画鋤縺励∵怦蛻ｩ縺ｫ
  const totalMonths = years * 12;

  if (monthlyInterestRate === 0) {
    return principal / years; // 驥大茜0縺ｮ蝣ｴ蜷医・蜈・悽繧貞ｹｴ謨ｰ縺ｧ蜑ｲ繧・  }

  const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
  return monthlyPayment * 12; // 蟷ｴ鬘阪ｒ霑斐☆
};

// 鬘埼擇蜿主・縺九ｉ謇句叙繧雁庶蜈･繧定ｨ育ｮ励☆繧矩未謨ｰ
function computeNetAnnual(grossAnnualIncome: number): number {
  const income = n(grossAnnualIncome);

  // 邨ｦ荳取園蠕玲而髯､ (莉､蜥・蟷ｴ莉･髯・
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

  // 遉ｾ莨壻ｿ晞匱譁・(蛛･蠎ｷ菫晞匱縲∝字逕溷ｹｴ驥代・寐逕ｨ菫晞匱) - 邁｡逡･蛹悶・縺溘ａ荳蠕・5%縺ｨ縺吶ｋ
  const socialInsurancePremium = income * 0.15;

  // 蝓ｺ遉取而髯､ (莉､蜥・蟷ｴ莉･髯・
  const basicDeduction = 480000;

  // 隱ｲ遞取園蠕・  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

  // 謇蠕礼ｨ・  let incomeTax: number;
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

  // 菴乗ｰ醍ｨ・(蝮・ｭ牙牡5,000蜀・+ 謇蠕怜牡10%) - 邁｡逡･蛹・  const residentTax = taxableIncome * 0.1 + 5000;

  // 謇句叙繧雁庶蜈･ = 鬘埼擇蜿主・ - 遉ｾ莨壻ｿ晞匱譁・- 謇蠕礼ｨ・- 菴乗ｰ醍ｨ・  const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

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

    const stressTestEnabled = interestScenario === '繝ｩ繝ｳ繝繝螟牙虚';

    const mu = Math.max(-1, Math.min(1, n(expectedReturn))); // 蟆乗焚, 萓・.04
    const scenario = interestScenario || '蝗ｺ螳壼茜蝗槭ｊ';
    const stEnabled = stressTestEnabled; // stressTestEnabled 縺ｯ譌｢縺ｫ螳夂ｾｩ貂医∩
    const seedBase = n(body.inputParams.stressTest?.seed) || 123456789; // body.inputParams.stressTest?.seed 繧剃ｽｿ逕ｨ

    const yearlyData: YearlyData[] = [];

    let currentAge = initialAge;
    let savings = currentSavingsJPY;
    const nisa = 0; // NISA縺ｯ莉雁屓縺ｯ繧ｷ繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ蟇ｾ雎｡螟・    const ideco = 0; // iDeCo縺ｯ莉雁屓縺ｯ繧ｷ繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ蟇ｾ雎｡螟・    const currentInvestmentsJPY_corrected = n(currentInvestmentsJPY) * 10000; // 荳・・繧貞・縺ｫ螟画鋤
    let investedPrincipal = currentInvestmentsJPY_corrected; // 蛻晄悄蜈・悽

    // 螳ｶ髮ｻ縺ｮ豁｣隕丞喧・亥女菫｡逶ｴ蠕鯉ｼ・    const appliancesOnly = Array.isArray(appliances) ? appliances.filter(a =>
      a && String(a.name ?? '').trim().length > 0 &&
      Number(a.cost10kJPY) > 0 &&
      Number(a.cycleYears) > 0
    ) : [];

    const baseYear = new Date().getFullYear();
    const T = (endAge - initialAge) + 1; // 繝ｫ繝ｼ繝怜屓謨ｰ縺ｫ蜷医ｏ縺帙ｋ
    const assetReturns: Record<string, number[]> = {};
    ASSETS.forEach((k, idx) => {
      const rand = mulberry32(seedBase + idx * 101);
      const zs = Array.from({ length: T }, () => gaussian(rand));
      const zstd = standardize(zs); // 蟷ｳ蝮・, 蛻・淵1縺ｫ陬懈ｭ｣・医％縺薙′縲悟庶譚溘阪・骰ｵ・・      const sigma = ASSET_SIGMA[k];
      const ra = zstd.map(z => {
        let r = mu + sigma * z;
        // 莉ｻ諢・ 驕主ｺｦ縺ｪ螟悶ｌ蛟､謚大宛・按ｱ3ﾏ・ｼ・        const lo = mu - 3 * sigma, hi = mu + 3 * sigma;
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

      // 1. 蜿主・險育ｮ・      let selfGrossIncome = mainJobIncomeGross * Math.pow(1 + incomeGrowthRate, i) + sideJobIncomeGross;
      let spouseGrossIncome = (spouseMainJobIncomeGross ?? 0) * Math.pow(1 + (spouseIncomeGrowthRate ?? 0), i) + (spouseSideJobIncomeGross ?? 0);

      // 騾閨ｷ蟷ｴ鮨｢莉･髯阪・蜿主・隱ｿ謨ｴ
      if (currentAge >= retirementAge) {
        selfGrossIncome = 0;
        spouseGrossIncome = 0;
      }

      annualIncome = computeNetAnnual(selfGrossIncome) + computeNetAnnual(spouseGrossIncome);

      // 2. 謾ｯ蜃ｺ險育ｮ・      if (expenseMode === 'simple') {
        livingExpense = livingCostSimpleAnnual ?? 0;
      } else {
        livingExpense = (detailedFixedAnnual ?? 0) + (detailedVariableAnnual ?? 0);
      }

      // 2a. 閠∝ｾ瑚ｲｻ逕ｨ (65豁ｳ莉･髯阪・逕滓ｴｻ雋ｻ縺ｨ蟷ｴ驥代・蟾ｮ鬘・
      if (currentAge >= retirementAge) {
        livingExpense = 0; // 騾閨ｷ蟷ｴ鮨｢莉･髯阪・livingExpense繧・縺ｫ縺吶ｋ
        const postRetirementLivingAnnual = postRetirementLiving10kJPY * 10000 * 12;
        const pensionAnnual = (currentAge >= pensionStartAge ? pensionMonthly10kJPY * 10000 * 12 : 0);
        retirementExpense = Math.max(0, postRetirementLivingAnnual - pensionAnnual);
      }

      // 2b. 蟄蝉ｾ幄ｲｻ逕ｨ
      if (children) {
        for (let c = 0; c < children.count; c++) {
          const childBirthAge = children.firstBornAge + c * 3; // 3蟷ｴ縺翫″縺ｫ逕溘∪繧後ｋ縺ｨ莉ｮ螳・          const childAge = currentAge - childBirthAge;

          if (childAge >= 0 && childAge <= 21) {
            let educationCost = 0;
            switch (children.educationPattern) {
              case '蜈ｬ遶倶ｸｭ蠢・: educationCost = 10000000 / 22; break;
              case '蜈ｬ遘∵ｷｷ蜷・: educationCost = 16000000 / 22; break;
              case '遘∫ｫ倶ｸｭ蠢・: educationCost = 20000000 / 22; break;
            }
            childExpense += educationCost;
          }
        }
      }

      // 2c. 莉玖ｭｷ雋ｻ逕ｨ
      if (care?.assume && care.parentCurrentAge && care.parentCareStartAge && care.years && care.monthly10kJPY) {
        const parentAge = care.parentCurrentAge + i;
        if (parentAge >= care.parentCareStartAge && parentAge < care.parentCareStartAge + care.years) {
          careExpense = care.monthly10kJPY * 10000 * 12;
        }
      }

      // 2d. 邨仙ｩ夊ｲｻ逕ｨ
      if (marriage && currentAge === marriage.age) {
        marriageExpense = marriage.engagementJPY + marriage.weddingJPY + marriage.honeymoonJPY + marriage.movingJPY;
      }

      // 2e. 螳ｶ髮ｻ雋ｻ逕ｨ
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

      // 2f. 霆願ｲｻ逕ｨ
      if (car.priceJPY > 0 && car.firstAfterYears >= 0 && car.frequencyYears > 0) {
        const base = initialAge + car.firstAfterYears;
        const yearsSinceFirst = currentAge - base;

        if (yearsSinceFirst >= 0) {
          for (let k = 0; k <= Math.floor(yearsSinceFirst / car.frequencyYears); k++) {
            const eventAge = base + k * car.frequencyYears;

            if (car.loan.use) {
              let annualRatePercent = 2.5;
              if (car.loan.type === '驫陦後Ο繝ｼ繝ｳ') annualRatePercent = 1.5;
              else if (car.loan.type === '繝・ぅ繝ｼ繝ｩ繝ｼ繝ｭ繝ｼ繝ｳ') annualRatePercent = 4.5;

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

      // 2g. 菴上∪縺・ｲｻ逕ｨ
      if (housing.type === '謖√■螳ｶ・医Ο繝ｼ繝ｳ荳ｭ・・ && housing.currentLoan?.monthlyPaymentJPY && housing.currentLoan?.remainingYears) {
        // 繝ｫ繝ｼ繝鈴幕蟋句ｹｴ繧定ｵｷ轤ｹ縺ｫ縲梧ｮ句ｭ伜ｹｴ謨ｰ縲阪□縺題ｨ井ｸ・        if (i < housing.currentLoan.remainingYears) {
          housingExpense += housing.currentLoan.monthlyPaymentJPY * 12;
        }
      }
      if (housing.purchasePlan && currentAge >= housing.purchasePlan.age && currentAge < housing.purchasePlan.age + housing.purchasePlan.years) {
        if (currentAge === housing.purchasePlan.age) {
          housingExpense += housing.purchasePlan.downPaymentJPY; // 鬆ｭ驥台ｸ諡ｬ
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

      // 隧ｳ邏ｰ繝｢繝ｼ繝画凾縺ｮ莠碁㍾險井ｸ企亟豁｢
      if (expenseMode === 'detailed') {
        carExpense = 0;
        housingExpense = 0;
        applianceExpense = 0;
        childExpense = 0;
      }

      // 蜷・ｨｮ雋ｻ逕ｨ縺ｮ蜷郁ｨ・      const totalExpense =
        livingExpense +
        childExpense +
        careExpense +
        carExpense +
        housingExpense +
        marriageExpense +
        applianceExpense +
        retirementExpense;

      // 笆 Investment logic
    const isRandom = (scenario === '繝ｩ繝ｳ繝繝螟牙虚' && stEnabled);
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

    // 笆 Cash flow calculation
    // 3. Update cash flow, deducting the investment amount from savings.
    const cashFlow = annualIncome - totalExpense - annualInvestment + (monthlySavingsJPY * 12);
    savings += cashFlow;

      // 逕滓ｴｻ髦ｲ陦幄ｳ・≡縺ｮ陬懷｡ｫ
      if (emergencyFundJPY > 0 && savings < emergencyFundJPY) {
        const shortfall = emergencyFundJPY - savings;
        const draw = Math.min(shortfall, investedPrincipal); // 蜈・悽縺九ｉ蜿悶ｊ蟠ｩ縺・        investedPrincipal -= draw;
        savings += draw;
      }

      // 雉・肇驟榊・ (莉雁屓縺ｯ迴ｾ驥代¨ISA縲（DeCo縺ｮ縺ｿ)
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
        medicalExpense: 0, // 莉雁屓縺ｯ險育ｮ怜ｯｾ雎｡螟・        longTermCareExpense: 0, // 莉雁屓縺ｯ險育ｮ怜ｯｾ雎｡螟・        retirementExpense: Math.round(retirementExpense),
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

