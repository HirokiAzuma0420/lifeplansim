const fs = require('fs');
const path = require('path');

// =====================================================================================
// index.ts からシミュレーションロジックとヘルパー関数をコピー
// =====================================================================================

const SPECIFIC_ACCOUNT_TAX_RATE = 0.20315;
const NISA_CONTRIBUTION_CAP = 18000000;
const NISA_RECURRING_ANNUAL_CAP = 1200000;
const NISA_SPOT_ANNUAL_CAP = 2400000;

const n = (v) => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

function computeNetAnnual(grossAnnualIncome) {
  const income = n(grossAnnualIncome);
  let salaryIncomeDeduction;
  if (income <= 1625000) { salaryIncomeDeduction = 550000; }
  else if (income <= 1800000) { salaryIncomeDeduction = income * 0.4 - 100000; }
  else if (income <= 3600000) { salaryIncomeDeduction = income * 0.3 + 80000; }
  else if (income <= 6600000) { salaryIncomeDeduction = income * 0.2 + 440000; }
  else if (income <= 8500000) { salaryIncomeDeduction = income * 0.1 + 1100000; }
  else { salaryIncomeDeduction = 1950000; }
  const socialInsurancePremium = income * 0.15;
  const basicDeduction = 480000;
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);
  let incomeTax;
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

function boxMullerTransform() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const R = Math.sqrt(-2.0 * Math.log(u));
  const theta = 2.0 * Math.PI * v;
  return [R * Math.cos(theta), R * Math.sin(theta)];
}

function generateNormalRandom(mean, stdDev) {
  const [z0] = boxMullerTransform();
  return z0 * stdDev + mean;
}

function generateReturnSeries(averageReturn, volatility, years) {
  console.log(`
--- generateReturnSeries for ${years} years (avg: ${averageReturn * 100}%, vol: ${volatility * 100}%) ---`);
  if (years <= 0) return [];

  const targetArithmeticMean = averageReturn;
  console.log(`  目標幾何平均 (入力): ${(averageReturn * 100).toFixed(2)}%`);
  console.log(`  目標算術平均 (計算値): ${(targetArithmeticMean * 100).toFixed(2)}%`);

  const returns = [];
  for (let i = 0; i < years; i++) {
    const yearReturn = generateNormalRandom(targetArithmeticMean, volatility);
    returns.push(yearReturn);
  }

  const actualMean = returns.reduce((sum, val) => sum + val, 0) / years;
  console.log(`  補正前の実績算術平均: ${(actualMean * 100).toFixed(2)}%`);

  const correction = targetArithmeticMean - actualMean;
  console.log(`  補正値: ${(correction * 100).toFixed(4)}%`);

  const correctedReturns = returns.map(r => r + correction);
  const correctedArithmeticMean = correctedReturns.reduce((sum, val) => sum + val, 0) / years;
  console.log(`  補正後の実績算術平均: ${(correctedArithmeticMean * 100).toFixed(2)}%`);

  // 実績幾何平均の計算を追加
  const productOfReturns = correctedReturns.reduce((acc, r) => acc * (1 + r), 1);
  const actualGeometricMean = Math.pow(productOfReturns, 1 / years) - 1;
  console.log(`  補正後の実績幾何平均: ${(actualGeometricMean * 100).toFixed(2)}%`);
  console.log('--------------------------------------------------');

  return correctedReturns;
}

