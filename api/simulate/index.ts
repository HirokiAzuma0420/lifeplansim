import type { VercelRequest, VercelResponse } from '@vercel/node';

interface InputParams {
  initialAge?: number;
  endAge?: number;
  currentSavings?: number;
  mainJobIncome?: number;
  incomeGrowthRate?: number;
  livingCost?: number;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const inputParams: InputParams = req.body || {};

    const initialAge = inputParams.initialAge ?? 25;
    const endAge = inputParams.endAge ?? 65;
    let currentAssets = inputParams.currentSavings ?? 1000000;
    let mainJobIncome = inputParams.mainJobIncome ?? 4000000;
    const incomeGrowthRate = inputParams.incomeGrowthRate ?? 0.02;
    const livingCost = inputParams.livingCost ?? 2000000;

    type YearData = {
    year: number;
    age: number;
    income: number;
    expense: number;
    assets: number;
    };

    const years: YearData[] = [];

    for (let age = initialAge; age <= endAge; age++) {
      const year = new Date().getFullYear() + (age - initialAge);

      const currentYearIncome = mainJobIncome;
      const currentYearExpense = livingCost;

      currentAssets = currentAssets + currentYearIncome - currentYearExpense;

      years.push({
        year,
        age,
        income: Math.round(currentYearIncome / 1000) * 1000,
        expense: Math.round(currentYearExpense / 1000) * 1000,
        assets: Math.round(currentAssets / 1000) * 1000,
      });

      mainJobIncome *= (1 + incomeGrowthRate);
    }

    const finalAssets = currentAssets;

    res.status(200).json({ result: { years, finalAssets } });
  } catch (error: unknown) {
  if (error instanceof Error) {
    // Error型なら .message が使える
    console.error('Simulation error:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } else {
    // それ以外（たとえばstring型やnumber型）も考慮
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
  }
}