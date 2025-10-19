const path = require('path');
const fs = require('fs');

const simulateModule = require('../tmp-ts-run/index.js');
const handler = simulateModule.default || simulateModule;

const formPath = path.join(__dirname, '..', '検証用', 'input.json');
const form = JSON.parse(fs.readFileSync(formPath, 'utf-8'));

const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const isYes = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'yes'
    || normalized === 'true'
    || normalized === '1'
    || normalized === 'はい'
    || normalized === 'する';
};

const monthlyInvestmentAmounts = form.monthlyInvestmentAmounts || {};
const monthlyRecurringInvestment = Object.values(monthlyInvestmentAmounts)
  .reduce((acc, v) => acc + toNum(v), 0);
const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12;
const yearlySpotJPY = [
  form.investmentStocksAnnualSpot,
  form.investmentTrustAnnualSpot,
  form.investmentBondsAnnualSpot,
  form.investmentIdecoAnnualSpot,
  form.investmentCryptoAnnualSpot,
  form.investmentOtherAnnualSpot,
].reduce((acc, v) => acc + toNum(v), 0);

const stocksCurrent = toNum(form.investmentStocksCurrent);
const trustCurrent = toNum(form.investmentTrustCurrent);
const bondsCurrent = toNum(form.investmentBondsCurrent);
const idecoCurrent = toNum(form.investmentIdecoCurrent);
const cryptoCurrent = toNum(form.investmentCryptoCurrent);
const otherCurrent = toNum(form.investmentOtherCurrent);

const stocksAccountType = String(form.investmentStocksAccountType ?? '').trim().toLowerCase() === 'nisa' ? 'nisa' : 'taxable';
const trustAccountType = String(form.investmentTrustAccountType ?? '').trim().toLowerCase() === 'nisa' ? 'nisa' : 'taxable';

const monthlyStocks = toNum(monthlyInvestmentAmounts.investmentStocksMonthly);
const monthlyTrust = toNum(monthlyInvestmentAmounts.investmentTrustMonthly);
const monthlyOther = [
  monthlyInvestmentAmounts.investmentBondsMonthly,
  monthlyInvestmentAmounts.investmentIdecoMonthly,
  monthlyInvestmentAmounts.investmentCryptoMonthly,
  monthlyInvestmentAmounts.investmentOtherMonthly,
].reduce((acc, v) => acc + toNum(v), 0);

const yearlyStocksRecurring = monthlyStocks * 12;
const yearlyTrustRecurring = monthlyTrust * 12;
const yearlyOtherRecurring = monthlyOther * 12;

const stocksSpot = toNum(form.investmentStocksAnnualSpot);
const trustSpot = toNum(form.investmentTrustAnnualSpot);
const otherSpot = [
  form.investmentBondsAnnualSpot,
  form.investmentIdecoAnnualSpot,
  form.investmentCryptoAnnualSpot,
  form.investmentOtherAnnualSpot,
].reduce((acc, v) => acc + toNum(v), 0);

const nisaCurrentHoldingsJPY = (stocksAccountType === 'nisa' ? stocksCurrent : 0)
  * 10000 + (trustAccountType === 'nisa' ? trustCurrent : 0) * 10000;
const taxableCurrentHoldingsJPY = (stocksAccountType === 'taxable' ? stocksCurrent : 0)
  * 10000 + (trustAccountType === 'taxable' ? trustCurrent : 0) * 10000
  + (bondsCurrent + idecoCurrent + cryptoCurrent + otherCurrent) * 10000;

const nisaRecurringAnnualJPY = (stocksAccountType === 'nisa' ? yearlyStocksRecurring : 0)
  + (trustAccountType === 'nisa' ? yearlyTrustRecurring : 0);
const taxableRecurringAnnualJPY = (stocksAccountType === 'taxable' ? yearlyStocksRecurring : 0)
  + (trustAccountType === 'taxable' ? yearlyTrustRecurring : 0)
  + yearlyOtherRecurring;

