import React from 'react';
import styles from './ReportPrintLayout.module.css';
import AssetTable from '../dashboard/AssetTable';
import CashFlowTable from '../dashboard/CashFlowTable';
import type { DashboardDataset } from '../../utils/dashboard-helper';
import type { SimulationInputParams } from '../../types/simulation-types';
import { formatCurrency } from '../../utils/number';

interface PdfTablePageProps {
  dataset: DashboardDataset;
  inputParams: SimulationInputParams;
}

export const PdfTablePage: React.FC<PdfTablePageProps> = ({
  dataset,
  inputParams,
}) => {
  return (
    <div className={styles.page}>
      <h2 className="text-2xl font-bold mb-4">資産・収支詳細</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">資産詳細テーブル</h3>
        <AssetTable enrichedData={dataset.enrichedData} />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">年間収支詳細テーブル</h3>
        <p className="text-sm text-gray-600 mb-4">
          初期資産額（現金預金）: {formatCurrency(inputParams.currentSavingsJPY)}
        </p>
        <CashFlowTable enrichedData={dataset.enrichedData} />
      </div>
      <p className="text-sm text-gray-600 mt-4">
        年ごとの詳細な資産と収支の推移です。特定の年の内訳を確認するのに役立ちます。
      </p>
    </div>
  );
};
