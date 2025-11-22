import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IncomePositionChart from '../components/dashboard/IncomePositionChart';
import SavingsPositionChart from '../components/dashboard/SavingsPositionChart';
import TotalAssetChart from '../components/dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../components/dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../components/dashboard/AssetPieChart';
import AssetTable from '../components/dashboard/AssetTable';
import CashFlowTable from '../components/dashboard/CashFlowTable';
import AccordionCard from '../components/dashboard/AccordionCard.tsx';
import LifePlanTimeline from '../components/dashboard/LifePlanTimeline.tsx';
import { getAssetGrade } from '../assets/getAssetGrade';
import { buildDashboardDataset } from '../utils/dashboard-helper';
import type { SimulationInputParams, SimulationNavigationState, YearlyData, InvestmentProduct } from '../types/simulation-types';
import type { FormDataState } from '../types/form-types';
import { useOrientation } from '../hooks/useOrientation';
import { computeNetAnnual } from '../utils/financial'; // 共通関数をインポート
import { MASTER_SECTIONS } from '@/constants/financial_const';
import { exportToExcel } from '../utils/export';
import { generatePdfReport } from '../utils/pdfGenerator';
import { ReportPrintLayout } from '../components/pdf/ReportPrintLayout';

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

import { formatCurrency, formatPercent } from '../utils/number';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const orientation = useOrientation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // 初期チェック
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileLandscape = isMobile && orientation === 'landscape';
  const state = location.state as SimulationNavigationState | undefined;
  const [showSectionModal, setShowSectionModal] = useState(false);
  const rawYearlyData = state?.yearlyData as YearlyData[] | undefined;
  const rawFormData = state?.rawFormData;
  // SimulationInputParams に products を追加
  const yearlyData = useMemo(() => rawYearlyData ?? [], [rawYearlyData]);
  const inputParams = state?.inputParams as (SimulationInputParams & { products?: InvestmentProduct[] }) | undefined;
  const summary = state?.summary;

  const percentileData = state?.percentileData;
  const dataset = useMemo(() => buildDashboardDataset(yearlyData, inputParams, percentileData), [yearlyData, inputParams, percentileData]);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  const calculateDisplayTotal = (entry?: { [key: string]: number | undefined }): number => {
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
  const totalGrossIncome = selfGrossIncome + spouseGrossIncome;
  const totalNetAnnualIncome = selfNetAnnualIncome + (spouseGrossIncome > 0 ? computeNetAnnual(spouseGrossIncome) : 0);

  const savingsForChart = dataset.firstYear?.totalAssets ?? 0;

  const rankInfo = getAssetGrade(latestTotal);

  // 期待利回りを、各商品の年間投資額で加重平均して計算する
  const totalAnnualInvestment = inputParams.products?.reduce((sum: number, p: InvestmentProduct) => sum + (p.recurringJPY ?? 0) + (p.spotJPY ?? 0), 0) ?? 0;
  const weightedAverageReturn = totalAnnualInvestment > 0
    ? (inputParams.products?.reduce((sum: number, p: InvestmentProduct) => sum + ((p.recurringJPY ?? 0) + (p.spotJPY ?? 0)) * (p.expectedReturn ?? 0), 0) ?? 0) / totalAnnualInvestment
    : 0;

  const summaryCards = [
    {
      label: '初年度の総資産',
      value: formatCurrency(firstYearTotal),
      note: `開始年: ${dataset.firstYear?.year ?? '-'}年 ${new Date().getMonth() + 1}月`,
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
      value: formatPercent(weightedAverageReturn),
      note: `年間投資額: ${formatCurrency(totalAnnualInvestment)}`,
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

  if (summary && typeof summary.bankruptcyRate === 'number') {
    summaryCards.splice(4, 0, { // ピーク資産額の前に挿入
      label: 'プラン破綻確率',
      value: formatPercent(summary.bankruptcyRate),
      note: '資産が枯渇する確率の目安',
    });
  }


  return (
    <>
      <ReportPrintLayout
        yearlyData={yearlyData}
        inputParams={inputParams}
        summary={summary}
        rawFormData={rawFormData as FormDataState}
        percentileData={percentileData}
      />
      <div className="min-h-screen bg-gray-100 py-10">
      <div
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 transition-transform duration-300 ease-in-out"
        style={{
          transform: isMobileLandscape ? 'scale(0.85)' : 'none',
          transformOrigin: 'top center',
        }}
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">シミュレーション結果</h1>
            <p className="text-gray-600 mt-1">フォーム入力をもとに {dataset.firstYear?.year ?? '-'} 年から {dataset.latestYear?.year ?? '-'} 年までの推移を可視化しました。</p>
          </div>
          <div className="flex gap-3">
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                className={`px-4 py-2 rounded text-white inline-flex items-center ${yearlyData.length ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}`}
                disabled={!yearlyData.length}
              >
                結果を保存
                <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.043-.481 1.576 0L10 10.405l2.908-2.857c.533-.481 1.141-.446 1.574 0 .436.445.408 1.197 0 1.615L10 13.232l-4.484-4.069c-.408-.418-.436-1.17 0-1.615z"/></svg>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <button
                      onClick={async () => {
                        setIsExportMenuOpen(false);
                        await generatePdfReport();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      レポートを保存 (PDF)
                    </button>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        if (inputParams) {
                          exportToExcel(yearlyData, inputParams);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      詳細データを保存 (Excel)
                    </button>
                    <button
                      onClick={() => { handleSaveOutput(); setIsExportMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      生データを保存 (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSectionModal(true)}
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
          <div id="pdf-summary-section" className="lg:col-span-1 space-y-4">
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
                <li>年間収入(世帯／手取り): {formatCurrency(totalNetAnnualIncome)}</li>
                <li>初期資産額: {formatCurrency(savingsForChart)}</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* モバイルではアコーディオンになるカード群 */}
            <AccordionCard title="総資産推移">
              <div id="pdf-total-asset-chart" className="bg-white rounded-xl shadow p-3 mb-6 relative">
                <TotalAssetChart
                  enrichedData={dataset.enrichedData}
                  rankInfo={rankInfo}
                  COLORS={COLORS}
                  age={currentAge}
                  retireAge={retireAge}
                  yAxisMax={peakAssetValue}
                />
              </div>
            </AccordionCard>

            {rawFormData && (
              <AccordionCard title="ライフプラン・タイムライン">
                <div id="pdf-timeline">
                  <LifePlanTimeline rawFormData={rawFormData as unknown as FormDataState} yearlyData={yearlyData} />
                </div>
              </AccordionCard>
            )}

            <AccordionCard title="収入・貯蓄の同世代比較">
              <div id="pdf-peer-comparison-charts" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <IncomePositionChart age={currentAge} income={selfGrossIncome} />
                <SavingsPositionChart age={currentAge} income={totalGrossIncome} savings={savingsForChart} />
              </div>
            </AccordionCard>

            <AccordionCard title="投資の状況">
              <div id="pdf-investment-charts" className="grid grid-cols-1 xl:grid-cols-2 gap-6 ">
                <div className="bg-white rounded-xl shadow p-4">
                  <InvestmentPrincipalChart enrichedData={dataset.enrichedData} COLORS={COLORS} age={currentAge} retireAge={retireAge} />
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <AssetPieChart pieData={dataset.pieData} />
                </div>
              </div>
            </AccordionCard>

            <AccordionCard title="資産詳細テーブル">
              <AssetTable enrichedData={dataset.enrichedData} />
            </AccordionCard>

            <AccordionCard title="年間収支詳細">
              <p className="text-sm text-gray-600 mb-4">
                初期資産額（現金預金）: {formatCurrency(inputParams.currentSavingsJPY)}
              </p>
              <CashFlowTable enrichedData={dataset.enrichedData} />
            </AccordionCard>

          </div>
        </div>
      </div>
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">どのセクションに戻りますか？</h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {MASTER_SECTIONS
                .map((section, index) => ({ section, originalIndex: index }))
                .filter(item => {
                  if (!rawFormData) return true;
                  // 既婚の場合は結婚セクションを除外
                  if (
                    (rawFormData as unknown as FormDataState).familyComposition === '既婚' &&
                    item.section === 'ライフイベント - 結婚'
                  ) {
                    return false;
                  }
                  return true;
                })
                .map(({ section, originalIndex }) => (
                <li key={originalIndex}>
                  <button
                    onClick={() => {
                      navigate('/form', { state: { rawFormData: rawFormData, sectionIndex: originalIndex } });
                      setShowSectionModal(false);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {section}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowSectionModal(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}