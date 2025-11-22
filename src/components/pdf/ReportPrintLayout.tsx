import React from 'react';
import styles from './ReportPrintLayout.module.css';
import type { SimulationInputParams, YearlyData, PercentileData } from '../../types/simulation-types';
import type { FormDataState } from '../../types/form-types';
import { buildDashboardDataset } from '../../utils/dashboard-helper';
import TotalAssetChart from '../dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../dashboard/AssetPieChart';
import LifePlanTimeline from '../dashboard/LifePlanTimeline';
import IncomePositionChart from '../dashboard/IncomePositionChart';
import SavingsPositionChart from '../dashboard/SavingsPositionChart';
import AssetTable from '../dashboard/AssetTable';
import CashFlowTable from '../dashboard/CashFlowTable';
import { getAssetGrade } from '../../assets/getAssetGrade';
import { computeNetAnnual } from '../../utils/financial';


interface ReportPrintLayoutProps {
  yearlyData: YearlyData[];
  inputParams: SimulationInputParams;
  summary?: { bankruptcyRate: number };
  rawFormData?: FormDataState;
  percentileData?: PercentileData;
}

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

export const ReportPrintLayout: React.FC<ReportPrintLayoutProps> = ({
  yearlyData,
  inputParams,
  summary,
  rawFormData,
  percentileData,
}) => {
  const dataset = React.useMemo(() => buildDashboardDataset(yearlyData, inputParams, percentileData), [yearlyData, inputParams, percentileData]);

  const currentAge = inputParams.initialAge || dataset.firstYear?.age || 0;
  const retireAge = inputParams.retirementAge || currentAge;

  const calculateDisplayTotal = (entry?: { [key: string]: number | undefined }): number => {
    if (!entry) return 0;
    return (entry['現金'] || 0) + (entry['NISA'] || 0) + (entry['iDeCo'] || 0) + (entry['課税口座'] || 0);
  };

  const firstYearTotal = calculateDisplayTotal(dataset.enrichedData[0]) || 0;
  const latestTotal = calculateDisplayTotal(dataset.enrichedData[dataset.enrichedData.length - 1]) || 0;
  const growthAmount = latestTotal - firstYearTotal || 0;
  const peakAssetValue = Math.max(0, ...dataset.enrichedData.map(entry => {
    const currentTotal = calculateDisplayTotal(entry);
    return currentTotal;
  }));

  const selfGrossIncome = (inputParams.mainJobIncomeGross ?? 0) + (inputParams.sideJobIncomeGross ?? 0);
  const totalGrossIncome = selfGrossIncome + ((inputParams.spouseMainJobIncomeGross ?? 0) + (inputParams.spouseSideJobIncomeGross ?? 0));
  const totalNetAnnualIncome = computeNetAnnual(totalGrossIncome);
  const savingsForChart = dataset.firstYear?.totalAssets ?? 0;

  const rankInfo = getAssetGrade(latestTotal);

  const totalAnnualInvestment = inputParams.products?.reduce((sum: number, p) => sum + (p.recurringJPY ?? 0) + (p.spotJPY ?? 0), 0) ?? 0;
  const weightedAverageReturn = totalAnnualInvestment > 0
    ? (inputParams.products?.reduce((sum: number, p) => sum + ((p.recurringJPY ?? 0) + (p.spotJPY ?? 0)) * (p.expectedReturn ?? 0), 0) ?? 0) / totalAnnualInvestment
    : 0;

  const summaryCards = [
    { label: '初年度の総資産', value: formatCurrency(firstYearTotal), note: `開始年: ${dataset.firstYear?.year ?? '-'}年` },
    { label: '最終年の総資産', value: formatCurrency(latestTotal), note: `終了年: ${dataset.latestYear?.year ?? '-'}年` },
    { label: '総資産の増減', value: `${growthAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(growthAmount))}`, note: growthAmount >= 0 ? '資産は増加傾向です' : '資産が目減りしています' },
    { label: '期待利回り', value: formatPercent(weightedAverageReturn), note: `年間投資額: ${formatCurrency(totalAnnualInvestment)}` },
    { label: 'ピーク資産額', value: peakAssetValue === Number.NEGATIVE_INFINITY ? '-' : formatCurrency(peakAssetValue), note: 'シミュレーション期間中の最大値' },
    { label: '生活防衛費', value: formatCurrency(inputParams.emergencyFundJPY), note: '不足時に現金化して補填します' },
  ];

  if (summary && typeof summary.bankruptcyRate === 'number') {
    summaryCards.splice(4, 0, { // ピーク資産額の前に挿入
      label: 'プラン破綻確率',
      value: formatPercent(summary.bankruptcyRate),
      note: '資産が枯渇する確率の目安',
    });
  }


  return (
    <div id="pdf-render-target" className={styles.container}>
      {/* Page 1: Cover Page */}
      <div className={styles.page}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <img src="/Topview.png" alt="Key Visual" className="w-64 mb-8" />
          <h1 className="text-4xl font-bold mb-4">ライフプラン シミュレーションレポート</h1>
          <p className="text-xl mb-2">作成日: {new Date().toLocaleDateString('ja-JP')}</p>
          {/* TODO: 対象者名を追加 */}
          <p className="text-lg">このレポートは、お客様の入力情報に基づき作成された試算です。</p>
        </div>
      </div>

      {/* Page 2: Summary and Input Conditions */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">レポートサマリー</h2>
        <p className="mb-6">
          ご入力いただいた情報に基づいてシミュレーションを実施した結果、お客様のライフプランは以下のようになりました。
          今後の資産推移をご確認ください。
        </p>

        <h3 className="text-xl font-semibold mb-3">主要指標サマリー</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="border p-3 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-lg font-semibold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.note}</p>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-3">シミュレーション前提条件</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>現在年齢: {currentAge} 歳</li>
          <li>退職予定: {retireAge} 歳</li>
          <li>年間収入(世帯／手取り): {formatCurrency(totalNetAnnualIncome)}</li>
          <li>初期資産額: {formatCurrency(savingsForChart)}</li>
          {/* その他の主要な入力パラメータもここに追加 */}
          <li>運用利回り: {formatPercent(inputParams.expectedReturn ?? 0)}</li>
          <li>ストレス耐性: {inputParams.stressTest.enabled ? '有効' : '無効'}</li>
        </ul>
      </div>

      {/* Page 3: Total Asset Chart */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">総資産推移</h2>
        <div className="p-3 mb-6 relative border rounded-lg">
          <TotalAssetChart
            enrichedData={dataset.enrichedData}
            rankInfo={rankInfo}
            COLORS={COLORS}
            age={currentAge}
            retireAge={retireAge}
            yAxisMax={peakAssetValue}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          退職年齢の{retireAge}歳に向けて資産は順調に増加し、その後は資産を取り崩しながら生活する様子が分かります。
          （免責事項: このグラフは試算であり、将来の結果を保証するものではありません。）
        </p>
      </div>

      {/* Page 4: Investment Charts */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">投資の状況</h2>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="p-3 border rounded-lg">
            <InvestmentPrincipalChart enrichedData={dataset.enrichedData} COLORS={COLORS} age={currentAge} retireAge={retireAge} />
          </div>
          <div className="p-3 border rounded-lg">
            <AssetPieChart pieData={dataset.pieData} />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          投資元本と評価額の推移、および現在の資産構成を示しています。リスク分散の状況などをご確認ください。
        </p>
      </div>
      
      {/* Page 5: Life Plan Timeline */}
      {rawFormData && (
        <div className={styles.page}>
          <h2 className="text-2xl font-bold mb-4">ライフイベント・タイムライン</h2>
          <div className="p-3 border rounded-lg">
            <LifePlanTimeline rawFormData={rawFormData as FormDataState} yearlyData={yearlyData} />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ご入力いただいたライフイベントと、それらが資産に与える影響のタイミングを一覧で表示しています。
          </p>
        </div>
      )}

      {/* Page 6: Peer Comparison Charts */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">収入・貯蓄の同世代比較</h2>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="p-3 border rounded-lg">
            <IncomePositionChart age={currentAge} income={inputParams.mainJobIncomeGross + (inputParams.sideJobIncomeGross ?? 0)} />
          </div>
          <div className="p-3 border rounded-lg">
            <SavingsPositionChart age={currentAge} income={totalGrossIncome} savings={savingsForChart} />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          現在の収入と貯蓄が同世代と比較してどの位置にあるかを示しています。
        </p>
      </div>

      {/* Page 7: Asset and Cash Flow Tables */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">資産・収支詳細</h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">資産詳細テーブル</h3>
          <AssetTable enrichedData={dataset.enrichedData} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">年間収支詳細テーブル</h3>
          <CashFlowTable enrichedData={dataset.enrichedData} />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          年ごとの詳細な資産と収支の推移です。特定の年の内訳を確認するのに役立ちます。
        </p>
      </div>

      {/* Last Page: Disclaimer */}
      <div className={styles.page}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-4">免責事項</h2>
          <p className="text-md mb-4">
            本レポートは、お客様にご入力いただいた情報に基づき試算されたものであり、将来の経済状況や個人の状況変化を保証するものではありません。
            表示される結果は将来を約束するものではなく、投資判断やその他の意思決定を行う際の唯一の根拠とすべきではありません。
            本シミュレーション結果により生じたいかなる損害についても、当社は一切の責任を負いません。
            ご自身の判断と責任においてご活用ください。
          </p>
          <p className="text-sm mt-8">Copyright © {new Date().getFullYear()} [Your Company Name]. All rights reserved.</p>
        </div>
      </div>

    </div>
  );
};
