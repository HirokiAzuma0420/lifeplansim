﻿import React, { useState, useMemo, useEffect} from 'react';
import { useLocation, useNavigate, } from 'react-router-dom';
import type { YearlyData, SimulationInputParams, CarePlan } from '../types/simulation';

function computeNetAnnual(grossAnnualIncome: number): number {
    // 簡略化された税・社会保障費計算
    // 課税所得 = 額面収入 - 給与所得控除 - 社会保険料控除 - 基礎控除
    // 所得税 = 課税所得 * 所得税率 - 控除額
    // 住民税 = 課税所得 * 住民税率 - 控除額
    // 社会保険料 = 額面収入 * 社会保険料率

    const n = (v: unknown): number => {
        const num = Number(v);
        return isFinite(num) ? num : 0;
    };

    const income = n(grossAnnualIncome);

    // 給与所得控除 (令和2年以降)
    let salaryIncomeDeduction: number;
    if (income <= 1625000) {
        salaryIncomeDeduction = 550000;
    } else if (income <= 1800000) {
        salaryIncomeDeduction = income * 0.4 - 100000;
    } else if (income <= 3600000) {
        salaryIncomeDeduction = income * 0.3 + 80000;
    } else if (income <= 6600000) {
        salaryIncomeDeduction = income * 0.2 + 440000;
    } else if (income <= 8500000) {
        salaryIncomeDeduction = income * 0.1 + 1100000;
    } else {
        salaryIncomeDeduction = 1950000;
    }

    // 社会保険料 (健康保険、厚生年金、雇用保険) - 簡略化のため一律15%とする
    const socialInsurancePremium = income * 0.15;

    // 基礎控除 (令和2年以降)
    const basicDeduction = 480000;

    // 課税所得
    const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

    // 所得税
    let incomeTax: number;
    if (taxableIncome <= 1950000) {
        incomeTax = taxableIncome * 0.05;
    } else if (taxableIncome <= 3300000) {
        incomeTax = taxableIncome * 0.1 - 97500;
    } else if (taxableIncome <= 6950000) {
        incomeTax = taxableIncome * 0.2 - 427500;
    } else if (taxableIncome <= 9000000) {
        incomeTax = taxableIncome * 0.23 - 636000;
    } else if (taxableIncome <= 18000000) {
        incomeTax = taxableIncome * 0.33 - 1536000;
    } else if (taxableIncome <= 40000000) {
        incomeTax = taxableIncome * 0.4 - 2796000;
    } else {
        incomeTax = taxableIncome * 0.45 - 4796000;
    }

    // 住民税 (均等割5,000円 + 所得割10%) - 簡略化
    const residentTax = taxableIncome * 0.1 + 5000;

    // 手取り収入 = 額面収入 - 社会保険料 - 所得税 - 住民税
    const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

    return Math.max(0, netAnnualIncome);
}

import { Trash2 } from "lucide-react";

import AssetAccordion from "../components/AssetAccordion";
import type { InvestmentFormValues, InvestmentMonthlyAmounts } from "../types/investment";

// --- 確認画面用のヘルパーを追加 ---
const formatYen = (value: number | string | undefined) => {
  const num = Number(value);
  if (value === undefined || isNaN(num)) return '未設定';
  return `${Math.round(num).toLocaleString()} 円`;
};

const formatManYen = (value: number | string | undefined) => {
  const num = Number(value);
  if (value === undefined || isNaN(num)) return '未設定';
  return `${Math.round(num * 10000).toLocaleString()} 円`;
};

const ConfirmationSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8 border border-gray-200 rounded-lg p-4 text-left">
    <h3 className="text-xl font-bold mb-4 border-b pb-2">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const ConfirmationItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-right">{value}</span>
  </div>
);

const sections = [
  '家族構成',
  '現在の収入',
  '現在の支出',
  'ライフイベント - 車',
  'ライフイベント - 家',
  'ライフイベント - 結婚',
  'ライフイベント - 子供',
  'ライフイベント - 生活',
  'ライフイベント - 親の介護',
  'ライフイベント - 老後',
  '貯蓄',
  '投資',
  'シミュレーション設定',
];

const LIFE_PLAN_FORM_CACHE_KEY = 'lifePlanFormDataCache';
const CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const initialMonthlyInvestmentAmounts: InvestmentMonthlyAmounts = {
  investmentStocksMonthly: '0',
  investmentTrustMonthly: '0',
  investmentBondsMonthly: '0',
  investmentIdecoMonthly: '0',
  investmentCryptoMonthly: '0',
  investmentOtherMonthly: '0',
};

const createDefaultCarePlan = (): Omit<CarePlan, 'id'> & { id: number } => ({
  id: Date.now(),
  parentCurrentAge: 70,
  parentCareStartAge: 80,
  monthly10kJPY: 10,
  years: 5,
});

const createDefaultFormData = () => ({
  familyComposition: '', // 家族構成
  personAge: '',
  spouseAge: '',
  mainIncome: '',
  spouseMainIncome: '',
  sideJobIncome: '0',
  spouseSideJobIncome: '0',
  expenseMethod: '', // 単純or詳細
  livingCostSimple: '',
  housingCost: '',
  utilitiesCost: '',
  communicationCost: '',
  carCost: '',
  insuranceCost: '',
  educationCost: '',
  otherFixedCost: '0',
  foodCost: '',
  dailyNecessitiesCost: '',
  transportationCost: '',
  clothingBeautyCost: '',
  socializingCost: '',
  hobbyEntertainmentCost: '',
  otherVariableCost: '0',
  carPurchasePlan: '',
  carFirstReplacementAfterYears: '',
  carPrice: '',
  carReplacementFrequency: '',
  carLoanUsage: '',
  carLoanYears: '',
  carLoanType: '',
  housingType: '' as '賃貸' | '持ち家（ローン中）' | '持ち家（完済）',
  carCurrentLoanInPayment: '',
  carCurrentLoanMonthly: '',
  carCurrentLoanRemainingMonths: '',
  housePurchaseIntent: '',
  housePurchasePlan: null as { age: number, price: number, downPayment: number, loanYears: number, interestRate: number } | null,
  houseRenovationPlans: [] as { age: number, cost: number, cycleYears?: number }[],
  housePurchaseAge: '',
  housePurchasePrice: '',
  headDownPayment: '',
  housingLoanYears: '',
  housingLoanInterestRateType: '', // 固定or変動
  housingLoanInterestRate: '',
  housingLoanStatus: '', // これから借りるorすでに返済中or借入予定なし
  loanOriginalAmount: '',
  loanMonthlyPayment: '',
  loanRemainingYears: '',
  loanInterestRate: '',
  planToMarry: '', // 結婚予定or予定なし
  spouseAgeAtMarriage: '',
  spouseIncomePattern: '',
  spouseCustomIncome: '',
  livingCostAfterMarriage: '',
  isLivingCostEdited: false,
  housingCostAfterMarriage: '',
  isHousingCostEdited: false,
  marriageAge: '',
  engagementCost: '200',
  weddingCost: '330',
  honeymoonCost: '35',
  newHomeMovingCost: '50',
  hasChildren: '', // ありorなし
  numberOfChildren: '',
  firstBornAge: '',
  educationPattern: '', // 公立のみor私立混在or私立のみ
  currentRentLoanPayment: '',
  otherLargeExpenses: '',
  parentCareAssumption: '', // ありor未定orなし
  parentCarePlans: [createDefaultCarePlan()],
  retirementAge: '65',
  postRetirementLivingCost: '25',
  spouseRetirementAge: '65',
  spousePensionStartAge: '65',
  spousePensionAmount: '10',
  pensionStartAge: '65',
  pensionAmount: '15',
  currentSavings: '',
  monthlySavings: '',
  hasInvestment: '', // ありorなし
  investmentStocksCurrent: '',
  investmentTrustCurrent: '',
  investmentBondsCurrent: '',
  investmentIdecoCurrent: '',
  investmentCryptoCurrent: '',
  investmentOtherCurrent: '',
  investmentStocksAccountType: 'taxable' as 'nisa' | 'taxable',
  investmentTrustAccountType: 'taxable' as 'nisa' | 'taxable',
  investmentOtherAccountType: 'taxable' as 'nisa' | 'taxable',
  monthlyInvestmentAmounts: { ...initialMonthlyInvestmentAmounts },
  investmentStocksAnnualSpot: '0',
  investmentTrustAnnualSpot: '0',
  investmentBondsAnnualSpot: '0',
  investmentIdecoAnnualSpot: '0',
  investmentCryptoAnnualSpot: '0',
  investmentOtherAnnualSpot: '0',
  investmentStocksRate: '6.0',
  investmentTrustRate: '4.0',
  investmentBondsRate: '1.0',
  investmentIdecoRate: '4.0',
  investmentCryptoRate: '8.0',
  investmentOtherRate: '0.5',
  simulationPeriodAge: '90',
  interestRateScenario: 'ランダム変動', // 楽観orストレス
  fixedInterestRate: '5.0', // 固定利回り用のフィールドを追加
  emergencyFund: '300',
  stressTestSeed: '', // 追加
  appliances: [
    { name: '冷蔵庫', cycle: 10, cost: 15, firstReplacementAfterYears: '' as number | '' },
    { name: '洗濯機', cycle: 8, cost: 12, firstReplacementAfterYears: '' as number | '' },
    { name: 'エアコン', cycle: 10, cost: 10, firstReplacementAfterYears: '' as number | '' },
    { name: 'テレビ', cycle: 10, cost: 8, firstReplacementAfterYears: '' as number | '' },
    { name: '電子レンジ', cycle: 8, cost: 3, firstReplacementAfterYears: '' as number | '' },
    { name: '掃除機', cycle: 6, cost: 2, firstReplacementAfterYears: '' as number | '' },
  ],
  // 昇給率をformDataに統合
  annualRaiseRate: '1.5',
  spouseAnnualRaiseRate: '1.5',
});

export type FormDataState = ReturnType<typeof createDefaultFormData>;
type FormLocationState = { rawFormData?: FormDataState; sectionIndex?: number };



