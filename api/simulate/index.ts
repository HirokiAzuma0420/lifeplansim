// Local minimal types to avoid '@vercel/node' runtime/type dependency
type VercelRequest = { method?: string; body?: unknown; query?: Record<string, unknown> };
type VercelResponse = { status: (code: number) => { json: (data: unknown) => void } };
import * as FC from '../../src/constants/financial_const';
import { computeNetAnnual, calculateLoanPayment as calculateLoanPaymentShared, calculateRetirementIncomeTax } from '../../src/utils/financial';
import type { InvestmentProduct, SimulationInputParams, AccountBucket, YearlyData, CarePlan, RetirementIncomeParams } from '../../src/types/simulation-types';

interface Appliance {
  name: string;
  cost10kJPY: number;
  cycleYears: number;
  firstAfterYears: number;
}

type DebugInfo = {
  replenishmentTriggered: boolean;
  savings_before_cashFlow?: number;
  savings_after_cashFlow?: number;
  savings_before_withdrawToCoverShortfall?: number;
  savings_before?: number; // Original savings_before for replenishment
  shortfall?: number;
  savings_after?: number; // Original savings_after for replenishment
  savings_after_withdrawToCoverShortfall?: number;
  savings_before_investment_reduction?: number;
  savings_after_investment_reduction?: number;
  savings_before_asset_growth?: number;
  savings_after_asset_growth?: number;
  totalInvestmentPrincipal_before_push?: number;
  savings_before_yearlyData_push?: number;
  savings_at_yearlyData_push_assignment?: number;
  finalSavingsForYear?: number;
};

