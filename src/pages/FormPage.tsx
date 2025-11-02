﻿import React, { useState, useMemo, useEffect} from 'react';
import { useLocation, useNavigate, } from 'react-router-dom';
import type { YearlyData, SimulationInputParams, CarePlan } from '@/types/simulation-types';
import { createApiParams } from '@/utils/api-adapter';
import { computeNetAnnual, calculateLoanPayment } from '../utils/financial';
import type { FormDataState, FormLocationState, InvestmentMonthlyAmounts } from '@/types/form-types';
import * as FC from '@/constants/financial_const';



import FamilySection from '@/components/form/FamilySection';
import IncomeSection from '@/components/form/IncomeSection';
import ExpenseSection from '@/components/form/ExpenseSection';
import CarLifeEventSection from '@/components/form/CarLifeEventSection';
import HomeLifeEventSection from '@/components/form/HomeLifeEventSection';
import MarriageLifeEventSection from '@/components/form/MarriageLifeEventSection';
import ChildrenLifeEventSection from '@/components/form/ChildrenLifeEventSection';
import LivingLifeEventSection from '@/components/form/LivingLifeEventSection';
import ParentCareLifeEventSection from '@/components/form/ParentCareLifeEventSection';
import RetirementLifeEventSection from '@/components/form/RetirementLifeEventSection';
import SavingsSection from '@/components/form/SavingsSection';
import InvestmentSection from '@/components/form/InvestmentSection';
import SimulationSettingsSection from '@/components/form/SimulationSettingsSection';

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
  parentCurrentAge: FC.DEFAULT_PARENT_AGE,
  parentCareStartAge: FC.DEFAULT_PARENT_CARE_START_AGE,
  monthly10kJPY: FC.DEFAULT_PARENT_CARE_MONTHLY_COST_MAN_YEN,
  years: FC.DEFAULT_PARENT_CARE_YEARS,
});

