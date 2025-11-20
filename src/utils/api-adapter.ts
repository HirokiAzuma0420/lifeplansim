import type { SimulationInputParams, InvestmentProduct } from '@/types/simulation-types';
import type { FormDataState } from '@/types/form-types';
import * as FC from '@/constants/financial_const';
import { n } from './financial';

const calculateInitialPrincipal = (totalAmount: string | number, sign: '+' | '-' | undefined, rate: string | number | undefined): number | undefined => {
  const totalAmountYen = n(totalAmount) * FC.YEN_PER_MAN;
  if (totalAmountYen === 0) return 0;

  const gainLossRate = n(rate) / 100 * (sign === '+' ? 1 : -1);
  if (gainLossRate === -1) return 0; // 評価額0で損失率-100%の場合

  return Math.round(totalAmountYen / (1 + gainLossRate));
};

export const createApiParams = (formData: FormDataState): SimulationInputParams => {
  const mainJobIncomeGross = n(formData.mainIncome) * FC.YEN_PER_MAN;
  const sideJobIncomeGross = n(formData.sideJobIncome) * FC.YEN_PER_MAN;
  const spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseMainIncome) : 0) * FC.YEN_PER_MAN;
  const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseSideJobIncome) : 0) * FC.YEN_PER_MAN;

  let spouseIncomeForSim = 0;
  if (formData.planToMarry === 'する') {
    if (formData.spouseIncomePattern === 'パート') {
      spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.PART_TIME;
    } else if (formData.spouseIncomePattern === '正社員') {
      spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.FULL_TIME;
    } else if (formData.spouseIncomePattern === 'カスタム') {
      spouseIncomeForSim = n(formData.spouseCustomIncome) * FC.YEN_PER_MAN;
    }
  }

  const monthlyFixedExpense =
    n(formData.utilitiesCost) +
    n(formData.communicationCost) +
    n(formData.insuranceCost) +
    n(formData.educationCost) +
    n(formData.otherFixedCost);
  const monthlyCarExpense = n(formData.carCost) * FC.YEN_PER_MAN;
  const detailedFixedAnnual = (monthlyFixedExpense + monthlyCarExpense) * FC.MONTHS_PER_YEAR;

  const monthlyVariableExpense =
    n(formData.foodCost) +
    n(formData.dailyNecessitiesCost) +
    n(formData.transportationCost) +
    n(formData.clothingBeautyCost) +
    n(formData.socializingCost) +
    n(formData.hobbyEntertainmentCost) +
    n(formData.otherVariableCost);
  const detailedVariableAnnual = monthlyVariableExpense * FC.MONTHS_PER_YEAR;

  const assetKeys: { key: 'stocks' | 'trust' | 'other'; current: keyof FormDataState; accountType: keyof FormDataState; gainLossSign: keyof FormDataState; gainLossRate: keyof FormDataState; recurring: keyof FormDataState['monthlyInvestmentAmounts']; spot: keyof FormDataState; rate: keyof FormDataState; }[] = [
    { key: 'stocks', current: 'investmentStocksCurrent', accountType: 'investmentStocksAccountType', gainLossSign: 'investmentStocksGainLossSign', gainLossRate: 'investmentStocksGainLossRate', recurring: 'investmentStocksMonthly', spot: 'investmentStocksAnnualSpot', rate: 'investmentStocksRate' },
    { key: 'trust', current: 'investmentTrustCurrent', accountType: 'investmentTrustAccountType', gainLossSign: 'investmentTrustGainLossSign', gainLossRate: 'investmentTrustGainLossRate', recurring: 'investmentTrustMonthly', spot: 'investmentTrustAnnualSpot', rate: 'investmentTrustRate' },
    { key: 'other', current: 'investmentOtherCurrent', accountType: 'investmentOtherAccountType', gainLossSign: 'investmentOtherGainLossSign', gainLossRate: 'investmentOtherGainLossRate', recurring: 'investmentOtherMonthly', spot: 'investmentOtherAnnualSpot', rate: 'investmentOtherRate' },
  ];

  const nisaEligibleProducts: InvestmentProduct[] = assetKeys.map(asset => {
    const accountType = formData[asset.accountType] as 'nisa' | 'taxable';
    const currentJPY = n(formData[asset.current]) * FC.YEN_PER_MAN;
    let initialPrincipal: number | undefined;

    if (accountType === 'nisa') {
      initialPrincipal = calculateInitialPrincipal(
        formData[asset.current] as string | number,
        formData[asset.gainLossSign] as '+' | '-',
        formData[asset.gainLossRate] as string | number
      );
    }

    return {
      key: asset.key,
      account: accountType === 'nisa' ? '非課税' : '課税',
      currentJPY,
      initialPrincipal,
      recurringJPY: n(formData.monthlyInvestmentAmounts[asset.recurring]) * FC.MONTHS_PER_YEAR,
      spotJPY: n(formData[asset.spot]),
      expectedReturn: n(formData[asset.rate]) / 100,
    };
  });

  const otherProducts: InvestmentProduct[] = [
    { key: 'bonds', currentJPY: n(formData.investmentBondsCurrent) * FC.YEN_PER_MAN, recurringJPY: n(formData.monthlyInvestmentAmounts.investmentBondsMonthly) * FC.MONTHS_PER_YEAR, spotJPY: n(formData.investmentBondsAnnualSpot), expectedReturn: n(formData.investmentBondsRate) / 100, account: '課税' },
    { key: 'crypto', currentJPY: n(formData.investmentCryptoCurrent) * FC.YEN_PER_MAN, recurringJPY: n(formData.monthlyInvestmentAmounts.investmentCryptoMonthly) * FC.MONTHS_PER_YEAR, spotJPY: n(formData.investmentCryptoAnnualSpot), expectedReturn: n(formData.investmentCryptoRate) / 100, account: '課税' },
    { key: 'ideco', currentJPY: n(formData.investmentIdecoCurrent) * FC.YEN_PER_MAN, recurringJPY: n(formData.monthlyInvestmentAmounts.investmentIdecoMonthly) * FC.MONTHS_PER_YEAR, spotJPY: n(formData.investmentIdecoAnnualSpot), expectedReturn: n(formData.investmentIdecoRate) / 100, account: 'iDeCo' },
  ];

  const products = [...nisaEligibleProducts, ...otherProducts].filter(p => p.currentJPY > 0 || p.recurringJPY > 0 || p.spotJPY > 0);

  const params: SimulationInputParams = {
    initialAge: n(formData.personAge),
    spouseInitialAge: formData.familyComposition === '既婚' ? n(formData.spouseAge) : undefined,
    endAge: n(formData.simulationPeriodAge),
    retirementAge: n(formData.retirementAge),
    pensionStartAge: n(formData.pensionStartAge),

    spouseRetirementAge: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spouseRetirementAge) : undefined,
    spousePensionStartAge: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spousePensionStartAge) : undefined,

    mainJobIncomeGross: mainJobIncomeGross,
    sideJobIncomeGross: sideJobIncomeGross,
    spouseMainJobIncomeGross: spouseMainJobIncomeGross,
    spouseSideJobIncomeGross: spouseSideJobIncomeGross,
    incomeGrowthRate: n(formData.annualRaiseRate) / 100,
    spouseIncomeGrowthRate: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spouseAnnualRaiseRate) / 100 : undefined,

    expenseMode: formData.expenseMethod === '簡単' ? 'simple' : 'detailed',
    livingCostSimpleAnnual: formData.expenseMethod === '簡単' ? n(formData.livingCostSimple) * FC.MONTHS_PER_YEAR : undefined,
    detailedFixedAnnual: formData.expenseMethod === '詳細' ? detailedFixedAnnual : undefined,
    detailedVariableAnnual: formData.expenseMethod === '詳細' ? detailedVariableAnnual : undefined,

    car: {
      priceJPY: n(formData.carPrice) * FC.YEN_PER_MAN,
      firstAfterYears: n(formData.carFirstReplacementAfterYears),
      frequencyYears: n(formData.carReplacementFrequency),
      loan: {
        use: formData.carLoanUsage === 'はい',
        years: formData.carLoanUsage === 'はい' ? n(formData.carLoanYears) : undefined,
        type: formData.carLoanUsage === 'はい' ? formData.carLoanType as '銀行ローン' | 'ディーラーローン' : undefined,
      },
      currentLoan: (n(formData.carCurrentLoanMonthly) > 0 && n(formData.carCurrentLoanRemainingMonths) > 0) ? { monthlyPaymentJPY: n(formData.carCurrentLoanMonthly), remainingMonths: n(formData.carCurrentLoanRemainingMonths) } : undefined,
    },

    housing: {
      type: formData.housingType as '賃貸' | '持ち家（ローン中）' | '持ち家（完済）',
      rentMonthlyJPY: formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : undefined,
      currentLoan: formData.housingType === '持ち家（ローン中）' && n(formData.loanMonthlyPayment) > 0 && n(formData.loanRemainingYears) > 0 ? {
        monthlyPaymentJPY: n(formData.loanMonthlyPayment),
        remainingYears: n(formData.loanRemainingYears),
      } : undefined,
      purchasePlan: formData.housePurchasePlan ? {
        age: n(formData.housePurchasePlan.age),
        priceJPY: n(formData.housePurchasePlan.price) * FC.YEN_PER_MAN,
        downPaymentJPY: n(formData.housePurchasePlan.downPayment) * FC.YEN_PER_MAN,
        years: n(formData.housePurchasePlan.loanYears),
        rate: n(formData.housePurchasePlan.interestRate) / 100,
      } : undefined,
      renovations: formData.houseRenovationPlans.map(p => ({
        age: n(p.age),
        costJPY: n(p.cost) * FC.YEN_PER_MAN,
        cycleYears: p.cycleYears ? n(p.cycleYears) : undefined,
      })),
    },

    marriage: formData.planToMarry === 'する' ? {
      age: n(formData.marriageAge),
      engagementJPY: n(formData.engagementCost) * FC.YEN_PER_MAN,
      weddingJPY: n(formData.weddingCost) * FC.YEN_PER_MAN,
      honeymoonJPY: n(formData.honeymoonCost) * FC.YEN_PER_MAN,
      movingJPY: n(formData.newHomeMovingCost) * FC.YEN_PER_MAN,
      spouse: {
        ageAtMarriage: n(formData.spouseAgeAtMarriage),
        incomeGross: spouseIncomeForSim,
        customIncomeJPY: spouseIncomeForSim,
      },
      newLivingCostAnnual: n(formData.livingCostAfterMarriage) * FC.MONTHS_PER_YEAR,
      newHousingCostAnnual: n(formData.housingCostAfterMarriage) * FC.MONTHS_PER_YEAR,
    } : undefined,

    children: formData.hasChildren === 'はい' ? {
      count: n(formData.numberOfChildren),
      firstBornAge: n(formData.firstBornAge),
      educationPattern: formData.educationPattern as '公立中心' | '公私混合' | '私立中心',
    } : undefined,

    appliances: formData.appliances
      .filter(a =>
        String(a?.name ?? '').trim().length > 0 &&
        n(a?.cost) > 0 &&
        n(a?.cycle) > 0
      )
      .map(p => ({
        name: String(p.name),
        cycleYears: n(p.cycle),
        firstAfterYears: n(p.firstReplacementAfterYears ?? 0),
        cost10kJPY: n(p.cost)
      })),

    cares: formData.parentCareAssumption === 'はい' ? formData.parentCarePlans.map(p => ({
      id: p.id,
      parentCurrentAge: n(p.parentCurrentAge),
      parentCareStartAge: n(p.parentCareStartAge),
      years: n(p.years),
      monthly10kJPY: n(p.monthly10kJPY),
    })) : [],

    postRetirementLiving10kJPY: n(formData.postRetirementLivingCost),
    pensionMonthly10kJPY: n(formData.pensionAmount),
    spousePensionAmount: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spousePensionAmount) : undefined,

    currentSavingsJPY: n(formData.currentSavings) * FC.YEN_PER_MAN,
    monthlySavingsJPY: n(formData.monthlySavings),

    products: products,

    stressTest: {
      enabled: formData.interestRateScenario === 'ランダム変動',
      seed: n(formData.stressTestSeed),
    },

    interestScenario: formData.interestRateScenario as '固定利回り' | 'ランダム変動',
    expectedReturn: formData.interestRateScenario === '固定利回り' ? n(formData.fixedInterestRate) / 100 : undefined,
    emergencyFundJPY: n(formData.emergencyFund) * FC.YEN_PER_MAN,
    useSpouseNisa: formData.useSpouseNisa,
  };

  if (formData.retirementIncome &&
      formData.retirementIncome.amount !== undefined &&
      formData.retirementIncome.age !== undefined &&
      formData.retirementIncome.yearsOfService !== undefined) {
    params.retirementIncome = {
      amountJPY: n(formData.retirementIncome.amount) * FC.YEN_PER_MAN,
      age: n(formData.retirementIncome.age),
      yearsOfService: n(formData.retirementIncome.yearsOfService),
    };
  }

  if (formData.spouseRetirementIncome &&
      (formData.familyComposition === '既婚' || formData.planToMarry === 'する')) {
    const s = formData.spouseRetirementIncome;
    if (s.amount !== undefined && s.age !== undefined && s.yearsOfService !== undefined) {
      params.spouseRetirementIncome = {
        amountJPY: n(s.amount) * FC.YEN_PER_MAN,
        age: n(s.age),
        yearsOfService: n(s.yearsOfService),
      };
    }
  }

  if (Array.isArray(formData.personalPensionPlans)) {
    params.personalPensionPlans = formData.personalPensionPlans.map(p => ({
      type: p.type,
      amountJPY: n(p.amount) * FC.YEN_PER_MAN,
      startAge: n(p.startAge),
      duration: p.duration !== undefined ? n(p.duration) : undefined,
    }));
  }

  if (Array.isArray(formData.spousePersonalPensionPlans) &&
      (formData.familyComposition === '既婚' || formData.planToMarry === 'する')) {
    params.spousePersonalPensionPlans = formData.spousePersonalPensionPlans.map(p => ({
      type: p.type,
      amountJPY: n(p.amount) * FC.YEN_PER_MAN,
      startAge: n(p.startAge),
      duration: p.duration !== undefined ? n(p.duration) : undefined,
    }));
  }

  if (Array.isArray(formData.otherLumpSums)) {
    params.otherLumpSums = formData.otherLumpSums.map(p => ({
      name: String(p.name ?? ''),
      amountJPY: n(p.amount) * FC.YEN_PER_MAN,
      age: n(p.age),
    }));
  }

  if (Array.isArray(formData.spouseOtherLumpSums) &&
      (formData.familyComposition === '既婚' || formData.planToMarry === 'する')) {
    params.spouseOtherLumpSums = formData.spouseOtherLumpSums.map(p => ({
      name: String(p.name ?? ''),
      amountJPY: n(p.amount) * FC.YEN_PER_MAN,
      age: n(p.age),
    }));
  }

  if (formData.assumeReemployment) {
    params.reemployment = {
      startAge: 60,
      reductionRate: n(formData.reemploymentReductionRate) / 100,
    };
  }
  if (formData.spouseAssumeReemployment) {
    params.spouseReemployment = {
      startAge: 60,
      reductionRate: n(formData.spouseReemploymentReductionRate) / 100,
    };
  }

  return params;
};