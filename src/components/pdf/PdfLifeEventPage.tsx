import React from 'react';
import styles from './ReportPrintLayout.module.css';
import LifePlanTimeline from '../dashboard/LifePlanTimeline';
import IncomePositionChart from '../dashboard/IncomePositionChart';
import SavingsPositionChart from '../dashboard/SavingsPositionChart';
import type { FormDataState } from '../../types/form-types';
import type { YearlyData } from '../../types/simulation-types';

interface PdfLifeEventPageProps {
  rawFormData: FormDataState;
  yearlyData: YearlyData[];
  currentAge: number;
  selfGrossIncome: number;
  totalGrossIncome: number;
  savingsForChart: number;
}

export const PdfLifeEventPage: React.FC<PdfLifeEventPageProps> = ({
  rawFormData,
  yearlyData,
  currentAge,
  selfGrossIncome,
  totalGrossIncome,
  savingsForChart,
}) => {
  return (
    <>
      {/* Page: Life Plan Timeline */}
      {rawFormData && (
        <div className={styles.page}>
          <h2 className="text-2xl font-bold mb-4">ライフイベント・タイムライン</h2>
          <div className="p-3 border rounded-lg">
            <LifePlanTimeline rawFormData={rawFormData} yearlyData={yearlyData} />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ご入力いただいたライフイベントと、それらが資産に与える影響のタイミングを一覧で表示しています。
          </p>
        </div>
      )}

      {/* Page: Peer Comparison Charts */}
      <div className={styles.page}>
        <h2 className="text-2xl font-bold mb-4">収入・貯蓄の同世代比較</h2>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="p-3 border rounded-lg">
            <IncomePositionChart age={currentAge} income={selfGrossIncome} />
          </div>
          <div className="p-3 border rounded-lg">
            <SavingsPositionChart age={currentAge} income={totalGrossIncome} savings={savingsForChart} />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          現在の収入と貯蓄が同世代と比較してどの位置にあるかを示しています。
        </p>
      </div>
    </>
  );
};
