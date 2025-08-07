import type { VercelRequest, VercelResponse } from '@vercel/node';

interface InputParams {
  initialAge?: number;
  endAge?: number;
  currentSavings?: number;
  mainJobIncome?: number;
  incomeGrowthRate?: number;
  livingCost?: number;
  spouseInitialAge?: number;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const inputParams: InputParams = req.body.inputParams || {};

    const initialAge = inputParams.initialAge ?? 25;
    const endAge = inputParams.endAge ?? 90;
    const spouseInitialAge = inputParams.spouseInitialAge; // 将来拡張用
    let currentAssets = inputParams.currentSavings ?? 1000000;
    let mainJobIncome = inputParams.mainJobIncome ?? 4000000;
    const incomeGrowthRate = inputParams.incomeGrowthRate ?? 0.02;
    const livingCost = inputParams.livingCost ?? 2000000;

    const years = [];

    for (let age = initialAge; age <= endAge; age++) {
      const year = new Date().getFullYear() + (age - initialAge);

      const currentYearIncome = mainJobIncome;
      const currentYearExpense = livingCost;

      currentAssets = currentAssets + currentYearIncome - currentYearExpense;

      years.push({
        year,
        age,
        income: currentYearIncome,
        expense: currentYearExpense,
        assets: currentAssets,
      });

      mainJobIncome *= (1 + incomeGrowthRate);
    }

    const finalAssets = currentAssets;

    res.status(200).json({ result: { years, finalAssets } });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
