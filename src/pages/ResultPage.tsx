import { useMemo } from 'react';
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
};

const formatCurrency = (value: number): string => `¥${Math.round(value).toLocaleString()}`;
const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SimulationNavigationState | undefined;
  const rawYearlyData = state?.yearlyData;
  const yearlyData = useMemo(() => rawYearlyData ?? [], [rawYearlyData]);
  const inputParams = state?.inputParams;

  const dataset = useMemo(() => buildDashboardDataset(yearlyData), [yearlyData]);

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
  const firstYearTotal = dataset.firstYear?.totalAssets ?? 0;
  const latestTotal = dataset.latestYear?.totalAssets ?? 0;
  const growthAmount = latestTotal - firstYearTotal;
  const peakAssetValue = dataset.enrichedData.reduce((max, entry) => Math.max(max, entry.総資産), Number.NEGATIVE_INFINITY);
  const incomeForChart = dataset.firstYear?.income ?? 0;
  const savingsForChart = dataset.firstYear?.totalAssets ?? 0;

  const rankInfo = getAssetGrade(latestTotal);

  const annualInvestment = inputParams.yearlyRecurringInvestmentJPY + inputParams.yearlySpotJPY;

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
                <li>年間手取り: {formatCurrency(incomeForChart)}</li>
                <li>初期積立額: {formatCurrency(savingsForChart)}</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IncomePositionChart age={currentAge} income={incomeForChart} />
              <SavingsPositionChart age={currentAge} income={incomeForChart} savings={savingsForChart} />
            </div>

            <TotalAssetChart
              enrichedData={dataset.enrichedData}
              rankInfo={rankInfo}
              COLORS={COLORS}
              age={currentAge}
              retireAge={retireAge}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <InvestmentPrincipalChart enrichedData={dataset.enrichedData} />
              <AssetPieChart pieData={dataset.pieData} />
            </div>

            <AssetTable enrichedData={dataset.enrichedData} />
          </div>
        </div>
      </div>
    </div>
  );
}