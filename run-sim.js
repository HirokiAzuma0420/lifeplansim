const simulate = require('./tmp-sim/index.js');
const form = require('./検証用/input.json');
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const monthlyInvestmentAmounts = form.monthlyInvestmentAmounts || {};
const monthlyRecurringInvestment = Object.values(monthlyInvestmentAmounts).reduce((sum, val) => sum + toNum(val), 0);
const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12;
const yearlySpotJPY = [
  form.investmentStocksAnnualSpot,
  form.investmentTrustAnnualSpot,
  form.investmentBondsAnnualSpot,
  form.investmentIdecoAnnualSpot,
  form.investmentCryptoAnnualSpot,
  form.investmentOtherAnnualSpot,
].reduce((sum, val) => sum + toNum(val), 0) * 10000; // mimic JsonTestPage bug
const stocksCurrent = toNum(form.investmentStocksCurrent);
const trustCurrent = toNum(form.investmentTrustCurrent);
const bondsCurrent = toNum(form.investmentBondsCurrent);
const idecoCurrent = toNum(form.investmentIdecoCurrent);
const cryptoCurrent = toNum(form.investmentCryptoCurrent);
const otherCurrent = toNum(form.investmentOtherCurrent);
const stocksAccountType = form.investmentStocksAccountType;
const trustAccountType = form.investmentTrustAccountType;
const monthlyStocks = toNum(monthlyInvestmentAmounts.investmentStocksMonthly);
const monthlyTrust = toNum(monthlyInvestmentAmounts.investmentTrustMonthly);
const monthlyOther = [
  monthlyInvestmentAmounts.investmentBondsMonthly,
  monthlyInvestmentAmounts.investmentIdecoMonthly,
  monthlyInvestmentAmounts.investmentCryptoMonthly,
  monthlyInvestmentAmounts.investmentOtherMonthly,
].reduce((sum, val) => sum + toNum(val), 0);
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
].reduce((sum, val) => sum + toNum(val), 0);
const nisaRecurringAnnualJPY = (stocksAccountType === 'nisa' ? yearlyStocksRecurring : 0) + (trustAccountType === 'nisa' ? yearlyTrustRecurring : 0);
const taxableRecurringAnnualJPY = (stocksAccountType === 'taxable' ? yearlyStocksRecurring : 0) + (trustAccountType === 'taxable' ? yearlyTrustRecurring : 0) + yearlyOtherRecurring;
const nisaSpotAnnualJPY = (stocksAccountType === 'nisa' ? stocksSpot : 0) + (trustAccountType === 'nisa' ? trustSpot : 0);
const taxableSpotAnnualJPY = (stocksAccountType === 'taxable' ? stocksSpot : 0) + (trustAccountType === 'taxable' ? trustSpot : 0) + otherSpot;
const rates = [form.investmentStocksRate, form.investmentTrustRate, form.investmentBondsRate, form.investmentIdecoRate, form.investmentCryptoRate, form.investmentOtherRate].map(toNum).filter(Number.isFinite);
const expectedReturn = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100;
const payload = {
  inputParams: {
    initialAge: toNum(form.personAge),
    endAge: toNum(form.simulationPeriodAge),
    retirementAge: toNum(form.retirementAge),
    pensionStartAge: toNum(form.pensionStartAge),
    mainJobIncomeGross: toNum(form.mainIncome) * 10000,
    sideJobIncomeGross: toNum(form.sideJobIncome) * 10000,
    spouseMainJobIncomeGross: toNum(form.spouseMainIncome) * 10000,
    spouseSideJobIncomeGross: toNum(form.spouseSideJobIncome) * 10000,
    incomeGrowthRate: 0,
    spouseIncomeGrowthRate: 0,
    expenseMode: 'simple',
    livingCostSimpleAnnual: toNum(form.livingCostSimple) * 12,
    car: { priceJPY: toNum(form.carPrice) * 10000, firstAfterYears: toNum(form.carFirstReplacementAfterYears), frequencyYears: toNum(form.carReplacementFrequency), loan: { use: false } },
    housing: { type: form.housingType },
    appliances: [],
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
        currentHoldingsJPY: (stocksAccountType === 'nisa' ? stocksCurrent : 0) * 10000 + (trustAccountType === 'nisa' ? trustCurrent : 0) * 10000,
        annualRecurringContributionJPY: nisaRecurringAnnualJPY,
        annualSpotContributionJPY: nisaSpotAnnualJPY,
      },
      taxable: {
        currentHoldingsJPY: (stocksAccountType === 'taxable' ? stocksCurrent : 0) * 10000 + (trustAccountType === 'taxable' ? trustCurrent : 0) * 10000 + (bondsCurrent + idecoCurrent + cryptoCurrent + otherCurrent) * 10000,
        annualRecurringContributionJPY: taxableRecurringAnnualJPY,
        annualSpotContributionJPY: taxableSpotAnnualJPY,
      },
    },
    stressTest: { enabled: false, seed: 0 },
    interestScenario: '固定利回り',
    emergencyFundJPY: toNum(form.emergencyFund) * 10000,
  }
};

const req = { method: 'POST', body: payload };
const res = {
  status(code) { this.statusCode = code; return this; },
  json(data) {
    console.log('status', this.statusCode);
    console.log('first year', data.yearlyData[0]);
  }
};

Promise.resolve(simulate.default(req, res)).catch(err => console.error(err));
