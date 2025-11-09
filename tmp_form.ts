import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, type Location } from 'react-router-dom';
import type { FormDataState, FormLocationState, InvestmentMonthlyAmounts } from '@/types/form-types';
import type { CarePlan } from '@/types/simulation-types';
import * as FC from '@/constants/financial_const';
import { computeNetAnnual, calculateLoanPayment, n } from '@/utils/financial';

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
  housingType: '' as '雉・ｲｸ' | '謖√■螳ｶ・医Ο繝ｼ繝ｳ荳ｭ・・ | '謖√■螳ｶ・亥ｮ梧ｸ茨ｼ・,
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
  interestRateScenario: '繝ｩ繝ｳ繝繝螟牙虚',
  fixedInterestRate: String(FC.DEFAULT_FIXED_INTEREST_RATE_PERCENT),
  emergencyFund: String(FC.DEFAULT_EMERGENCY_FUND_MAN_YEN),
  stressTestSeed: '',
  appliances: FC.DEFAULT_APPLIANCES,
  annualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
  spouseAnnualRaiseRate: String(FC.DEFAULT_ANNUAL_RAISE_RATE_PERCENT),
  useSpouseNisa: false,

  // 騾閨ｷ驥代・荳譎る≡
  retirementIncome: null,
  spouseRetirementIncome: null,
  personalPensionPlans: [],
  spousePersonalPensionPlans: [],
  otherLumpSums: [],
  spouseOtherLumpSums: [],
  // 螳壼ｹｴ蜀埼寐逕ｨ
  assumeReemployment: false,
  reemploymentReductionRate: String(FC.DEFAULT_REEMPLOYMENT_REDUCTION_RATE_PERCENT),
  spouseAssumeReemployment: false,
  spouseReemploymentReductionRate: String(FC.DEFAULT_REEMPLOYMENT_REDUCTION_RATE_PERCENT),
});

