import React from 'react';
import styles from './ReportPrintLayout.module.css';
import type { SimulationInputParams, YearlyData, PercentileData, InvestmentProduct } from '../../types/simulation-types';
import type { FormDataState } from '../../types/form-types';
import { buildDashboardDataset } from '../../utils/dashboard-helper';
import TotalAssetChart from '../dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../dashboard/AssetPieChart';
import LifePlanTimeline from '../dashboard/LifePlanTimeline';
import IncomePositionChart from '../dashboard/IncomePositionChart';
import SavingsPositionChart from '../dashboard/SavingsPositionChart';
import { getAssetGrade } from '../../assets/getAssetGrade';
import { extractLifePlanEvents, chunkEvents } from '../dashboard/life-plan-events';
import { buildAssumptionItems } from './assumption-helper';

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

const formatCurrency = (value: number): string => `¥${Math.round(value).toLocaleString('ja-JP')}`;
const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const ReportPrintLayout: React.FC<ReportPrintLayoutProps> = ({
  yearlyData,
  inputParams,
  summary,
  rawFormData,
  percentileData,
}) => {
  const dataset = React.useMemo(
    () => buildDashboardDataset(yearlyData, inputParams, percentileData),
    [yearlyData, inputParams, percentileData]
  );

  const currentAge = inputParams.initialAge || dataset.firstYear?.age || 0;
  const retireAge = inputParams.retirementAge || currentAge;

  const calculateDisplayTotal = (entry?: { [key: string]: number | undefined }): number => {
    if (!entry) return 0;
    return (entry['現金'] || 0) + (entry['NISA'] || 0) + (entry['iDeCo'] || 0) + (entry['課税口座'] || 0);
  };

  const firstYearTotal = calculateDisplayTotal(dataset.enrichedData[0]) || 0;
  const latestTotal = calculateDisplayTotal(dataset.enrichedData[dataset.enrichedData.length - 1]) || 0;
  const growthAmount = latestTotal - firstYearTotal || 0;
  const peakAssetValue = Math.max(
    0,
    ...dataset.enrichedData.map(entry => calculateDisplayTotal(entry))
  );

  const selfGrossIncome = (inputParams.mainJobIncomeGross ?? 0) + (inputParams.sideJobIncomeGross ?? 0);
  const totalGrossIncome =
    selfGrossIncome + ((inputParams.spouseMainJobIncomeGross ?? 0) + (inputParams.spouseSideJobIncomeGross ?? 0));
  const savingsForChart = dataset.firstYear?.totalAssets ?? 0;

  const retireData = React.useMemo(() => {
    const exact = yearlyData.find(d => d.age === retireAge);
    return exact ?? yearlyData[yearlyData.length - 1] ?? null;
  }, [yearlyData, retireAge]);

  const idecoSnapshot = React.useMemo(() => {
    const before = [...yearlyData].reverse().find(d => d.age < retireAge && (d.ideco?.balance ?? 0) > 0);
    return before ?? yearlyData.find(d => d.age === retireAge) ?? yearlyData[yearlyData.length - 1] ?? null;
  }, [yearlyData, retireAge]);

  const retireTotalAssets = retireData?.totalAssets ?? 0;
  const retireCash = retireData?.savings ?? 0;
  const retireIdecoBalance = idecoSnapshot?.ideco?.balance ?? 0;
  const retireIdecoPrincipal = idecoSnapshot?.ideco?.principal ?? 0;
  const retireNisaPrincipal = retireData?.nisa?.principal ?? 0;
  const retireNisaBalance = retireData?.nisa?.balance ?? 0;
  const retireNisaPnl = retireNisaBalance - retireNisaPrincipal;
  const retireTaxablePrincipal = retireData?.taxable?.principal ?? 0;
  const retireTaxableBalance = retireData?.taxable?.balance ?? 0;
  const retireTaxablePnl = retireTaxableBalance - retireTaxablePrincipal;

  const rankInfo = getAssetGrade(latestTotal);

  const totalAnnualInvestment =
    inputParams.products?.reduce((sum: number, p: InvestmentProduct) => sum + (p.recurringJPY ?? 0) + (p.spotJPY ?? 0), 0) ?? 0;
  const weightedAverageReturn =
    totalAnnualInvestment > 0
      ? (inputParams.products?.reduce(
          (sum: number, p: InvestmentProduct) =>
            sum + ((p.recurringJPY ?? 0) + (p.spotJPY ?? 0)) * (p.expectedReturn ?? 0),
          0
        ) ?? 0) / totalAnnualInvestment
      : 0;

  const timelineEvents = rawFormData ? extractLifePlanEvents(rawFormData) : [];
  const timelineChunks = chunkEvents(timelineEvents, 3);

  const assumptionItems = buildAssumptionItems(inputParams);
  const assumptionSections = ['基本情報', '収入・貯蓄', '生活費', '住宅', '自動車', '退職後', '年金', '投資・リスク']
    .map(category => ({
      category,
      items: assumptionItems.filter(i => i.category === category),
    }))
    .filter(section => section.items.length > 0);
  const assumptionSectionChunks: { category: string; items: typeof assumptionItems }[][] = [];
  const maxSectionsPerPage = 3;
  for (let i = 0; i < assumptionSections.length; i += maxSectionsPerPage) {
    assumptionSectionChunks.push(assumptionSections.slice(i, i + maxSectionsPerPage));
  }

  const productChunks: InvestmentProduct[][] = [];
  const products = inputParams.products ?? [];
  const productCardsPerPage = 2;
  for (let i = 0; i < products.length; i += productCardsPerPage) {
    productChunks.push(products.slice(i, i + productCardsPerPage));
  }

  const summaryCards = [
    { label: '初年度の総資産', value: formatCurrency(firstYearTotal), note: `開始年: ${dataset.firstYear?.year ?? '-'}年` },
    { label: '最終年の総資産', value: formatCurrency(latestTotal), note: `終了年: ${dataset.latestYear?.year ?? '-'}年` },
    {
      label: '総資産の増減',
      value: `${growthAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(growthAmount))}`,
      note: growthAmount >= 0 ? '資産は増加傾向です' : '資産が目減りしています',
    },
    { label: '期待利回り', value: formatPercent(weightedAverageReturn), note: `年間投資額: ${formatCurrency(totalAnnualInvestment)}` },
    { label: 'ピーク資産額', value: peakAssetValue === Number.NEGATIVE_INFINITY ? '-' : formatCurrency(peakAssetValue), note: 'シミュレーション期間中の最大値' },
    { label: '生活防衛費', value: formatCurrency(inputParams.emergencyFundJPY), note: '不足時に現金化して補填します' },
  ];

  if (summary && typeof summary.bankruptcyRate === 'number') {
    summaryCards.splice(4, 0, {
      label: 'プラン破綻確率',
      value: formatPercent(summary.bankruptcyRate),
      note: '資産が枯渇する確率の目安',
    });
  }

  const pages: React.ReactNode[] = [];

  pages.push(
    <div className={styles.pageContent}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <img src="/Topview.png" alt="キービジュアル" className="w-64 mb-8" />
        <h1 className="text-4xl font-bold mb-4">ライフプラン シミュレーションレポート</h1>
        <p className="text-xl mb-2">作成日: {new Date().toLocaleDateString('ja-JP')}</p>
        <p className="text-lg">このレポートは、お客様の入力情報に基づき作成された試算です。</p>
      </div>
    </div>
  );

  assumptionSectionChunks.forEach((chunk, idx) => {
    pages.push(
      <div className={styles.pageContent} key={`assumption-${idx}`}>
        <h2 className="text-2xl font-bold mb-4">シミュレーション前提条件（{idx + 1}/{assumptionSectionChunks.length}）</h2>
        <div className="space-y-4">
          {chunk.map(section => (
            <div key={section.category} className={styles.assumptionSection}>
              <div className={styles.assumptionHeader}>{section.category}</div>
              <div className={styles.assumptionList}>
                {section.items.map((item, i) => (
                  <div key={`${item.label}-${i}`}>
                    <p className={styles.assumptionItemLabel}>{item.label}</p>
                    <p className={styles.assumptionItemValue}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

  productChunks.forEach((chunk, idx) => {
    pages.push(
      <div className={styles.pageContent} key={`products-${idx}`}>
        <h2 className="text-2xl font-bold mb-4">投資商品（{idx + 1}/{productChunks.length}）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chunk.map((p: InvestmentProduct, i: number) => {
            const monthlyRecurring = (p.recurringJPY ?? 0) / 12;
            return (
              <div key={`${p.account}-${i}`} className={styles.assumptionSection}>
                <div className={styles.assumptionHeader}>商品{idx * productCardsPerPage + i + 1}（口座: {p.account}）</div>
                <div className={styles.assumptionList}>
                  <div>
                    <p className={styles.assumptionItemLabel}>評価額</p>
                    <p className={styles.assumptionItemValue}>{formatCurrency(p.currentJPY ?? 0)}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>月額積立</p>
                    <p className={styles.assumptionItemValue}>{`${formatCurrency(monthlyRecurring)} / 月`}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>スポット（年額）</p>
                    <p className={styles.assumptionItemValue}>{formatCurrency(p.spotJPY ?? 0)}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>想定利回り</p>
                    <p className={styles.assumptionItemValue}>{formatPercent(p.expectedReturn ?? 0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  pages.push(
    <div className={styles.pageContent}>
      <h2 className="text-2xl font-bold mb-4">レポートサマリー</h2>
      <p className="mb-6">
        ご入力いただいた情報に基づいてシミュレーションを実施した結果、お客様のライフプランは以下のようになりました。
        今後の資産推移をご確認ください。
      </p>

      <h3 className="text-xl font-semibold mb-3">主要指標サマリー</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="border p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-lg font-semibold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  );

  pages.push(
    <div className={styles.pageContent}>
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm text-gray-500">退職年齢時点の総資産額</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(retireTotalAssets)}</p>
          </div>
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm text-gray-500">現金保有額</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(retireCash)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">iDeCoサマリー（売却直前）</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>元本</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireIdecoPrincipal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>評価額</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireIdecoBalance)}</span>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">NISAサマリー</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>保有額</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireNisaBalance)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>元本</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireNisaPrincipal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>評価損益額</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireNisaPnl)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-sm text-gray-500 mb-2">課税口座サマリー</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>保有額</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireTaxableBalance)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>評価損益額</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(retireTaxablePnl)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  pages.push(
    <div className={styles.pageContent}>
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
  );

  if (rawFormData && timelineChunks.length > 0) {
    timelineChunks.forEach((chunk, idx) => {
      pages.push(
        <div className={styles.pageContent} key={`timeline-${idx}`}>
          <h2 className="text-2xl font-bold mb-4">ライフイベント・タイムライン（{idx + 1}/{timelineChunks.length}）</h2>
          <div className="p-3 border rounded-lg">
            <LifePlanTimeline rawFormData={rawFormData as FormDataState} yearlyData={yearlyData} eventsOverride={chunk} />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ご入力いただいたライフイベントと、それらが資産に与える影響のタイミングを一覧で表示しています。
          </p>
        </div>
      );
    });
  }

  productChunks.forEach((chunk: InvestmentProduct[], idx: number) => {
    pages.push(
      <div className={styles.pageContent} key={`products-${idx}`}>
        <h2 className="text-2xl font-bold mb-4">投資商品（{idx + 1}/{productChunks.length}）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chunk.map((p: InvestmentProduct, i: number) => {
            const monthlyRecurring = (p.recurringJPY ?? 0) / 12;
            return (
              <div key={`${p.account}-${i}`} className={styles.assumptionSection}>
                <div className={styles.assumptionHeader}>商品{idx * productCardsPerPage + i + 1}（口座: {p.account}）</div>
                <div className={styles.assumptionList}>
                  <div>
                    <p className={styles.assumptionItemLabel}>評価額</p>
                    <p className={styles.assumptionItemValue}>{formatCurrency(p.currentJPY ?? 0)}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>月額積立</p>
                    <p className={styles.assumptionItemValue}>{`${formatCurrency(monthlyRecurring)} / 月`}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>スポット（年額）</p>
                    <p className={styles.assumptionItemValue}>{formatCurrency(p.spotJPY ?? 0)}</p>
                  </div>
                  <div>
                    <p className={styles.assumptionItemLabel}>想定利回り</p>
                    <p className={styles.assumptionItemValue}>{formatPercent(p.expectedReturn ?? 0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  pages.push(
    <div className={styles.pageContent}>
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
  );

  pages.push(
    <div className={styles.pageContent}>
      <h2 className="text-2xl font-bold mb-4">免責事項</h2>
      <p className="text-md mb-4">
        本レポートは、ご入力いただいた情報に基づき試算されたものであり、将来の経済状況や個人の状況変化を保証するものではありません。
        表示される結果は将来を約束するものではなく、投資判断やその他の意思決定を行う際の唯一の根拠とすべきではありません。
        本シミュレーション結果により生じたいかなる損害についても、当社は一切の責任を負いません。
        ご自身の判断と責任においてご活用ください。
      </p>
      <p className="text-sm mt-8 text-gray-500">Copyright © {new Date().getFullYear()} [Your Company Name]. All rights reserved.</p>
    </div>
  );

  return (
    <div id="pdf-render-target" className={styles.container}>
      {pages.map((content, index) => (
        <div className={`${styles.page} pdf-page`} key={index}>
          <div className={styles.pageInner}>{content}</div>
          <div className={styles.pageFooter}>ページ {index + 1} / {pages.length}</div>
        </div>
      ))}
    </div>
  );
};
