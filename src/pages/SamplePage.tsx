import { useState } from 'react';
import { data } from '../assets/sampleData';
import { useNavigate } from 'react-router-dom';

import { getAssetGrade } from '../assets/getAssetGrade';

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
  const enrichedData = data.map((d) => ({
    ...d,
    総資産: d.現金 + d.NISA + d.iDeCo,
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
    { name: '現金', value: latest.現金 },
    { name: 'NISA', value: latest.NISA },
    { name: 'iDeCo', value: latest.iDeCo },
  ];

  const handleSave = (key: string) => {
    setEditFields((prev) => ({ ...prev, [key]: false }));
  };

  const rankInfo = getAssetGrade(currentTotalAsset);

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
          enrichedData={enrichedData as { [key: string]: number; year: number; 総資産: number; }[]}
          detailedAssetData={[]}
          rankInfo={rankInfo}
          COLORS={COLORS}
          age={parseInt(formData.age)}
          retireAge={parseInt(formData.retireAge)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InvestmentPrincipalChart enrichedData={enrichedData} />
          <AssetPieChart pieData={pieData} />
        </div>

        <AssetTable enrichedData={enrichedData} />
      </div>
    </div>
  );
}

