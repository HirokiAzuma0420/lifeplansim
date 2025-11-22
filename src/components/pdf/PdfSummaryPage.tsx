import React from 'react';
import styles from './ReportPrintLayout.module.css';
import { formatCurrency, formatPercent } from '../../utils/number';
import type { SimulationInputParams } from '../../types/simulation-types';

interface SummaryCardProps {
  label: string;
  value: string;
  note: string;
}

interface PdfSummaryPageProps {
  summaryCards: SummaryCardProps[];
  currentAge: number;
  retireAge: number;
  totalNetAnnualIncome: number;
  savingsForChart: number;
  inputParams: SimulationInputParams;
}

export const PdfSummaryPage: React.FC<PdfSummaryPageProps> = ({
  summaryCards,
  currentAge,
  retireAge,
  totalNetAnnualIncome,
  savingsForChart,
  inputParams,
}) => {
  return (
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
        <li>運用利回り: {formatPercent(inputParams.expectedReturn ?? 0)}</li>
        <li>ストレス耐性: {inputParams.stressTest.enabled ? '有効' : '無効'}</li>
      </ul>
    </div>
  );
};
