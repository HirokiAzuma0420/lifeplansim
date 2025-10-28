import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IncomePositionChart from '../components/dashboard/IncomePositionChart';
import SavingsPositionChart from '../components/dashboard/SavingsPositionChart';
import TotalAssetChart from '../components/dashboard/TotalAssetChart';
import InvestmentPrincipalChart from '../components/dashboard/InvestmentPrincipalChart';
import AssetPieChart from '../components/dashboard/AssetPieChart';
import AssetTable from '../components/dashboard/AssetTable';
import CashFlowTable from '../components/dashboard/CashFlowTable.tsx';
import AccordionCard from '../components/dashboard/AccordionCard.tsx';
import { getAssetGrade } from '../assets/getAssetGrade';
import { buildDashboardDataset } from '../utils/simulation';
import type { SimulationInputParams, YearlyData, InvestmentProduct } from '../types/simulation'; // InvestmentProduct をインポート
import { useOrientation } from '../hooks/useOrientation';
import sampleInput from '../../sample/input_sample.json';
import type { FormDataState } from './FormPage'; // FormDataState をインポート

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

export default function SamplePage() {
  const navigate = useNavigate();
  const orientation = useOrientation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const runSampleSimulation = async () => {
      setLoading(true);
      setError(null);
      try {
        // FormPage.tsxからデータ変換ロジックを移植
        const n = (v: unknown): number => {
          const num = Number(v);
          return isFinite(num) ? num : 0;
        };

        const formData: FormDataState = sampleInput as FormDataState; // formData を FormDataState で型付け

        const mainJobIncomeGross = n(formData.mainIncome) * 10000;
        const sideJobIncomeGross = n(formData.sideJobIncome) * 10000;
        const spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseMainIncome) : 0) * 10000;
        const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseSideJobIncome) : 0) * 10000;

        const monthlyFixedExpense = n(formData.utilitiesCost) + n(formData.communicationCost) + n(formData.insuranceCost) + n(formData.educationCost) + n(formData.otherFixedCost);
        const detailedFixedAnnual = monthlyFixedExpense * 12;
        const monthlyVariableExpense = n(formData.foodCost) + n(formData.dailyNecessitiesCost) + n(formData.transportationCost) + n(formData.clothingBeautyCost) + n(formData.socializingCost) + n(formData.hobbyEntertainmentCost) + n(formData.otherVariableCost);
        const detailedVariableAnnual = monthlyVariableExpense * 12;

        const stocksCurrentYen = n(formData.investmentStocksCurrent) * 10000;
        const trustCurrentYen = n(formData.investmentTrustCurrent) * 10000;
        const bondsCurrentYen = n(formData.investmentBondsCurrent) * 10000;
        const idecoCurrentYen = n(formData.investmentIdecoCurrent) * 10000;
        const cryptoCurrentYen = n(formData.investmentCryptoCurrent) * 10000;
        const otherOnlyCurrentYen = n(formData.investmentOtherCurrent) * 10000;

        const yearlyStocksRecurringYen = n(formData.monthlyInvestmentAmounts.investmentStocksMonthly) * 12;
        const yearlyTrustRecurringYen = n(formData.monthlyInvestmentAmounts.investmentTrustMonthly) * 12;
        const yearlyBondsRecurringYen = n(formData.monthlyInvestmentAmounts.investmentBondsMonthly) * 12;
        const yearlyIdecoRecurringYen = n(formData.monthlyInvestmentAmounts.investmentIdecoMonthly) * 12;
        const yearlyCryptoRecurringYen = n(formData.monthlyInvestmentAmounts.investmentCryptoMonthly) * 12;
        const yearlyOtherOnlyRecurringYen = n(formData.monthlyInvestmentAmounts.investmentOtherMonthly) * 12;

        const stocksSpotYen = n(formData.investmentStocksAnnualSpot);
        const trustSpotYen = n(formData.investmentTrustAnnualSpot);
        const bondsSpotYen = n(formData.investmentBondsAnnualSpot);
        const idecoSpotYen = n(formData.investmentIdecoAnnualSpot);
        const cryptoSpotYen = n(formData.investmentCryptoAnnualSpot);
        const otherOnlySpotYen = n(formData.investmentOtherAnnualSpot);

        const products = [
          { key: 'stocks', account: formData.investmentStocksAccountType === 'nisa' ? '非課税' : '課税', currentJPY: stocksCurrentYen, recurringJPY: yearlyStocksRecurringYen, spotJPY: stocksSpotYen, expectedReturn: n(formData.investmentStocksRate) / 100 },
          { key: 'trust', account: formData.investmentTrustAccountType === 'nisa' ? '非課税' : '課税', currentJPY: trustCurrentYen, recurringJPY: yearlyTrustRecurringYen, spotJPY: trustSpotYen, expectedReturn: n(formData.investmentTrustRate) / 100 },
          { key: 'bonds', account: '課税', currentJPY: bondsCurrentYen, recurringJPY: yearlyBondsRecurringYen, spotJPY: bondsSpotYen, expectedReturn: n(formData.investmentBondsRate) / 100 },
          { key: 'crypto', account: '課税', currentJPY: cryptoCurrentYen, recurringJPY: yearlyCryptoRecurringYen, spotJPY: cryptoSpotYen, expectedReturn: n(formData.investmentCryptoRate) / 100 },
          { key: 'other', account: formData.investmentOtherAccountType === 'nisa' ? '非課税' : '課税', currentJPY: otherOnlyCurrentYen, recurringJPY: yearlyOtherOnlyRecurringYen, spotJPY: otherOnlySpotYen, expectedReturn: n(formData.investmentOtherRate) / 100 },
          { key: 'ideco', account: 'iDeCo', currentJPY: idecoCurrentYen, recurringJPY: yearlyIdecoRecurringYen, spotJPY: idecoSpotYen, expectedReturn: n(formData.investmentIdecoRate) / 100 },
        ] as InvestmentProduct[];

        const apiParams: SimulationInputParams = {
          initialAge: n(formData.personAge),
          spouseInitialAge: formData.familyComposition === '既婚' ? n(formData.spouseAge) : undefined,
          endAge: n(formData.simulationPeriodAge),
          retirementAge: n(formData.retirementAge),
          pensionStartAge: n(formData.pensionStartAge),
          spouseRetirementAge: formData.familyComposition === '既婚' ? n(formData.spouseRetirementAge) : undefined,
          spousePensionStartAge: formData.familyComposition === '既婚' ? n(formData.spousePensionStartAge) : undefined,
          mainJobIncomeGross: mainJobIncomeGross,
          sideJobIncomeGross: sideJobIncomeGross,
          spouseMainJobIncomeGross: spouseMainJobIncomeGross,
          spouseSideJobIncomeGross: spouseSideJobIncomeGross,
          incomeGrowthRate: 1.5 / 100, // FormPageのデフォルト値を仮使用
          spouseIncomeGrowthRate: formData.familyComposition === '既婚' ? 1.5 / 100 : undefined, // FormPageのデフォルト値を仮使用
          expenseMode: formData.expenseMethod === '簡単' ? 'simple' : 'detailed',
          livingCostSimpleAnnual: formData.expenseMethod === '簡単' ? n(formData.livingCostSimple) : undefined,
          detailedFixedAnnual: formData.expenseMethod === '詳細' ? detailedFixedAnnual : undefined,
          detailedVariableAnnual: formData.expenseMethod === '詳細' ? detailedVariableAnnual : undefined,
          car: {
            priceJPY: n(formData.carPrice) * 10000,
            firstAfterYears: n(formData.carFirstReplacementAfterYears),
            frequencyYears: n(formData.carReplacementFrequency),
            loan: {
              use: formData.carLoanUsage === 'はい',
              years: formData.carLoanUsage === 'はい' ? n(formData.carLoanYears) : undefined,
              type: formData.carLoanUsage === 'はい' ? formData.carLoanType as '銀行ローン' | 'ディーラーローン' : undefined,
            },
            currentLoan: (n(formData.carCurrentLoanMonthly) > 0 && n(formData.carCurrentLoanRemainingMonths) > 0) ? { monthlyPaymentJPY: n(formData.carCurrentLoanMonthly), remainingMonths: n(formData.carCurrentLoanRemainingMonths) } : undefined,
          },
          housing: {
            type: formData.housingType as '賃貸' | '持ち家（ローン中）' | '持ち家（完済）',
            rentMonthlyJPY: formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : undefined,
            currentLoan: formData.housingType === '持ち家（ローン中）' && n(formData.loanMonthlyPayment) > 0 && n(formData.loanRemainingYears) > 0 ? { monthlyPaymentJPY: n(formData.loanMonthlyPayment), remainingYears: n(formData.loanRemainingYears) } : undefined,
            purchasePlan: formData.housePurchasePlan ? { age: n(formData.housePurchasePlan.age), priceJPY: n(formData.housePurchasePlan.price) * 10000, downPaymentJPY: n(formData.housePurchasePlan.downPayment) * 10000, years: n(formData.housePurchasePlan.loanYears), rate: n(formData.housePurchasePlan.interestRate) / 100 } : undefined,
            renovations: formData.houseRenovationPlans.map(p => ({ age: n(p.age), costJPY: n(p.cost) * 10000, cycleYears: p.cycleYears ? n(p.cycleYears) : undefined })),
          },
          marriage: formData.planToMarry === 'する' ? { age: n(formData.marriageAge), engagementJPY: n(formData.engagementCost) * 10000, weddingJPY: n(formData.weddingCost) * 10000, honeymoonJPY: n(formData.honeymoonCost) * 10000, movingJPY: n(formData.newHomeMovingCost) * 10000 } : undefined,
          children: formData.hasChildren === 'はい' ? { count: n(formData.numberOfChildren), firstBornAge: n(formData.firstBornAge), educationPattern: formData.educationPattern as '公立中心' | '公私混合' | '私立中心' } : undefined,
          appliances: formData.appliances.filter(a => a?.name && n(a.cost) > 0 && n(a.cycle) > 0).map(p => ({ name: String(p.name), cycleYears: n(p.cycle), firstAfterYears: n(p.firstReplacementAfterYears ?? 0), cost10kJPY: n(p.cost) })),
          cares: formData.parentCareAssumption === 'はい' ? formData.parentCarePlans.map(p => ({ id: p.id, parentCurrentAge: n(p.parentCurrentAge), parentCareStartAge: n(p.parentCareStartAge), years: n(p.years), monthly10kJPY: n(p.monthly10kJPY) })) : [],
          postRetirementLiving10kJPY: n(formData.postRetirementLivingCost),
          pensionMonthly10kJPY: n(formData.pensionAmount),
          spousePensionMonthly10kJPY: formData.familyComposition === '既婚' ? n(formData.spousePensionAmount) : undefined,
          currentSavingsJPY: n(formData.currentSavings) * 10000,
          monthlySavingsJPY: n(formData.monthlySavings),
          products: products,
          stressTest: {
            enabled: formData.interestRateScenario === 'ランダム変動',
            seed: n(formData.stressTestSeed),
          },
          interestScenario: formData.interestRateScenario as '固定利回り' | 'ランダム変動',
          emergencyFundJPY: n(formData.emergencyFund) * 10000,
        };

        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputParams: apiParams }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'サンプルのシミュレーション実行中にエラーが発生しました。');
        }
        setYearlyData(data.yearlyData || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました。');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    runSampleSimulation();
  }, []);

  const isMobileLandscape = isMobile && orientation === 'landscape';
  const inputParams = sampleInput as unknown as (SimulationInputParams & { products?: InvestmentProduct[] });
  const dataset = useMemo(() => buildDashboardDataset(yearlyData, inputParams), [yearlyData, inputParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">サンプルデータを生成中...</p>
          <p className="text-gray-500">シミュレーションを実行しています。少々お待ちください。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600">エラー</h1>
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  const n = (v: unknown): number => { // n関数をトップレベルに移動
    const num = Number(v);
    return isFinite(num) ? num : 0;
  };

  const currentAge = inputParams.initialAge || dataset.firstYear?.age || 0;
  const retireAge = inputParams.retirementAge || currentAge;

  const calculateDisplayTotal = (entry?: { [key: string]: number | undefined }): number => { // ヘルパー関数を移動
    if (!entry) return 0;
    return (entry['現金'] || 0) + (entry['NISA'] || 0) + (entry['iDeCo'] || 0) + (entry['課税口座'] || 0);
  };
  const firstYearTotal = calculateDisplayTotal(dataset.enrichedData[0]) || 0;
  const latestTotal = calculateDisplayTotal(dataset.enrichedData[dataset.enrichedData.length - 1]) || 0;
  const growthAmount = latestTotal - firstYearTotal || 0;
  const peakAssetValue = Math.max(0, ...dataset.enrichedData.map(entry => calculateDisplayTotal(entry))); // 収入と利回りの計算を移動

  const selfGrossIncome = (inputParams.mainJobIncomeGross ?? 0) + (inputParams.sideJobIncomeGross ?? 0);
  const savingsForChart = dataset.firstYear?.totalAssets ?? 0; // 収入と利回りの計算を移動
  const rankInfo = getAssetGrade(latestTotal); // 収入と利回りの計算を移動

  const summaryCards = [
    { label: '初年度の総資産', value: formatCurrency(firstYearTotal), note: `開始年: ${dataset.firstYear?.year ?? '-'}年` },
    { label: '最終年の総資産', value: formatCurrency(latestTotal), note: `終了年: ${dataset.latestYear?.year ?? '-'}年` },
    { label: '総資産の増減', value: `${growthAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(growthAmount))}`, note: growthAmount >= 0 ? '資産は増加傾向です' : '資産が目減りしています' },
    { label: '期待利回り', value: formatPercent(0.0507), note: `年間投資額: ${formatCurrency(420000)}` },
    { label: 'ピーク資産額', value: formatCurrency(peakAssetValue), note: 'シミュレーション期間中の最大値' },
    { label: '生活防衛費', value: formatCurrency(n(sampleInput.emergencyFund) * 10000), note: '不足時に現金化して補填します' }, // 正しい値を参照
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 transition-transform duration-300 ease-in-out"
        style={{ transform: isMobileLandscape ? 'scale(0.85)' : 'none', transformOrigin: 'top center' }}
      >
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">サンプルシミュレーション</h1>
            <p className="text-gray-600 mt-1">これはサンプルの入力データに基づいたシミュレーション結果です。</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/form')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              自分で試す
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
                <li>年間収入(世帯／手取り): {formatCurrency(4182500)}</li>
                <li>初期資産額: {formatCurrency(savingsForChart)}</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <AccordionCard title="総資産推移">
              <div className="bg-white rounded-xl shadow p-3 mb-6 relative">
                <TotalAssetChart enrichedData={dataset.enrichedData} rankInfo={rankInfo} COLORS={COLORS} age={currentAge} retireAge={retireAge} yAxisMax={peakAssetValue} />
              </div>
            </AccordionCard>

            <AccordionCard title="収入・貯蓄の同世代比較">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <IncomePositionChart age={currentAge} income={selfGrossIncome} />
                <SavingsPositionChart age={currentAge} income={5260000} savings={savingsForChart} />
              </div>
            </AccordionCard>

            <AccordionCard title="投資の状況">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 ">
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
    </div>
  );
}
