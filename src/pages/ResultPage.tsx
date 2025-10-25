﻿import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IncomePositionChart from '../components/dashboard/IncomePositionChart';
import SavingsPositionChart from '../components/dashboard/SavingsPositionChart';
import TotalAssetChart from '../components/dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../components/dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../components/dashboard/AssetPieChart';
import AssetTable from '../components/dashboard/AssetTable';
import { getAssetGrade } from '../assets/getAssetGrade';
import { buildDashboardDataset } from '../utils/simulation';
import type { SimulationNavigationState } from '../types/simulation';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
  株式: '#EF4444',
  投資信託: '#8B5CF6',
  債券: '#F97316',
  仮想通貨: '#FBBF24',
  その他: '#6B7280',
};

const formatCurrency = (value: number): string => `¥${Math.round(value).toLocaleString()}`;
const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

// FormPage.tsxから computeNetAnnual 関数を移植
function computeNetAnnual(grossAnnualIncome: number): number {
  const n = (v: unknown): number => {
    const num = Number(v);
    return isFinite(num) ? num : 0;
  };

  const income = n(grossAnnualIncome);

  let salaryIncomeDeduction: number;
  if (income <= 1625000) { salaryIncomeDeduction = 550000; }
  else if (income <= 1800000) { salaryIncomeDeduction = income * 0.4 - 100000; }
  else if (income <= 3600000) { salaryIncomeDeduction = income * 0.3 + 80000; }
  else if (income <= 6600000) { salaryIncomeDeduction = income * 0.2 + 440000; }
  else if (income <= 8500000) { salaryIncomeDeduction = income * 0.1 + 1100000; }
  else { salaryIncomeDeduction = 1950000; }

  const socialInsurancePremium = income * 0.15;
  const basicDeduction = 480000;
  const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

  let incomeTax: number;
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

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SimulationNavigationState | undefined;
  const rawYearlyData = state?.yearlyData;
  const yearlyData = useMemo(() => rawYearlyData ?? [], [rawYearlyData]);
  const inputParams = state?.inputParams;

  const dataset = useMemo(() => buildDashboardDataset(yearlyData), [yearlyData]);
  // 商品別内訳（API拡張に対応：存在時のみ表示）
  const latestProducts = useMemo<Record<string, number>>(() => {
    if (!Array.isArray(yearlyData) || yearlyData.length === 0) return {};
    const last = yearlyData[yearlyData.length - 1];
    return last?.products ?? {};
  }, [yearlyData]);

  const handleSaveOutput = useCallback(() => {
    if (!yearlyData.length || typeof window === 'undefined') {
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(yearlyData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'output.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('failed to export simulation result', error);
    }
  }, [yearlyData]);

  if (!inputParams || dataset.enrichedData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-800">シミュレーション結果が見つかりません</h1>
          <p className="text-gray-600">フォームから再度シミュレーションを実行してください。</p>
          <button
            type="button"
            onClick={() => navigate('/form')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            フォームに戻る
          </button>
        </div>
      </div>
    );
  }

  const currentAge = inputParams.initialAge || dataset.firstYear?.age || 0;
  const retireAge = inputParams.retirementAge || currentAge;

  // 表示用の総資産（グラフの積み上げと一致）を計算するヘルパー
  const calculateDisplayTotal = (entry?: { [key: string]: number }): number => {
    if (!entry) return 0;
    // buildDashboardDatasetで作成された明確なキーを直接合計する
    return (entry['現金'] || 0) + (entry['NISA'] || 0) + (entry['iDeCo'] || 0) + (entry['課税口座'] || 0);
  };

  const firstYearTotal = calculateDisplayTotal(dataset.enrichedData[0]) || 0;
  const latestTotal = calculateDisplayTotal(dataset.enrichedData[dataset.enrichedData.length - 1]) || 0;
  const growthAmount = latestTotal - firstYearTotal || 0;
  const peakAssetValue = Math.max(0, ...dataset.enrichedData.map(entry => {
    const currentTotal = calculateDisplayTotal(entry);
    return currentTotal;
  }));

  // 収入偏差値グラフ用に、按分されていない「本人」の手取り年収を計算
  const selfGrossIncome = (inputParams.mainJobIncomeGross ?? 0) + (inputParams.sideJobIncomeGross ?? 0);
  const selfNetAnnualIncome = computeNetAnnual(selfGrossIncome);

  // サマリー表示用に、按分されていない「世帯」の手取り年収を計算
  const spouseGrossIncome = (inputParams.spouseMainJobIncomeGross ?? 0) + (inputParams.spouseSideJobIncomeGross ?? 0);
  const totalNetAnnualIncome = selfNetAnnualIncome + computeNetAnnual(spouseGrossIncome);

  const savingsForChart = dataset.firstYear?.totalAssets ?? 0;

  const rankInfo = getAssetGrade(latestTotal);

  const annualInvestment = (inputParams.yearlyRecurringInvestmentJPY ?? 0) + (inputParams.yearlySpotJPY ?? 0);

  // latestProducts は上部でメモ化済み

  const summaryCards = [
    {
      label: '初年度の総資産',
      value: formatCurrency(firstYearTotal),
      note: `開始年: ${dataset.firstYear?.year ?? '-'}年`,
    },
    {
      label: '最終年の総資産',
      value: formatCurrency(latestTotal),
      note: `終了年: ${dataset.latestYear?.year ?? '-'}年`,
    },
    {
      label: '総資産の増減',
      value: `${growthAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(growthAmount))}`,
      note: growthAmount >= 0 ? '資産は増加傾向です' : '資産が目減りしています',
    },
    {
      label: '期待利回り',
      value: formatPercent(inputParams.expectedReturn),
      note: `年間投資額: ${formatCurrency(annualInvestment)}`,
    },
    {
      label: 'ピーク資産額',
      value: peakAssetValue === Number.NEGATIVE_INFINITY ? '-' : formatCurrency(peakAssetValue),
      note: 'シミュレーション期間中の最大値',
    },
    {
      label: '生活防衛費',
      value: formatCurrency(inputParams.emergencyFundJPY),
      note: '不足時に現金化して補填します',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">シミュレーション結果</h1>
            <p className="text-gray-600 mt-1">フォーム入力をもとに {dataset.firstYear?.year ?? '-'} 年から {dataset.latestYear?.year ?? '-'} 年までの推移を可視化しました。</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveOutput}
              className={`px-4 py-2 rounded text-white ${yearlyData.length ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}`}
              disabled={!yearlyData.length}
            >
              結果を保存
            </button>
            <button
              type="button"
              onClick={() => navigate('/form')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              条件を修正する
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              トップに戻る
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 space-y-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-semibold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.note}</p>
              </div>
            ))}
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500 mb-2">入力条件サマリー</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>現在年齢: {currentAge} 歳</li>
                <li>退職予定: {retireAge} 歳</li>
                <li>年間手取り: {formatCurrency(totalNetAnnualIncome)}</li>
                <li>初期資産額: {formatCurrency(savingsForChart)}</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IncomePositionChart age={currentAge} income={selfGrossIncome} />
              <SavingsPositionChart age={currentAge} income={selfGrossIncome} savings={savingsForChart} />
            </div>

            <TotalAssetChart
              enrichedData={dataset.enrichedData}
              detailedAssetData={dataset.detailedAssetData}
              rankInfo={rankInfo}
              COLORS={COLORS}
              age={currentAge}
              retireAge={retireAge}
              yAxisMax={peakAssetValue}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <InvestmentPrincipalChart enrichedData={dataset.enrichedData} />
              <AssetPieChart pieData={dataset.pieData} />
            </div>

            <AssetTable enrichedData={dataset.enrichedData} />

            {Object.keys(latestProducts).length > 0 && (
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-lg font-semibold mb-2">商品別内訳（最新年）</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-2 py-1 text-left">商品</th>
                        <th className="px-2 py-1 text-right">残高</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(latestProducts).map(([k, v]) => (
                        <tr key={k} className="border-b">
                          <td className="px-2 py-1">{k}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
