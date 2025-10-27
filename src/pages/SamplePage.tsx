import { useState } from 'react';
import { data } from '../assets/sampleData';
import { useNavigate } from 'react-router-dom';

import { getAssetGrade } from '../assets/getAssetGrade';
import type { EnrichedYearlyAsset } from '../utils/simulation';

// Dashboard Components
import IncomePositionChart from '../components/dashboard/IncomePositionChart';
import SavingsPositionChart from '../components/dashboard/SavingsPositionChart';
import TotalAssetChart from '../components/dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../components/dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../components/dashboard/AssetPieChart';
import AssetTable from '../components/dashboard/AssetTable';
import PersonalTile from '../components/dashboard/PersonalTile';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

export default function SamplePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
  const enrichedData: EnrichedYearlyAsset[] = data.map((d) => ({
    age: 0, // 必須プロパティをデフォルト値で補完
    年間支出: 0,
    年間収入: 0,
    年間投資額: 0,
    年間収支: 0,
    ...d,
    総資産: (d.現金 || 0) + (d.NISA || 0) + (d.iDeCo || 0),
    投資元本: (d.NISA累積 || 0) + (d.iDeCo累積 || 0),
    課税口座: 0,
    NISA: d.NISA || 0,
    iDeCo: d.iDeCo || 0,
    NISA元本: d.NISA累積 || 0,
    iDeCo元本: d.iDeCo累積 || 0,
  }));

  const latest = enrichedData[enrichedData.length - 1];

  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    totalAsset: latest.総資産.toString(), 
    age: '35',
    retireAge: '65',
    income: '6000000',
    expense: '4000000',
    nisa: '600000',
    ideco: '276000',
    stockYield: '5.0',
    bondYield: '1.0',
    inflation: '1.5',
    medical: '2.0',
    withdrawRate: '4.0',
  }));

  const currentTotalAsset = parseFloat(formData.totalAsset) || latest.総資産;

  const pieData = [
    { name: '現金', value: latest.現金 || 0 },
    { name: 'NISA', value: latest.NISA || 0 },
    { name: 'iDeCo', value: latest.iDeCo || 0 },
  ];

  const handleSave = (key: string) => {
    setEditFields((prev) => ({ ...prev, [key]: false }));
  };

  const rankInfo = getAssetGrade(currentTotalAsset);

  const yAxisMax = Math.max(
    ...enrichedData.map(d => d.総資産)
  );

  return (
    <div className="relative bg-gray-100 min-h-screen">
      <button
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => navigate('/')}
        aria-label="トップに戻る"
      >
        ×
      </button>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => setMenuOpen(true)}
        aria-label="メニューを開く"
      >
        ≡
      </button>

      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto lg:fixed lg:top-0 lg:right-0 lg:h-screen lg:translate-x-0 lg:w-80 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 text-center">
          <button
            className="lg:hidden absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full text-lg"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>

          <PersonalTile 
            currentTotalAsset={currentTotalAsset}
            formData={formData}
            setFormData={setFormData}
            editFields={editFields}
            setEditFields={setEditFields}
            handleSave={handleSave}
          />

          <button className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold mt-6">
            再シミュレーション実行
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 lg:mr-80">
        <h2 className="text-2xl font-bold text-center mb-6">資産管理ダッシュボード</h2>

        <IncomePositionChart
          age={parseInt(formData.age)}
          income={parseInt(formData.income)}
        />

        <SavingsPositionChart
          age={parseInt(formData.age)}
          income={parseInt(formData.income)}
          savings={currentTotalAsset}
        />

        <TotalAssetChart
          enrichedData={enrichedData}
          rankInfo={rankInfo}
          COLORS={COLORS}
          age={parseInt(formData.age)}
          retireAge={parseInt(formData.retireAge)}
          yAxisMax={yAxisMax}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InvestmentPrincipalChart
            enrichedData={enrichedData}
            COLORS={COLORS}
            age={parseInt(formData.age)}
            retireAge={parseInt(formData.retireAge)}
          />
          <AssetPieChart pieData={pieData} />
        </div>

        <AssetTable enrichedData={enrichedData} />
      </div>
    </div>
  );
}