const nisaSpotAnnualJPY = (stocksAccountType === 'nisa' ? stocksSpot : 0)
  + (trustAccountType === 'nisa' ? trustSpot : 0);
const taxableSpotAnnualJPY = (stocksAccountType === 'taxable' ? stocksSpot : 0)
  + (trustAccountType === 'taxable' ? trustSpot : 0)
  + otherSpot;

const rates = [
  form.investmentStocksRate,
  form.investmentTrustRate,
  form.investmentBondsRate,
  form.investmentIdecoRate,
  form.investmentCryptoRate,
  form.investmentOtherRate,
].map(toNum).filter((x) => Number.isFinite(x));
const expectedReturn = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100;

const car = {
  priceJPY: toNum(form.carPrice) * 10000,
  firstAfterYears: toNum(form.carFirstReplacementAfterYears),
  frequencyYears: toNum(form.carReplacementFrequency),
  loan: {
    use: isYes(form.carLoanUsage),
    years: isYes(form.carLoanUsage) ? toNum(form.carLoanYears) : undefined,
    type: isYes(form.carLoanUsage) ? form.carLoanType : undefined,
  },
  currentLoan: undefined,
};

const carMonthly = toNum(form.carCurrentLoanMonthly);
const carRemainingYears = toNum(form.carCurrentLoanRemainingYears);
if (isYes(form.carCurrentLoanInPayment) && carMonthly > 0 && carRemainingYears > 0) {
  car.currentLoan = {
    monthlyPaymentJPY: carMonthly,
    remainingYears: carRemainingYears,
  };
}

const rentYen = toNum(form.currentRentLoanPayment);
const houseLoanMonthly = toNum(form.loanMonthlyPayment);
const houseLoanRemainingYears = toNum(form.loanRemainingYears);

const HOUSING_RENT = '賃貸';
const HOUSING_LOAN = '持ち家(ローンあり)';
const HOUSING_OWNED = '持ち家(ローンなし)';

let housingType = HOUSING_OWNED;
const rawHousingType = String(form.housingType ?? '');
if (rawHousingType.includes(HOUSING_RENT) || rentYen > 0) {
  housingType = HOUSING_RENT;
} else if (rawHousingType.includes('ローン') || (houseLoanMonthly > 0 && houseLoanRemainingYears > 0)) {
  housingType = HOUSING_LOAN;
}

const purchasePlan = form.housePurchasePlan;

const housing = {
  type: housingType,
  rentMonthlyJPY: housingType === HOUSING_RENT && rentYen > 0 ? rentYen : undefined,
  currentLoan: housingType === HOUSING_LOAN && houseLoanMonthly > 0 && houseLoanRemainingYears > 0
    ? {
        monthlyPaymentJPY: houseLoanMonthly,
        remainingYears: houseLoanRemainingYears,
      }
    : undefined,
  purchasePlan: purchasePlan
    ? {
        age: toNum(purchasePlan.age),
        priceJPY: toNum(purchasePlan.price) * 10000,
        downPaymentJPY: toNum(purchasePlan.downPayment) * 10000,
        years: toNum(purchasePlan.loanYears),
        rate: toNum(purchasePlan.interestRate),
      }
    : undefined,
  renovations: Array.isArray(form.houseRenovationPlans)
    ? form.houseRenovationPlans
        .map((r) => ({
          age: toNum(r.age),
          costJPY: toNum(r.cost) * 10000,
          cycleYears: r.cycleYears == null ? undefined : toNum(r.cycleYears),
        }))
        .filter((r) => r.age >= 0 && r.costJPY > 0)
    : undefined,
};

const appliances = Array.isArray(form.appliances)
  ? form.appliances
      .map((item) => ({
        name: typeof item.name === 'string' ? item.name.trim() : String(item.name ?? '').trim(),
        cycleYears: toNum(item.cycle),
        firstAfterYears: toNum(item.firstReplacementAfterYears),
        cost10kJPY: toNum(item.cost),
      }))
      .filter((a) => a.name && a.cost10kJPY > 0 && a.cycleYears > 0)
  : [];

