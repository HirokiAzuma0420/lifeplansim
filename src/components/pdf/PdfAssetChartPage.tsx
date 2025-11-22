import React from 'react';
import styles from './ReportPrintLayout.module.css';
import TotalAssetChart from '../dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../dashboard/AssetPieChart';
import type { DashboardDataset } from '../../utils/dashboard-helper'; // DashboardDataset の型をインポート
import type { RankInfo } from '../../assets/getAssetGrade'; // RankInfo の型をインポート

interface PdfAssetChartPageProps {
  dataset: DashboardDataset; // dataset は buildDashboardDataset の戻り値
  rankInfo: RankInfo;
  COLORS: { [key: string]: string }; // COLORS の型
  currentAge: number;
  retireAge: number;
  peakAssetValue: number;
}

export const PdfAssetChartPage: React.FC<PdfAssetChartPageProps> = ({
  dataset,
  rankInfo,
  COLORS,
  currentAge,
  retireAge,
  peakAssetValue,
}) => {
  return (
    <>
      {/* Page: Total Asset Chart */}
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

      {/* Page: Investment Charts */}
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
    </>
  );
};