// ユーティリティ関数
const n = (v: unknown): number => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

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
  // 最初の暴落は設定値に基づいて設定
  let nextCrashYear = Math.floor(Math.random() * (FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MAX - FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MIN + 1)) + FC.CRASH_EVENT_CONFIG.FIRST_CRASH_YEAR_MIN;
  while (nextCrashYear < years) {
    crashYears.add(nextCrashYear);
    // 次の暴落は設定値に基づいて設定
    nextCrashYear += Math.floor(Math.random() * (FC.CRASH_EVENT_CONFIG.SUBSEQUENT_CRASH_YEAR_MAX - FC.CRASH_EVENT_CONFIG.SUBSEQUENT_CRASH_YEAR_MIN + 1)) + FC.CRASH_EVENT_CONFIG.SUBSEQUENT_CRASH_YEAR_MIN;
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

function runMonteCarloSimulation(
  params: SimulationInputParams,
  numberOfSimulations: number
): { yearlyData: YearlyData[]; summary: { bankruptcyRate: number } } {
  const allSimulations: YearlyData[][] = [];

  // 1. runSimulationを100回実行
  for (let i = 0; i < numberOfSimulations; i++) {
    // 毎回異なるリターン系列を生成するために、シードを少し変更する
    // stressTestが有効でない場合でも、この関数が呼ばれたら有効にする
    const simParams: SimulationInputParams = {
      ...params,
      stressTest: {
        ...params.stressTest,
        enabled: true, // モンテカルロでは常にランダム変動を有効にする
        seed: (params.stressTest?.seed ?? Date.now()) + i,
      },
    };
    allSimulations.push(runSimulation(simParams));
  }

  if (allSimulations.length === 0) return { yearlyData: [], summary: { bankruptcyRate: 0 } };

  // 破綻確率の計算
  let bankruptCount = 0;
  for (const sim of allSimulations) {
    // いずれかの年で総資産が0以下になったら破綻とみなす
    if (sim.some(yearData => yearData.totalAssets <= 0)) {
      bankruptCount++;
    }
  }
  const bankruptcyRate = bankruptCount / numberOfSimulations;

  // 2. 中央値のシミュレーション結果を選択
  // 最終年の総資産額に基づいてソート
  allSimulations.sort((a, b) => {
    const lastA = a[a.length - 1];
    const lastB = b[b.length - 1];
    return (lastA?.totalAssets ?? 0) - (lastB?.totalAssets ?? 0);
  });

  // 中央値のインデックスを計算し、そのシミュレーションデータを取得
  const medianIndex = Math.floor(allSimulations.length / 2);
  const medianSimulationData = allSimulations[medianIndex];

  return {
    yearlyData: medianSimulationData,
    summary: { bankruptcyRate },
  };
}

function isInputParamsBody(x: unknown): x is { inputParams: SimulationInputParams } {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (!('inputParams' in r)) return false;
  const ip = (r as { inputParams: unknown }).inputParams;
  if (!ip || typeof ip !== 'object') return false;
  const m = ip as Record<string, unknown>;
  return 'initialAge' in m && 'endAge' in m && 'retirementAge' in m;
}

function getAnnualChildCost(age: number, pattern: '公立中心' | '公私混合' | '私立中心'): number {
  const costTable = FC.EDUCATION_COST_TABLE[pattern];
  let costInManYen = 0;

  if (age >= 0 && age <= 6) costInManYen = costTable['0-6'];
  else if (age >= 7 && age <= 12) costInManYen = costTable['7-12'];
  else if (age >= 13 && age <= 15) costInManYen = costTable['13-15'];
  else if (age >= 16 && age <= 18) costInManYen = costTable['16-18'];
  else if (age >= 19 && age <= 22) costInManYen = costTable['19-22'];

  return costInManYen * FC.YEN_PER_MAN; // 円に変換して返す
}

/**
 * 指定された不足額を補填するために、投資資産から取り崩しを行う。
 * 取り崩しは 課税口座 -> 非課税口座 の優先順位で行われる。
 * @param shortfall - 補填が必要な金額
 * @param savings - 現在の現金預金残高
 * @param productList - 投資商品のリスト
 * @param productBalances - 各商品の残高情報
 * @returns 更新された現金預金、商品残高、および翌年復活するNISA枠の金額
 */
function withdrawToCoverShortfall(
  shortfall: number,
  savings: number,
  productList: InvestmentProduct[],
  productBalances: Record<string, AccountBucket>
): { newSavings: number; newProductBalances: Record<string, AccountBucket>; nisaRecycleAmount: number } {
  const withdrawalOrder: ('課税' | '非課税')[] = ['課税', '非課税'];
  let totalNisaRecycled = 0;

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

    if (accountType === '課税') {
      let totalPrincipalInAccount = 0;
      productsInAccount.forEach(p => {
        const originalIndex = productList.indexOf(p);
        const productId = `${p.key}-${originalIndex}`;
        totalPrincipalInAccount += productBalances[productId]?.principal ?? 0;
      });
      const gainRatio = totalBalanceInAccount > 0 ? Math.max(0, (totalBalanceInAccount - totalPrincipalInAccount) / totalBalanceInAccount) : 0;
      const requiredGross = shortfall / (1 - gainRatio * FC.SPECIFIC_ACCOUNT_TAX_RATE);
      const grossWithdrawal = Math.min(totalBalanceInAccount, requiredGross);
      const tax = grossWithdrawal * gainRatio * FC.SPECIFIC_ACCOUNT_TAX_RATE;
      const netProceeds = grossWithdrawal - tax;

      productsInAccount.forEach(p => {
        const originalIndex = productList.indexOf(p);
        const productId = `${p.key}-${originalIndex}`;
        const productBucket = productBalances[productId];
        if (!productBucket || totalBalanceInAccount <= 0 || productBucket.balance <= 0) return;
        const proportion = productBucket.balance / totalBalanceInAccount;
        const withdrawalAmount = grossWithdrawal * proportion;
        const principalRatio = productBucket.balance > 0 ? productBucket.principal / productBucket.balance : 1;
        const principalWithdrawn = withdrawalAmount * principalRatio;
        productBucket.principal -= principalWithdrawn;
        productBucket.balance -= withdrawalAmount;
      });

      savings += netProceeds;
      shortfall -= netProceeds;

    } else { // 非課税
      const withdrawalAmount = Math.min(totalBalanceInAccount, shortfall);
      productsInAccount.forEach(p => {
        const originalIndex = productList.indexOf(p);
        const productId = `${p.key}-${originalIndex}`;
        const productBucket = productBalances[productId];
        if (!productBucket || totalBalanceInAccount <= 0 || productBucket.balance <= 0) return;
        const proportion = productBucket.balance / totalBalanceInAccount;
        const amountToWithdraw = withdrawalAmount * proportion;
        const principalRatio = productBucket.balance > 0 ? productBucket.principal / productBucket.balance : 1;
        const principalWithdrawn = amountToWithdraw * principalRatio;
        productBucket.principal -= principalWithdrawn;
        productBucket.balance -= amountToWithdraw;
        totalNisaRecycled += principalWithdrawn;
      });
      savings += withdrawalAmount;
      shortfall -= withdrawalAmount;
    }
  }

  return { newSavings: savings, newProductBalances: productBalances, nisaRecycleAmount: totalNisaRecycled };
}