const payload = {
  inputParams: {
    initialAge: toNum(form.personAge),
    spouseInitialAge: toNum(form.spouseAge) || undefined,
    endAge: toNum(form.simulationPeriodAge),
    retirementAge: toNum(form.retirementAge),
    pensionStartAge: toNum(form.pensionStartAge),
    mainJobIncomeGross: toNum(form.mainIncome) * 10000,
    sideJobIncomeGross: toNum(form.sideJobIncome) * 10000,
    spouseMainJobIncomeGross: toNum(form.spouseMainIncome) * 10000,
    spouseSideJobIncomeGross: toNum(form.spouseSideJobIncome) * 10000,
    incomeGrowthRate: 0,
    spouseIncomeGrowthRate: 0,
    expenseMode: toNum(form.livingCostSimple) > 0 ? 'simple' : 'detailed',
    livingCostSimpleAnnual: toNum(form.livingCostSimple) > 0 ? toNum(form.livingCostSimple) * 12 : undefined,
    detailedFixedAnnual: toNum(form.detailedFixedAnnual),
    detailedVariableAnnual: toNum(form.detailedVariableAnnual),
    car,
    housing,
    marriage: String(form.planToMarry ?? '') === 'する'
      ? {
          age: toNum(form.marriageAge),
          engagementJPY: toNum(form.engagementCost) * 10000,
          weddingJPY: toNum(form.weddingCost) * 10000,
          honeymoonJPY: toNum(form.honeymoonCost) * 10000,
          movingJPY: toNum(form.newHomeMovingCost) * 10000,
        }
      : undefined,
    children: undefined,
    appliances,
    care: {
      assume: isYes(form.parentCareAssumption),
      parentCurrentAge: toNum(form.parentCurrentAge),
      parentCareStartAge: toNum(form.parentCareStartAge),
      years: toNum(form.parentCareYears),
      monthly10kJPY: toNum(form.parentCareMonthlyCost),
    },
    postRetirementLiving10kJPY: toNum(form.postRetirementLivingCost),
    pensionMonthly10kJPY: toNum(form.pensionAmount),
    currentSavingsJPY: toNum(form.currentSavings) * 10000,
    monthlySavingsJPY: toNum(form.monthlySavings),
    currentInvestmentsJPY: (stocksCurrent + trustCurrent + bondsCurrent + idecoCurrent + cryptoCurrent + otherCurrent) * 10000,
    yearlyRecurringInvestmentJPY,
    yearlySpotJPY,
    expectedReturn,
    investmentTaxation: {
      nisa: {
        currentHoldingsJPY: nisaCurrentHoldingsJPY,
        annualRecurringContributionJPY: nisaRecurringAnnualJPY,
        annualSpotContributionJPY: nisaSpotAnnualJPY,
      },
      taxable: {
        currentHoldingsJPY: taxableCurrentHoldingsJPY,
        annualRecurringContributionJPY: taxableRecurringAnnualJPY,
        annualSpotContributionJPY: taxableSpotAnnualJPY,
      },
    },
    stressTest: {
      enabled: String(form.interestRateScenario ?? '') === 'ランダム変動',
      seed: toNum(form.stressTestSeed),
    },
    interestScenario: String(form.interestRateScenario ?? '') || '固定利回り',
    emergencyFundJPY: toNum(form.emergencyFund) * 10000,
  },
};

const req = { method: 'POST', body: payload };
const res = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.data = data;
    console.log('status', this.statusCode);
    if (Array.isArray(data.yearlyData) && data.yearlyData.length > 0) {
      const firstYear = data.yearlyData[0];
      console.log('firstYear', JSON.stringify(firstYear, null, 2));
      console.log('firstYearTotalAssets', firstYear.totalAssets);
    } else {
      console.log('response', JSON.stringify(data, null, 2));
    }
  },
};

Promise.resolve(handler(req, res)).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