function runSimulation(params) {
  const yearlyData = [];
  let currentAge = params.initialAge;
  const baseYear = new Date().getFullYear();
  const productList = Array.isArray(params.products) ? params.products : [];

  const stressTestEnabled = params.stressTest?.enabled ?? false;
  const simulationYears = params.endAge - params.initialAge + 1;
  const VOLATILITY = 0.15;

  const productReturnSeries = new Map();
  if (stressTestEnabled) {
    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const series = generateReturnSeries(n(p.expectedReturn), VOLATILITY, simulationYears);
      productReturnSeries.set(productId, series);
    });
  }

  let savings = n(params.currentSavingsJPY);
  const nisa = { principal: 0, balance: 0 };
  const ideco = { principal: 0, balance: 0 };
  const taxable = { principal: 0, balance: 0 };
  const productBalances = {};

  productList.forEach((p, index) => {
    const productId = `${p.key}-${index}`;
    const current = n(p.currentJPY);
    productBalances[productId] = { principal: current, balance: current };
  });

  let cumulativeNisaContribution = 0;
  const idecoCashOutAge = 60; // Simplified for test

  for (let i = 0; currentAge <= params.endAge; i++, currentAge++) {
    const year = baseYear + i;

    // At the beginning of the loop, aggregate product balances to account balances
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
    if (i === 0) {
        cumulativeNisaContribution = nisa.principal;
    }

    if (currentAge === idecoCashOutAge) {
        savings += ideco.balance;
        ideco.principal = 0;
        ideco.balance = 0;
        productList.forEach((p, index) => {
            if (p.account === 'iDeCo') {
                const productId = `${p.key}-${index}`;
                productBalances[productId] = { principal: 0, balance: 0 };
            }
        });
    }
    const annualIncome = (currentAge < params.retirementAge) ? (n(params.mainJobIncomeGross) + n(params.spouseMainJobIncomeGross)) : 0;
    const totalExpense = (currentAge < params.retirementAge) ? n(params.livingCostSimpleAnnual) : (200000 * 12); // Simplified

    let totalInvestmentOutflow = 0;
    if (currentAge < params.retirementAge) {
        productList.forEach((p, index) => {
            const productId = `${p.key}-${index}`;
            const contribution = n(p.recurringJPY) + n(p.spotJPY);
            if (p.account === '非課税') {
                productBalances[productId].principal += contribution;
                productBalances[productId].balance += contribution;
                totalInvestmentOutflow += contribution;
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

    productList.forEach((p, index) => {
      const productId = `${p.key}-${index}`;
      const productBucket = productBalances[productId];
      if (productBucket.balance <= 0) return;
      let yearlyReturn = 0;
      if (stressTestEnabled) {
        yearlyReturn = productReturnSeries.get(productId)[i];
      } else {
        yearlyReturn = n(p.expectedReturn);
      }
      productBucket.balance *= (1 + yearlyReturn);
    });

    const cashFlow = annualIncome - totalExpense - totalInvestmentOutflow;
    savings += cashFlow;

    // Simplified withdrawal logic for test
    if (savings < 0) {
        taxable.balance += savings;
        savings = 0;
    }

    yearlyData.push({
      year,
      age: currentAge,
      income: Math.round(annualIncome),
      totalExpense: Math.round(totalExpense),
      savings: Math.round(savings),
      nisa: { principal: Math.round(nisa.principal), balance: Math.round(nisa.balance) },
      ideco: { principal: Math.round(ideco.principal), balance: Math.round(ideco.balance) },
      taxable: { principal: Math.round(taxable.principal), balance: Math.round(taxable.balance) },
      totalAssets: Math.round(savings + nisa.balance + ideco.balance + taxable.balance),
    });
  }

  return yearlyData;
}

// =====================================================================================
// テスト実行部分
// =====================================================================================

// input.json を参考に手動で InputParams を構築
const params = {
  initialAge: 35,
  endAge: 90,
  retirementAge: 65,
  mainJobIncomeGross: 4200000,
  spouseMainJobIncomeGross: 2500000,
  livingCostSimpleAnnual: 250000 * 12,
  currentSavingsJPY: 3000000,
  stressTest: {
    enabled: true,
  },
  products: [
    {
      key: 'ideco',
      account: 'iDeCo',
      currentJPY: 1000000,       // 100万円
      recurringJPY: 10000 * 12,  // 年間12万円
      spotJPY: 0,
      expectedReturn: 0.04,      // 4.0%
    },
    {
      key: 'trust',
      account: '非課税', // NISA
      currentJPY: 500000,        // 50万円
      recurringJPY: 20000 * 12,  // 年間24万円
      spotJPY: 0,
      expectedReturn: 0.06,      // 6.0%
    }
  ],
};

console.log('シミュレーションを開始します...');
const result = runSimulation(params);

console.log('\n--- シミュレーション結果 ---');
const finalYear = result[result.length - 1];
console.log(`最終年 (${finalYear.age}歳) の資産合計: ${Math.round(finalYear.totalAssets / 10000)}万円`);
console.log(`  - iDeCo: ${Math.round(finalYear.ideco.balance / 10000)}万円 (元本: ${Math.round(finalYear.ideco.principal / 10000)}万円)`);
console.log(`  - NISA: ${Math.round(finalYear.nisa.balance / 10000)}万円 (元本: ${Math.round(finalYear.nisa.principal / 10000)}万円)`);

// iDeCoの平均リターンを簡易的に計算
const idecoProduct = params.products.find(p => p.key === 'ideco');
const idecoPrincipal = idecoProduct.currentJPY + (params.retirementAge - params.initialAge) * idecoProduct.recurringJPY;
const idecoFinalBalance = result.find(y => y.age === params.retirementAge -1).ideco.balance;
// 簡易的な年平均リターン (複利を無視した単利換算)
const idecoDuration = params.retirementAge - params.initialAge;
const idecoAvgReturn = (idecoFinalBalance / idecoPrincipal - 1) / idecoDuration;
// console.log(`iDeCoの簡易平均実質リターン: ${(idecoAvgReturn * 100).toFixed(2)}% (目標: ${idecoProduct.expectedReturn * 100}%)`);
