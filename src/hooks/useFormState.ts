import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, type Location } from 'react-router-dom';
import type { FormDataState, FormLocationState, InvestmentMonthlyAmounts } from '@/types/form-types';
import type { CarePlan } from '@/types/simulation-types';
import * as FC from '@/constants/financial_const';
import { computeNetAnnual, calculateLoanPayment, n } from '@/utils/financial';
import { validate } from '@/utils/validation';

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

export const createDefaultFormData = (): FormDataState => ({
  familyComposition: '',
  personAge: '',
  spouseAge: '',
  mainIncome: '',
  spouseMainIncome: '',
  sideJobIncome: '0',
  spouseSideJobIncome: '0',
  expenseMethod: '',
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
  housingLoanInterestRateType: '',
  housingLoanInterestRate: '',
  housingLoanStatus: '',
  loanOriginalAmount: '',
  loanMonthlyPayment: '',
  loanRemainingYears: '',
  loanInterestRate: '',
  planToMarry: '',
  spouseAgeAtMarriage: '',
  spouseIncomePattern: '',
  spouseCustomIncome: '',
  livingCostAfterMarriage: '',
  isLivingCostEdited: false,
  housingCostAfterMarriage: '',
  isHousingCostEdited: false,
  marriageAge: '',
  engagementCost: String(FC.DEFAULT_ENGAGEMENT_COST_MAN_YEN),
  weddingCost: String(FC.DEFAULT_WEDDING_COST_MAN_YEN),
  honeymoonCost: String(FC.DEFAULT_HONEYMOON_COST_MAN_YEN),
  newHomeMovingCost: String(FC.DEFAULT_NEW_HOME_MOVING_COST_MAN_YEN),
  hasChildren: '',
  numberOfChildren: '',
  firstBornAge: '',
  educationPattern: '',
  currentRentLoanPayment: '',
  otherLargeExpenses: '',
  parentCareAssumption: '',
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
  investmentStocksGainLossSign: '+',
  investmentStocksGainLossRate: '0',
  investmentTrustGainLossSign: '+',
  investmentTrustGainLossRate: '0',
  investmentOtherGainLossSign: '+',
  investmentOtherGainLossRate: '0',
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
  interestRateScenario: 'ランダム変動',
  fixedInterestRate: String(FC.DEFAULT_FIXED_INTEREST_RATE_PERCENT),
  emergencyFund: String(FC.DEFAULT_EMERGENCY_FUND_MAN_YEN),
  stressTestSeed: '',
  appliances: FC.DEFAULT_APPLIANCES,
  annualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
  spouseAnnualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
  useSpouseNisa: false,

  // 退職金・一時金
  retirementIncome: null,
  spouseRetirementIncome: null,
  personalPensionPlans: [],
  spousePersonalPensionPlans: [],
  otherLumpSums: [],
  spouseOtherLumpSums: [],
  // 定年再雇用
  assumeReemployment: false,
  reemploymentReductionRate: String(FC.DEFAULT_REEMPLOYMENT_REDUCTION_RATE_PERCENT),
  spouseAssumeReemployment: false,
  spouseReemploymentReductionRate: String(FC.DEFAULT_REEMPLOYMENT_REDUCTION_RATE_PERCENT),
});