export default function FormPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as FormLocationState | null;
  const initialStateFromLocation = locationState?.rawFormData;
  const initialSectionIndex = locationState?.sectionIndex ?? 0;
  const [showBackModal, setShowBackModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<object | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isReady, setIsReady] = useState(false); // フォーム描画準備完了フラグ
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [totalNetAnnualIncome, setTotalNetAnnualIncome] = useState(0);

  const [formData, setFormData] = useState<FormDataState>(() => {
    // 結果ページから戻ってきた場合は、そのデータを優先する
    if (initialStateFromLocation) {
      return initialStateFromLocation;
    }
    // それ以外の場合は、デフォルト値で初期化（キャッシュの確認はuseEffectで行う）
    return createDefaultFormData();
  });

  // ページ読み込み時にキャッシュを確認・復元する
  useEffect(() => {
    // 結果ページから戻ってきた場合は、即座に描画準備完了
    if (initialStateFromLocation) {
      setIsReady(true);
      return;
    }

    const cachedItem = localStorage.getItem(LIFE_PLAN_FORM_CACHE_KEY);
    if (cachedItem) {
      const { timestamp } = JSON.parse(cachedItem);
      const isExpired = (Date.now() - timestamp) > CACHE_EXPIRATION_MS;

      if (isExpired) {
        localStorage.removeItem(LIFE_PLAN_FORM_CACHE_KEY);
        setIsReady(true);
      } else {
        // モーダルを表示してユーザーの選択を待つ
        setShowRestoreModal(true);
      }
    } else {
      // キャッシュがなければ即座に描画準備完了
      setIsReady(true);
    }
  }, [initialStateFromLocation]);

  // formDataが変更されたらキャッシュに保存する
  useEffect(() => {
    // フォームの準備が完了していない、または結果ページから戻ってきた場合は保存しない
    if (!isReady || initialStateFromLocation) {
      return;
    }
    // 結果ページから戻ってきた直後は保存しない
    if (initialStateFromLocation) {
      return;
    }
    const cacheItem = {
      timestamp: Date.now(),
      data: formData,
    };
    localStorage.setItem(LIFE_PLAN_FORM_CACHE_KEY, JSON.stringify(cacheItem));
  }, [formData, initialStateFromLocation, isReady]);

  const effectiveSections = useMemo(() => {
    return sections.filter((section) => {
      if (section === 'ライフイベント - 結婚' && formData.familyComposition === '既婚') return false;
      return true;
    });
  }, [formData.familyComposition]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
    // ResultPageから渡された元のインデックスを、フィルタリング後のインデックスに変換する
    const originalSectionName = sections[initialSectionIndex];
    const effectiveIndex = effectiveSections.indexOf(originalSectionName);
    return effectiveIndex !== -1 ? effectiveIndex : 0;
  });

  const [visitedSections, setVisitedSections] = useState<Set<number>>(() => new Set(initialStateFromLocation ? sections.map((_, i) => i) : [0]));

  // This effect ensures that if we return to the form, we don't show the completion screen
  useEffect(() => {
    if (initialStateFromLocation) {
      setIsCompleted(false);
    }
  }, [initialStateFromLocation]);

  const totalExpenses = useMemo(() => {
    if (formData.expenseMethod !== '詳細') return 0;
    const fixed = [
      formData.utilitiesCost,
      formData.communicationCost,
      formData.insuranceCost,
      formData.educationCost,
      formData.otherFixedCost,
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);

    const variable = [
      formData.foodCost,
      formData.dailyNecessitiesCost,
      formData.transportationCost,
      formData.clothingBeautyCost,
      formData.socializingCost,
      formData.hobbyEntertainmentCost,
      formData.otherVariableCost,
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);

    return fixed + variable;
  }, [formData]);

  const validateSection = (sectionIndex: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    const currentSection = effectiveSections[sectionIndex];
    const n = (v: unknown) => Number(v) || 0;

    switch (currentSection) {
      case '家族構成':
        if (!formData.familyComposition) {
          newErrors.familyComposition = '家族構成を選択してください。';
        }
        break;
      case '現在の収入':
        if (!formData.personAge) {
          newErrors.personAge = '年齢を入力してください。';
        } else if (n(formData.personAge) < 18 || n(formData.personAge) >= 100) {
          newErrors.personAge = '18歳から99歳の間で入力してください。';
        }
        if (!formData.mainIncome) {
          newErrors.mainIncome = '本業の年間収入を入力してください。';
        } else if (n(formData.mainIncome) < 0) {
          newErrors.mainIncome = '0以上の数値を入力してください。';
        }

        if (formData.familyComposition === '既婚') {
          if (!formData.spouseAge) {
            newErrors.spouseAge = '配偶者の年齢を入力してください。';
          } else if (n(formData.spouseAge) < 18 || n(formData.spouseAge) >= 100) {
            newErrors.spouseAge = '18歳から99歳の間で入力してください。';
          }
          if (!formData.spouseMainIncome) {
            newErrors.spouseMainIncome = '配偶者の本業年間収入を入力してください。';
          } else if (Number(formData.spouseMainIncome) < 0) {
            newErrors.spouseMainIncome = '0以上の数値を入力してください。';
          }
        }
        break;
      case '現在の支出':
        if (!formData.expenseMethod) {
          newErrors.expenseMethod = '支出の入力方法を選択してください。';
        } else if (formData.expenseMethod === '簡単') {
          if (!formData.livingCostSimple) newErrors.livingCostSimple = '生活費を入力してください。';
          else if (n(formData.livingCostSimple) < 0) newErrors.livingCostSimple = '0以上の数値を入力してください。';
        } else {
          if (!formData.utilitiesCost) newErrors.utilitiesCost = '水道・光熱費を入力してください。';
          if (!formData.communicationCost) newErrors.communicationCost = '通信費を入力してください。';
          if (!formData.insuranceCost) newErrors.insuranceCost = '保険を入力してください。';
          if (!formData.educationCost) newErrors.educationCost = '教養・教育費を入力してください。';
          if (!formData.foodCost) newErrors.foodCost = '食費を入力してください。';
          if (!formData.dailyNecessitiesCost) newErrors.dailyNecessitiesCost = '日用品を入力してください。';
          if (!formData.transportationCost) newErrors.transportationCost = '交通費を入力してください。';
          if (!formData.clothingBeautyCost) newErrors.clothingBeautyCost = '衣類・美容費を入力してください。';
          if (!formData.socializingCost) newErrors.socializingCost = '交際費を入力してください。';
          if (!formData.hobbyEntertainmentCost) newErrors.hobbyEntertainmentCost = '趣味・娯楽費を入力してください。';
        }
        break;
      case 'ライフイベント - 車':
        if (!formData.carCurrentLoanInPayment) newErrors.carCurrentLoanInPayment = '現在のローン状況を選択してください。';
        if (formData.carCurrentLoanInPayment === 'yes') {
            if (!formData.carCurrentLoanMonthly) newErrors.carCurrentLoanMonthly = '月々の返済額を入力してください。';
            if (!formData.carCurrentLoanRemainingMonths) newErrors.carCurrentLoanRemainingMonths = '残り支払い回数を入力してください。';
        }
        if (!formData.carPurchasePlan) newErrors.carPurchasePlan = '車の購入/買い替え予定を選択してください。';
        if (formData.carPurchasePlan === 'yes') {
          if (!formData.carFirstReplacementAfterYears) newErrors.carFirstReplacementAfterYears = '初回買い替え年数を入力してください。';
          if (!formData.carPrice) newErrors.carPrice = '価格帯を入力してください。';
          if (!formData.carReplacementFrequency) newErrors.carReplacementFrequency = '乗り換え頻度を入力してください。';
          if (!formData.carLoanUsage) newErrors.carLoanUsage = 'ローンの利用を選択してください。';
          if (formData.carLoanUsage === 'はい') {
            if (!formData.carLoanYears) newErrors.carLoanYears = 'ローン年数を選択してください。';
            if (!formData.carLoanType) newErrors.carLoanType = 'ローンの種類を選択してください。';
          }
        }
        break;
      case 'ライフイベント - 家':
        if (!formData.housingType) newErrors.housingType = '現在の住まいを選択してください。';
        if (formData.housingType === '賃貸') {
          if (!formData.currentRentLoanPayment) newErrors.currentRentLoanPayment = '家賃を入力してください。';
          if (!formData.housePurchaseIntent) newErrors.housePurchaseIntent = '将来の住宅購入予定を選択してください。';
          if (formData.housePurchaseIntent === 'yes' && formData.housePurchasePlan) {
            if (!formData.housePurchasePlan.age) newErrors['housePurchasePlan.age'] = '購入予定年齢を入力してください。';
            if (!formData.housePurchasePlan.price) newErrors['housePurchasePlan.price'] = '予定価格を入力してください。';
            if (formData.housePurchasePlan.downPayment === undefined) newErrors['housePurchasePlan.downPayment'] = '頭金を入力してください。';
            if (!formData.housePurchasePlan.loanYears) newErrors['housePurchasePlan.loanYears'] = 'ローン年数を入力してください。';
            if (!formData.housePurchasePlan.interestRate) newErrors['housePurchasePlan.interestRate'] = '想定金利を入力してください。';
          }
        }
        if (formData.housingType === '持ち家（ローン中）') {
            if (!formData.loanMonthlyPayment) newErrors.loanMonthlyPayment = '月額返済額を入力してください。';
            if (!formData.loanRemainingYears) newErrors.loanRemainingYears = '残存年数を入力してください。';
        }
        break;
      case 'ライフイベント - 結婚':
        if (!formData.planToMarry) newErrors.planToMarry = '結婚の予定を選択してください。';
        if (formData.planToMarry === 'する') {
          if (!formData.marriageAge) newErrors.marriageAge = '結婚予定年齢を入力してください。';
          else if (n(formData.marriageAge) < n(formData.personAge)) newErrors.marriageAge = '現在年齢以上の年齢を入力してください。';
          if (!formData.spouseAgeAtMarriage) newErrors.spouseAgeAtMarriage = '配偶者の年齢を入力してください。';
          if (!formData.spouseIncomePattern) newErrors.spouseIncomePattern = '配偶者の収入パターンを選択してください。';
          if (formData.spouseIncomePattern === 'カスタム' && !formData.spouseCustomIncome) {
            newErrors.spouseCustomIncome = '配偶者のカスタム年収を入力してください。';
          }
          if (formData.housingType !== '持ち家（ローン中）' && !formData.housingCostAfterMarriage) {
            newErrors.housingCostAfterMarriage = '結婚後の住居費を入力してください。';
          }
        }
        break;
      case 'ライフイベント - 子供':
        if (!formData.hasChildren) newErrors.hasChildren = '子供の有無を選択してください。';
        if (formData.hasChildren === 'はい') {
          if (!formData.numberOfChildren) newErrors.numberOfChildren = '子供の人数を入力してください。';
          if (!formData.firstBornAge) newErrors.firstBornAge = '最初の子が生まれる予定年齢を入力してください。';
          if (!formData.educationPattern) newErrors.educationPattern = '教育費パターンを選択してください。';
        }
        break;
      case 'ライフイベント - 親の介護':
        if (!formData.parentCareAssumption) newErrors.parentCareAssumption = '介護の想定を選択してください。';
        if (formData.parentCareAssumption === 'はい') {
          formData.parentCarePlans.forEach((plan, index) => {
            if (!plan.parentCurrentAge) newErrors[`parentCarePlans[${index}].parentCurrentAge`] = `${index + 1}人目の親の現在の年齢を入力してください。`;
            if (!plan.parentCareStartAge) newErrors[`parentCarePlans[${index}].parentCareStartAge`] = `${index + 1}人目の介護開始年齢を入力してください。`;
            if (!plan.monthly10kJPY) newErrors[`parentCarePlans[${index}].monthly10kJPY`] = `${index + 1}人目の月額費用を入力してください。`;
            if (!plan.years) newErrors[`parentCarePlans[${index}].years`] = `${index + 1}人目の介護期間を入力してください。`;
          });
        }
        break;
      case 'ライフイベント - 老後':
        if (!formData.postRetirementLivingCost) newErrors.postRetirementLivingCost = '老後の生活費を入力してください。';
        if (!formData.retirementAge) newErrors.retirementAge = '退職予定年齢を入力してください。';
        if (!formData.pensionStartAge) newErrors.pensionStartAge = '年金受給開始年齢を入力してください。';
        if (!formData.pensionAmount) newErrors.pensionAmount = '年金受給額を入力してください。';
        if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
          if (!formData.spouseRetirementAge) newErrors.spouseRetirementAge = '配偶者の退職予定年齢を入力してください。';
          if (!formData.spousePensionStartAge) newErrors.spousePensionStartAge = '配偶者の年金受給開始年齢を入力してください。';
          if (!formData.spousePensionAmount) newErrors.spousePensionAmount = '配偶者の年金受給額を入力してください。';
        }
        break;
      case '貯蓄':
        if (!formData.currentSavings) newErrors.currentSavings = '現在の預貯金総額を入力してください。';
        if (!formData.monthlySavings) newErrors.monthlySavings = '毎月の貯蓄額を入力してください。';
        break;
      case '投資':
        // 投資セクションは任意入力が多いため、必須バリデーションは一旦見送り。
        // 必要であれば、入力されている場合の数値チェックなどを追加します。
        break;
      case 'シミュレーション設定':
        if (!formData.simulationPeriodAge) newErrors.simulationPeriodAge = 'シミュレーション対象期間を入力してください。';
        else if (n(formData.simulationPeriodAge) <= n(formData.personAge)) newErrors.simulationPeriodAge = '現在年齢より大きい年齢を入力してください。';
        if (!formData.interestRateScenario) newErrors.interestRateScenario = '利回りシナリオを選択してください。';
        if (!formData.emergencyFund) newErrors.emergencyFund = '生活防衛資金を入力してください。';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextSection = () => {
    if (validateSection(currentSectionIndex) && currentSectionIndex < effectiveSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };



  const handleSimulate = async () => {
    setLoading(true);

    const n = (v: unknown): number => {
      const num = Number(v);
      return isFinite(num) ? num : 0;
    };

    try {
      const mainJobIncomeGross = n(formData.mainIncome) * 10000;
      const sideJobIncomeGross = n(formData.sideJobIncome) * 10000;
      let spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseMainIncome) : 0) * 10000;
      const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? n(formData.spouseSideJobIncome) : 0) * 10000;

      // 結婚予定がある場合の配偶者収入
      let spouseIncomeForSim = 0; // シミュレーションパラメータ用
      if (formData.planToMarry === 'する') {
        if (formData.spouseIncomePattern === 'パート') {
          spouseIncomeForSim = 1060000;
        } else if (formData.spouseIncomePattern === '正社員') {
          spouseIncomeForSim = 3000000;
        } else if (formData.spouseIncomePattern === 'カスタム') {
          spouseIncomeForSim = n(formData.spouseCustomIncome) * 10000;
        }
        // 既婚ユーザーの入力と競合しないように、spouseMainJobIncomeGross を上書き
        spouseMainJobIncomeGross = spouseIncomeForSim;
      }

      // Detailed expenses: convert monthly inputs (yen per month, car in 10k yen) into annual totals.
      const monthlyFixedExpense =
        n(formData.utilitiesCost) +
        n(formData.communicationCost) +
        n(formData.insuranceCost) +
        n(formData.educationCost) +
        n(formData.otherFixedCost);
      const monthlyCarExpense = n(formData.carCost) * 10000;
      const detailedFixedAnnual = (monthlyFixedExpense + monthlyCarExpense) * 12;

      const monthlyVariableExpense =
        n(formData.foodCost) +
        n(formData.dailyNecessitiesCost) +
        n(formData.transportationCost) +
        n(formData.clothingBeautyCost) +
        n(formData.socializingCost) +
        n(formData.hobbyEntertainmentCost) +
        n(formData.otherVariableCost);
      const detailedVariableAnnual = monthlyVariableExpense * 12;

      // 資産(円)の集計
      const currentInvestmentsJPY = (
        n(formData.investmentStocksCurrent) +
        n(formData.investmentTrustCurrent) +
        n(formData.investmentBondsCurrent) +
        n(formData.investmentIdecoCurrent) +
        n(formData.investmentCryptoCurrent) +
        n(formData.investmentOtherCurrent)
      ) * 10000;

      const monthlyRecurringInvestment = Object.values(formData.monthlyInvestmentAmounts).reduce((sum: number, v) => sum + n(v), 0);
      const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12;

      const yearlySpotJPY = (
        n(formData.investmentStocksAnnualSpot) +
        n(formData.investmentTrustAnnualSpot) +
        n(formData.investmentBondsAnnualSpot) +
        n(formData.investmentIdecoAnnualSpot) +
        n(formData.investmentCryptoAnnualSpot) +
        n(formData.investmentOtherAnnualSpot)
      ); // yen per year

      const stocksCurrentYen = n(formData.investmentStocksCurrent) * 10000;
      const trustCurrentYen = n(formData.investmentTrustCurrent) * 10000;
      const otherCurrentYen = (n(formData.investmentBondsCurrent) + n(formData.investmentIdecoCurrent) + n(formData.investmentCryptoCurrent) + n(formData.investmentOtherCurrent)) * 10000;

      const monthlyStocksYen = n(formData.monthlyInvestmentAmounts.investmentStocksMonthly);
      const monthlyTrustYen = n(formData.monthlyInvestmentAmounts.investmentTrustMonthly);
      const monthlyOtherYen = (
        n(formData.monthlyInvestmentAmounts.investmentBondsMonthly) +
        n(formData.monthlyInvestmentAmounts.investmentIdecoMonthly) +
        n(formData.monthlyInvestmentAmounts.investmentCryptoMonthly) +
        n(formData.monthlyInvestmentAmounts.investmentOtherMonthly)
       );
      const yearlyStocksRecurringYen = monthlyStocksYen * 12;
      const yearlyTrustRecurringYen = monthlyTrustYen * 12;
      const yearlyOtherRecurringYen = monthlyOtherYen * 12;

      const stocksSpotYen = n(formData.investmentStocksAnnualSpot);
      const trustSpotYen = n(formData.investmentTrustAnnualSpot);
      const otherSpotYen = (
        n(formData.investmentBondsAnnualSpot) +
        n(formData.investmentIdecoAnnualSpot) +
        n(formData.investmentCryptoAnnualSpot) +
        n(formData.investmentOtherAnnualSpot)
      );

      const stocksAccountType = formData.investmentStocksAccountType;
      const trustAccountType = formData.investmentTrustAccountType;

      const nisaCurrentHoldingsJPY = (stocksAccountType === 'nisa' ? stocksCurrentYen : 0) + (trustAccountType === 'nisa' ? trustCurrentYen : 0);
      const taxableCurrentHoldingsJPY = (stocksAccountType === 'taxable' ? stocksCurrentYen : 0) + (trustAccountType === 'taxable' ? trustCurrentYen : 0) + otherCurrentYen;

      const nisaRecurringAnnualJPY = (stocksAccountType === 'nisa' ? yearlyStocksRecurringYen : 0) + (trustAccountType === 'nisa' ? yearlyTrustRecurringYen : 0);
      const taxableRecurringAnnualJPY = (stocksAccountType === 'taxable' ? yearlyStocksRecurringYen : 0) + (trustAccountType === 'taxable' ? yearlyTrustRecurringYen : 0) + yearlyOtherRecurringYen;

      const nisaSpotAnnualJPY = (stocksAccountType === 'nisa' ? stocksSpotYen : 0) + (trustAccountType === 'nisa' ? trustSpotYen : 0);
      const taxableSpotAnnualJPY = (stocksAccountType === 'taxable' ? stocksSpotYen : 0) + (trustAccountType === 'taxable' ? trustSpotYen : 0) + otherSpotYen;

      const totalInvestmentRate = (n(formData.investmentStocksRate) + n(formData.investmentTrustRate) + n(formData.investmentBondsRate) + n(formData.investmentIdecoRate) + n(formData.investmentCryptoRate) + n(formData.investmentOtherRate)) / 6;

      // 商品別（stocks/trust/bonds/crypto/other/iDeCo）を独立に構築
      const bondsCurrentYen = n(formData.investmentBondsCurrent) * 10000;
      const idecoCurrentYen = n(formData.investmentIdecoCurrent) * 10000;
      const cryptoCurrentYen = n(formData.investmentCryptoCurrent) * 10000;
      const otherOnlyCurrentYen = n(formData.investmentOtherCurrent) * 10000;

      const monthlyBondsYen = n(formData.monthlyInvestmentAmounts.investmentBondsMonthly);
      const monthlyIdecoOnlyYen = n(formData.monthlyInvestmentAmounts.investmentIdecoMonthly);
      const monthlyCryptoYen = n(formData.monthlyInvestmentAmounts.investmentCryptoMonthly);
      const monthlyOtherOnlyYen = n(formData.monthlyInvestmentAmounts.investmentOtherMonthly);

      const yearlyBondsRecurringYen = monthlyBondsYen * 12;
      const yearlyIdecoRecurringYen = monthlyIdecoOnlyYen * 12;
      const yearlyCryptoRecurringYen = monthlyCryptoYen * 12;
      const yearlyOtherOnlyRecurringYen = monthlyOtherOnlyYen * 12;

      const bondsSpotYen = n(formData.investmentBondsAnnualSpot);
      const idecoSpotYen = n(formData.investmentIdecoAnnualSpot);
      const cryptoSpotYen = n(formData.investmentCryptoAnnualSpot);
      const otherOnlySpotYen = n(formData.investmentOtherAnnualSpot);

      const stocksRate = n(formData.investmentStocksRate) / 100;
      const trustRate = n(formData.investmentTrustRate) / 100;
      const bondsRate = n(formData.investmentBondsRate) / 100;
      const idecoRate = n(formData.investmentIdecoRate) / 100;
      const cryptoRate = n(formData.investmentCryptoRate) / 100;
      const otherRate = n(formData.investmentOtherRate) / 100;

      const products = [
        {
          key: 'stocks',
          account: stocksAccountType === 'nisa' ? '非課税' : '課税',
          currentJPY: stocksCurrentYen,
          recurringJPY: yearlyStocksRecurringYen,
          spotJPY: stocksSpotYen,
          expectedReturn: stocksRate,
        },
        {
          key: 'trust',
          account: trustAccountType === 'nisa' ? '非課税' : '課税',
          currentJPY: trustCurrentYen,
          recurringJPY: yearlyTrustRecurringYen,
          spotJPY: trustSpotYen,
          expectedReturn: trustRate,
        },
        {
          key: 'bonds',
          account: '課税',
          currentJPY: bondsCurrentYen,
          recurringJPY: yearlyBondsRecurringYen,
          spotJPY: bondsSpotYen,
          expectedReturn: bondsRate,
        },
        {
          key: 'crypto',
          account: '課税',
          currentJPY: cryptoCurrentYen,
          recurringJPY: yearlyCryptoRecurringYen,
          spotJPY: cryptoSpotYen,
          expectedReturn: cryptoRate,
        },
        {
          key: 'other',
          account: formData.investmentOtherAccountType === 'nisa' ? '非課税' : '課税',
          currentJPY: otherOnlyCurrentYen,
          recurringJPY: yearlyOtherOnlyRecurringYen,
          spotJPY: otherOnlySpotYen,
          expectedReturn: otherRate,
        },
        {
          key: 'ideco',
          account: 'iDeCo',
          currentJPY: idecoCurrentYen,
          recurringJPY: yearlyIdecoRecurringYen,
          spotJPY: idecoSpotYen,
          expectedReturn: idecoRate,
        },
      ] as const;

      const params = {
        initialAge: n(formData.personAge),
        spouseInitialAge: formData.familyComposition === '既婚' ? n(formData.spouseAge) : undefined,
        endAge: n(formData.simulationPeriodAge),
        retirementAge: n(formData.retirementAge),
        pensionStartAge: n(formData.pensionStartAge),

        spouseRetirementAge: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spouseRetirementAge) : undefined,
        spousePensionStartAge: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spousePensionStartAge) : undefined,

        mainJobIncomeGross: mainJobIncomeGross,
        sideJobIncomeGross: sideJobIncomeGross,
        spouseMainJobIncomeGross: spouseMainJobIncomeGross,
        spouseSideJobIncomeGross: spouseSideJobIncomeGross,
        incomeGrowthRate: n(formData.annualRaiseRate) / 100,
        spouseIncomeGrowthRate: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spouseAnnualRaiseRate) / 100 : undefined,

        expenseMode: formData.expenseMethod === '簡単' ? 'simple' : 'detailed',
        // 万円/月 → 円/年
        livingCostSimpleAnnual: formData.expenseMethod === '簡単' ? n(formData.livingCostSimple) * 10000 * 12 : undefined,
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
          currentLoan: (Number(formData.carCurrentLoanMonthly) > 0 && Number(formData.carCurrentLoanRemainingMonths) > 0) ? { monthlyPaymentJPY: n(formData.carCurrentLoanMonthly), remainingMonths: n(formData.carCurrentLoanRemainingMonths) }: undefined,
        },

        housing: {
          type: formData.housingType,
          rentMonthlyJPY: formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : undefined,
          currentLoan: formData.housingType === '持ち家（ローン中）' && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0 ? {
            monthlyPaymentJPY: n(formData.loanMonthlyPayment),
            remainingYears: n(formData.loanRemainingYears),
          } : undefined,
          purchasePlan: formData.housePurchasePlan ? {
            age: n(formData.housePurchasePlan.age),
            priceJPY: n(formData.housePurchasePlan.price) * 10000,
            downPaymentJPY: n(formData.housePurchasePlan.downPayment) * 10000,
            years: n(formData.housePurchasePlan.loanYears),
            rate: n(formData.housingLoanInterestRateType === '指定' ? formData.housingLoanInterestRate : 1.5) / 100,
          } : undefined,
          renovations: formData.houseRenovationPlans.map(p => ({
            age: n((p as RenovationPlan).age),
            costJPY: n((p as RenovationPlan).cost) * 10000,
            cycleYears: (p as RenovationPlan).cycleYears ? n((p as RenovationPlan).cycleYears) : undefined,
          })),
        },

        marriage: formData.planToMarry === 'する' ? {
          age: n(formData.marriageAge),
          engagementJPY: n(formData.engagementCost) * 10000,
          weddingJPY: n(formData.weddingCost) * 10000,
          honeymoonJPY: n(formData.honeymoonCost) * 10000,
          movingJPY: n(formData.newHomeMovingCost) * 10000,
          // 結婚後の情報を追加
          spouse: {
            ageAtMarriage: n(formData.spouseAgeAtMarriage),
            incomeGross: spouseIncomeForSim,
          },
          //結婚後の生活費は月ｘ12する
          newLivingCostAnnual: n(formData.livingCostAfterMarriage) * 12,
          newHousingCostAnnual: n(formData.housingCostAfterMarriage) * 12,
        } : undefined,

        children: formData.hasChildren === 'はい' ? {
          count: n(formData.numberOfChildren),
          firstBornAge: n(formData.firstBornAge),
          educationPattern: formData.educationPattern as '公立中心' | '公私混合' | '私立中心',
        } : undefined,

        appliances: formData.appliances
          .filter((a) =>
            String(a?.name ?? '').trim().length > 0 &&
            Number(a?.cost) > 0 &&
            Number(a?.cycle) > 0
          )
          .map((p) => ({
            name: String(p.name),
            cycleYears: Number(p.cycle),
            firstAfterYears: Number(p.firstReplacementAfterYears ?? 0),
            cost10kJPY: Number(p.cost) // 万円（サーバで×10000）
          })),

        cares: formData.parentCareAssumption === 'はい' ? formData.parentCarePlans.map(p => ({
          id: p.id,
          parentCurrentAge: n(p.parentCurrentAge),
          parentCareStartAge: n(p.parentCareStartAge),
          years: n(p.years),
          monthly10kJPY: n(p.monthly10kJPY),
        })) : [],

        postRetirementLiving10kJPY: n(formData.postRetirementLivingCost),
        pensionMonthly10kJPY: n(formData.pensionAmount),
        spousePensionMonthly10kJPY: (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? n(formData.spousePensionAmount) : undefined,

        currentSavingsJPY: n(formData.currentSavings) * 10000,
        monthlySavingsJPY: n(formData.monthlySavings),

        currentInvestmentsJPY: currentInvestmentsJPY,
        yearlyRecurringInvestmentJPY,
        yearlySpotJPY,
        expectedReturn: totalInvestmentRate / 100,
        products: products as unknown as Array<{
          key: 'stocks' | 'trust' | 'bonds' | 'crypto' | 'other' | 'ideco';
          account: '課税' | '非課税' | 'iDeCo';
          currentJPY: number; recurringJPY: number; spotJPY: number; expectedReturn: number;
        }>,
        investmentTaxation: {
          nisa: {
            currentHoldingsJPY: nisaCurrentHoldingsJPY,
            annualRecurringContributionJPY: nisaRecurringAnnualJPY,
            annualSpotContributionJPY: nisaSpotAnnualJPY,
          },
          taxable: {
            currentHoldingsJPY: taxableCurrentHoldingsJPY,
            annualRecurringContributionJPY: taxableRecurringAnnualJPY,
            annualSpotContributionJPY: taxableSpotAnnualJPY,
          },
        },
        stressTest: {
          enabled: formData.interestRateScenario === 'ランダム変動',
          seed: n(formData.stressTestSeed), // 新しく追加するformDataのプロパティ
        },

        interestScenario: formData.interestRateScenario as '固定利回り' | 'ランダム変動', // 追加
        fixedInterestRate: formData.interestRateScenario === '固定利回り' ? n(formData.fixedInterestRate) / 100 : undefined,
        emergencyFundJPY: n(formData.emergencyFund) * 10000,
      };

      // 単位統一の最終調整（すべて円でAPIへ渡す）
      // 1) 生活費（簡単）は「円/月」入力 → 年間円へ変換
      if (params.expenseMode === 'simple') {
        params.livingCostSimpleAnnual = n(formData.livingCostSimple) * 12; // 万円/月 -> 円/年
      }
      // 2) 投資の月積立は「円/月」入力 → 年間円へ変換
      params.yearlyRecurringInvestmentJPY = monthlyRecurringInvestment;

      // TODO: UIの「今の家賃/返済」欄（円）をそのまま params.housing に反映する実装は別パッチで対応

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputParams: params }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'シミュレーションエラー');
      }

      const yearly = Array.isArray(data.yearlyData) ? (data.yearlyData as YearlyData[]) : [];
      if (yearly.length === 0) {
        throw new Error('シミュレーション結果が空です');
      }

      setResult(null);
      navigate('/result', { state: { yearlyData: yearly, percentileData: data.percentileData, inputParams: params as SimulationInputParams, rawFormData: formData } });

    } catch (error: unknown)  {
      console.error(error);
       if (error instanceof Error) {
        setResult({ error: error.message });
    } else {
        setResult({ error: '通信エラー' });
    }
    }
    setLoading(false);
  };

  type RenovationPlan = { age: number; cost: number; cycleYears?: number };



  const handleRenovationPlanChange = (
    index: number,
    key: keyof RenovationPlan,
    value: string,
  ) => {
    setFormData(prev => {
      const plans = [...prev.houseRenovationPlans];
      if (!plans[index]) {
        return prev;
      }

      const updated: RenovationPlan = { ...plans[index] };
      if (key === 'cycleYears') {
        updated[key] = value === '' ? undefined : Number(value);
      } else {
        updated[key] = Number(value);
      }

      plans[index] = updated;
      return { ...prev, houseRenovationPlans: plans };
    });
  };

  const handleApplianceChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newAppliances = [...prev.appliances];
      const isNumberField = field === 'cycle' || field === 'cost';
      newAppliances[index] = {
        ...newAppliances[index],
        [field]: isNumberField ? Number(value) : value,
      };
      return { ...prev, appliances: newAppliances };
    });
  };

  const addAppliance = () => {
    setFormData(prev => ({ ...prev, appliances: [...prev.appliances, { name: '', cycle: 0, cost: 0, firstReplacementAfterYears: '' }] }));
  };

  const handleRemoveAppliance = (index: number) => {
    setFormData(prev => ({ ...prev, appliances: prev.appliances.filter((_, i) => i !== index) }));
  };

  const handleCarePlanChange = (
    index: number,
    key: keyof Omit<CarePlan, 'id'>,
    value: string,
  ) => {
    setFormData(prev => {
      const newPlans = [...prev.parentCarePlans];
      if (!newPlans[index]) return prev;
      newPlans[index] = { ...newPlans[index], [key]: Number(value) };
      return { ...prev, parentCarePlans: newPlans };
    });
  };

  const addCarePlan = () => {
    setFormData(prev => {
      const firstPlan = prev.parentCarePlans[0] || createDefaultCarePlan();
      const newPlan = { ...firstPlan, id: Date.now() };
      return { ...prev, parentCarePlans: [...prev.parentCarePlans, newPlan] };
    });
  };

  const removeCarePlan = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parentCarePlans: prev.parentCarePlans.filter((_, i) => i !== index),
    }));
  };

  const displayTotalApplianceCost = useMemo(() => {
    return formData.appliances
      .map((item) => Number(item.cost) || 0)
      .reduce((sum, cost) => sum + cost, 0)
  }, [formData.appliances]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('houseRenovationPlans')) {
      const indices = name.match(/\d+/g);
      if (indices) {
        const index = parseInt(indices[0], 10);
        const field = name.split('.')[1];
        const newPlans = [...formData.houseRenovationPlans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setFormData({ ...formData, houseRenovationPlans: newPlans });
      }
    } else if (name.startsWith('housePurchasePlan')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        housePurchasePlan: {
          ...(formData.housePurchasePlan || { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 }),
          [field]: Number(value)
        }
      });
    } else if (name.startsWith('investment') && name.endsWith('Monthly')) {
      setFormData(prev => ({
        ...prev,
        monthlyInvestmentAmounts: {
          ...prev.monthlyInvestmentAmounts,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'livingCostAfterMarriage') {
          newState.isLivingCostEdited = true;
        }
        if (name === 'housingCostAfterMarriage') {
          newState.isHousingCostEdited = true;
        }
        return newState;
      });
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const totalIncome = useMemo(() => {
    return (
      (Number(formData.mainIncome) || 0) +
      (Number(formData.spouseMainIncome) || 0) +
      (Number(formData.sideJobIncome) || 0) +
      (Number(formData.spouseSideJobIncome) || 0)
    );
  }, [formData.mainIncome, formData.spouseMainIncome, formData.sideJobIncome, formData.spouseSideJobIncome]);

  const displayTotalIncome = useMemo(() => {
    return totalIncome * 10000;
  }, [totalIncome]);

  const totalMarriageCost = useMemo(() => {
    if (formData.planToMarry !== 'する') return 0;
    return (
      (Number(formData.engagementCost) || 0) +
      (Number(formData.weddingCost) || 0) +
      (Number(formData.honeymoonCost) || 0) +
      (Number(formData.newHomeMovingCost) || 0)
    ) * 10000; // 万円 → 円に変換
  }, [
    formData.planToMarry,
    formData.engagementCost,
    formData.weddingCost,
    formData.honeymoonCost,
    formData.newHomeMovingCost,
  ]);

  const totalCareCost = useMemo(() => {
    if (formData.parentCareAssumption !== 'はい' || !formData.parentCarePlans) return 0;
    return formData.parentCarePlans.reduce((total, plan) => {
      return total + ((Number(plan.monthly10kJPY) || 0) * (Number(plan.years) || 0) * 12);
    }, 0);
  }, [formData.parentCareAssumption, formData.parentCarePlans]);

  const totalRetirementMonthly = useMemo(() => {
    const spousePension = (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? (Number(formData.spousePensionAmount) || 0) : 0;
    return (
        (Number(formData.postRetirementLivingCost) || 0) - ((Number(formData.pensionAmount) || 0) + spousePension)
    );
  }, [formData.postRetirementLivingCost, formData.pensionAmount, formData.spousePensionAmount, formData.familyComposition, formData.planToMarry]);

  const totalCarLoanCost = useMemo(() => {
    if (formData.carLoanUsage !== 'はい') return 0;
    const principal = Number(formData.carPrice) * 10000 || 0;
    const years = Number(formData.carLoanYears) || 0;

    let annualRate = 0.025; // default
    if (formData.carLoanType === '銀行ローン') annualRate = 0.015;
    else if (formData.carLoanType === 'ディーラーローン') annualRate = 0.045;

    const interestRate = annualRate / 12;
    const months = years * 12;
    if (principal <= 0 || years <= 0) return 0;

    const monthly = principal * interestRate * Math.pow(1 + interestRate, months) / (Math.pow(1 + interestRate, months) - 1);
    const total = monthly * months;
    return Math.ceil(total);
  }, [formData.carPrice, formData.carLoanUsage, formData.carLoanYears, formData.carLoanType]);

  const totalInvestment = useMemo(() => {
    const monthlyTotal = Object.values(formData.monthlyInvestmentAmounts).reduce(
      (acc: number, val) => acc + Number(val),
      0
    );

    const annualSpotTotal = (
      (Number(formData.investmentStocksAnnualSpot) || 0) +
      (Number(formData.investmentTrustAnnualSpot) || 0) +
      (Number(formData.investmentBondsAnnualSpot) || 0) +
      (Number(formData.investmentIdecoAnnualSpot) || 0) +
      (Number(formData.investmentCryptoAnnualSpot) || 0) +
      (Number(formData.investmentOtherAnnualSpot) || 0)
    );

    return {
      monthly: monthlyTotal,
      annual: (monthlyTotal * 12) + annualSpotTotal
    };
  }, [
    formData.monthlyInvestmentAmounts,
    formData.investmentStocksAnnualSpot,
    formData.investmentTrustAnnualSpot,
    formData.investmentBondsAnnualSpot,
    formData.investmentIdecoAnnualSpot,
    formData.investmentCryptoAnnualSpot,
    formData.investmentOtherAnnualSpot,
  ]);

  const calculateLoanPayment = (principal: number, annualInterestRate: number, years: number): { annualPayment: number, totalPayment: number } => {
    if (principal <= 0 || annualInterestRate < 0 || years <= 0) {
      return { annualPayment: 0, totalPayment: 0 };
    }

    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const totalMonths = years * 12;

    if (monthlyInterestRate === 0) {
      const annualPayment = principal / years;
      return { annualPayment: annualPayment, totalPayment: principal };
    }

    const monthlyPayment = principal * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), totalMonths) / (Math.pow((1 + monthlyInterestRate), totalMonths) - 1);
    const annualPayment = monthlyPayment * 12;
    const totalPayment = annualPayment * years;

    return { annualPayment: Math.ceil(annualPayment / 1000) * 1000, totalPayment: Math.ceil(totalPayment / 1000) * 1000 };
  };

  const { estimatedAnnualLoanPayment, estimatedTotalLoanPayment } = useMemo(() => {
    const housingLoanStatus = formData.housingLoanStatus;
    let annualPayment = 0;
    let totalPayment = 0;

    const isFutureBuyer = formData.housingType === '賃貸' && formData.housePurchasePlan !== null;
    const isCurrentLoanHolder = formData.housingType === '持ち家（ローン中）' && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0;

    if (housingLoanStatus === 'これから借りる予定' || isFutureBuyer) {
      const price = (isFutureBuyer ? formData.housePurchasePlan?.price : Number(formData.housePurchasePrice)) || 0;
      const downPayment = (isFutureBuyer ? formData.housePurchasePlan?.downPayment : Number(formData.headDownPayment)) || 0;
      const years = (isFutureBuyer ? formData.housePurchasePlan?.loanYears : Number(formData.housingLoanYears)) || 0;
      const interestRateType = formData.housingLoanInterestRateType;
      const customInterestRate = (isFutureBuyer ? formData.housePurchasePlan?.interestRate : Number(formData.housingLoanInterestRate)) || 0;

      if (price > 0 && years > 0 && interestRateType) {
        const principal = (price - downPayment) * 10000; // Convert to yen

        let interestRate = 1.5; // Default general interest rate
        if (interestRateType === '指定') {
          interestRate = customInterestRate;
        }
        const calculated = calculateLoanPayment(principal, interestRate, years);
        annualPayment = calculated.annualPayment;
        totalPayment = calculated.totalPayment;
      }
    } else if (housingLoanStatus === 'すでに返済中' || isCurrentLoanHolder) {
      const loanMonthlyPayment = Number(formData.loanMonthlyPayment) || 0;
      const loanRemainingYears = Number(formData.loanRemainingYears) || 0;

      if (loanMonthlyPayment > 0 && loanRemainingYears > 0) {
        annualPayment = Math.ceil(loanMonthlyPayment * 12 / 1000) * 1000;
        totalPayment = Math.ceil(annualPayment * loanRemainingYears / 1000) * 1000;
      }
    }

    return { estimatedAnnualLoanPayment: annualPayment, estimatedTotalLoanPayment: totalPayment };
  }, [
    formData.housingLoanStatus,
    formData.housePurchasePrice,
    formData.headDownPayment,
    formData.housingLoanYears,
    formData.housingLoanInterestRateType,
    formData.housingLoanInterestRate,
    formData.loanMonthlyPayment,
    formData.loanRemainingYears,
    formData.housePurchasePlan,
    formData.housingType
  ]);

  // 結婚後の生活費・住居費の自動計算
  useEffect(() => {
    if (formData.planToMarry !== 'する' || formData.isLivingCostEdited) return;

    const singleLivingCost = formData.expenseMethod === '簡単'
      ? Number(formData.livingCostSimple) || 0
      : totalExpenses / 10000; // totalExpensesは円/月なので万円/月に変換

    if (singleLivingCost > 0) {
      const recommendedCost = Math.round(singleLivingCost * 1.5);
      setFormData(prev => ({
        ...prev,
        livingCostAfterMarriage: String(recommendedCost)
      }));
    }
  }, [formData.livingCostSimple, formData.expenseMethod, formData.planToMarry, formData.isLivingCostEdited, totalExpenses]);

  useEffect(() => {
    if (formData.planToMarry !== 'する' || formData.isHousingCostEdited) return;

    const singleHousingCost = Number(formData.currentRentLoanPayment) || 0;

    if (singleHousingCost > 0) {
      const recommendedCost = Math.round(singleHousingCost * 1.3);
      setFormData(prev => ({
        ...prev,
        housingCostAfterMarriage: String(recommendedCost)
      }));
    }
  }, [formData.currentRentLoanPayment, formData.planToMarry, formData.isHousingCostEdited]);
  

  useEffect(() => {
    if (formData.expenseMethod === '詳細') {
      const element = document.getElementById('detailed-expense');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [formData.expenseMethod]);

  useEffect(() => {
    if (formData.familyComposition === "独身") {
      setFormData(prev => ({
        ...prev,
        spouseMainIncome: "0",
        spouseSideJobIncome: "0"
      }));
    }
  }, [formData.familyComposition]);

  useEffect(() => {
    const el = document.getElementById("floating-header");
    if (!el) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const updateTop = () => {
      el.style.top = `${visualViewport.offsetTop}px`;
    };

    visualViewport.addEventListener("resize", updateTop);
    visualViewport.addEventListener("scroll", updateTop);
    updateTop();

    return () => {
      visualViewport.removeEventListener("resize", updateTop);
      visualViewport.removeEventListener("scroll", updateTop);
    };
  }, []);

  useEffect(() => {
    if (!location.state && !window.history.state?.formInitialized) {
      window.history.pushState({ formInitialized: true, section: 0 }, "", "");
      setCurrentSectionIndex(0);
    }
  }, [location.state]);

  useEffect(() => {
    const state = { formInitialized: true, section: currentSectionIndex };
    window.history.pushState(state, "", "");
  }, [currentSectionIndex]);

  useEffect(() => {
    if (currentSectionIndex > 0) {
      setVisitedSections(prev => new Set([...prev, currentSectionIndex]));
    }
  }, [currentSectionIndex]);

  useEffect(() => {
    const mainJobIncomeGross = (Number(formData.mainIncome) || 0) * 10000;
    const sideJobIncomeGross = (Number(formData.sideJobIncome) || 0) * 10000;
    const spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseMainIncome) || 0) : 0) * 10000;
    const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseSideJobIncome) || 0) : 0) * 10000;

    const selfNetAnnual = computeNetAnnual(mainJobIncomeGross) + computeNetAnnual(sideJobIncomeGross);
    const spouseNetAnnual = computeNetAnnual(spouseMainJobIncomeGross) + computeNetAnnual(spouseSideJobIncomeGross);

    setTotalNetAnnualIncome(selfNetAnnual + spouseNetAnnual);
}, [
    formData.mainIncome,
    formData.sideJobIncome,
    formData.spouseMainIncome,
    formData.spouseSideJobIncome,
    formData.familyComposition,
]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.formInitialized && typeof state.section === "number") {
        setCurrentSectionIndex(state.section);
      } else {
        // 不正な履歴（外部履歴）に戻ろうとした場合、強制的に初期セクションに戻す
        window.history.pushState({ formInitialized: true, section: 0 }, "", "");
        setCurrentSectionIndex(0);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // ページを離れる直前に最新のデータを保存する
      if (isReady && !initialStateFromLocation) {
        const cacheItem = {
          timestamp: Date.now(),
          data: formData,
        };
        localStorage.setItem(LIFE_PLAN_FORM_CACHE_KEY, JSON.stringify(cacheItem));
      }
      e.preventDefault();
      e.returnValue = ""; // Chrome, Firefox で有効
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData, isReady, initialStateFromLocation]);

  const renderSection = () => {
    switch (effectiveSections[currentSectionIndex]) {
      case '家族構成':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q1.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">家族構成に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                現在の家族構成は？<span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="familyComposition"
                    value="独身"
                    checked={formData.familyComposition === '独身'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">独身</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="familyComposition"
                    value="既婚"
                    checked={formData.familyComposition === '既婚'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">既婚</span>
                </label>
              </div>
              {errors.familyComposition && <p className="text-red-500 text-xs italic mt-2">{errors.familyComposition}</p>}
            </div>
          </div>
        );
      case '現在の収入':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q2.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">現在の収入に関する質問</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="personAge"> 
                本人の現在年齢[歳]
              </label>
              <input 
                type="number"
                id="personAge"
                name="personAge"
                value={formData.personAge || ''}
                onChange={handleInputChange}
                className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.personAge ? 'border-red-500' : ''}`}
                required
              /> 
              {errors.personAge && <p className="text-red-500 text-xs italic mt-1">{errors.personAge}</p>}
            </div>

            <div className="mb-4 flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mainIncome">
                  本業年間収入[万円]
                </label>
                <input
                  type="number"
                  id="mainIncome"
                  name="mainIncome"
                  value={formData.mainIncome}
                  onChange={handleInputChange}
                  className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.mainIncome ? 'border-red-500' : ''}`}
                  required
                />
                {errors.mainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.mainIncome}</p>}
              </div>
              <div className="w-24">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="annualRaiseRate">
                  昇給率（%）
                </label>
                <input
                  type="number"
                  id="annualRaiseRate"
                  step="0.1"
                  min="0"
                  name="annualRaiseRate"
                  value={formData.annualRaiseRate || ''}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sideJobIncome">
                副業年間収入[万円]
              </label>
              <input
                type="number"
                id="sideJobIncome"
                name="sideJobIncome"
                value={formData.sideJobIncome}
                onChange={handleInputChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                defaultValue={0}
              />
            </div>
            {formData.familyComposition === '既婚' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAge">
                  配偶者の現在年齢[歳]
                </label>
                <input
                  type="number"
                  id="spouseAge"
                  name="spouseAge"
                  value={formData.spouseAge || ''}
                  onChange={handleInputChange}
                  className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.spouseAge ? 'border-red-500' : ''}`}
                  required
                />
                {errors.spouseAge && <p className="text-red-500 text-xs italic mt-1">{errors.spouseAge}</p>}
              </div>
            )}

            <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''} flex items-end space-x-4`}>
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseMainIncome">
                    配偶者の本業年間収入[万円]
                  </label>
                  <input
                    type="number"
                    id="spouseMainIncome"
                    name="spouseMainIncome"
                    value={formData.spouseMainIncome}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.spouseMainIncome ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.spouseMainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.spouseMainIncome}</p>}
                </div>
                <div className="w-24">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAnnualRaiseRate">
                    昇給率（%）
                  </label>
                  <input
                    type="number"
                    id="spouseAnnualRaiseRate"
                    step="0.1"
                    min="0"
                    name="spouseAnnualRaiseRate"
                    value={formData.spouseAnnualRaiseRate || ''}
                    onChange={handleInputChange}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseSideJobIncome">
                  配偶者の副業年間収入（額面）[万円]
                </label>
                <input
                  type="number"
                  id="spouseSideJobIncome"
                  name="spouseSideJobIncome"
                  value={formData.spouseSideJobIncome}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  defaultValue={0}
                />
              </div>
          </div>
        );
      case '現在の支出':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q3.png" className="max-w-full h-auto"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">現在の支出に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                支出の入力方法を選んでください。
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="expenseMethod"
                    value="簡単"
                    checked={formData.expenseMethod === '簡単'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">簡単</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="expenseMethod"
                    value="詳細"
                    checked={formData.expenseMethod === '詳細'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">詳細</span>
                </label>
              </div>
              {errors.expenseMethod && <p className="text-red-500 text-xs italic mt-2">{errors.expenseMethod}</p>}
            </div>

            <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md mb-4">
                  ※住居費、自動車関連費、貯蓄・投資は除いて入力してください。
                </p>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostSimple">
                  生活費[円]
                </label>
                <input
                  type="number"
                  id="livingCostSimple"
                  name="livingCostSimple"
                  value={formData.livingCostSimple}
                  onChange={handleInputChange}
                  className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.livingCostSimple ? 'border-red-500' : ''}`}
                  required
                />
                {errors.livingCostSimple && <p className="text-red-500 text-xs italic mt-1">{errors.livingCostSimple}</p>}
              </div>
              </div>

            <div id="detailed-expense" className={`accordion-content ${formData.expenseMethod === '詳細' ? 'open' : ''}`}>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md mb-4">
                  ※住居費と自動車関連費は、後のセクションで詳細を入力します。
                </p>
                <h3 className="text-lg font-semibold mb-2">固定費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="utilitiesCost">
                    水道・光熱費[円]
                  </label>
                  <input type="number" id="utilitiesCost" name="utilitiesCost" value={formData.utilitiesCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.utilitiesCost ? 'border-red-500' : ''}`} required />
                  {errors.utilitiesCost && <p className="text-red-500 text-xs italic mt-1">{errors.utilitiesCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="communicationCost">
                    通信費[円]
                  </label>
                  <input type="number" id="communicationCost" name="communicationCost" value={formData.communicationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.communicationCost ? 'border-red-500' : ''}`} required />
                  {errors.communicationCost && <p className="text-red-500 text-xs italic mt-1">{errors.communicationCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceCost">
                    保険[円]
                  </label>
                  <input type="number" id="insuranceCost" name="insuranceCost" value={formData.insuranceCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.insuranceCost ? 'border-red-500' : ''}`} required />
                  {errors.insuranceCost && <p className="text-red-500 text-xs italic mt-1">{errors.insuranceCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationCost">
                    教養・教育[円]
                  </label>
                  <input type="number" id="educationCost" name="educationCost" value={formData.educationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.educationCost ? 'border-red-500' : ''}`} required />
                  {errors.educationCost && <p className="text-red-500 text-xs italic mt-1">{errors.educationCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherFixedCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherFixedCost" name="otherFixedCost" value={formData.otherFixedCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.otherFixedCost ? 'border-red-500' : ''}`} defaultValue={0} />
                  {errors.otherFixedCost && <p className="text-red-500 text-xs italic mt-1">{errors.otherFixedCost}</p>}
                </div>

                <h3 className="text-lg font-semibold mb-2">変動費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foodCost">
                    食費[円]
                  </label>
                  <input type="number" id="foodCost" name="foodCost" value={formData.foodCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.foodCost ? 'border-red-500' : ''}`} required />
                  {errors.foodCost && <p className="text-red-500 text-xs italic mt-1">{errors.foodCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dailyNecessitiesCost">
                    日用品[円]
                  </label>
                  <input type="number" id="dailyNecessitiesCost" name="dailyNecessitiesCost" value={formData.dailyNecessitiesCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.dailyNecessitiesCost ? 'border-red-500' : ''}`} required />
                  {errors.dailyNecessitiesCost && <p className="text-red-500 text-xs italic mt-1">{errors.dailyNecessitiesCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transportationCost">
                    交通費[円]
                  </label>
                  <input type="number" id="transportationCost" name="transportationCost" value={formData.transportationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.transportationCost ? 'border-red-500' : ''}`} required />
                  {errors.transportationCost && <p className="text-red-500 text-xs italic mt-1">{errors.transportationCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clothingBeautyCost">
                    衣類・美容[円]
                  </label>
                  <input type="number" id="clothingBeautyCost" name="clothingBeautyCost" value={formData.clothingBeautyCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.clothingBeautyCost ? 'border-red-500' : ''}`} required />
                  {errors.clothingBeautyCost && <p className="text-red-500 text-xs italic mt-1">{errors.clothingBeautyCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socializingCost">
                    交際費[円]
                  </label>
                  <input type="number" id="socializingCost" name="socializingCost" value={formData.socializingCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.socializingCost ? 'border-red-500' : ''}`} required />
                  {errors.socializingCost && <p className="text-red-500 text-xs italic mt-1">{errors.socializingCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hobbyEntertainmentCost">
                    趣味・娯楽[円]
                  </label>
                  <input type="number" id="hobbyEntertainmentCost" name="hobbyEntertainmentCost" value={formData.hobbyEntertainmentCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.hobbyEntertainmentCost ? 'border-red-500' : ''}`} required />
                  {errors.hobbyEntertainmentCost && <p className="text-red-500 text-xs italic mt-1">{errors.hobbyEntertainmentCost}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherVariableCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherVariableCost" name="otherVariableCost" value={formData.otherVariableCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.otherVariableCost ? 'border-red-500' : ''}`} defaultValue={0} />
                  {errors.otherVariableCost && <p className="text-red-500 text-xs italic mt-1">{errors.otherVariableCost}</p>}
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 車':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-car.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">車に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在ローン返済中ですか？</label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" className="custom-radio" name="carCurrentLoanInPayment" value="yes" checked={formData.carCurrentLoanInPayment === 'yes'} onChange={handleRadioChange} />
                  <span>はい</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" className="custom-radio" name="carCurrentLoanInPayment" value="no" checked={formData.carCurrentLoanInPayment === 'no'} onChange={handleRadioChange} />
                  <span>いいえ</span>
                </label>
                {errors.carCurrentLoanInPayment && <p className="text-red-500 text-xs italic mt-2">{errors.carCurrentLoanInPayment}</p>}
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.carCurrentLoanInPayment === 'yes' ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCurrentLoanMonthly">月々の返済額（円/月）</label>
                    <input type="number" id="carCurrentLoanMonthly" name="carCurrentLoanMonthly" value={formData.carCurrentLoanMonthly} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.carCurrentLoanMonthly ? 'border-red-500' : ''}`} />
                    {errors.carCurrentLoanMonthly && <p className="text-red-500 text-xs italic mt-1">{errors.carCurrentLoanMonthly}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCurrentLoanRemainingMonths">残り支払い回数（ヶ月）</label>
                    <input type="number" id="carCurrentLoanRemainingMonths" name="carCurrentLoanRemainingMonths" value={formData.carCurrentLoanRemainingMonths} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.carCurrentLoanRemainingMonths ? 'border-red-500' : ''}`} />
                    {errors.carCurrentLoanRemainingMonths && <p className="text-red-500 text-xs italic mt-1">{errors.carCurrentLoanRemainingMonths}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">今後、車を購入/買い替えする予定はありますか？</label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" className="custom-radio" name="carPurchasePlan" value="yes" checked={formData.carPurchasePlan === 'yes'} onChange={handleRadioChange} />
                  <span>はい</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" className="custom-radio" name="carPurchasePlan" value="no" checked={formData.carPurchasePlan === 'no'} onChange={handleRadioChange} />
                  <span>いいえ</span>
                </label>
                {errors.carPurchasePlan && <p className="text-red-500 text-xs italic mt-2">{errors.carPurchasePlan}</p>}
              </div>
            </div>

            <div className={`accordion-content ${formData.carPurchasePlan === 'yes' ? 'open' : ''}`}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carFirstReplacementAfterYears">
                初回買い替えは今から何年後？[年]
              </label>
              <input type="number" id="carFirstReplacementAfterYears" name="carFirstReplacementAfterYears" value={formData.carFirstReplacementAfterYears} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carFirstReplacementAfterYears ? 'border-red-500' : ''}`} />
              {errors.carFirstReplacementAfterYears && <p className="text-red-500 text-xs italic mt-1">{errors.carFirstReplacementAfterYears}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carPrice">
                今後買い替える車の価格帯は？[万円]
              </label>
              <input type="number" id="carPrice" name="carPrice" value={formData.carPrice} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carPrice ? 'border-red-500' : ''}`} required />
              {errors.carPrice && <p className="text-red-500 text-xs italic mt-1">{errors.carPrice}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carReplacementFrequency">
                車を乗り換える頻度は？[年]
              </label>
              <input type="number" id="carReplacementFrequency" name="carReplacementFrequency" value={formData.carReplacementFrequency} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carReplacementFrequency ? 'border-red-500' : ''}`} required />
              {errors.carReplacementFrequency && <p className="text-red-500 text-xs italic mt-1">{errors.carReplacementFrequency}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                ローンで購入しますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="carLoanUsage"
                    value="はい"
                    checked={formData.carLoanUsage === 'はい'}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="carLoanUsage"
                    value="いいえ"
                    checked={formData.carLoanUsage === 'いいえ'}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2">いいえ</span>
                </label>
              </div>
              {errors.carLoanUsage && <p className="text-red-500 text-xs italic mt-2">{errors.carLoanUsage}</p>}
            </div>
            <div className={`accordion-content ${formData.carLoanUsage === 'はい' ? 'open' : ''}`}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carLoanYears">
                  ローン年数は？
                </label>
                <select
                  id="carLoanYears"
                  name="carLoanYears"
                  value={formData.carLoanYears}
                  onChange={handleInputChange}
                  className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carLoanYears ? 'border-red-500' : ''}`}
                >
                  <option value="">選択してください</option>
                  <option value="3">3年</option>
                  <option value="5">5年</option>
                  <option value="7">7年</option>
                </select>
                {errors.carLoanYears && <p className="text-red-500 text-xs italic mt-1">{errors.carLoanYears}</p>}
              </div>
              <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                ローンの種類は？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="carLoanType"
                    value="銀行ローン"
                    checked={formData.carLoanType === '銀行ローン'}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2">銀行ローン</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="carLoanType"
                    value="ディーラーローン"
                    checked={formData.carLoanType === 'ディーラーローン'}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2">ディーラーローン</span>
                </label>
              </div>
              {errors.carLoanType && <p className="text-red-500 text-xs italic mt-2">{errors.carLoanType}</p>}
            </div>
            </div>
            </div>
          </div>
        );
      case 'ライフイベント - 家':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-home.png" alt="住まいのイラスト"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">住まいに関する質問</h2>

            {/* 1. 現住居の確認 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の住まいはどちらですか？</label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" className="custom-radio" name="housingType" value="賃貸" checked={formData.housingType === '賃貸'} onChange={handleRadioChange} required />
                  <span className="ml-2">賃貸</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" className="custom-radio" name="housingType" value="持ち家（ローン中）" checked={formData.housingType === '持ち家（ローン中）'} onChange={handleRadioChange} required />
                  <span className="ml-2">持ち家（ローン返済中）</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" className="custom-radio" name="housingType" value="持ち家（完済）" checked={formData.housingType === '持ち家（完済）'} onChange={handleRadioChange} required />
                  <span className="ml-2">持ち家（ローン完済）</span>
                </label>
                {errors.housingType && <p className="text-red-500 text-xs italic mt-2">{errors.housingType}</p>}
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.housingType === '賃貸' ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <div className="mt-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentRentLoanPayment">家賃（円/月）</label>
                  <input type="number" id="currentRentLoanPayment" name="currentRentLoanPayment" value={formData.currentRentLoanPayment} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.currentRentLoanPayment ? 'border-red-500' : ''}`} />
                  {errors.currentRentLoanPayment && <p className="text-red-500 text-xs italic mt-1">{errors.currentRentLoanPayment}</p>}
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.housingType === '持ち家（ローン中）' ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanMonthlyPayment">月額返済（円/月）</label>
                    <input type="number" id="loanMonthlyPayment" name="loanMonthlyPayment" value={formData.loanMonthlyPayment} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.loanMonthlyPayment ? 'border-red-500' : ''}`} />
                    {errors.loanMonthlyPayment && <p className="text-red-500 text-xs italic mt-1">{errors.loanMonthlyPayment}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanRemainingYears">残存年数（年）</label>
                    <input type="number" id="loanRemainingYears" name="loanRemainingYears" value={formData.loanRemainingYears} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.loanRemainingYears ? 'border-red-500' : ''}`} />
                    {errors.loanRemainingYears && <p className="text-red-500 text-xs italic mt-1">{errors.loanRemainingYears}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 将来の住宅購入について */}
            {formData.housingType === '賃貸' && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">将来の住宅購入について</h3>
                <label className="block text-gray-700 text-sm font-bold mb-2">将来的に家を購入する予定はありますか？</label>
                <div className="mt-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      className="custom-radio"
                    name="housePurchaseIntent"
                      value="yes"
                    checked={formData.housePurchaseIntent === 'yes'}
                      onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        housePurchaseIntent: 'yes',
                        housePurchasePlan: prev.housePurchasePlan === null 
                          ? { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 } 
                          : prev.housePurchasePlan
                      }));
                      }}
                    />
                    <span className="ml-2">はい</span>
                  </label>
                  <label className="inline-flex items-center">
                  <input type="radio" className="custom-radio" name="housePurchaseIntent" value="no" checked={formData.housePurchaseIntent === 'no'} onChange={() => setFormData(prev => ({...prev, housePurchaseIntent: 'no', housePurchasePlan: null}))} />
                    <span className="ml-2">いいえ</span>
                  </label>
                </div>
                {errors.housePurchaseIntent && <p className="text-red-500 text-xs italic mt-2">{errors.housePurchaseIntent}</p>}

                {formData.housePurchasePlan && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">購入予定年齢</label>
                      <input type="number" name="housePurchasePlan.age" value={formData.housePurchasePlan.age || ''} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.age'] ? 'border-red-500' : ''}`} />
                      {errors['housePurchasePlan.age'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.age']}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">予定価格[万円]</label>
                      <input type="number" name="housePurchasePlan.price" value={formData.housePurchasePlan.price || ''} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.price'] ? 'border-red-500' : ''}`} />
                      {errors['housePurchasePlan.price'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.price']}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">頭金[万円]</label>
                      <input type="number" name="housePurchasePlan.downPayment" value={formData.housePurchasePlan.downPayment || ''} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.downPayment'] ? 'border-red-500' : ''}`} />
                      {errors['housePurchasePlan.downPayment'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.downPayment']}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">ローン年数</label>
                      <input type="number" name="housePurchasePlan.loanYears" value={formData.housePurchasePlan.loanYears || ''} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.loanYears'] ? 'border-red-500' : ''}`} />
                      {errors['housePurchasePlan.loanYears'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.loanYears']}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">想定金利（%）</label>
                      <input type="number" name="housePurchasePlan.interestRate" value={formData.housePurchasePlan.interestRate || ''} onChange={handleInputChange} step="0.1" className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.interestRate'] ? 'border-red-500' : ''}`} />
                      {errors['housePurchasePlan.interestRate'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.interestRate']}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(formData.housingType.startsWith('持ち家') || formData.housePurchasePlan) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">将来リフォームの予定はありますか？</h3>
                <label className="block text-gray-700 text-sm font-bold mb-2">将来的にリフォームする予定はありますか？</label>
                <div className="mt-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      className="custom-radio"
                      name="renovationPlanToggle"
                      value="yes" checked={formData.houseRenovationPlans.length > 0}
                      onChange={() => setFormData((prev: typeof formData) => ({
                        ...prev,
                        houseRenovationPlans:
                          prev.houseRenovationPlans.length > 0 ?
                          prev.houseRenovationPlans :
                          [{ age: undefined as unknown as number, cost: 150, cycleYears: 10 }],
                      }))}
                    />
                    <span className="ml-2">はい</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="custom-radio"
                      name="renovationPlanToggle"
                      value="no"
                      checked={formData.houseRenovationPlans.length === 0}
                      onChange={() => setFormData((prev: typeof formData) => ({
                        ...prev,
                        houseRenovationPlans: [],
                      }))}
                    />
                    <span className="ml-2">いいえ</span>
                  </label>
                </div>

                {formData.houseRenovationPlans.length > 0 && (() => {
                  const plan = formData.houseRenovationPlans[0];
                  return (
                    <div className="mt-4 space-y-4 border rounded p-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">実施予定年齢</label>
                        <input
                          type="number" 
                          value={plan?.age ?? ''}
                          onChange={(e) => handleRenovationPlanChange(0, 'age', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">費用[万円]</label>
                        <input
                          type="number"
                          value={plan?.cost ?? ''}
                          onChange={(e) => handleRenovationPlanChange(0, 'cost', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">繰り返し頻度[年]</label>
                        <input
                          type="number"
                          value={plan?.cycleYears ?? ''}
                          onChange={(e) => handleRenovationPlanChange(0, 'cycleYears', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      case 'ライフイベント - 結婚':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-marriage.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">結婚に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                結婚を予定していますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="planToMarry"
                    value="する"
                    checked={formData.planToMarry === 'する'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">する</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="planToMarry"
                    value="しない"
                    checked={formData.planToMarry === 'しない'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">しない</span>
                </label>
              </div>
              {errors.planToMarry && <p className="text-red-500 text-xs italic mt-2">{errors.planToMarry}</p>}
            </div>
            <div className={`accordion-content ${formData.planToMarry === 'する' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="marriageAge">
                    結婚予定年齢は？[歳]
                  </label>
                  <input type="number" id="marriageAge" name="marriageAge" value={formData.marriageAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.marriageAge ? 'border-red-500' : ''}`} required />
                  {errors.marriageAge && <p className="text-red-500 text-xs italic mt-1">{errors.marriageAge}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAgeAtMarriage">
                    結婚時点での配偶者の年齢は？[歳]
                  </label>
                  <input type="number" id="spouseAgeAtMarriage" name="spouseAgeAtMarriage" value={formData.spouseAgeAtMarriage} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spouseAgeAtMarriage ? 'border-red-500' : ''}`} />
                  {errors.spouseAgeAtMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.spouseAgeAtMarriage}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">配偶者の収入は？</label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="パート" checked={formData.spouseIncomePattern === 'パート'} onChange={handleRadioChange} /><span className="ml-2">パート (106万円)</span></label>
                    <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="正社員" checked={formData.spouseIncomePattern === '正社員'} onChange={handleRadioChange} /><span className="ml-2">正社員 (300万円)</span></label>
                    <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="カスタム" checked={formData.spouseIncomePattern === 'カスタム'} onChange={handleRadioChange} /><span className="ml-2">カスタム入力</span></label>
                  </div>
                  {errors.spouseIncomePattern && <p className="text-red-500 text-xs italic mt-2">{errors.spouseIncomePattern}</p>}
                </div>
                {formData.spouseIncomePattern === 'カスタム' && (
                  <div className="mb-4 pl-4 border-l-4 border-blue-300">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseCustomIncome">
                      配偶者の年収[万円]
                    </label>
                    <input type="number" id="spouseCustomIncome" name="spouseCustomIncome" value={formData.spouseCustomIncome} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spouseCustomIncome ? 'border-red-500' : ''}`} />
                    {errors.spouseCustomIncome && <p className="text-red-500 text-xs italic mt-1">{errors.spouseCustomIncome}</p>}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostAfterMarriage">
                    結婚後の生活費（月額）[円]
                  </label>
                  <input
                    type="number"
                    id="livingCostAfterMarriage"
                    name="livingCostAfterMarriage"
                    value={formData.livingCostAfterMarriage}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.livingCostAfterMarriage ? 'border-red-500' : ''}`}
                  />
                  {errors.livingCostAfterMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.livingCostAfterMarriage}</p>}
                  <p className="text-xs text-gray-500 mt-1">独身時の生活費の1.5倍が自動入力されます。自由に編集可能です。</p>
                </div>
                <div className="mb-4">
                  <label className={`block text-sm font-bold mb-2 ${formData.housingType === '持ち家（ローン中）' ? 'text-gray-400' : 'text-gray-700'}`} htmlFor="housingCostAfterMarriage">
                    結婚後の住居費（月額）[円]
                  </label>
                  <input
                    type="number"
                    id="housingCostAfterMarriage"
                    name="housingCostAfterMarriage"
                    value={formData.housingType === '持ち家（ローン中）' ? '' : formData.housingCostAfterMarriage}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.housingCostAfterMarriage ? 'border-red-500' : ''} ${formData.housingType === '持ち家（ローン中）' ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    disabled={formData.housingType === '持ち家（ローン中）'}
                  />
                  {errors.housingCostAfterMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.housingCostAfterMarriage}</p>}
                  {formData.housingType === '持ち家（ローン中）' ? (
                    <p className="text-xs text-gray-500 mt-1">※現在「持ち家（ローン中）」のため、結婚後も住宅ローンの返済が継続されます。</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">独身時の住居費の1.3倍が自動入力されます。自由に編集可能です。</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="engagementCost">
                    婚約関連費用（指輪・結納金など）[万円]
                  </label>
                  <input type="number" id="engagementCost" name="engagementCost" value={formData.engagementCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={200} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="weddingCost">
                    結婚式費用[万円]
                  </label>
                  <input type="number" id="weddingCost" name="weddingCost" value={formData.weddingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={330} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="honeymoonCost">
                    新婚旅行費用[万円]
                  </label>
                  <input type="number" id="honeymoonCost" name="honeymoonCost" value={formData.honeymoonCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={35} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHomeMovingCost">
                    新居への引っ越し費用[万円]
                  </label>
                  <input type="number" id="newHomeMovingCost" name="newHomeMovingCost" value={formData.newHomeMovingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={50} />
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 子供':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-children.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">子供に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                子供はいますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasChildren"
                    value="はい"
                    checked={formData.hasChildren === 'はい'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasChildren"
                    value="いいえ"
                    checked={formData.hasChildren === 'いいえ'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">いいえ</span>
                </label>
              </div>
              {errors.hasChildren && <p className="text-red-500 text-xs italic mt-2">{errors.hasChildren}</p>}
            </div>
            <div className={`accordion-content ${formData.hasChildren === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfChildren">
                    子供の人数は？[人]
                  </label>
                  <input type="number" id="numberOfChildren" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.numberOfChildren ? 'border-red-500' : ''}`} required />
                  {errors.numberOfChildren && <p className="text-red-500 text-xs italic mt-1">{errors.numberOfChildren}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstBornAge">
                    最初の子が生まれる予定年齢は？[歳]
                  </label>
                  <input type="number" id="firstBornAge" name="firstBornAge" value={formData.firstBornAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.firstBornAge ? 'border-red-500' : ''}`} required />
                  {errors.firstBornAge && <p className="text-red-500 text-xs italic mt-1">{errors.firstBornAge}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationPattern">
                    教育費の想定パターンは？
                  </label>
                  <select 
                    id="educationPattern"
                    name="educationPattern"
                    value={formData.educationPattern}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.educationPattern ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="公立中心">公立中心（〜1,000万円/人）</option>
                    <option value="公私混合">公私混合（〜1,600万円/人）</option>
                    <option value="私立中心">私立中心（〜2,000万円/人）</option>
                  </select>
                  {errors.educationPattern && <p className="text-red-500 text-xs italic mt-1">{errors.educationPattern}</p>}
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 生活':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-appliances.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">生活に関する質問</h2>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">家電買い替えサイクルと費用</h3>

              <table className="table-fixed w-full border-separate border-spacing-y-2">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[17%]" />
                  <col className="w-[17%]" />
                  <col className="w-[31%]" />
                  <col className="w-[40px]" />
                </colgroup>
                <thead>
                  <tr className="text-xs text-gray-600 text-left">
                    <th className="text-left px-1">家電名</th>
                    <th className="text-left px-1">買い替えサイクル（年）</th>
                    <th className="text-left px-1">初回買い替え（年後）</th>
                    <th className="text-left px-1">1回あたりの費用（万円）</th>
                    <th className="px-1 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.appliances.map((appliance, index) => (
                    <tr key={index} className="align-middle">
                      <td className="px-1">
                        <input
                          type="text"
                          placeholder="家電名"
                          value={appliance.name}
                          onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
                          className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                        />
                      </td>
                      <td className="px-1">
                        <input
                          type="number"
                          placeholder="年数"
                          value={appliance.cycle}
                          min={0}
                          onChange={(e) => handleApplianceChange(index, 'cycle', e.target.value)}
                          className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                        />
                      </td>
                      <td className="px-1">
                        <input
                          type="number"
                          placeholder="年後"
                          value={appliance.firstReplacementAfterYears}
                          min={0}
                          onChange={(e) => handleApplianceChange(index, 'firstReplacementAfterYears', e.target.value)}
                          className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                        />
                      </td>
                      <td className="px-1">
                        <input
                          type="number"
                          placeholder="費用（万円）"
                          value={appliance.cost}
                          min={0}
                          onChange={(e) => handleApplianceChange(index, 'cost', e.target.value)}
                          className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                        />
                      </td>
                      <td className="px-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveAppliance(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="この家電行を削除"
                          title="削除"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={addAppliance}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  家電を追加する
                </button>
              </div>
            </div>
          </div>
        );
      case 'ライフイベント - 親の介護':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-parenthelp.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">親の介護に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                親の介護が将来発生すると想定しますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="はい"
                    checked={formData.parentCareAssumption === 'はい'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="いいえ"
                    checked={formData.parentCareAssumption === 'いいえ'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">いいえ</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="まだ分からない"
                    checked={formData.parentCareAssumption === 'まだ分からない'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">まだ分からない</span>
                </label>
              </div>
              {errors.parentCareAssumption && <p className="text-red-500 text-xs italic mt-2">{errors.parentCareAssumption}</p>}
            </div>
            <div className={`accordion-content ${formData.parentCareAssumption === 'はい' ? 'open' : ''}`}>
              {formData.parentCarePlans.map((plan, index) => (
                <div key={plan.id} className="border rounded p-4 mb-4 relative">
                  <h3 className="text-lg font-semibold mb-2">{index + 1}人目の親の設定</h3>
                  {formData.parentCarePlans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCarePlan(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      aria-label={`${index + 1}人目の設定を削除`}
                      title="削除"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].parentCurrentAge`}>
                        現在の年齢[歳]
                      </label>
                      <input type="number" id={`parentCarePlans[${index}].parentCurrentAge`} value={plan.parentCurrentAge} onChange={(e) => handleCarePlanChange(index, 'parentCurrentAge', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].parentCurrentAge`] ? 'border-red-500' : ''}`} />
                      {errors[`parentCarePlans[${index}].parentCurrentAge`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].parentCurrentAge`]}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].parentCareStartAge`}>
                        介護開始年齢[歳]
                      </label>
                      <input type="number" id={`parentCarePlans[${index}].parentCareStartAge`} value={plan.parentCareStartAge} onChange={(e) => handleCarePlanChange(index, 'parentCareStartAge', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].parentCareStartAge`] ? 'border-red-500' : ''}`} />
                      {errors[`parentCarePlans[${index}].parentCareStartAge`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].parentCareStartAge`]}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].monthly10kJPY`}>
                        介護費用の想定（月額）[万円]
                      </label>
                      <input type="number" id={`parentCarePlans[${index}].monthly10kJPY`} value={plan.monthly10kJPY} onChange={(e) => handleCarePlanChange(index, 'monthly10kJPY', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].monthly10kJPY`] ? 'border-red-500' : ''}`} />
                      {errors[`parentCarePlans[${index}].monthly10kJPY`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].monthly10kJPY`]}</p>}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].years`}>
                        介護期間の想定[年]
                      </label>
                      <input type="number" id={`parentCarePlans[${index}].years`} value={plan.years} onChange={(e) => handleCarePlanChange(index, 'years', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].years`] ? 'border-red-500' : ''}`} />
                      {errors[`parentCarePlans[${index}].years`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].years`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <button type="button" onClick={addCarePlan} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  親の設定を追加する
                </button>
                {totalCareCost > 0 && (
                  <div className="mt-4 text-right text-lg font-semibold">
                    介護費用総額: <span className="text-blue-600">{totalCareCost.toLocaleString()}</span> 万円
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'ライフイベント - 老後':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-retirement.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">老後に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postRetirementLivingCost">
                老後の生活費（月額）[万円]
              </label>
              <input type="number" id="postRetirementLivingCost" name="postRetirementLivingCost" value={formData.postRetirementLivingCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.postRetirementLivingCost ? 'border-red-500' : ''}`} defaultValue={25} />
              {errors.postRetirementLivingCost && <p className="text-red-500 text-xs italic mt-1">{errors.postRetirementLivingCost}</p>}
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold text-center mb-4">本人の老後設定</h3>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="retirementAge">
                  退職予定年齢は？[歳]
                </label>
                <input type="number" id="retirementAge" name="retirementAge" value={formData.retirementAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.retirementAge ? 'border-red-500' : ''}`} defaultValue={65} />
                {errors.retirementAge && <p className="text-red-500 text-xs italic mt-1">{errors.retirementAge}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionStartAge">
                  年金の想定受給開始年齢は？[歳]
                </label>
                <input type="number" id="pensionStartAge" name="pensionStartAge" value={formData.pensionStartAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.pensionStartAge ? 'border-red-500' : ''}`} defaultValue={65} />
                {errors.pensionStartAge && <p className="text-red-500 text-xs italic mt-1">{errors.pensionStartAge}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionAmount">
                  年金受給額（月額）[万円]
                </label>
                <input type="number" id="pensionAmount" name="pensionAmount" value={formData.pensionAmount} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.pensionAmount ? 'border-red-500' : ''}`} defaultValue={15} />
                {errors.pensionAmount && <p className="text-red-500 text-xs italic mt-1">{errors.pensionAmount}</p>}
              </div>
            </div>

            {(formData.familyComposition === '既婚' || formData.planToMarry === 'する') && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-semibold text-center mb-4">配偶者の老後設定</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseRetirementAge">
                    配偶者の退職予定年齢は？[歳]
                  </label>
                  <input
                    type="number"
                    id="spouseRetirementAge"
                    name="spouseRetirementAge"
                    value={formData.spouseRetirementAge}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spouseRetirementAge ? 'border-red-500' : ''}`}
                    defaultValue={65}
                  />
                  {errors.spouseRetirementAge && <p className="text-red-500 text-xs italic mt-1">{errors.spouseRetirementAge}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spousePensionStartAge">
                    配偶者の年金受給開始年齢は？[歳]
                  </label>
                  <input
                    type="number"
                    id="spousePensionStartAge"
                    name="spousePensionStartAge"
                    value={formData.spousePensionStartAge}
                    onChange={handleInputChange}
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spousePensionStartAge ? 'border-red-500' : ''}`}
                    defaultValue={65}
                  />
                  {errors.spousePensionStartAge && <p className="text-red-500 text-xs italic mt-1">{errors.spousePensionStartAge}</p>}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spousePensionAmount">配偶者の年金受給額（月額）[万円]</label>
                  <input type="number" id="spousePensionAmount" name="spousePensionAmount" value={formData.spousePensionAmount} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spousePensionAmount ? 'border-red-500' : ''}`} defaultValue={10} />
                  {errors.spousePensionAmount && <p className="text-red-500 text-xs italic mt-1">{errors.spousePensionAmount}</p>}
                </div>
              </div>
            )}
          </div>
        );
      case '貯蓄':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-savings.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">貯蓄に関する質問</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentSavings">
                現在の預貯金総額は？[万円]
              </label>
              <input type="number" id="currentSavings" name="currentSavings" value={formData.currentSavings} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.currentSavings ? 'border-red-500' : ''}`} required />
              {errors.currentSavings && <p className="text-red-500 text-xs italic mt-1">{errors.currentSavings}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlySavings">
                毎月の貯蓄額は？[円]
              </label>
              <input type="number" id="monthlySavings" name="monthlySavings" value={formData.monthlySavings} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.monthlySavings ? 'border-red-500' : ''}`} required />
              {errors.monthlySavings && <p className="text-red-500 text-xs italic mt-1">{errors.monthlySavings}</p>}
            </div>
          </div>
        );
      case '投資': {
        const investmentFormValues: InvestmentFormValues = {
          investmentStocksCurrent: formData.investmentStocksCurrent,
          investmentStocksAnnualSpot: formData.investmentStocksAnnualSpot,
          investmentStocksRate: formData.investmentStocksRate,
          investmentTrustCurrent: formData.investmentTrustCurrent,
          investmentTrustAnnualSpot: formData.investmentTrustAnnualSpot,
          investmentTrustRate: formData.investmentTrustRate,
          investmentBondsCurrent: formData.investmentBondsCurrent,
          investmentBondsAnnualSpot: formData.investmentBondsAnnualSpot,
          investmentBondsRate: formData.investmentBondsRate,
          investmentIdecoCurrent: formData.investmentIdecoCurrent,
          investmentIdecoAnnualSpot: formData.investmentIdecoAnnualSpot,
          investmentIdecoRate: formData.investmentIdecoRate,
          investmentCryptoCurrent: formData.investmentCryptoCurrent,
          investmentCryptoAnnualSpot: formData.investmentCryptoAnnualSpot,
          investmentCryptoRate: formData.investmentCryptoRate,
          investmentOtherCurrent: formData.investmentOtherCurrent,
          investmentOtherAnnualSpot: formData.investmentOtherAnnualSpot,
          investmentOtherRate: formData.investmentOtherRate,
        };

        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-investment.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">投資に関する質問</h2>
            <div className="space-y-4">
              <AssetAccordion
                assetName="株式"
                assetKey="investmentStocks"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
                accountTypeFieldName="investmentStocksAccountType"
                accountTypeValue={formData.investmentStocksAccountType}
              />
              <AssetAccordion
                assetName="投資信託"
                assetKey="investmentTrust"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
                accountTypeFieldName="investmentTrustAccountType"
                accountTypeValue={formData.investmentTrustAccountType}
              />
              <AssetAccordion
                assetName="債券"
                assetKey="investmentBonds"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="iDeCo"
                assetKey="investmentIdeco"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="仮想通貨"
                assetKey="investmentCrypto"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="その他"
                assetKey="investmentOther"
                formData={investmentFormValues}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
                accountTypeFieldName="investmentOtherAccountType"
                accountTypeValue={formData.investmentOtherAccountType}
              />
            </div>
          </div>
        );
      }
      case 'シミュレーション設定':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q5-settings.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">シミュレーション設定に関する質問</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="simulationPeriodAge">
                シミュレーションの対象期間（現在から何歳まで）[歳]
              </label>
              <input type="number" id="simulationPeriodAge" name="simulationPeriodAge" value={formData.simulationPeriodAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.simulationPeriodAge ? 'border-red-500' : ''}`} defaultValue={90} />
              {errors.simulationPeriodAge && <p className="text-red-500 text-xs italic mt-1">{errors.simulationPeriodAge}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                利回りシナリオの選択
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="interestRateScenario"
                    value="固定利回り"
                    checked={formData.interestRateScenario === '固定利回り'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">固定利回り（例：年3%）</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="interestRateScenario"
                    value="ランダム変動"
                    checked={formData.interestRateScenario === 'ランダム変動'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">ランダム変動（ストレステストあり）</span>
                </label>
              </div>
              {errors.interestRateScenario && <p className="text-red-500 text-xs italic mt-2">{errors.interestRateScenario}</p>}
              <div className={`accordion-content ${formData.interestRateScenario === '固定利回り' ? 'open' : ''}`}>
                <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fixedInterestRate">
                    固定利率（%）
                  </label>
                  <input
                    type="number"
                    id="fixedInterestRate"
                    name="fixedInterestRate"
                    value={formData.fixedInterestRate}
                    onChange={handleInputChange}
                    step="0.1"
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    この設定を有効にすると投資セクションの個別利率は無視されます。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyFund">
                生活防衛資金（常に確保したい現金額）[万円]
              </label>
              <input type="number" id="emergencyFund" name="emergencyFund" value={formData.emergencyFund} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.emergencyFund ? 'border-red-500' : ''}`} defaultValue={300} />
              {errors.emergencyFund && <p className="text-red-500 text-xs italic mt-1">{errors.emergencyFund}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const progress = ((currentSectionIndex + 1) / effectiveSections.length) * 100;

  const isHouseLoanSection = effectiveSections[currentSectionIndex] === 'ライフイベント - 家';
  const shouldShowLoanBox = isHouseLoanSection && 
  (
    formData.housingLoanStatus === 'これから借りる予定' || 
    formData.housingLoanStatus === 'すでに返済中' || 
    formData.housePurchasePlan !== null ||
    (formData.housingType === '持ち家（ローン中）' && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0)
);


    function renderFloatingBox(amount: number, shouldShow: boolean, label: string, topClass: string = 'top-[1.5rem]') {
  return (
    <div
      className={"absolute " + topClass + " inset-x-0 z-50 transition-opacity duration-500 " +
        (shouldShow ? "opacity-100" : "opacity-0 pointer-events-none")}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-md w-fit mx-auto px-4 py-2">
          <span className="text-yellow-800 text-sm md:text-xl font-semibold">
            {label}: {amount.toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  );
}

const renderConfirmationView = () => {
    const n = (v: unknown) => Number(v) || 0;

    // --- 右カラム（ライフプラン）のイベントを構築 ---
    const events: { age: number, title: string, details: { label: string, value: React.ReactNode }[], incomeChange?: number }[] = [];

    // 現在の収入
    const selfGrossIncome = n(formData.mainIncome) * 10000 + n(formData.sideJobIncome) * 10000;
    const selfNetIncome = computeNetAnnual(selfGrossIncome);
    
    // --- 確認画面用の追加計算 ---
    // 額面の世帯年収
    const currentSpouseGrossIncomeForSummary = formData.familyComposition === '既婚' ? (n(formData.spouseMainIncome) * 10000 + n(formData.spouseSideJobIncome) * 10000) : 0;
    const totalGrossAnnualIncome = selfGrossIncome + currentSpouseGrossIncomeForSummary;

    // 月の生活費
    const monthlyLivingExpense = formData.expenseMethod === '簡単'
      ? n(formData.livingCostSimple)
      : totalExpenses; // totalExpenses は既に月額合計（円）として計算されている

    // 現在支払っている月額費用
    const currentCarLoanMonthly = formData.carCurrentLoanInPayment === 'yes' ? n(formData.carCurrentLoanMonthly) : 0;
    const currentHousingMonthly = formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : (formData.housingType === '持ち家（ローン中）' ? n(formData.loanMonthlyPayment) : 0);
    
    const currentCareMonthly = formData.parentCareAssumption === 'はい'
      ? formData.parentCarePlans.reduce((sum, plan) => {
          const hasStarted = n(plan.parentCurrentAge) >= n(plan.parentCareStartAge);
          return hasStarted ? sum + n(plan.monthly10kJPY) * 10000 : sum;
        }, 0)
      : 0;

    let currentEducationMonthly = 0;
    if (formData.hasChildren === 'はい') {
      // 年齢ステージ別の年間教育費（万円）
      const educationCostByStage = {
        '公立中心': {
          preschool: 22,   // 0-6歳
          elementary: 32,  // 7-12歳
          middle: 49,      // 13-15歳
          high: 46,        // 16-18歳
          university: 104, // 19-22歳
        },
        '公私混合': {
          preschool: 22,
          elementary: 32,
          middle: 49,
          high: 107, // 私立高校
          university: 250, // 私立大学
        },
        '私立中心': {
          preschool: 80,
          elementary: 160,
          middle: 140,
          high: 107,
          university: 250,
        },
      };

      const pattern = formData.educationPattern as keyof typeof educationCostByStage;
      const costStages = educationCostByStage[pattern];

      for (let i = 0; i < n(formData.numberOfChildren); i++) {
        // 子供の現在の年齢を計算
        const childBirthYearInPersonAge = n(formData.firstBornAge) + i * 3;
        const childCurrentAge = n(formData.personAge) - childBirthYearInPersonAge;

        let annualCostForChild = 0;
        if (costStages) {
          if (childCurrentAge >= 0 && childCurrentAge <= 6) annualCostForChild = costStages.preschool;
          else if (childCurrentAge >= 7 && childCurrentAge <= 12) annualCostForChild = costStages.elementary;
          else if (childCurrentAge >= 13 && childCurrentAge <= 15) annualCostForChild = costStages.middle;
          else if (childCurrentAge >= 16 && childCurrentAge <= 18) annualCostForChild = costStages.high;
          else if (childCurrentAge >= 19 && childCurrentAge <= 22) annualCostForChild = costStages.university;
        }

        currentEducationMonthly += (annualCostForChild * 10000) / 12;
      }
    }

    // 表示する項目をフィルタリング
    const currentPayments = [
      { label: '車のローン', value: currentCarLoanMonthly },
      { label: '住居費', value: currentHousingMonthly },
      { label: '介護費用', value: currentCareMonthly },
      { label: '教育費(想定)', value: currentEducationMonthly },
    ].filter(p => p.value > 0);

    // サマリー表示用の「現在の」世帯手取り年収
    const currentSpouseGrossIncome = formData.familyComposition === '既婚' ? (n(formData.spouseMainIncome) * 10000 + n(formData.spouseSideJobIncome) * 10000) : 0;
    const summaryTotalNetAnnualIncome = selfNetIncome + computeNetAnnual(currentSpouseGrossIncome);

    let spouseNetIncome = formData.familyComposition === '既婚' ? computeNetAnnual(currentSpouseGrossIncome) : 0;
    const currentHouseholdNetIncome = selfNetIncome + spouseNetIncome;

    // 結婚イベント
    if (formData.planToMarry === 'する') {
      // 「結婚する」場合、将来の配偶者収入を計算して spouseNetIncome を更新する
      let spouseGrossIncomeAfterMarriage = 0;
      if (formData.spouseIncomePattern === 'パート') spouseGrossIncomeAfterMarriage = 1060000;
      else if (formData.spouseIncomePattern === '正社員') spouseGrossIncomeAfterMarriage = 3000000;
      else if (formData.spouseIncomePattern === 'カスタム') spouseGrossIncomeAfterMarriage = n(formData.spouseCustomIncome) * 10000;
      
      spouseNetIncome = computeNetAnnual(spouseGrossIncomeAfterMarriage);

      let spouseIncomeForSim = 0;
      if (formData.spouseIncomePattern === 'パート') spouseIncomeForSim = 1060000;
      else if (formData.spouseIncomePattern === '正社員') spouseIncomeForSim = 3000000;
      else if (formData.spouseIncomePattern === 'カスタム') spouseIncomeForSim = n(formData.spouseCustomIncome) * 10000;
      
      const spouseNetIncomeAfterMarriage = computeNetAnnual(spouseIncomeForSim);
      
      events.push({
        age: n(formData.marriageAge),
        title: '💒 結婚',
        details: [
          { label: '結婚費用', value: formatYen(totalMarriageCost) },
          { label: '配偶者の収入が加算', value: `+ ${formatYen(spouseNetIncomeAfterMarriage)} /年` },
        ],
        incomeChange: spouseNetIncomeAfterMarriage
      });
    }

    // 子供イベント
    if (formData.hasChildren === 'はい') {
      const educationCosts = {
        '公立中心': 1000, // 万円
        '公私混合': 1600,
        '私立中心': 2000,
      };
      const educationCost = educationCosts[formData.educationPattern as keyof typeof educationCosts] || 0;

      for (let i = 0; i < n(formData.numberOfChildren); i++) {
        events.push({
          age: n(formData.firstBornAge) + i * 3,
          title: `👶 ${i + 1}人目の子供誕生`,
          details: [
            { label: '教育費の発生', value: `〜${n(formData.firstBornAge) + i * 3 + 22}歳まで` },
            { label: '教育費パターン', value: `${formData.educationPattern}（${educationCost.toLocaleString()}万円/人）` }
          ]
        });
      }
    }

    // 住宅購入イベント
    if (formData.housePurchasePlan) {
      events.push({
        age: n(formData.housePurchasePlan.age),
        title: '🏠 住宅購入',
        details: [
          { label: '物件価格', value: formatManYen(formData.housePurchasePlan.price) },
          { label: '頭金支払い', value: `- ${formatManYen(formData.housePurchasePlan.downPayment)}` },
          { label: 'ローン返済開始', value: `〜${n(formData.housePurchasePlan.age) + n(formData.housePurchasePlan.loanYears)}歳まで` },
        ]
      });
    }

    // 車の買い替えイベント
    if (formData.carPurchasePlan === 'yes' && n(formData.carFirstReplacementAfterYears) > 0) {
      events.push({
        age: n(formData.personAge) + n(formData.carFirstReplacementAfterYears),
        title: '🚗 車の買い替え',
        details: [
          { label: '1回あたりの買替額', value: formatManYen(formData.carPrice) },
          { label: 'ローンの有無', value: formData.carLoanUsage === 'はい' ? `あり (${formData.carLoanYears}年)` : 'なし' },
          { label: '買い替えサイクル', value: `${formData.carReplacementFrequency}年ごと` },
        ]
      });
    }

    // 介護イベント
    if (formData.parentCareAssumption === 'はい') {
      formData.parentCarePlans.forEach(plan => {
        // 介護開始が本人の何歳の時かを計算
        const startAge = n(formData.personAge) + (n(plan.parentCareStartAge) - n(plan.parentCurrentAge));
        const endAge = startAge + n(plan.years);
        const annualCost = n(plan.monthly10kJPY) * 10000 * 12;

        events.push({
          age: startAge,
          title: '👨‍👩‍👧‍👦 親の介護開始',
          details: [
            { label: '年間介護費用', value: `+ ${formatYen(annualCost)} /年 (〜${endAge}歳)` },
          ],
        });
      });
    }

    // リフォームイベント
    if (formData.houseRenovationPlans.length > 0) {
      formData.houseRenovationPlans.forEach((plan, index) => {
        if (n(plan.age) > 0) {
          events.push({
            age: n(plan.age),
            title: `🛠️ リフォーム実施 (${index + 1}回目)`,
            details: [
              { label: '費用', value: formatManYen(plan.cost) },
              { label: '繰り返し', value: plan.cycleYears ? `${plan.cycleYears}年ごと` : '1回のみ' },
            ]
          });
        }
      });
    }

    // イベントを年齢でソート（退職イベントの前に一度ソートが必要）
    events.sort((a, b) => a.age - b.age);

    // 収入の変遷を計算（退職イベントの計算に必要）
    const incomeHistory: { ageRange: string; income: number }[] = [];
    let lastAgeForHistory = n(formData.personAge);
    let timelineHouseholdNetIncomeForHistory = currentHouseholdNetIncome;

    for (const event of events) {
      if (event.age > lastAgeForHistory) {
        incomeHistory.push({
          ageRange: `${lastAgeForHistory}歳〜`,
          income: timelineHouseholdNetIncomeForHistory
        });
      }
      if (event.incomeChange !== undefined) {
        timelineHouseholdNetIncomeForHistory += event.incomeChange;
      }
      lastAgeForHistory = event.age;
    }


    // 退職イベント
    const retirementAge = n(formData.retirementAge);
    const pensionStartAge = n(formData.pensionStartAge);
    const pensionNetIncome = n(formData.pensionAmount) * 10000 * 12; // 本人の年金

    // ユーザー本人の退職イベント
    if (selfNetIncome > 0) {
      events.push({
        age: retirementAge,
        title: '👤 あなたの退職',
        details: [
            { label: '給与収入が停止', value: `手取り年収が減少します` },
        ],
        incomeChange: -selfNetIncome
      });
    }

    // ユーザー本人の年金受給開始イベント
    if (pensionNetIncome > 0) {
      events.push({
        age: pensionStartAge,
        title: '👤 あなたの年金受給開始',
        details: [
          { label: '年金受給開始', value: `+ ${formatYen(pensionNetIncome)} /年` },
        ],
        incomeChange: pensionNetIncome
      });
    }

    // 配偶者の退職イベント
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
        const personAge = n(formData.personAge);
        const spouseCurrentAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);

        const spouseRetirementTargetAge = n(formData.spouseRetirementAge);
        const spousePensionStartTargetAge = n(formData.spousePensionStartAge);
        const spousePensionNetIncome = n(formData.spousePensionAmount) * 10000 * 12;

        // 配偶者の退職が、本人の何歳の時に起こるか
        const spouseRetirementAgeOnPersonTimeline = personAge + (spouseRetirementTargetAge - spouseCurrentAge);
        // 配偶者の年金受給が、本人の何歳の時に起こるか
        const spousePensionStartAgeOnPersonTimeline = personAge + (spousePensionStartTargetAge - spouseCurrentAge);

        // 配偶者の収入がある場合、退職イベントを追加
        if (spouseNetIncome > 0) {
            events.push({
               age: spouseRetirementAgeOnPersonTimeline,
               title: 'パートナーの退職',
               details: [
                   { label: '給与収入が停止', value: `手取り年収が減少します` },
               ],
               incomeChange: -spouseNetIncome
           });
        }

        // 配偶者の年金収入がある場合、年金受給開始イベントを追加
        if (spousePensionNetIncome > 0) {
            events.push({
               age: spousePensionStartAgeOnPersonTimeline,
               title: 'パートナーの年金受給開始',
               details: [
                   { label: '年金受給開始', value: `+ ${formatYen(spousePensionNetIncome)} /年` },
               ],
               incomeChange: spousePensionNetIncome
           });
        }
    }

    // イベントを年齢でソート
    events.sort((a, b) => a.age - b.age);

    // 各イベント発生時点での累計収入を計算
    const incomeAtEvent: number[] = [];
    let cumulativeIncome = currentHouseholdNetIncome;
    for (const event of events) {
      cumulativeIncome += event.incomeChange ?? 0;
      incomeAtEvent.push(cumulativeIncome);
    }
    // 収入の変遷を計算
    const finalIncomeHistory: { ageRange: string; income: number }[] = [];
    let lastAge = n(formData.personAge);

    // タイムライン用の収入履歴を再計算
    let timelineHouseholdNetIncome = currentHouseholdNetIncome;
    for (const event of events) {
      if (event.age > lastAge) {
        finalIncomeHistory.push({
          ageRange: `${lastAge}歳〜`,
          income: timelineHouseholdNetIncome
        });
      }
      if (event.incomeChange !== undefined) {
        timelineHouseholdNetIncome += event.incomeChange;
      }
      lastAge = event.age;
    }
    // 最後の期間を追加
    if (lastAge <= n(formData.simulationPeriodAge)) {
      finalIncomeHistory.push({
        ageRange: `${lastAge}歳〜`,
        income: timelineHouseholdNetIncome
      });
    }

    // --- サマリー表示用の「現在の」年間支出を計算 ---
    let summaryAnnualExpense = 0;
    if (formData.expenseMethod === '簡単') {
      // 簡単入力の場合、生活費は「円/月」なので円/年に変換
      summaryAnnualExpense += n(formData.livingCostSimple) * 12;
    } else {
      // 詳細入力の場合、totalExpensesは「円/月」の合計なので年額に変換
      summaryAnnualExpense += totalExpenses * 12;
    }
    // 現在の住居費（円/月）を年額に変換して加算
    if (formData.housingType === '賃貸') {
      summaryAnnualExpense += n(formData.currentRentLoanPayment) * 12;
    } else if (formData.housingType === '持ち家（ローン中）') {
      summaryAnnualExpense += n(formData.loanMonthlyPayment) * 12;
    }
    // 現在の車のローン（円/月）を年額に変換して加算
    if (formData.carCurrentLoanInPayment === 'yes') {
      summaryAnnualExpense += n(formData.carCurrentLoanMonthly) * 12;
    }
    // 毎月の貯蓄額は支出に含めない（キャッシュフローで考慮されるため）
    // const totalAnnualExpense = summaryAnnualExpense; // 変数名が冗長なので直接使う

    return (
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full md:w-1/3 space-y-6">
          <ConfirmationSection title="👤 プロフィール">
            <ConfirmationItem label="家族構成" value={formData.familyComposition} />
            <ConfirmationItem label="あなたの年齢" value={`${formData.personAge} 歳`} />
            {formData.familyComposition === '既婚' && <ConfirmationItem label="配偶者の年齢" value={`${formData.spouseAge} 歳`} />}
          </ConfirmationSection>
          <ConfirmationSection title="💰 現在の収支（年間）">            
            <ConfirmationItem label="世帯の手取り年収" value={formatYen(summaryTotalNetAnnualIncome)} />
            <ConfirmationItem label="世帯の年間支出" value={formatYen(summaryAnnualExpense)} />
            <ConfirmationItem
              label="年間収支"
              value={
                <span className={summaryTotalNetAnnualIncome - summaryAnnualExpense >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {summaryTotalNetAnnualIncome - summaryAnnualExpense >= 0 ? '+' : ''}{formatYen(summaryTotalNetAnnualIncome - summaryAnnualExpense)}
                </span>
              }
            />
          </ConfirmationSection>
          <ConfirmationSection title="🏦 現在の資産">
            <ConfirmationItem label="総資産" value={formatYen(n(formData.currentSavings) * 10000 + n(formData.investmentStocksCurrent) * 10000 + n(formData.investmentTrustCurrent) * 10000 + n(formData.investmentBondsCurrent) * 10000 + n(formData.investmentIdecoCurrent) * 10000 + n(formData.investmentCryptoCurrent) * 10000 + n(formData.investmentOtherCurrent) * 10000)} />
            <ConfirmationItem label="預貯金" value={formatManYen(formData.currentSavings)} />
            <ConfirmationItem label="投資額" value={formatManYen(n(formData.investmentStocksCurrent) + n(formData.investmentTrustCurrent) + n(formData.investmentBondsCurrent) + n(formData.investmentIdecoCurrent) + n(formData.investmentCryptoCurrent) + n(formData.investmentOtherCurrent))} />
          </ConfirmationSection>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-2/3">
          <ConfirmationSection title="🚀 将来のライフプランと収入の変化">
            <div className="space-y-6">
              <div>
                <p className="font-semibold">{n(formData.personAge)}歳 (現在)</p>
                <ul className="list-disc list-inside text-sm text-gray-600 pl-4">
                  <li>額面の世帯年収: {formatYen(totalGrossAnnualIncome)}</li>
                  <li>世帯手取り年収: {formatYen(selfNetIncome + spouseNetIncome)}</li>
                  <li>月の生活費: {formatYen(monthlyLivingExpense)}</li>
                  {currentPayments.map(p => (
                    <li key={p.label}>{p.label} (月額): {formatYen(p.value)}</li>
                  ))}
                </ul>
              </div>
              {events.map((event, index) => {
                const incomeDiff = event.incomeChange;
                return (
                  <div key={index}>
                    <hr className="my-4" />
                    <p className="font-semibold">{event.age}歳</p>
                    <div className="pl-4">
                      <p className="font-bold">{event.title}</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {event.details.map((detail, i) => (
                          <li key={i}>{detail.label}: {detail.value}</li>
                        ))} 
                      </ul>
                      {incomeDiff !== undefined && (
                        <p className="text-sm mt-1">
                          世帯手取り年収:
                          <span className={incomeDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {' '}{formatYen(incomeAtEvent[index])}
                            {' '}({incomeDiff >= 0 ? '+' : ''}{formatYen(incomeDiff)})
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div>
                <hr className="my-4" />
                <p className="font-semibold">{n(formData.simulationPeriodAge)}歳</p>
                <p className="pl-4 font-bold">シミュレーション終了</p>
              </div>
            </div>
          </ConfirmationSection>
        </div>
      </div>
    );
  };

  return (
    <>
      {!isReady && !showRestoreModal && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        </div>
      )}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">入力の再開</h2>
            <p className="text-gray-600 mb-6">前回の入力内容があります。引き継ぎますか？</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem(LIFE_PLAN_FORM_CACHE_KEY);
                  setShowRestoreModal(false);
                  setFormData(createDefaultFormData());
                  setIsReady(true);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                いいえ
              </button>
              <button
                onClick={() => {
                  const cachedData = localStorage.getItem(LIFE_PLAN_FORM_CACHE_KEY);
                  if (cachedData) { 
                    const { data } = JSON.parse(cachedData);
                    setFormData(data);
                  }
                  setIsReady(true);
                  setShowRestoreModal(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
      {showBackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">どこに戻りますか？</h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
            {Array.from(visitedSections).sort((a, b) => a - b).map(i => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setCurrentSectionIndex(i);
                      setIsCompleted(false); // 確認画面から戻る場合も考慮
                      setShowBackModal(false);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {effectiveSections[i]}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowBackModal(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

    <div className={`flex justify-center w-full min-h-screen bg-gray-100 ${!isReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}>
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg md:max-w-5xl overflow-visible relative">
        {/* Floating Header */}
        <div id="floating-header" className="fixed left-0 right-0 z-50 transition-opacity duration-500">
          {/* Progress Bar */}
          <div className="relative w-full bg-gray-300 h-4 rounded-t-lg">
              <div
                className="bg-blue-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {Math.round(progress)}%
              </div>
            </div>
        <div className="h-1"></div>
        
        {renderFloatingBox(totalExpenses, currentSectionIndex === effectiveSections.indexOf('現在の支出') && totalExpenses > 0, "生活費総額")}
        {renderFloatingBox(displayTotalIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && displayTotalIncome > 0, "年間収入総額", "top-[1.5rem]")}
        {renderFloatingBox(totalNetAnnualIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && totalNetAnnualIncome > 0, "年間手取り総額", "top-[5rem]")}
        
        {renderFloatingBox(estimatedAnnualLoanPayment, shouldShowLoanBox && estimatedAnnualLoanPayment > 0, "年間返済額")}
        {renderFloatingBox(estimatedTotalLoanPayment, shouldShowLoanBox && estimatedTotalLoanPayment > 0, "総返済額", "top-[5rem]")}
        {renderFloatingBox(totalCarLoanCost, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 車') && totalCarLoanCost > 0, '車ローン総額')}
        {renderFloatingBox(totalCareCost * 10000, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 親の介護') && totalCareCost > 0, '介護費用総額')}
        {renderFloatingBox(totalRetirementMonthly * 10000, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 老後') && totalRetirementMonthly > 0, '老後の不足額')}
        
        {renderFloatingBox(totalInvestment.monthly, currentSectionIndex === effectiveSections.indexOf('投資') && totalInvestment.monthly > 0, "月間投資総額")}
        {renderFloatingBox(totalInvestment.annual, currentSectionIndex === effectiveSections.indexOf('投資') && totalInvestment.annual > 0, "年間投資総額", "top-[5rem]")}
        {renderFloatingBox(displayTotalApplianceCost * 10000, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 生活') && displayTotalApplianceCost > 0, "家電買い替え総額")}
        {renderFloatingBox(
          totalMarriageCost,
          currentSectionIndex === effectiveSections.indexOf('ライフイベント - 結婚') && totalMarriageCost > 0,
          "結婚費用総額",
        )}
        </div>
        <div className="relative flex">
          {isCompleted ? (
            <div className="w-full p-8">
              <h2 className="text-2xl font-bold mb-4 text-center">入力内容の確認</h2>
              <p className="mb-6 text-gray-600 text-center">シミュレーションを実行する前に、以下の設定内容をご確認ください。</p>
              <div className="max-h-[60vh] overflow-y-auto px-4">
                {renderConfirmationView()}
              </div>
              <div className="mt-8 flex justify-center space-x-4">
                <button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => setShowBackModal(true)}
                  disabled={loading}
                >
                  修正する
                </button>
                <button
                  type="button"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                  onClick={handleSimulate}
                  disabled={loading}
                >
                  {loading ? '実行中...' : 'この内容でシミュレーションを実行'}
                </button>
              </div>
              {result && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">シミュレーション結果</h3>
                  <pre className="text-xs text-left text-red-600">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col max-w-[800px] w-full px-4">
              <div className="w-full p-4">
                {renderSection()}
                <div className="flex justify-center space-x-4 mt-6">
                  {visitedSections.size > 1 && currentSectionIndex > 0 && (
                    <button
                      onClick={() => setShowBackModal(true)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      戻る
                    </button>
                  )}
                  {currentSectionIndex < effectiveSections.length - 1 ? (
                    <button
                      onClick={goToNextSection}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      次へ
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (validateSection(currentSectionIndex)) {
                          setIsCompleted(true);
                        }
                      }}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                      disabled={Object.keys(errors).length > 0}
                    >
                      完了
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
    </>
  );
}