const createDefaultFormData = (): FormDataState => ({
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
  housePurchasePlan: null as { age: number | '', price: number | '', downPayment: number | '', loanYears: number | '', interestRate: number | '' } | null,
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
  marriageAge: '', // 万円
  engagementCost: String(FC.DEFAULT_ENGAGEMENT_COST_MAN_YEN),
  weddingCost: String(FC.DEFAULT_WEDDING_COST_MAN_YEN),
  honeymoonCost: String(FC.DEFAULT_HONEYMOON_COST_MAN_YEN),
  newHomeMovingCost: String(FC.DEFAULT_NEW_HOME_MOVING_COST_MAN_YEN),
  hasChildren: '', // ありorなし
  numberOfChildren: '',
  firstBornAge: '',
  educationPattern: '', // 公立のみor私立混在or私立のみ
  currentRentLoanPayment: '',
  otherLargeExpenses: '',
  parentCareAssumption: '', // ありor未定orなし
  parentCarePlans: [createDefaultCarePlan()],
  retirementAge: String(FC.DEFAULT_RETIREMENT_AGE),
  postRetirementLivingCost: String(FC.DEFAULT_POST_RETIREMENT_LIVING_COST_MAN_YEN),
  spouseRetirementAge: String(FC.DEFAULT_RETIREMENT_AGE),
  spousePensionStartAge: String(FC.DEFAULT_PENSION_START_AGE),
  spousePensionAmount: String(FC.DEFAULT_SPOUSE_PENSION_MONTHLY_MAN_YEN),
  pensionStartAge: String(FC.DEFAULT_PENSION_START_AGE),
  pensionAmount: String(FC.DEFAULT_PENSION_MONTHLY_MAN_YEN),
  currentSavings: '',
  monthlySavings: '',
  hasInvestment: '',
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
  investmentStocksRate: String(FC.DEFAULT_INVESTMENT_RATE.STOCKS),
  investmentTrustRate: String(FC.DEFAULT_INVESTMENT_RATE.TRUST),
  investmentBondsRate: String(FC.DEFAULT_INVESTMENT_RATE.BONDS),
  investmentIdecoRate: String(FC.DEFAULT_INVESTMENT_RATE.IDECO),
  investmentCryptoRate: String(FC.DEFAULT_INVESTMENT_RATE.CRYPTO),
  investmentOtherRate: String(FC.DEFAULT_INVESTMENT_RATE.OTHER),
  simulationPeriodAge: String(FC.DEFAULT_SIMULATION_END_AGE),
  interestRateScenario: 'ランダム変動', // 楽観orストレス
  fixedInterestRate: String(FC.DEFAULT_FIXED_INTEREST_RATE_PERCENT), // 固定利回り用のフィールドを追加
  emergencyFund: String(FC.DEFAULT_EMERGENCY_FUND_MAN_YEN),
  stressTestSeed: '', // 追加
  appliances: FC.DEFAULT_APPLIANCES,
  // 昇給率をformDataに統合
  annualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
  spouseAnnualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
});




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
      const { timestamp } = JSON.parse(cachedItem) as { timestamp: number, data: FormDataState };
      const isExpired = (Date.now() - timestamp) > FC.FORM_CACHE_EXPIRATION_MS;

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
    ].reduce<number>((sum, val) => sum + (Number(val) || 0), 0);

    const variable = [
      formData.foodCost,
      formData.dailyNecessitiesCost,
      formData.transportationCost,
      formData.clothingBeautyCost,
      formData.socializingCost,
      formData.hobbyEntertainmentCost,
      formData.otherVariableCost,
    ].reduce<number>((sum, val) => sum + (Number(val) || 0), 0);

    return fixed + variable;
  }, [
    formData.expenseMethod,
    formData.utilitiesCost,
    formData.communicationCost,
    formData.insuranceCost,
    formData.educationCost,
    formData.otherFixedCost,
    formData.foodCost,
    formData.dailyNecessitiesCost,
    formData.transportationCost,
    formData.clothingBeautyCost,
    formData.socializingCost,
    formData.hobbyEntertainmentCost,
    formData.otherVariableCost,
  ]);

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
        } else if (n(formData.personAge) < FC.VALIDATION_MIN_AGE || n(formData.personAge) > FC.VALIDATION_MAX_AGE) {
          newErrors.personAge = `${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`
        }
        if (!formData.mainIncome) {
          newErrors.mainIncome = '本業の年間収入を入力してください。';
        } else if (n(formData.mainIncome) < 0) {
          newErrors.mainIncome = '0以上の数値を入力してください。';
        }

        if (formData.familyComposition === '既婚') {
          if (!formData.spouseAge) {
            newErrors.spouseAge = '配偶者の年齢を入力してください。';
          } else if (n(formData.spouseAge) < FC.VALIDATION_MIN_AGE || n(formData.spouseAge) > FC.VALIDATION_MAX_AGE) {
            newErrors.spouseAge = `${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`
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
          if (formData.housePurchasePlan.downPayment === '' || formData.housePurchasePlan.downPayment == null) newErrors['housePurchasePlan.downPayment'] = '頭金を入力してください。';
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
          if (!formData.spouseAgeAtMarriage) newErrors.spouseAgeAtMarriage = '結婚時の配偶者の年齢を入力してください。';
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
        if (formData.parentCareAssumption === 'はい' && formData.parentCarePlans) {
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
    try {
      const params = createApiParams(formData);

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


  const handleApplianceChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newAppliances = [...prev.appliances];
      const isNumberField = field === 'cycle' || field === 'cost' || field === 'firstReplacementAfterYears';
      const valueToSet = isNumberField ? (value === '' ? '' : Number(value)) : value;
      newAppliances[index] = { 
        ...newAppliances[index],
        [field]: valueToSet,
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
      newPlans[index] = {
        ...newPlans[index],
        [key]: value === '' ? '' : Number(value)
      };
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
        newPlans[index] = { ...newPlans[index], [field]: value === '' ? '' : Number(value) };
        setFormData({ ...formData, houseRenovationPlans: newPlans });
      }
    } else if (name.startsWith('housePurchasePlan')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        housePurchasePlan: {
          ...(formData.housePurchasePlan || { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 }),
              [field]: value === '' ? '' : Number(value)
            },
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
      // 数値に変換すべきフィールドを判定
      const isNumericField = e.target.type === 'number' && name !== 'stressTestSeed';
      const valueToSet = isNumericField ? (value === '' ? '' : Number(value)) : value;

      setFormData(prev => {
        const newState = { ...prev, [name]: valueToSet };
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

  const totalIncome = useMemo(() => {
    return (
      Number(formData.mainIncome || 0) +
      Number(formData.spouseMainIncome || 0) +
      Number(formData.sideJobIncome || 0) +
      Number(formData.spouseSideJobIncome || 0)
    );
  }, [formData.mainIncome, formData.spouseMainIncome, formData.sideJobIncome, formData.spouseSideJobIncome]);

  const displayTotalIncome = useMemo(() => {
    return totalIncome * FC.YEN_PER_MAN;
  }, [totalIncome]);

  const totalMarriageCost = useMemo(() => {
    if (formData.planToMarry !== 'する') return 0;
    return (
      Number(formData.engagementCost || 0) +
      Number(formData.weddingCost || 0) +
      Number(formData.honeymoonCost || 0) +
      (Number(formData.newHomeMovingCost) || 0)
    ) * FC.YEN_PER_MAN; // 万円 → 円に変換
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
      return total + ((Number(plan.monthly10kJPY) || 0) * (Number(plan.years) || 0) * FC.MONTHS_PER_YEAR);
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
    const principal = Number(formData.carPrice) * FC.YEN_PER_MAN || 0;
    const years = Number(formData.carLoanYears) || 0;

    let annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_GENERAL * 100; // default
    if (formData.carLoanType === '銀行ローン') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_BANK * 100;
    else if (formData.carLoanType === 'ディーラーローン') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_DEALER * 100;

    const { totalPayment } = calculateLoanPayment(principal, annualRatePercent, years);
    return Math.ceil(totalPayment);
  }, [formData.carPrice, formData.carLoanUsage, formData.carLoanYears, formData.carLoanType]);

  const totalInvestment = useMemo(() => {
    const monthlyTotal = Object.values(formData.monthlyInvestmentAmounts).reduce(
      (acc: number, val) => acc + Number(val),
      0
    );
    // 年間スポット投資額はシミュレーションパラメータでのみ使用するため、ここでは月額のみ計算
    return { monthly: monthlyTotal };
  }, [formData.monthlyInvestmentAmounts]);

  const { estimatedAnnualLoanPayment, estimatedTotalLoanPayment } = useMemo(() => {
    const housingLoanStatus = formData.housingLoanStatus;
    let annualPayment = 0;
    let totalPayment = 0;

    const isFutureBuyer = formData.housingType === '賃貸' && formData.housePurchasePlan !== null;
    const isCurrentLoanHolder = formData.housingType === '持ち家（ローン中）' && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0;

    if (housingLoanStatus === 'これから借りる' || isFutureBuyer) {
      const price = (isFutureBuyer ? formData.housePurchasePlan?.price : Number(formData.housePurchasePrice)) || 0;
      const downPayment = (isFutureBuyer ? formData.housePurchasePlan?.downPayment : Number(formData.headDownPayment)) || 0;
      const years = (isFutureBuyer ? formData.housePurchasePlan?.loanYears : Number(formData.housingLoanYears)) || 0;
      const interestRateType = formData.housingLoanInterestRateType;
      const customInterestRate = (isFutureBuyer ? formData.housePurchasePlan?.interestRate : Number(formData.housingLoanInterestRate)) || 0;

      if (price > 0 && years > 0 && interestRateType) {
        const principal = (price - downPayment) * FC.YEN_PER_MAN; // Convert to yen

        let interestRate = FC.DEFAULT_LOAN_RATES.HOUSING_GENERAL * 100; // Default general interest rate
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
        annualPayment = Math.ceil(loanMonthlyPayment * FC.MONTHS_PER_YEAR / 1000) * 1000;
        totalPayment = Math.ceil(annualPayment * loanRemainingYears / 1000) * 1000; // 概算
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
      : totalExpenses / FC.YEN_PER_MAN; // totalExpensesは円/月なので万円/月に変換

    if (singleLivingCost > 0 && !formData.isLivingCostEdited) {
      const recommendedCost = Math.round(singleLivingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.LIVING);
      setFormData(prev => ({
        ...prev,
        livingCostAfterMarriage: String(recommendedCost)
      }));
    }
  }, [formData.livingCostSimple, formData.expenseMethod, formData.planToMarry, formData.isLivingCostEdited, totalExpenses]);

  useEffect(() => {
    if (formData.planToMarry !== 'する' || formData.isHousingCostEdited) return;

    const singleHousingCost = Number(formData.currentRentLoanPayment) || 0;

    if (singleHousingCost > 0 && !formData.isHousingCostEdited) {
      const recommendedCost = Math.round(singleHousingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.HOUSING);
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
    const mainJobIncomeGross = (Number(formData.mainIncome) || 0) * FC.YEN_PER_MAN;
    const sideJobIncomeGross = (Number(formData.sideJobIncome) || 0) * FC.YEN_PER_MAN;
    const spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseMainIncome) || 0) : 0) * FC.YEN_PER_MAN;
    const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseSideJobIncome) || 0) : 0) * FC.YEN_PER_MAN;

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
  const renderSection = () => {
    switch (effectiveSections[currentSectionIndex]) {
      case '家族構成':
        return <FamilySection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case '現在の収入':
        return <IncomeSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case '現在の支出':
        return <ExpenseSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case 'ライフイベント - 車':
        return <CarLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;

      case 'ライフイベント - 家':
        return <HomeLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} setFormData={setFormData} handleRenovationPlanChange={handleRenovationPlanChange} />;
      case 'ライフイベント - 結婚':
        return <MarriageLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case 'ライフイベント - 子供':
        return <ChildrenLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case 'ライフイベント - 生活':
        return <LivingLifeEventSection formData={formData} handleApplianceChange={handleApplianceChange} addAppliance={addAppliance} handleRemoveAppliance={handleRemoveAppliance} />;
      case 'ライフイベント - 親の介護':
        return <ParentCareLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} handleCarePlanChange={handleCarePlanChange} addCarePlan={addCarePlan} removeCarePlan={removeCarePlan} totalCareCost={totalCareCost} />;
      case 'ライフイベント - 老後':
        return <RetirementLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case '貯蓄':
        return <SavingsSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      case '投資':
        return <InvestmentSection formData={formData} handleInputChange={handleInputChange} monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts} />;
      case 'シミュレーション設定':
        return <SimulationSettingsSection formData={formData} handleInputChange={handleInputChange} errors={errors} />;
      default:
        return null;
    }
  };

  const progress = ((currentSectionIndex + 1) / effectiveSections.length) * 100;

  const isHouseLoanSection = effectiveSections[currentSectionIndex] === 'ライフイベント - 家';
  const shouldShowLoanBox = isHouseLoanSection && 
  (
    formData.housingLoanStatus === 'これから借りる' || 
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
    const events: { age: number, title: string, details: { label: string, value: React.ReactNode }[] }[] = [];

    // 現在の収入
    const selfGrossIncome = n(formData.mainIncome) * FC.YEN_PER_MAN + n(formData.sideJobIncome) * FC.YEN_PER_MAN;
    const selfNetIncome = computeNetAnnual(selfGrossIncome);
    
    // --- 確認画面用の追加計算 (現在の状況ベース) ---
    // 現在の額面世帯年収
    const currentSpouseGrossIncome = formData.familyComposition === '既婚' ? (n(formData.spouseMainIncome) * 10000 + n(formData.spouseSideJobIncome) * 10000) : 0;
    const currentTotalGrossAnnualIncome = selfGrossIncome + currentSpouseGrossIncome;
    
    // 月の生活費（円）
    const monthlyLivingExpense = formData.expenseMethod === '簡単'
      ? n(formData.livingCostSimple)
      : totalExpenses; // totalExpenses は既に月額合計（円）として計算されている

    // 現在支払っている月額費用
    const currentCarLoanMonthly = formData.carCurrentLoanInPayment === 'yes' ? n(formData.carCurrentLoanMonthly) : 0;
    const currentHousingMonthly = formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : (formData.housingType === '持ち家（ローン中）' ? n(formData.loanMonthlyPayment) : 0);
    
    const currentCareMonthly = formData.parentCareAssumption === 'はい'
      ? formData.parentCarePlans.reduce((sum, plan) => {
          const hasStarted = n(plan.parentCurrentAge) >= n(plan.parentCareStartAge);
          return hasStarted ? sum + n(plan.monthly10kJPY) * FC.YEN_PER_MAN : sum;
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

        currentEducationMonthly += (annualCostForChild * FC.YEN_PER_MAN) / FC.MONTHS_PER_YEAR;
      }
    }

    // 表示する項目をフィルタリング
    const currentPayments = [
      { label: '住居費', value: currentHousingMonthly },
      { label: '車のローン', value: currentCarLoanMonthly },
      { label: '介護費用', value: currentCareMonthly },
      { label: '教育費(想定)', value: currentEducationMonthly },
    ].filter(p => p.value > 0);

    // 月額総支出を計算
    const totalMonthlyExpense =
      monthlyLivingExpense +
      currentHousingMonthly +
      currentCarLoanMonthly +
      currentCareMonthly +
      currentEducationMonthly;


    // 現在の手取り世帯年収
    const currentSpouseNetIncome = formData.familyComposition === '既婚' ? computeNetAnnual(currentSpouseGrossIncome) : 0;
    const currentTotalNetAnnualIncome = selfNetIncome + currentSpouseNetIncome;

    // 結婚イベント
    if (formData.planToMarry === 'する') {
      let spouseIncomeForSim = 0;
      if (formData.spouseIncomePattern === 'パート') spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.PART_TIME;
      else if (formData.spouseIncomePattern === '正社員') spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.FULL_TIME;
      else if (formData.spouseIncomePattern === 'カスタム') spouseIncomeForSim = n(formData.spouseCustomIncome) * FC.YEN_PER_MAN;
      
      const spouseNetIncomeAfterMarriage = computeNetAnnual(spouseIncomeForSim);
      
      events.push({
        age: n(formData.marriageAge),
        title: '💒 結婚',
        details: [
          { label: '結婚費用', value: formatYen(totalMarriageCost) },
          { label: '配偶者の収入が加算', value: `+ ${formatYen(spouseNetIncomeAfterMarriage)} /年` },
        ],
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
        const annualCost = n(plan.monthly10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;

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

    // 退職イベント
    const retirementAge = n(formData.retirementAge);
    const pensionStartAge = n(formData.pensionStartAge);
    const pensionNetIncome = n(formData.pensionAmount) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR; // 本人の年金

    // ユーザー本人の退職イベント
    if (selfNetIncome > 0) {
      events.push({
        age: retirementAge,
        title: '👤 あなたの退職',
        details: [{ label: '給与収入が停止', value: `手取り年収が減少します` }],
      });
    }

    // ユーザー本人の年金受給開始イベント
    if (pensionNetIncome > 0) {
      events.push({
        age: pensionStartAge,
        title: '👤 あなたの年金受給開始',
        details: [{ label: '年金受給開始', value: `+ ${formatYen(pensionNetIncome)} /年` }],
      });
    }

    // 配偶者の退職イベント
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
        const personAge = n(formData.personAge);
        const spouseCurrentAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);

        const spouseRetirementTargetAge = n(formData.spouseRetirementAge);
        const spousePensionStartTargetAge = n(formData.spousePensionStartAge);
        const spousePensionNetIncome = n(formData.spousePensionAmount) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;

        // 配偶者の収入は、結婚予定がある場合、結婚後の収入を基準に計算する (修正)
        const spouseBaseNetIncome = (() => {
          if (formData.planToMarry === 'する') {
            if (formData.spouseIncomePattern === 'パート') return computeNetAnnual(FC.SPOUSE_INCOME_PATTERNS.PART_TIME);
            if (formData.spouseIncomePattern === '正社員') return computeNetAnnual(FC.SPOUSE_INCOME_PATTERNS.FULL_TIME);
            if (formData.spouseIncomePattern === 'カスタム') return computeNetAnnual(n(formData.spouseCustomIncome) * FC.YEN_PER_MAN);
            return 0;
          }
          return currentSpouseNetIncome;
        })();
        const spouseRetirementAgeOnPersonTimeline = personAge + (spouseRetirementTargetAge - spouseCurrentAge);
        // 配偶者の年金受給が、本人の何歳の時に起こるか
        const spousePensionStartAgeOnPersonTimeline = personAge + (spousePensionStartTargetAge - spouseCurrentAge);

        // 配偶者の収入がある場合、退職イベントを追加
        if (spouseBaseNetIncome > 0) {
            events.push({
               age: spouseRetirementAgeOnPersonTimeline,
               title: 'パートナーの退職',
               details: [{ label: '給与収入が停止', value: `手取り年収が減少します` }],
           });
        }

        // 配偶者の年金収入がある場合、年金受給開始イベントを追加
        if (spousePensionNetIncome > 0) {
            events.push({
               age: spousePensionStartAgeOnPersonTimeline,
               title: 'パートナーの年金受給開始',
               details: [{ label: '年金受給開始', value: `+ ${formatYen(spousePensionNetIncome)} /年` }],
           });
        }
    }

    // イベントを年齢でソート
    events.sort((a, b) => a.age - b.age);

    // --- サマリー表示用の「現在の」年間支出を計算 ---
    let summaryAnnualExpense = 0;
    if (formData.expenseMethod === '簡単') {
      // 簡単入力の場合、生活費は「円/月」なので円/年に変換
      summaryAnnualExpense += n(formData.livingCostSimple) * FC.MONTHS_PER_YEAR;
    } else {
      // 詳細入力の場合、totalExpensesは「円/月」の合計なので年額に変換
      summaryAnnualExpense += totalExpenses * FC.MONTHS_PER_YEAR;
    }
    // 現在の住居費（円/月）を年額に変換して加算
    if (formData.housingType === '賃貸') {
      summaryAnnualExpense += n(formData.currentRentLoanPayment) * FC.MONTHS_PER_YEAR;
    } else if (formData.housingType === '持ち家（ローン中）') {
      summaryAnnualExpense += n(formData.loanMonthlyPayment) * FC.MONTHS_PER_YEAR;
    }
    // 現在の車のローン（円/月）を年額に変換して加算
    if (formData.carCurrentLoanInPayment === 'yes') {
      summaryAnnualExpense += n(formData.carCurrentLoanMonthly) * FC.MONTHS_PER_YEAR;
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
            <ConfirmationItem label="世帯の手取り年収" value={formatYen(currentTotalNetAnnualIncome)} />
            <ConfirmationItem label="世帯の年間支出" value={formatYen(summaryAnnualExpense)} />
            <ConfirmationItem
              label="年間収支"
              value={
                <span className={currentTotalNetAnnualIncome - summaryAnnualExpense >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {currentTotalNetAnnualIncome - summaryAnnualExpense >= 0 ? '+' : ''}{formatYen(currentTotalNetAnnualIncome - summaryAnnualExpense)}
                </span>
              }
            />
          </ConfirmationSection>
          <ConfirmationSection title="🏦 現在の資産">
            <ConfirmationItem label="総資産" value={formatYen(n(formData.currentSavings) * FC.YEN_PER_MAN + n(formData.investmentStocksCurrent) * FC.YEN_PER_MAN + n(formData.investmentTrustCurrent) * FC.YEN_PER_MAN + n(formData.investmentBondsCurrent) * FC.YEN_PER_MAN + n(formData.investmentIdecoCurrent) * FC.YEN_PER_MAN + n(formData.investmentCryptoCurrent) * FC.YEN_PER_MAN + n(formData.investmentOtherCurrent) * FC.YEN_PER_MAN)} />
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
                  <li className="list-none pt-2 mt-2 border-t border-gray-200 font-semibold">収入</li>
                  <li>額面の世帯年収: {formatYen(currentTotalGrossAnnualIncome)}
                    <ul className="list-none pl-5">
                      <li>└ 手取り年収: {formatYen(currentTotalNetAnnualIncome)}</li>
                    </ul>
                  </li>
                  <li className="list-none pt-2 mt-2 border-t border-gray-200 font-semibold">支出</li>
                  <li>
                    月額総支出: {formatYen(totalMonthlyExpense)}
                    <ul className="list-none pl-5">
                      <li>└ 生活費: {formatYen(monthlyLivingExpense)}</li>
                      {currentPayments.map(p => (
                        <li key={p.label}>└ {p.label}: {formatYen(p.value)}</li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </div>
              {events.map((event, index) => {
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
        {renderFloatingBox(displayTotalIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && displayTotalIncome > 0, "額面年収総額", "top-[1.5rem]")}
        {renderFloatingBox(totalNetAnnualIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && totalNetAnnualIncome > 0, "年間手取り総額", "top-[5rem]")}
        
        {renderFloatingBox(estimatedAnnualLoanPayment, shouldShowLoanBox && estimatedAnnualLoanPayment > 0, "年間返済額")}
        {renderFloatingBox(estimatedTotalLoanPayment, shouldShowLoanBox && estimatedTotalLoanPayment > 0, "総返済額", "top-[5rem]")}
        {renderFloatingBox(totalCarLoanCost, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 車') && totalCarLoanCost > 0, '車ローン総額')}
        {renderFloatingBox(totalCareCost * 10000, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 親の介護') && totalCareCost > 0, '介護費用総額')}
        {renderFloatingBox(totalRetirementMonthly * 10000, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 老後') && totalRetirementMonthly > 0, '老後の不足額')}
        
        {renderFloatingBox(totalInvestment.monthly, currentSectionIndex === effectiveSections.indexOf('投資') && totalInvestment.monthly > 0, "月間投資総額")}
        {renderFloatingBox(displayTotalApplianceCost * FC.YEN_PER_MAN, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 生活') && displayTotalApplianceCost > 0, "家電買い替え総額")}
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