export const useFormState = () => {
  const location = useLocation();
  // location.state の型を安全に扱う
  const locationState = (location as Location<FormLocationState | null>).state;
  const initialStateFromLocation = locationState?.rawFormData;

  const [formData, setFormData] = useState<FormDataState>(() => {
    if (initialStateFromLocation) {
      return initialStateFromLocation;
    }
    return createDefaultFormData();
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [cacheDisabled, setCacheDisabled] = useState(false); // キャッシュ機能を無効化するフラグ

  // `effectiveSections` と `validateSection` をフック内に定義
  const effectiveSections = useMemo(() => {
    const allSections = [...FC.MASTER_SECTIONS];
    if (formData.familyComposition === '既婚') {
      return allSections.filter(section => section !== 'ライフイベント - 結婚');
    }
    // `HomeLifeEventSection` は `housingType` の値によって表示が大きく変わるため、
    // `familyComposition` に依らず常に表示されるべきです。
    // しかし、`effectiveSections` のロジックでは `familyComposition` が '既婚' の場合に
    // 'ライフイベント - 結婚' を除外するだけで、'ライフイベント - 住まい' は影響を受けません。
    // そのため、このセクションのフィールドをバリデーション対象に含める必要があります。
    // `SECTION_FIELD_MAP` に 'ライフイベント - 住まい' を追加することで、
    // `validateSection` がこのセクションのフィールドを正しく検証できるようになります。
    return allSections;
  }, [formData.familyComposition]);

  const validateSection = useCallback((sectionIndex: number) => {
    const sectionName = effectiveSections[sectionIndex];
    const section = FC.SECTION_FIELD_MAP.find(s => s.section === sectionName);
    const fieldsToValidate: (keyof FormDataState | string)[] = section ? [...section.fields] : [];

    if (sectionName === 'ライフイベント - 住宅') {
      if (formData.housePurchaseIntent === 'yes') {
        fieldsToValidate.push(
          'housePurchasePlan.age',
          'housePurchasePlan.price',
          'housePurchasePlan.downPayment',
          'housePurchasePlan.loanYears',
          'housePurchasePlan.interestRate'
        );
      }
      if (formData.houseRenovationPlans.length > 0) {
        fieldsToValidate.push('houseRenovationPlans.0.age');
        fieldsToValidate.push('houseRenovationPlans.0.cost');
      }
    } else if (sectionName === 'ライフイベント - 車') {
      if (formData.carPurchasePlan === 'yes') {
        fieldsToValidate.push(
          'carFirstReplacementAfterYears',
          'carPrice',
          'carReplacementFrequency',
          'carLoanUsage',
          'carLoanYears'
        );
      }
      if (formData.carCurrentLoanInPayment === 'yes') {
        fieldsToValidate.push('carCurrentLoanMonthly', 'carCurrentLoanRemainingMonths');
      }
      // Also validate the base fields for this section
      fieldsToValidate.push('carCurrentLoanInPayment', 'carPurchasePlan');
    } else if (sectionName === FC.SECTION_NAMES.RETIREMENT_INCOME) {
      // --- 本人 ---
      if (formData.retirementIncome) {
        fieldsToValidate.push('retirementIncome.amount', 'retirementIncome.age', 'retirementIncome.yearsOfService');
      }
      if (formData.personalPensionPlans.length > 0) {
        formData.personalPensionPlans.forEach((_, index) => {
          fieldsToValidate.push(`personalPensionPlans.${index}.amount`, `personalPensionPlans.${index}.startAge`);
          if (formData.personalPensionPlans[index].type === 'fixedTerm') {
            fieldsToValidate.push(`personalPensionPlans.${index}.duration`);
          }
        });
      }
      if (formData.otherLumpSums.length > 0) {
        formData.otherLumpSums.forEach((_, index) => {
          fieldsToValidate.push(`otherLumpSums.${index}.name`, `otherLumpSums.${index}.amount`, `otherLumpSums.${index}.age`);
        });
      }

      // --- 配偶者 ---
      if (formData.spouseRetirementIncome) {
        fieldsToValidate.push('spouseRetirementIncome.amount', 'spouseRetirementIncome.age', 'spouseRetirementIncome.yearsOfService');
      }
      if (formData.spousePersonalPensionPlans.length > 0) {
        formData.spousePersonalPensionPlans.forEach((_, index) => {
          fieldsToValidate.push(`spousePersonalPensionPlans.${index}.amount`, `spousePersonalPensionPlans.${index}.startAge`);
          if (formData.spousePersonalPensionPlans[index].type === 'fixedTerm') {
            fieldsToValidate.push(`spousePersonalPensionPlans.${index}.duration`);
          }
        });
      }
      if (formData.spouseOtherLumpSums.length > 0) {
        formData.spouseOtherLumpSums.forEach((_, index) => {
          fieldsToValidate.push(`spouseOtherLumpSums.${index}.name`, `spouseOtherLumpSums.${index}.amount`, `spouseOtherLumpSums.${index}.age`);
        });
      }
    } else if (sectionName === FC.SECTION_NAMES.SIMULATION_SETTINGS) {
      // シミュレーション設定セクションの条件付きバリデーション
      if (formData.interestRateScenario === '固定利回り') {
        fieldsToValidate.push('fixedInterestRate'); // この行は変更なし、financial_const.tsの修正が重要
      }
    }

    const newErrors = validate(formData, fieldsToValidate);

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [effectiveSections, formData]);

  useEffect(() => {
    if (!isReady || initialStateFromLocation || cacheDisabled) {
      return;
    }
    const cacheItem = {
      timestamp: Date.now(),
      data: formData,
    };
    localStorage.setItem(LIFE_PLAN_FORM_CACHE_KEY, JSON.stringify(cacheItem));
  }, [formData, initialStateFromLocation, isReady, cacheDisabled]);
  
  const restoreFormData = useCallback(() => {
    const cachedData = localStorage.getItem(LIFE_PLAN_FORM_CACHE_KEY);
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      setFormData(data);
    }
    setIsReady(true);
    setShowRestoreModal(false);
  }, []);

  const clearAndReady = useCallback(() => {
    localStorage.removeItem(LIFE_PLAN_FORM_CACHE_KEY);
    setShowRestoreModal(false);
    setFormData(createDefaultFormData());
    setIsReady(true);
    setCacheDisabled(true); // キャッシュをクリアした後は、このセッションではキャッシュを無効化
  }, []);

  // NEW useEffect to handle initial loading and cache
  useEffect(() => {
    if (initialStateFromLocation) {
      // location.stateからデータが渡された場合、キャッシュは使用せず、そのデータで初期化する
      setIsReady(true);
      return;
    }

    const cachedData = localStorage.getItem(LIFE_PLAN_FORM_CACHE_KEY);
    if (cachedData) {
      try {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < FC.FORM_CACHE_EXPIRATION_MS) {
          setFormData(data);
          setShowRestoreModal(true); // Show modal to ask user to restore
        } else {
          // Cache expired, clear it
          localStorage.removeItem(LIFE_PLAN_FORM_CACHE_KEY);
          setIsReady(true); // Ready with default data
        }
      } catch (e) {
        console.error("Failed to parse cached form data:", e);
        localStorage.removeItem(LIFE_PLAN_FORM_CACHE_KEY);
        setIsReady(true); // Ready with default data
      }
    } else {
      setIsReady(true); // No cache, ready with default data
    }
  }, [initialStateFromLocation]); // Run once on mount, or when initialStateFromLocation changes

  // Input handlers
  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; type: string; value: string | boolean; checked?: boolean } }
  ) => {
    const { name, type } = e.target;

    if (name.startsWith('houseRenovationPlans')) {
      const indices = name.match(/\d+/g);
      if (indices) {
        const index = parseInt(indices[0], 10);
        const field = name.split('.')[1];
        setFormData(prev => {
            const value = e.target.value;
            const newPlans = [...prev.houseRenovationPlans];
            newPlans[index] = { ...newPlans[index], [field]: value === '' ? '' : Number(value) };
            return { ...prev, houseRenovationPlans: newPlans };
        });
      }
    } else if (name.startsWith('housePurchasePlan')) {
      const field = name.split('.')[1];
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        housePurchasePlan: {
          ...(prev.housePurchasePlan || { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 }),
          [field]: value === '' ? '' : Number(value)
        },
      }));
    } else if (name.startsWith('investment') && name.endsWith('Monthly')) {
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        monthlyInvestmentAmounts: {
          ...prev.monthlyInvestmentAmounts,
          [name]: value
        }
      }));
    } else {
      let value: string | boolean;
      if (type === 'checkbox') {
        // Switchコンポーネントのようにvalueに直接booleanが入る場合と、通常のinput[type=checkbox]のようにcheckedプロパティに入る場合の両方に対応
        const targetValue = (e.target as HTMLInputElement).value;
        value = typeof targetValue === 'boolean' ? targetValue : (e.target as HTMLInputElement).checked;
      } else {
        value = e.target.value;
      }

      // assumeReemployment と spouseAssumeReemployment は boolean に変換する
      if (name === 'assumeReemployment' || name === 'spouseAssumeReemployment') {
        // 文字列の 'true'/'false' を boolean に変換
        value = value === 'true' || value === true;
      }

      setFormData(prev => {
        // エラーを修正した際に即座にボタンを活性化させるための処理
        setErrors(currentErrors => {
          const newErrors = { ...currentErrors };
          delete newErrors[name];
          return newErrors;
        });
        const newState = { ...prev, [name]: value };

        if (name === 'livingCostAfterMarriage') {
          newState.isLivingCostEdited = true;
        }
        if (name === 'housingCostAfterMarriage') {
          newState.isHousingCostEdited = true;
        }
        // 住居タイプが「賃貸」以外に変更された場合、将来の購入プランをリセット
        if (name === 'housingType' && value !== '賃貸') {
          newState.housePurchaseIntent = 'no';
          newState.housePurchasePlan = null;
        }

        // 子供の有無が「なし」に変更された場合、子供関連のデータをリセット
        if (name === 'hasChildren' && value === 'なし') {
          const defaultData = createDefaultFormData();
          newState.numberOfChildren = defaultData.numberOfChildren;
          newState.firstBornAge = defaultData.firstBornAge;
          newState.educationPattern = defaultData.educationPattern;
        }

        // 結婚予定が「しない」に変更された場合、結婚関連のデータをリセット
        if (name === 'planToMarry' && value === 'しない') {
          const defaultData = createDefaultFormData();
          newState.marriageAge = defaultData.marriageAge;
          newState.spouseAgeAtMarriage = defaultData.spouseAgeAtMarriage;
          newState.spouseIncomePattern = defaultData.spouseIncomePattern;
          newState.engagementCost = defaultData.engagementCost;
          // ... 他の結婚関連費用もリセット
        }

        // 支出入力方法が「簡単」に変更された場合、詳細支出項目をリセット
        if (name === 'expenseMethod' && value === '簡単') {
          const defaultData = createDefaultFormData();
          newState.housingCost = defaultData.housingCost;
          newState.utilitiesCost = defaultData.utilitiesCost;
          newState.communicationCost = defaultData.communicationCost;
          newState.carCost = defaultData.carCost;
          newState.insuranceCost = defaultData.insuranceCost;
          newState.educationCost = defaultData.educationCost;
          newState.otherFixedCost = defaultData.otherFixedCost;
          newState.foodCost = defaultData.foodCost;
          newState.dailyNecessitiesCost = defaultData.dailyNecessitiesCost;
          newState.transportationCost = defaultData.transportationCost;
          newState.clothingBeautyCost = defaultData.clothingBeautyCost;
          newState.socializingCost = defaultData.socializingCost;
          newState.hobbyEntertainmentCost = defaultData.hobbyEntertainmentCost;
          newState.otherVariableCost = defaultData.otherVariableCost;
        }

        // 車の購入予定が「なし」に変更された場合、車関連のデータをリセット
        if (name === 'carPurchasePlan' && value === 'no') {
          const defaultData = createDefaultFormData();
          newState.carPrice = defaultData.carPrice;
          newState.carFirstReplacementAfterYears = defaultData.carFirstReplacementAfterYears;
          newState.carReplacementFrequency = defaultData.carReplacementFrequency;
          newState.carLoanUsage = defaultData.carLoanUsage;
          newState.carLoanYears = defaultData.carLoanYears;
          newState.carLoanType = defaultData.carLoanType;
        }

        // 親の介護想定が「なし」に変更された場合、介護計画をリセット
        if (name === 'parentCareAssumption' && value === 'なし') {
          const defaultData = createDefaultFormData();
          newState.parentCarePlans = defaultData.parentCarePlans;
        }

        // 定年再雇用の想定が変更された場合、減給率をリセット
        if (name === 'assumeReemployment') {
          const defaultData = createDefaultFormData();
          if (value === true) {
            // 想定「する」にした場合はデフォルト値を設定
            newState.reemploymentReductionRate = defaultData.reemploymentReductionRate;
          } else {
            // 想定「しない」にした場合は空にする（もしくはデフォルト値）
            newState.reemploymentReductionRate = defaultData.reemploymentReductionRate;
          }
        }

        // 住宅リフォームプランのコストが0または空になった場合、そのプランを削除
        if (name.startsWith('houseRenovationPlans') && name.endsWith('.cost') && (value === '' || n(value) === 0)) {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.houseRenovationPlans = newState.houseRenovationPlans.filter((_, i) => i !== index);
          }
        }

        // 介護プランのコストが0または空になった場合、そのプランを削除
        if (name.startsWith('parentCarePlans') && name.endsWith('.monthly10kJPY') && (value === '' || n(value) === 0)) {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.parentCarePlans = newState.parentCarePlans.filter((_, i) => i !== index);
          }
        }

        // その他一時金の名称が空になった場合、そのプランを削除
        if ((name.startsWith('otherLumpSums') || name.startsWith('spouseOtherLumpSums')) && name.endsWith('.name') && value === '') {
          const planType = name.startsWith('otherLumpSums') ? 'otherLumpSums' : 'spouseOtherLumpSums';
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState[planType] = newState[planType].filter((_, i) => i !== index);
          }
        }

        // 家電プランの入力が変更され、名前が空になった場合、そのプランを削除
        if (name.startsWith('appliances') && name.endsWith('.name') && value === '') {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.appliances = newState.appliances.filter((_, i) => i !== index);
          }
        }

        // 個人年金の受け取り有無が変更された場合、プランをリセット
        if (name === 'hasPersonalPension') {
          if (value === false) {
            newState.personalPensionPlans = [];
          }
        }

        // 配偶者の個人年金の受け取り有無が変更された場合、プランをリセット
        if (name === 'hasSpousePersonalPension') {
          if (value === false) {
            newState.spousePersonalPensionPlans = [];
          }
        }

        return newState;
      });
    }
  }, []);

  const handleApplianceChange = useCallback((index: number, field: string, value: string) => {
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
  }, []);

  const addAppliance = useCallback(() => {
    setFormData(prev => ({ ...prev, appliances: [...prev.appliances, { name: '', cycle: 0, cost: 0, firstReplacementAfterYears: '' }] }));
  }, []);

  const handleRemoveAppliance = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, appliances: prev.appliances.filter((_, i) => i !== index) }));
  }, []);

  const handleCarePlanChange = useCallback((index: number, key: keyof Omit<CarePlan, 'id'>, value: string) => {
    setFormData(prev => {
      const newPlans = [...prev.parentCarePlans];
      if (!newPlans[index]) return prev;
      newPlans[index] = {
        ...newPlans[index],
        [key]: value === '' ? '' : Number(value)
      };
      return { ...prev, parentCarePlans: newPlans };
    });
  }, []);

  const addCarePlan = useCallback(() => {
    setFormData(prev => {
      const firstPlan = prev.parentCarePlans[0] || createDefaultCarePlan();
      const newPlan = { ...firstPlan, id: Date.now() };
      return { ...prev, parentCarePlans: [...prev.parentCarePlans, newPlan] };
    });
  }, []);

  const removeCarePlan = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      parentCarePlans: prev.parentCarePlans.filter((_, i) => i !== index),
    }));
  }, []);

  type RenovationPlan = { age: number; cost: number; cycleYears?: number };

  const handleRenovationPlanChange = useCallback((index: number, key: keyof RenovationPlan, value: string) => {
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
  }, []);

  // Auto-calculations and side effects
  const totalExpenses = useMemo(() => {
    if (formData.expenseMethod !== '詳細') return 0;
    const fixed = [
      formData.utilitiesCost, formData.communicationCost, formData.insuranceCost,
      formData.educationCost, formData.otherFixedCost,
    ].reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
    const variable = [
      formData.foodCost, formData.dailyNecessitiesCost, formData.transportationCost,
      formData.clothingBeautyCost, formData.socializingCost, formData.hobbyEntertainmentCost,
      formData.otherVariableCost,
    ].reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
    return fixed + variable;
  }, [
    formData.expenseMethod, formData.utilitiesCost, formData.communicationCost,
    formData.insuranceCost, formData.educationCost, formData.otherFixedCost,
    formData.foodCost, formData.dailyNecessitiesCost, formData.transportationCost,
    formData.clothingBeautyCost, formData.socializingCost, formData.hobbyEntertainmentCost,
    formData.otherVariableCost,
  ]);

  useEffect(() => {
    if (formData.planToMarry !== 'する' || formData.isLivingCostEdited) return;
    
    const singleLivingCost = formData.expenseMethod === '簡単'
      ? Number(formData.livingCostSimple) || 0
      : totalExpenses;

    if (singleLivingCost > 0) {
      const recommendedCost = Math.round(singleLivingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.LIVING);
      setFormData(prev => ({ ...prev, livingCostAfterMarriage: String(recommendedCost) }));
    }
  }, [formData.livingCostSimple, totalExpenses, formData.expenseMethod, formData.planToMarry, formData.isLivingCostEdited]);

  useEffect(() => {
    if (formData.planToMarry !== 'する' || formData.isHousingCostEdited) return;
    const singleHousingCost = Number(formData.currentRentLoanPayment) || 0;
    if (singleHousingCost > 0 && !formData.isHousingCostEdited) {
      const recommendedCost = Math.round(singleHousingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.HOUSING);
      setFormData(prev => ({ ...prev, housingCostAfterMarriage: String(recommendedCost) }));
    }
  }, [formData.currentRentLoanPayment, formData.planToMarry, formData.isHousingCostEdited]);

  useEffect(() => {
    if (formData.familyComposition === "独身") {
      const defaultData = createDefaultFormData();
      setFormData(prev => ({
        ...prev,
        spouseMainIncome: defaultData.spouseMainIncome,
        spouseSideJobIncome: defaultData.spouseSideJobIncome,
      }));
    }
  }, [formData.familyComposition]);

  const totalNetAnnualIncome = useMemo(() => {
    const mainJobIncomeGross = (Number(formData.mainIncome) || 0) * FC.YEN_PER_MAN;
    const sideJobIncomeGross = (Number(formData.sideJobIncome) || 0) * FC.YEN_PER_MAN;
    const spouseMainJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseMainIncome) || 0) : 0) * FC.YEN_PER_MAN;
    const spouseSideJobIncomeGross = (formData.familyComposition === '既婚' ? (Number(formData.spouseSideJobIncome) || 0) : 0) * FC.YEN_PER_MAN;
    const selfNetAnnual = computeNetAnnual(mainJobIncomeGross) + computeNetAnnual(sideJobIncomeGross);
    const spouseNetAnnual = computeNetAnnual(spouseMainJobIncomeGross) + computeNetAnnual(spouseSideJobIncomeGross);
    return selfNetAnnual + spouseNetAnnual;
  }, [
    formData.mainIncome, formData.sideJobIncome, formData.spouseMainIncome,
    formData.spouseSideJobIncome, formData.familyComposition,
  ]);

  // Memoized display values
  const displayTotalApplianceCost = useMemo(() => formData.appliances.map((item) => Number(item.cost) || 0).reduce((sum, cost) => sum + cost, 0), [formData.appliances]);
  const totalIncome = useMemo(() => (Number(formData.mainIncome || 0) + Number(formData.spouseMainIncome || 0) + Number(formData.sideJobIncome || 0) + Number(formData.spouseSideJobIncome || 0)), [formData.mainIncome, formData.spouseMainIncome, formData.sideJobIncome, formData.spouseSideJobIncome]);
  const displayTotalIncome = useMemo(() => totalIncome * FC.YEN_PER_MAN, [totalIncome]);
  const totalMarriageCost = useMemo(() => {
    if (formData.planToMarry !== 'する') return 0;
    return (Number(formData.engagementCost || 0) + Number(formData.weddingCost || 0) + Number(formData.honeymoonCost || 0) + (Number(formData.newHomeMovingCost) || 0)) * FC.YEN_PER_MAN;
  }, [formData.planToMarry, formData.engagementCost, formData.weddingCost, formData.honeymoonCost, formData.newHomeMovingCost]);
  const totalCareCost = useMemo(() => {
    if (formData.parentCareAssumption !== 'はい' || !formData.parentCarePlans) return 0;
    return formData.parentCarePlans.reduce((total, plan) => total + ((Number(plan.monthly10kJPY) || 0) * (Number(plan.years) || 0) * FC.MONTHS_PER_YEAR), 0);
  }, [formData.parentCareAssumption, formData.parentCarePlans]);
  const totalRetirementMonthly = useMemo(() => {
    const spousePension = (formData.familyComposition === '既婚' || formData.planToMarry === 'する') ? (Number(formData.spousePensionAmount) || 0) : 0;
    return ((Number(formData.postRetirementLivingCost) || 0) - ((Number(formData.pensionAmount) || 0) + spousePension));
  }, [formData.postRetirementLivingCost, formData.pensionAmount, formData.spousePensionAmount, formData.familyComposition, formData.planToMarry]);
  const totalCarLoanCost = useMemo(() => {
    if (formData.carLoanUsage !== 'はい') return 0;
    const principal = Number(formData.carPrice) * FC.YEN_PER_MAN || 0;
    const years = Number(formData.carLoanYears) || 0;
    let annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_GENERAL * 100;
    if (formData.carLoanType === '銀行ローン') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_BANK * 100;
    else if (formData.carLoanType === 'ディーラーローン') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_DEALER * 100;
    const { totalPayment } = calculateLoanPayment(principal, annualRatePercent, years);
    return Math.ceil(totalPayment);
  }, [formData.carPrice, formData.carLoanUsage, formData.carLoanYears, formData.carLoanType]);
  const totalInvestment = useMemo(() => {
    const monthlyTotal = Object.values(formData.monthlyInvestmentAmounts).reduce((acc: number, val) => acc + Number(val), 0);
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
        const principal = (price - downPayment) * FC.YEN_PER_MAN;
        let interestRate = FC.DEFAULT_LOAN_RATES.HOUSING_GENERAL * 100;
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
        totalPayment = Math.ceil(annualPayment * loanRemainingYears / 1000) * 1000;
      }
    }
    return { estimatedAnnualLoanPayment: annualPayment, estimatedTotalLoanPayment: totalPayment };
  }, [
    formData.housingLoanStatus, formData.housePurchasePrice, formData.headDownPayment,
    formData.housingLoanYears, formData.housingLoanInterestRateType, formData.housingLoanInterestRate,
    formData.loanMonthlyPayment, formData.loanRemainingYears, formData.housePurchasePlan, formData.housingType
  ]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    showRestoreModal,
    isReady,
    restoreFormData,
    clearAndReady,
    handleInputChange,
    handleApplianceChange,
    addAppliance,
    handleRemoveAppliance,
    handleCarePlanChange,
    addCarePlan,
    removeCarePlan,
    handleRenovationPlanChange,
    totalExpenses,
    totalNetAnnualIncome,
    displayTotalApplianceCost,
    displayTotalIncome,
    totalMarriageCost,
    totalCareCost,
    totalRetirementMonthly,
    totalCarLoanCost,
    totalInvestment,
    estimatedAnnualLoanPayment,
    estimatedTotalLoanPayment,
    initialStateFromLocation,
    effectiveSections, // FormPage に渡す
    validateSection    // FormPage に渡す
  };
};