function runSimulation(params: SimulationInputParams): YearlyData[] {
  // NISA夫婦合算枠を考慮した生涯上限額を設定
  const nisaLifetimeCap = params.useSpouseNisa ? FC.NISA_LIFETIME_CAP * FC.NISA_COUPLE_MULTIPLIER : FC.NISA_LIFETIME_CAP;

  // --- シミュレーション準備 ---
  const yearlyData: YearlyData[] = [];
  let currentAge = params.initialAge;
  const now = new Date();
  const baseYear = now.getFullYear();
  const startMonth = now.getMonth(); // 0-indexed
  const firstYearRemainingMonths = FC.MONTHS_PER_YEAR - startMonth;
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
      let nisaRecycleAmountForNextYear = 0; // NISA枠復活対応：翌年に復活する売却元本額
  
      const idecoCashOutAge = Math.min(params.retirementAge, FC.IDECO_MAX_CASHOUT_AGE);
  // --- リターン系列の事前生成 ---
  const stressTestEnabled = params.stressTest?.enabled ?? false;
  const VOLATILITY_MAP: Record<InvestmentProduct['key'], number> = FC.VOLATILITY_MAP;
  const productReturnSeries = new Map<string, number[]>();
  if (params.interestScenario === '固定利回り' && params.expectedReturn != null) {
    // 固定利回りの場合、全商品の期待リターンを上書き
    productList = productList.map(p => ({
      ...p,
      expectedReturn: params.expectedReturn as number,
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
  const appliancesOnly: Appliance[] = Array.isArray(params.appliances) ? params.appliances.filter((a: Appliance) => a && String(a.name ?? '').trim().length > 0 && Number(a.cost10kJPY) > 0 && Number(a.cycleYears) > 0) : [];

  // --- シミュレーションループ ---
  // ループ内で変更される状態変数
  let activeCarLoans: { endAge: number, annualPayment: number }[] = [];

  // 年収をループ内で更新するための変数を初期化
  let currentSelfGrossIncome = n(params.mainJobIncomeGross) + n(params.sideJobIncomeGross);
  let currentSpouseGrossIncome = (n(params.spouseMainJobIncomeGross) ?? 0) + (n(params.spouseSideJobIncomeGross) ?? 0);

  // 一時金収入を計上するための変数を初期化
  let oneTimeIncomeThisYear = 0;

  // ループ内で変更される状態変数
  for (let i = 0; currentAge <= params.endAge; i++, currentAge++) {
    const debugInfo: DebugInfo = {
      replenishmentTriggered: false,
      savings_before_cashFlow: undefined,
      savings_after_cashFlow: undefined,
      savings_before_withdrawToCoverShortfall: undefined,
      savings_before: undefined,
      shortfall: undefined,
      savings_after: undefined,
      savings_after_withdrawToCoverShortfall: undefined,
      savings_before_investment_reduction: undefined,
      savings_after_investment_reduction: undefined,
      savings_before_asset_growth: undefined,
      savings_after_asset_growth: undefined,
      totalInvestmentPrincipal_before_push: undefined,
      savings_before_yearlyData_push: undefined,
      finalSavingsForYear: undefined,
    };
    cumulativeNisaContribution -= nisaRecycleAmountForNextYear; // NISA枠復活
    let spouseGrossIncome = 0;
    oneTimeIncomeThisYear = 0; // 年の初めにリセット
    nisaRecycleAmountForNextYear = 0; // 今年のリサイクル額計算のためにリセット

    const year = baseYear + i;
    const yearFraction = (i === 0) ? firstYearRemainingMonths / FC.MONTHS_PER_YEAR : 1;
    const spouseCurrentAge = params.spouseInitialAge ? params.initialAge + i + (params.spouseInitialAge - params.initialAge) : undefined;

    // 昇給を適用（初年度は適用しない）
    if (i > 0) {
      if (currentAge < params.retirementAge) {
        currentSelfGrossIncome *= (1 + n(params.incomeGrowthRate));
      }
      if (spouseCurrentAge !== undefined && params.spouseRetirementAge && spouseCurrentAge < n(params.spouseRetirementAge)) {
        currentSpouseGrossIncome *= (1 + (n(params.spouseIncomeGrowthRate) ?? 0));
      }
    }

    // --- 0. iDeCo現金化 (イベント) ---
    // 収支計算の前に処理し、その年の現金を増やしておく
    if (currentAge === idecoCashOutAge) {
      let idecoAmount = 0;
      productList.forEach((p, index) => {
        if (p.account === 'iDeCo') {
          const productId = `${p.key}-${index}`;
          idecoAmount += productBalances[productId]?.balance ?? 0;
          productBalances[productId] = { principal: 0, balance: 0 };
        }
      });

      if (idecoAmount > 0) {
        // 同じ年に受け取る退職所得を合算
        let totalRetirementIncome = idecoAmount;
        const retirementIncomesOnThisYear: { amount: number, yearsOfService: number, source: 'ideco' | 'self' | 'spouse' }[] = [];

        retirementIncomesOnThisYear.push({ amount: idecoAmount, yearsOfService: params.retirementAge - params.initialAge, source: 'ideco' });

        if (params.retirementIncome && params.retirementIncome.age === currentAge) {
          totalRetirementIncome += params.retirementIncome.amountJPY;
          retirementIncomesOnThisYear.push({ amount: params.retirementIncome.amountJPY, yearsOfService: params.retirementIncome.yearsOfService, source: 'self' });
        }
        if (params.spouseRetirementIncome && spouseCurrentAge && params.spouseRetirementIncome.age === spouseCurrentAge) {
          totalRetirementIncome += params.spouseRetirementIncome.amountJPY;
          retirementIncomesOnThisYear.push({ amount: params.spouseRetirementIncome.amountJPY, yearsOfService: params.spouseRetirementIncome.yearsOfService, source: 'spouse' });
        }

        // 退職所得控除と税額計算
        const totalYearsOfService = retirementIncomesOnThisYear.reduce((max, p) => Math.max(max, p.yearsOfService), 0);
        const totalTax = calculateRetirementIncomeTax(totalRetirementIncome, totalYearsOfService);

        // 税額を按分して手取り額を計算
        if (totalRetirementIncome > 0) {
          const idecoTax = (idecoAmount / totalRetirementIncome) * totalTax;
          savings += idecoAmount - idecoTax;

          if (params.retirementIncome && params.retirementIncome.age === currentAge) {
            const selfRetirementTax = (params.retirementIncome.amountJPY / totalRetirementIncome) * totalTax;
            oneTimeIncomeThisYear += params.retirementIncome.amountJPY - selfRetirementTax;
          }
          if (params.spouseRetirementIncome && spouseCurrentAge && params.spouseRetirementIncome.age === spouseCurrentAge) {
            const spouseRetirementTax = (params.spouseRetirementIncome.amountJPY / totalRetirementIncome) * totalTax;
            oneTimeIncomeThisYear += params.spouseRetirementIncome.amountJPY - spouseRetirementTax;
          }
        } else {
          savings += idecoAmount;
        }
      }
    }

    // iDeCoとは別の年の退職金
    const processRetirementIncome = (ri: RetirementIncomeParams | undefined, targetAge: number) => {
      if (ri && ri.age === targetAge && ri.age !== idecoCashOutAge) {
        const tax = calculateRetirementIncomeTax(ri.amountJPY, ri.yearsOfService);
        oneTimeIncomeThisYear += ri.amountJPY - tax;
      }
    };
    processRetirementIncome(params.retirementIncome, currentAge);
    if (spouseCurrentAge) processRetirementIncome(params.spouseRetirementIncome, spouseCurrentAge);

    // 個人年金・その他一時金の処理
    const handleLumpSums = (lumpSums: SimulationInputParams['personalPensionPlans'] | SimulationInputParams['otherLumpSums'], targetAge: number) => {
      if (lumpSums) {
        lumpSums.forEach(p => {
          if ('age' in p && p.age === targetAge) { // OtherLumpSum
            oneTimeIncomeThisYear += p.amountJPY;
          } else if ('startAge' in p && p.startAge === targetAge && p.type === 'lumpSum') { // PersonalPensionPlan
            oneTimeIncomeThisYear += p.amountJPY;
          }
        });
      }
    };

    handleLumpSums(params.personalPensionPlans, currentAge);
    if (spouseCurrentAge) handleLumpSums(params.spousePersonalPensionPlans, spouseCurrentAge);
    handleLumpSums(params.otherLumpSums, currentAge);
    if (spouseCurrentAge) handleLumpSums(params.spouseOtherLumpSums, spouseCurrentAge);

    // --- 結婚イベント ---
    if (params.marriage && currentAge === n(params.marriage.age)) {
      // 配偶者情報を更新
      if (params.marriage.spouse) {
        params.spouseInitialAge = params.marriage.spouse.ageAtMarriage;
        currentSpouseGrossIncome = params.marriage.spouse.incomeGross; // 結婚時点の年収で上書き
        // Re-evaluate spouseGrossIncome for the current year after marriage
        if (spouseCurrentAge !== undefined && params.spouseRetirementAge && spouseCurrentAge < n(params.spouseRetirementAge)) {
          spouseGrossIncome = currentSpouseGrossIncome;
        }
      }
    }

    // --- 1. 収支計算 (Cash Flow) ---
    // 1a. 収入
    let investedThisYear = 0; // ★★★ この年の投資額をリセット
    let selfGrossIncome = 0;
    if (currentAge >= params.retirementAge) {
      selfGrossIncome = 0; // 退職後は給与収入ゼロ
    } else {
      selfGrossIncome = currentSelfGrossIncome;
    }

    spouseGrossIncome = 0;
    // 結婚後は spouseCurrentAge が定義される
    if (spouseCurrentAge !== undefined && params.spouseRetirementAge && spouseCurrentAge < n(params.spouseRetirementAge)) {
      spouseGrossIncome = currentSpouseGrossIncome;
    }
    let pensionAnnual = currentAge >= params.pensionStartAge ? n(params.pensionMonthly10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR : 0;
    if (spouseCurrentAge !== undefined && spouseCurrentAge >= n(params.spousePensionStartAge)) {
      pensionAnnual += n(params.spousePensionMonthly10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;
    }

    // 個人年金（年金形式）を収入に加算
    let personalPensionIncome = 0;
    const handlePensionPlans = (pensionPlans: SimulationInputParams['personalPensionPlans'], targetAge: number) => {
      if (pensionPlans) {
        pensionPlans.forEach(p => {
          if (p.type === 'fixedTerm' && targetAge >= p.startAge && targetAge < p.startAge + (p.duration || 0)) {
            personalPensionIncome += p.amountJPY;
          } else if (p.type === 'lifeTime' && targetAge >= p.startAge) {
            personalPensionIncome += p.amountJPY;
          }
        });
      }
    };
    handlePensionPlans(params.personalPensionPlans, currentAge);
    if (spouseCurrentAge) handlePensionPlans(params.spousePersonalPensionPlans, spouseCurrentAge);

    let idecoDeductionThisYear = 0;
    let investmentIncome = 0; // 投資収益を初期化
    if (currentAge < idecoCashOutAge) {
      productList.filter(p => p.account === 'iDeCo').forEach(p => {
        idecoDeductionThisYear += (n(p.recurringJPY) + n(p.spotJPY)) * yearFraction;
      });
    }
    const annualIncome = (computeNetAnnual(selfGrossIncome - idecoDeductionThisYear) + computeNetAnnual(spouseGrossIncome)) * yearFraction + pensionAnnual + personalPensionIncome + oneTimeIncomeThisYear;

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

    // 1b. 支出
    let livingExpense = 0;
    if (currentAge >= params.retirementAge) {
      // 退職後は老後生活費を適用
      livingExpense = n(params.postRetirementLiving10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR * yearFraction;
    } else if (params.marriage && currentAge >= n(params.marriage.age)) {
      // 結婚後は結婚後の生活費を適用
      livingExpense = n(params.marriage.newLivingCostAnnual) * yearFraction;
    } else {
      // それ以外は通常の生活費
      livingExpense = (params.expenseMode === 'simple' ? n(params.livingCostSimpleAnnual) : (n(params.detailedFixedAnnual) + n(params.detailedVariableAnnual))) * yearFraction;
    }

    // retirementGapの計算用に、年金と老後生活費の差額を計算
    const postRetirementLivingCostForGap = currentAge >= params.retirementAge ? n(params.postRetirementLiving10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR : 0;
    const retirementGap = Math.max(0, postRetirementLivingCostForGap - pensionAnnual);
    let careExpense = 0;
    if (Array.isArray(params.cares)) {
      params.cares.forEach((plan: CarePlan) => {
        const parentAge = n(plan.parentCurrentAge) + i;
        const careStartAge = n(plan.parentCareStartAge);
        if (parentAge >= careStartAge && parentAge < careStartAge + n(plan.years)) {
          careExpense += n(plan.monthly10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR * yearFraction;
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
          applianceExpense += n(a.cost10kJPY) * FC.YEN_PER_MAN;
        }
      }
    }
    let carExpense = 0;
    if (params.car) {
      let carRecurring = 0;
      if (carCurrentLoanMonthsRemaining > 0) { // 12はMONTHS_PER_YEARに
        const monthsThisYear = (i === 0) ? Math.min(firstYearRemainingMonths, carCurrentLoanMonthsRemaining) : Math.min(FC.MONTHS_PER_YEAR, carCurrentLoanMonthsRemaining);
        carRecurring += n(params.car.currentLoan?.monthlyPaymentJPY) * monthsThisYear;
        carCurrentLoanMonthsRemaining -= monthsThisYear;
      }

      // 将来の買い替えローンをアクティブローンリストに追加
      if (n(params.car.priceJPY) > 0 && params.car.firstAfterYears !== undefined && n(params.car.firstAfterYears) >= 0 && n(params.car.frequencyYears) > 0) {
        const base = params.initialAge + n(params.car.firstAfterYears);
        if (currentAge >= base) {
          const yearsSinceFirst = currentAge - base;
          const cycle = n(params.car.frequencyYears);
          if (cycle > 0 && yearsSinceFirst % cycle === 0) { // 買い替え年
            if (!params.car.loan?.use) { // 現金購入
              carRecurring += n(params.car.priceJPY);
            } else { // ローン購入
              const loanYears = n(params.car.loan?.years);
              if (loanYears > 0) {
                let annualRate = FC.DEFAULT_LOAN_RATES.CAR_GENERAL;
                if (params.car.loan?.type === '銀行ローン') annualRate = FC.DEFAULT_LOAN_RATES.CAR_BANK;
                else if (params.car.loan?.type === 'ディーラーローン') annualRate = FC.DEFAULT_LOAN_RATES.CAR_DEALER;
                const annualPayment = calculateLoanPaymentShared(n(params.car.priceJPY), annualRate * 100, loanYears).annualPayment;
                activeCarLoans.push({ endAge: currentAge + loanYears, annualPayment });
              }
            }
          }
        }
      }

      // アクティブなローンからの返済額を計上
      activeCarLoans.forEach((loan: { endAge: number; annualPayment: number }) => {
        if (currentAge < loan.endAge) {
          carRecurring += loan.annualPayment * yearFraction;
        }
      });
      // 終了したローンをリストから削除 (endAgeになったら削除)
      activeCarLoans = activeCarLoans.filter((loan: { endAge: number; }) => currentAge < loan.endAge);

      carExpense = carRecurring;
    }
    let housingExpense = 0;
    const currentHousingExpense = params.housing?.type === '賃貸' ? (n(params.housing.rentMonthlyJPY) * FC.MONTHS_PER_YEAR) : 0;
    if (params.housing) { // 既存の住宅関連ロジック
      if (params.housing.type === '賃貸' && currentHousingExpense > 0) {
        const willBuyHouse = !!params.housing.purchasePlan;
        const purchaseAge = params.housing.purchasePlan?.age ?? Infinity;
        if (!willBuyHouse || currentAge < purchaseAge) { // 購入前は賃貸料を計上
          housingExpense += currentHousingExpense * yearFraction;
        }
      }
      if (params.housing.type === '持ち家（ローン中）' && params.housing.currentLoan && currentAge < params.initialAge + n(params.housing.currentLoan.remainingYears)) {
        housingExpense += n(params.housing.currentLoan.monthlyPaymentJPY) * FC.MONTHS_PER_YEAR * yearFraction;
      }
      if (params.housing.purchasePlan && currentAge >= n(params.housing.purchasePlan.age)) {
        if (currentAge === n(params.housing.purchasePlan.age)) {
          housingExpense += n(params.housing.purchasePlan.downPaymentJPY);
        }
        if (params.housing.purchasePlan.years && currentAge < n(params.housing.purchasePlan.age) + n(params.housing.purchasePlan.years)) {
          const loanPrincipal = n(params.housing.purchasePlan.priceJPY) - n(params.housing.purchasePlan.downPaymentJPY);
          housingExpense += calculateLoanPaymentShared(loanPrincipal, n(params.housing.purchasePlan.rate) * 100, n(params.housing.purchasePlan.years)).annualPayment * yearFraction;
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

    // 結婚後の住居費を反映させるロジックを追加
    if (params.marriage && currentAge >= n(params.marriage.age)) {
      // 住宅購入計画がある場合、購入前は結婚後の賃貸費用、購入後はローン返済がhousingExpenseに含まれるため、ここでは何もしない
      // 住宅購入計画がない場合、結婚後の住居費を適用
      const willBuyHouse = !!params.housing?.purchasePlan;
      const purchaseAge = params.housing?.purchasePlan?.age ?? Infinity;
      if (!willBuyHouse || currentAge < purchaseAge) {
        housingExpense = n(params.marriage.newHousingCostAnnual) * yearFraction;
      }
    }
    const totalExpense = livingExpense + childExpense + careExpense + marriageExpense + applianceExpense + carExpense + housingExpense;

    // 1c. 現金残高の更新
    debugInfo.savings_before_cashFlow = savings;
    const cashFlow = annualIncome - totalExpense;
    savings += cashFlow;
    debugInfo.savings_after_cashFlow = savings;

    // --- 3. 投資の実行 (黒字の場合) ---
    const canInvest = currentAge < params.retirementAge;
    if (canInvest) { // 退職するまでは投資を継続
      const investableAmount = Math.max(0, savings - n(params.emergencyFundJPY));
      let remainingNisaAllowance = Math.max(0, nisaLifetimeCap - cumulativeNisaContribution);
      let nisaInvestedThisYear = 0;

      for (const p of productList) {
        if (investedThisYear >= investableAmount) break;

        const productId = `${p.key}-${productList.indexOf(p)}`;
        const contribution = (n(p.recurringJPY) + n(p.spotJPY)) * yearFraction;
        const actualContribution = Math.min(contribution, investableAmount - investedThisYear);

        if (actualContribution <= 0) continue;

        let investmentApplied = 0;
        if (p.account === '非課税' && remainingNisaAllowance > 0) {
          const remainingAnnualCap = Math.max(0, FC.NISA_ANNUAL_CAP - nisaInvestedThisYear);
          const nisaAllowed = Math.min(actualContribution, remainingNisaAllowance, remainingAnnualCap);

          productBalances[productId].principal += nisaAllowed;
          productBalances[productId].balance += nisaAllowed;
          cumulativeNisaContribution += nisaAllowed;
          remainingNisaAllowance -= nisaAllowed;
          nisaInvestedThisYear += nisaAllowed; // 年間投資額を更新
          investmentApplied = nisaAllowed;

        } else if (p.account === '課税') { // NISA枠がない、または課税口座指定の場合
          productBalances[productId].principal += actualContribution;
          productBalances[productId].balance += actualContribution;
          investmentApplied = actualContribution;
        } else if (p.account === 'iDeCo' && currentAge < FC.IDECO_MAX_CONTRIBUTION_AGE) { // iDeCoは定数で指定した年齢まで
          productBalances[productId].principal += actualContribution;
          productBalances[productId].balance += actualContribution;
          investmentApplied = actualContribution;
        }
        investedThisYear += investmentApplied;
      }
      debugInfo.savings_before_investment_reduction = savings;
      savings -= investedThisYear;
      debugInfo.savings_after_investment_reduction = savings;
    }

    // --- 2. 資産の取り崩し (赤字補填) ---
    // 生活防衛資金を下回った場合に、投資資産を売却して現金を補填する
    const emergencyFund = n(params.emergencyFundJPY);

    if (savings < emergencyFund) {
      debugInfo.savings_before_withdrawToCoverShortfall = savings;
      const shortfall = emergencyFund - savings;
      debugInfo.replenishmentTriggered = true;
      debugInfo.savings_before = savings;
      debugInfo.shortfall = shortfall;

      const result = withdrawToCoverShortfall(shortfall, savings, productList, productBalances);
      savings = result.newSavings;
      debugInfo.savings_after = savings;
      debugInfo.savings_after_withdrawToCoverShortfall = savings;

      nisaRecycleAmountForNextYear += result.nisaRecycleAmount;
    }

    // --- 4. 資産の成長 (利回り反映) ---
    debugInfo.savings_before_asset_growth = savings;
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
      const growth = productBucket.balance * yearlyReturn * yearFraction;
      productBucket.balance *= ((1 + yearlyReturn) ** yearFraction);
      investmentIncome += growth;
    });
    debugInfo.savings_after_asset_growth = savings;

    // --- 5. 年間データの集計と記録 ---
    const nisa = { principal: 0, balance: 0 };
    const ideco = { principal: 0, balance: 0 };
    const taxable = { principal: 0, balance: 0 };
    const productsForYear: Record<string, AccountBucket> = {};
    let totalInvestmentPrincipal = 0;

    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
      const roundedBucket = {
        principal: Math.round(productBucket.principal),
        balance: Math.round(productBucket.balance),
      };
      productsForYear[productId] = roundedBucket;

      totalInvestmentPrincipal += productBucket.principal;
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

    debugInfo.totalInvestmentPrincipal_before_push = totalInvestmentPrincipal;
    debugInfo.savings_before_yearlyData_push = savings;
    debugInfo.savings_at_yearlyData_push_assignment = savings;

    yearlyData.push({
      year,
      age: currentAge,
      income: Math.round(annualIncome),
      incomeDetail: {
        self: Math.round(computeNetAnnual(selfGrossIncome - idecoDeductionThisYear) * yearFraction),
        spouse: Math.round(computeNetAnnual(spouseGrossIncome) * yearFraction),
        investment: Math.round(investmentIncome),
      },
      expense: Math.round(totalExpense),
      expenseDetail: {
        living: Math.round(livingExpense),
        car: Math.round(carExpense),
        housing: Math.round(housingExpense),
        marriage: Math.round(marriageExpense),
        children: Math.round(childExpense),
        appliances: Math.round(applianceExpense),
        care: Math.round(careExpense),
        retirementGap: Math.round(retirementGap),
      },
      savings: Math.round(savings),
      nisa: { principal: Math.round(nisa.principal), balance: Math.round(nisa.balance) },
      ideco: { principal: Math.round(ideco.principal), balance: Math.round(ideco.balance) },
      taxable: { principal: Math.round(taxable.principal), balance: Math.round(taxable.balance) },
      investmentPrincipal: Math.round(totalInvestmentPrincipal),
      balance: Math.round(cashFlow - investedThisYear),
      totalAssets: Math.round(totalAssets),
      investedAmount: Math.round(investedThisYear),
      assetAllocation: {
        cash: Math.round(savings),
        investment: Math.round(taxable.balance),
        nisa: Math.round(nisa.balance),
        ideco: Math.round(ideco.balance),
      },
      products: productsForYear,
      debug: debugInfo,
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

  let result: { yearlyData: YearlyData[]; summary?: { bankruptcyRate: number } };

  const isDebugRun = req.query?.debug_run === 'true';

  if (isDebugRun) {
    result = { yearlyData: runSimulation(params) };
  } else if (params.interestScenario === '固定利回り') {
    result = {
      yearlyData: runSimulation(params),
      summary: { bankruptcyRate: 0 }, // 固定利回りでは破綻確率は0（または計算しない）
    };
  } else {
    result = runMonteCarloSimulation(params, FC.MONTE_CARLO_SIMULATION_COUNT);
  }

  res.status(200).json(result);
}