export const useFormState = () => {
  const location = useLocation();
  // location.state 縺ｮ蝙九ｒ螳牙・縺ｫ謇ｱ縺・  const locationState = (location as Location<FormLocationState | null>).state;
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
  const [cacheDisabled, setCacheDisabled] = useState(false); // 繧ｭ繝｣繝・す繝･讖溯・繧堤┌蜉ｹ蛹悶☆繧九ヵ繝ｩ繧ｰ

  // `effectiveSections` 縺ｨ `validateSection` 繧偵ヵ繝・け蜀・↓螳夂ｾｩ
  const effectiveSections = useMemo(() => {
    const allSections = [...FC.MASTER_SECTIONS];
    if (formData.familyComposition === '譌｢蟀・) {
      return allSections.filter(section => section !== '繝ｩ繧､繝輔う繝吶Φ繝・- 邨仙ｩ・);
    }
    return allSections;
  }, [formData.familyComposition]);

  const validateSection = useCallback((sectionIndex: number) => {
    const sectionName = effectiveSections[sectionIndex];
    const newErrors: { [key: string]: string } = {};
    // 繝舌Μ繝・・繧ｷ繝ｧ繝ｳ繝ｭ繧ｸ繝・け縺ｮ螳溯｣・ｾ・    if (sectionName === '螳ｶ譌乗ｧ区・') {
      if (!formData.familyComposition) {
        newErrors.familyComposition = '螳ｶ譌乗ｧ区・繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・;
      }
    } else if (sectionName === '迴ｾ蝨ｨ縺ｮ蜿主・') { // New block for Income section validation
      if (!formData.personAge || n(formData.personAge) < FC.VALIDATION_MIN_AGE || n(formData.personAge) > FC.VALIDATION_MAX_AGE) {
        newErrors.personAge = `蟷ｴ鮨｢縺ｯ${FC.VALIDATION_MIN_AGE}豁ｳ縺九ｉ${FC.VALIDATION_MAX_AGE}豁ｳ縺ｮ髢薙〒蜈･蜉帙＠縺ｦ縺上□縺輔＞縲Ａ;
      }
      if (formData.familyComposition === '譌｢蟀・) {
        if (!formData.spouseAge || n(formData.spouseAge) < FC.VALIDATION_MIN_AGE || n(formData.spouseAge) > FC.VALIDATION_MAX_AGE) {
          newErrors.spouseAge = `驟榊・閠・・蟷ｴ鮨｢縺ｯ${FC.VALIDATION_MIN_AGE}豁ｳ縺九ｉ${FC.VALIDATION_MAX_AGE}豁ｳ縺ｮ髢薙〒蜈･蜉帙＠縺ｦ縺上□縺輔＞縲Ａ;
        }
      }
      // Also add validation for mainIncome and spouseMainIncome
      if (!formData.mainIncome || n(formData.mainIncome) <= 0) {
        newErrors.mainIncome = '譛ｬ讌ｭ蟷ｴ髢灘庶蜈･繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・;
      }
      if (formData.familyComposition === '譌｢蟀・ && (!formData.spouseMainIncome || n(formData.spouseMainIncome) <= 0)) {
        newErrors.spouseMainIncome = '驟榊・閠・・譛ｬ讌ｭ蟷ｴ髢灘庶蜈･繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・;
      }
    }
    // Add validation for other sections here as needed

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
    setCacheDisabled(true); // 繧ｭ繝｣繝・す繝･繧偵け繝ｪ繧｢縺励◆蠕後・縲√％縺ｮ繧ｻ繝・す繝ｧ繝ｳ縺ｧ縺ｯ繧ｭ繝｣繝・す繝･繧堤┌蜉ｹ蛹・  }, []);

  // NEW useEffect to handle initial loading and cache
  useEffect(() => {
    if (initialStateFromLocation) {
      // location.state縺九ｉ繝・・繧ｿ縺梧ｸ｡縺輔ｌ縺溷ｴ蜷医√く繝｣繝・す繝･縺ｯ菴ｿ逕ｨ縺帙★縲√◎縺ｮ繝・・繧ｿ縺ｧ蛻晄悄蛹悶☆繧・      setIsReady(true);
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
        // Switch繧ｳ繝ｳ繝昴・繝阪Φ繝医・繧医≧縺ｫvalue縺ｫ逶ｴ謗･boolean縺悟・繧句ｴ蜷医→縲・壼ｸｸ縺ｮinput[type=checkbox]縺ｮ繧医≧縺ｫchecked繝励Ο繝代ユ繧｣縺ｫ蜈･繧句ｴ蜷医・荳｡譁ｹ縺ｫ蟇ｾ蠢・        const targetValue = (e.target as HTMLInputElement).value;
        value = typeof targetValue === 'boolean' ? targetValue : (e.target as HTMLInputElement).checked;
      } else {
        value = e.target.value;
      }

      // assumeReemployment 縺ｨ spouseAssumeReemployment 縺ｯ boolean 縺ｫ螟画鋤縺吶ｋ
      if (name === 'assumeReemployment' || name === 'spouseAssumeReemployment') {
        // 譁・ｭ怜・縺ｮ 'true'/'false' 繧・boolean 縺ｫ螟画鋤
        value = value === 'true' || value === true;
      }

      setFormData(prev => {
        const newState = { ...prev, [name]: value };

        if (name === 'livingCostAfterMarriage') {
          newState.isLivingCostEdited = true;
        }
        if (name === 'housingCostAfterMarriage') {
          newState.isHousingCostEdited = true;
        }
        // 菴丞ｱ・ち繧､繝励′縲瑚ｳ・ｲｸ縲堺ｻ･螟悶↓螟画峩縺輔ｌ縺溷ｴ蜷医∝ｰ・擂縺ｮ雉ｼ蜈･繝励Λ繝ｳ繧偵Μ繧ｻ繝・ヨ
        if (name === 'housingType' && value !== '雉・ｲｸ') {
          newState.housePurchaseIntent = 'no';
          newState.housePurchasePlan = null;
        }

        // 蟄蝉ｾ帙・譛臥┌縺後後↑縺励阪↓螟画峩縺輔ｌ縺溷ｴ蜷医∝ｭ蝉ｾ幃未騾｣縺ｮ繝・・繧ｿ繧偵Μ繧ｻ繝・ヨ
        if (name === 'hasChildren' && value === '縺ｪ縺・) {
          const defaultData = createDefaultFormData();
          newState.numberOfChildren = defaultData.numberOfChildren;
          newState.firstBornAge = defaultData.firstBornAge;
          newState.educationPattern = defaultData.educationPattern;
        }

        // 邨仙ｩ壻ｺ亥ｮ壹′縲後＠縺ｪ縺・阪↓螟画峩縺輔ｌ縺溷ｴ蜷医∫ｵ仙ｩ夐未騾｣縺ｮ繝・・繧ｿ繧偵Μ繧ｻ繝・ヨ
        if (name === 'planToMarry' && value === '縺励↑縺・) {
          const defaultData = createDefaultFormData();
          newState.marriageAge = defaultData.marriageAge;
          newState.spouseAgeAtMarriage = defaultData.spouseAgeAtMarriage;
          newState.spouseIncomePattern = defaultData.spouseIncomePattern;
          newState.engagementCost = defaultData.engagementCost;
          // ... 莉悶・邨仙ｩ夐未騾｣雋ｻ逕ｨ繧ゅΜ繧ｻ繝・ヨ
        }

        // 謾ｯ蜃ｺ蜈･蜉帶婿豕輔′縲檎ｰ｡蜊倥阪↓螟画峩縺輔ｌ縺溷ｴ蜷医∬ｩｳ邏ｰ謾ｯ蜃ｺ鬆・岼繧偵Μ繧ｻ繝・ヨ
        if (name === 'expenseMethod' && value === '邁｡蜊・) {
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

        // 霆翫・雉ｼ蜈･莠亥ｮ壹′縲後↑縺励阪↓螟画峩縺輔ｌ縺溷ｴ蜷医∬ｻ企未騾｣縺ｮ繝・・繧ｿ繧偵Μ繧ｻ繝・ヨ
        if (name === 'carPurchasePlan' && value === 'no') {
          const defaultData = createDefaultFormData();
          newState.carPrice = defaultData.carPrice;
          newState.carFirstReplacementAfterYears = defaultData.carFirstReplacementAfterYears;
          newState.carReplacementFrequency = defaultData.carReplacementFrequency;
          newState.carLoanUsage = defaultData.carLoanUsage;
          newState.carLoanYears = defaultData.carLoanYears;
          newState.carLoanType = defaultData.carLoanType;
        }

        // 隕ｪ縺ｮ莉玖ｭｷ諠ｳ螳壹′縲後↑縺励阪↓螟画峩縺輔ｌ縺溷ｴ蜷医∽ｻ玖ｭｷ險育判繧偵Μ繧ｻ繝・ヨ
        if (name === 'parentCareAssumption' && value === '縺ｪ縺・) {
          const defaultData = createDefaultFormData();
          newState.parentCarePlans = defaultData.parentCarePlans;
        }

        // 螳壼ｹｴ蜀埼寐逕ｨ縺ｮ諠ｳ螳壹′螟画峩縺輔ｌ縺溷ｴ蜷医∵ｸ帷ｵｦ邇・ｒ繝ｪ繧ｻ繝・ヨ
        if (name === 'assumeReemployment') {
          const defaultData = createDefaultFormData();
          if (value === true) {
            // 諠ｳ螳壹後☆繧九阪↓縺励◆蝣ｴ蜷医・繝・ヵ繧ｩ繝ｫ繝亥､繧定ｨｭ螳・            newState.reemploymentReductionRate = defaultData.reemploymentReductionRate;
          } else {
            // 諠ｳ螳壹後＠縺ｪ縺・阪↓縺励◆蝣ｴ蜷医・遨ｺ縺ｫ縺吶ｋ・医ｂ縺励￥縺ｯ繝・ヵ繧ｩ繝ｫ繝亥､・・            newState.reemploymentReductionRate = defaultData.reemploymentReductionRate;
          }
        }

        // 菴丞ｮ・Μ繝輔か繝ｼ繝繝励Λ繝ｳ縺ｮ繧ｳ繧ｹ繝医′0縺ｾ縺溘・遨ｺ縺ｫ縺ｪ縺｣縺溷ｴ蜷医√◎縺ｮ繝励Λ繝ｳ繧貞炎髯､
        if (name.startsWith('houseRenovationPlans') && name.endsWith('.cost') && (value === '' || n(value) === 0)) {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.houseRenovationPlans = newState.houseRenovationPlans.filter((_, i) => i !== index);
          }
        }

        // 莉玖ｭｷ繝励Λ繝ｳ縺ｮ繧ｳ繧ｹ繝医′0縺ｾ縺溘・遨ｺ縺ｫ縺ｪ縺｣縺溷ｴ蜷医√◎縺ｮ繝励Λ繝ｳ繧貞炎髯､
        if (name.startsWith('parentCarePlans') && name.endsWith('.monthly10kJPY') && (value === '' || n(value) === 0)) {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.parentCarePlans = newState.parentCarePlans.filter((_, i) => i !== index);
          }
        }

        // 縺昴・莉紋ｸ譎る≡縺ｮ蜷咲ｧｰ縺檎ｩｺ縺ｫ縺ｪ縺｣縺溷ｴ蜷医√◎縺ｮ繝励Λ繝ｳ繧貞炎髯､
        if ((name.startsWith('otherLumpSums') || name.startsWith('spouseOtherLumpSums')) && name.endsWith('.name') && value === '') {
          const planType = name.startsWith('otherLumpSums') ? 'otherLumpSums' : 'spouseOtherLumpSums';
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState[planType] = newState[planType].filter((_, i) => i !== index);
          }
        }

        // 螳ｶ髮ｻ繝励Λ繝ｳ縺ｮ蜈･蜉帙′螟画峩縺輔ｌ縲∝錐蜑阪′遨ｺ縺ｫ縺ｪ縺｣縺溷ｴ蜷医√◎縺ｮ繝励Λ繝ｳ繧貞炎髯､
        if (name.startsWith('appliances') && name.endsWith('.name') && value === '') {
          const indices = name.match(/\d+/g);
          if (indices) {
            const index = parseInt(indices[0], 10);
            newState.appliances = newState.appliances.filter((_, i) => i !== index);
          }
        }

        // 蛟倶ｺｺ蟷ｴ驥代・蜿励￠蜿悶ｊ譛臥┌縺悟､画峩縺輔ｌ縺溷ｴ蜷医√・繝ｩ繝ｳ繧偵Μ繧ｻ繝・ヨ
        if (name === 'hasPersonalPension') {
          if (value === false) {
            newState.personalPensionPlans = [];
          }
        }

        // 驟榊・閠・・蛟倶ｺｺ蟷ｴ驥代・蜿励￠蜿悶ｊ譛臥┌縺悟､画峩縺輔ｌ縺溷ｴ蜷医√・繝ｩ繝ｳ繧偵Μ繧ｻ繝・ヨ
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
    if (formData.expenseMethod !== '隧ｳ邏ｰ') return 0;
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
    if (formData.planToMarry !== '縺吶ｋ' || formData.isLivingCostEdited) return;
    
    const singleLivingCost = formData.expenseMethod === '邁｡蜊・
      ? Number(formData.livingCostSimple) || 0
      : totalExpenses;

    if (singleLivingCost > 0) {
      const recommendedCost = Math.round(singleLivingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.LIVING);
      setFormData(prev => ({ ...prev, livingCostAfterMarriage: String(recommendedCost) }));
    }
  }, [formData.livingCostSimple, totalExpenses, formData.expenseMethod, formData.planToMarry, formData.isLivingCostEdited]);

  useEffect(() => {
    if (formData.planToMarry !== '縺吶ｋ' || formData.isHousingCostEdited) return;
    const singleHousingCost = Number(formData.currentRentLoanPayment) || 0;
    if (singleHousingCost > 0 && !formData.isHousingCostEdited) {
      const recommendedCost = Math.round(singleHousingCost * FC.POST_MARRIAGE_COST_INCREASE_RATE.HOUSING);
      setFormData(prev => ({ ...prev, housingCostAfterMarriage: String(recommendedCost) }));
    }
  }, [formData.currentRentLoanPayment, formData.planToMarry, formData.isHousingCostEdited]);

  useEffect(() => {
    if (formData.familyComposition === "迢ｬ霄ｫ") {
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
    const spouseMainJobIncomeGross = (formData.familyComposition === '譌｢蟀・ ? (Number(formData.spouseMainIncome) || 0) : 0) * FC.YEN_PER_MAN;
    const spouseSideJobIncomeGross = (formData.familyComposition === '譌｢蟀・ ? (Number(formData.spouseSideJobIncome) || 0) : 0) * FC.YEN_PER_MAN;
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
    if (formData.planToMarry !== '縺吶ｋ') return 0;
    return (Number(formData.engagementCost || 0) + Number(formData.weddingCost || 0) + Number(formData.honeymoonCost || 0) + (Number(formData.newHomeMovingCost) || 0)) * FC.YEN_PER_MAN;
  }, [formData.planToMarry, formData.engagementCost, formData.weddingCost, formData.honeymoonCost, formData.newHomeMovingCost]);
  const totalCareCost = useMemo(() => {
    if (formData.parentCareAssumption !== '縺ｯ縺・ || !formData.parentCarePlans) return 0;
    return formData.parentCarePlans.reduce((total, plan) => total + ((Number(plan.monthly10kJPY) || 0) * (Number(plan.years) || 0) * FC.MONTHS_PER_YEAR), 0);
  }, [formData.parentCareAssumption, formData.parentCarePlans]);
  const totalRetirementMonthly = useMemo(() => {
    const spousePension = (formData.familyComposition === '譌｢蟀・ || formData.planToMarry === '縺吶ｋ') ? (Number(formData.spousePensionAmount) || 0) : 0;
    return ((Number(formData.postRetirementLivingCost) || 0) - ((Number(formData.pensionAmount) || 0) + spousePension));
  }, [formData.postRetirementLivingCost, formData.pensionAmount, formData.spousePensionAmount, formData.familyComposition, formData.planToMarry]);
  const totalCarLoanCost = useMemo(() => {
    if (formData.carLoanUsage !== '縺ｯ縺・) return 0;
    const principal = Number(formData.carPrice) * FC.YEN_PER_MAN || 0;
    const years = Number(formData.carLoanYears) || 0;
    let annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_GENERAL * 100;
    if (formData.carLoanType === '驫陦後Ο繝ｼ繝ｳ') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_BANK * 100;
    else if (formData.carLoanType === '繝・ぅ繝ｼ繝ｩ繝ｼ繝ｭ繝ｼ繝ｳ') annualRatePercent = FC.DEFAULT_LOAN_RATES.CAR_DEALER * 100;
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
    const isFutureBuyer = formData.housingType === '雉・ｲｸ' && formData.housePurchasePlan !== null;
    const isCurrentLoanHolder = formData.housingType === '謖√■螳ｶ・医Ο繝ｼ繝ｳ荳ｭ・・ && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0;
    if (housingLoanStatus === '縺薙ｌ縺九ｉ蛟溘ｊ繧・ || isFutureBuyer) {
      const price = (isFutureBuyer ? formData.housePurchasePlan?.price : Number(formData.housePurchasePrice)) || 0;
      const downPayment = (isFutureBuyer ? formData.housePurchasePlan?.downPayment : Number(formData.headDownPayment)) || 0;
      const years = (isFutureBuyer ? formData.housePurchasePlan?.loanYears : Number(formData.housingLoanYears)) || 0;
      const interestRateType = formData.housingLoanInterestRateType;
      const customInterestRate = (isFutureBuyer ? formData.housePurchasePlan?.interestRate : Number(formData.housingLoanInterestRate)) || 0;
      if (price > 0 && years > 0 && interestRateType) {
        const principal = (price - downPayment) * FC.YEN_PER_MAN;
        let interestRate = FC.DEFAULT_LOAN_RATES.HOUSING_GENERAL * 100;
        if (interestRateType === '謖・ｮ・) {
          interestRate = customInterestRate;
        }
        const calculated = calculateLoanPayment(principal, interestRate, years);
        annualPayment = calculated.annualPayment;
        totalPayment = calculated.totalPayment;
      }
    } else if (housingLoanStatus === '縺吶〒縺ｫ霑疲ｸ井ｸｭ' || isCurrentLoanHolder) {
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
    effectiveSections, // FormPage 縺ｫ貂｡縺・    validateSection    // FormPage 縺ｫ貂｡縺・  };
};

