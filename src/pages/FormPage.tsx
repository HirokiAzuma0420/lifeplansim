import React, { useState, useMemo, useEffect} from 'react';
import { Trash2 } from "lucide-react";
import incomeBrackets from "../assets/net_income_brackets.json";
import AssetAccordion from "../components/AssetAccordion";

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

function getNetIncome(gross: number): number {
  const bracket = incomeBrackets.find((b: { min: number; max: number | null; rate: number }) => gross >= b.min && (b.max === null || gross <= b.max))
  return bracket ? gross * bracket.rate : gross * 0.8
}

export default function FormPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showBackModal, setShowBackModal] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set([0]));
  const [annualRaiseRate, setAnnualRaiseRate] = useState(1.5);
  const [spouseAnnualRaiseRate, setSpouseAnnualRaiseRate] = useState(1.5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<object | string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    familyComposition: '', // 独身／既婚
    personAge: '',
    spouseAge: '',
    mainIncome: '',
    spouseMainIncome: '',
    sideJobIncome: '0',
    spouseSideJobIncome: '0',
    expenseMethod: '', // 簡単／詳細
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
    carFirstReplacementAfterYears: '',
    carPrice: '',
    carReplacementFrequency: '',
    carLoanUsage: '',
    carLoanYears: '',
    carLoanType: '',
    housingType: '' as '賃貸' | '持ち家（ローン中）' | '持ち家（完済）',
    housePurchasePlan: null as { age: number, price: number, downPayment: number, loanYears: number, interestRate: number } | null,
    houseRenovationPlans: [] as { age: number, cost: number, cycleYears?: number }[],
    housePurchaseAge: '',
    housePurchasePrice: '',
    headDownPayment: '',
    housingLoanYears: '',
    housingLoanInterestRateType: '', // 一般的な想定／指定
    housingLoanInterestRate: '',
    housingLoanStatus: '', // これから借りる予定／すでに返済中／借りる予定はない
    loanOriginalAmount: '',
    loanMonthlyPayment: '',
    loanRemainingYears: '',
    loanInterestRate: '',
    planToMarry: '', // する／しない
    marriageAge: '',
    engagementCost: '200',
    weddingCost: '330',
    honeymoonCost: '35',
    newHomeMovingCost: '50',
    hasChildren: '', // はい／いいえ
    numberOfChildren: '',
    firstBornAge: '',
    educationPattern: '', // 公立中心／公私混合／私立中心
    currentRentLoanPayment: '',
    otherLargeExpenses: '',
    parentCurrentAge: '',
    parentCareStartAge: '',
    parentCareAssumption: '', // はい／いいえ／まだ分からない
    parentCareMonthlyCost: '10',
    parentCareYears: '5',
    retirementAge: '65',
    postRetirementLivingCost: '25',
    pensionStartAge: '65',
    pensionAmount: '15',
    currentSavings: '',
    monthlySavings: '',
    hasInvestment: '', // はい／いいえ
    investmentStocksCurrent: '',
    investmentTrustCurrent: '',
    investmentBondsCurrent: '',
    investmentIdecoCurrent: '',
    investmentCryptoCurrent: '',
    investmentOtherCurrent: '',
    monthlyInvestmentAmounts: {
      investmentStocksMonthly: '0',
      investmentTrustMonthly: '0',
      investmentBondsMonthly: '0',
      investmentIdecoMonthly: '0',
      investmentCryptoMonthly: '0',
      investmentOtherMonthly: '0',
    },
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
    interestRateScenario: '', // 固定利回り／ランダム変動
    emergencyFund: '300',
  });

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputParams: {
            initialAge: Number(formData.personAge),
            spouseInitialAge: formData.spouseAge ? Number(formData.spouseAge) : undefined,
            endAge: Number(formData.simulationPeriodAge),
            currentSavings: Number(formData.currentSavings) * 10000, // 万円 -> 円
            mainJobIncome: Number(formData.mainIncome) * 10000, // 万円 -> 円
            incomeGrowthRate: Number(annualRaiseRate) / 100, // % -> 小数
            spouseMainIncome: Number(formData.spouseMainIncome) * 10000, // 万円 -> 円
            spouseIncomeGrowthRate: Number(spouseAnnualRaiseRate) / 100, // % -> 小数
            sideJobIncome: Number(formData.sideJobIncome) * 10000, // 万円 -> 円
            spouseSideJobIncome: Number(formData.spouseSideJobIncome) * 10000, // 万円 -> 円
            livingCost: formData.livingCostSimple ? Number(formData.livingCostSimple) * 12 : 0, // 円/月 -> 円/年
            carPrice: Number(formData.carPrice) * 10000, // 万円 -> 円
            carReplacementFrequency: Number(formData.carReplacementFrequency),
            carLoanUsage: formData.carLoanUsage,
            carLoanYears: Number(formData.carLoanYears),
            carLoanType: formData.carLoanType,
            carFirstReplacementAfterYears: Number(formData.carFirstReplacementAfterYears),
            housingType: formData.housingType,
            housePurchasePlan: formData.housePurchasePlan ? {
              age: Number(formData.housePurchasePlan.age),
              price: Number(formData.housePurchasePlan.price) * 10000, // 万円 -> 円
              downPayment: Number(formData.housePurchasePlan.downPayment) * 10000, // 万円 -> 円
              loanYears: Number(formData.housePurchasePlan.loanYears),
              interestRate: Number(formData.housePurchasePlan.interestRate) / 100, // % -> 小数
            } : null,
            houseRenovationPlans: formData.houseRenovationPlans.map(plan => ({
              age: Number(plan.age),
              cost: Number(plan.cost) * 10000, // 万円 -> 円
              cycleYears: plan.cycleYears ? Number(plan.cycleYears) : undefined,
            })),
            loanMonthlyPayment: Number(formData.loanMonthlyPayment),
            loanRemainingYears: Number(formData.loanRemainingYears),
            housingLoanInterestRateType: formData.housingLoanInterestRateType,
            housingLoanInterestRate: Number(formData.housingLoanInterestRate) / 100, // % -> 小数
            monthlySavings: Number(formData.monthlySavings),
            investmentStocksCurrent: Number(formData.investmentStocksCurrent),
            investmentTrustCurrent: Number(formData.investmentTrustCurrent),
            investmentBondsCurrent: Number(formData.investmentBondsCurrent),
            investmentIdecoCurrent: Number(formData.investmentIdecoCurrent),
            investmentCryptoCurrent: Number(formData.investmentCryptoCurrent),
            investmentOtherCurrent: Number(formData.investmentOtherCurrent),
            monthlyInvestmentAmounts: Object.fromEntries(
              Object.entries(formData.monthlyInvestmentAmounts).map(([key, value]) => [key, Number(value)])
            ),
            investmentStocksAnnualSpot: Number(formData.investmentStocksAnnualSpot),
            investmentTrustAnnualSpot: Number(formData.investmentTrustAnnualSpot),
            investmentBondsAnnualSpot: Number(formData.investmentBondsAnnualSpot),
            investmentIdecoAnnualSpot: Number(formData.investmentIdecoAnnualSpot),
            investmentCryptoAnnualSpot: Number(formData.investmentCryptoAnnualSpot),
            investmentOtherAnnualSpot: Number(formData.investmentOtherAnnualSpot),
            investmentStocksRate: Number(formData.investmentStocksRate) / 100,
            investmentTrustRate: Number(formData.investmentTrustRate) / 100,
            investmentBondsRate: Number(formData.investmentBondsRate) / 100,
            investmentIdecoRate: Number(formData.investmentIdecoRate) / 100,
            investmentCryptoRate: Number(formData.investmentCryptoRate) / 100,
            investmentOtherRate: Number(formData.investmentOtherRate) / 100,
            emergencyFund: Number(formData.emergencyFund) * 10000, // 万円 -> 円
            // Also need to pass annualRaiseRate and spouseAnnualRaiseRate from state
            annualRaiseRate: Number(annualRaiseRate), // This is already a number from state, but let's be explicit
            spouseAnnualRaiseRate: Number(spouseAnnualRaiseRate), // Same here
            parentCurrentAge: Number(formData.parentCurrentAge),
            parentCareStartAge: Number(formData.parentCareStartAge),
            pensionStartAge: Number(formData.pensionStartAge),
            pensionAmount: Number(formData.pensionAmount) * 10000, // 万円 -> 円
            postRetirementLivingCost: Number(formData.postRetirementLivingCost) * 10000, // 万円 -> 円
          }
        }),
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error(error);
      setResult({ error: '通信エラー' });
    }
    setLoading(false);
  };

  const effectiveSections = useMemo(() => {
    return sections.filter((section) => {
      if (section === 'ライフイベント - 結婚' && formData.familyComposition === '既婚') return false;
      return true;
    });
  }, [formData.familyComposition]);

  const [applianceReplacements, setApplianceReplacements] = useState([
    { name: '冷蔵庫', cycle: 10, cost: 15, firstReplacementAfterYears: 0 },
    { name: '洗濯機', cycle: 8, cost: 12, firstReplacementAfterYears: 0 },
    { name: 'エアコン', cycle: 10, cost: 10, firstReplacementAfterYears: 0 },
    { name: 'テレビ', cycle: 10, cost: 8, firstReplacementAfterYears: 0 },
    { name: '電子レンジ', cycle: 8, cost: 3, firstReplacementAfterYears: 0 },
    { name: '掃除機', cycle: 6, cost: 2, firstReplacementAfterYears: 0 },
  ]);

  const handleApplianceChange = (index: number, field: string, value: string) => {
    const newAppliances = [...applianceReplacements];
    newAppliances[index] = { ...newAppliances[index], [field]: value };
    setApplianceReplacements(newAppliances);
  };

  const addAppliance = () => {
    setApplianceReplacements([...applianceReplacements, { name: '', cycle: 0, cost: 0, firstReplacementAfterYears: 0 }]);
  };

  const handleRemoveAppliance = (index: number) => {
    setApplianceReplacements((prev) => prev.filter((_, i) => i !== index));
  };

  const displayTotalApplianceCost = useMemo(() => {
    return applianceReplacements
      .map((item) => Number(item.cost) || 0)
      .reduce((sum, cost) => sum + cost, 0)
  }, [applianceReplacements]);

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
    } else if (name.endsWith('Monthly')) {
      setFormData(prev => ({
        ...prev,
        monthlyInvestmentAmounts: {
          ...prev.monthlyInvestmentAmounts,
          [name]: value
        }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const goToNextSection = () => {
    if (currentSectionIndex < effectiveSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const totalExpenses = useMemo(() => {
    if (formData.expenseMethod !== '詳細') return 0;
    const fixed = [
      formData.housingCost,
      formData.utilitiesCost,
      formData.communicationCost,
      formData.carCost,
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
    if (formData.parentCareAssumption !== 'はい') return 0;
    return (
      (Number(formData.parentCareMonthlyCost) || 0) *
      (Number(formData.parentCareYears) || 0) *
      12
    );
  }, [formData.parentCareAssumption, formData.parentCareMonthlyCost, formData.parentCareYears]);

  const totalRetirementMonthly = useMemo(() => {
    return (
        (Number(formData.postRetirementLivingCost) || 0) - (Number(formData.pensionAmount) || 0)
    );
  }, [formData.postRetirementLivingCost, formData.pensionAmount]);

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
      (acc, val) => acc + Number(val),
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

  const displayEstimatedNetIncome = useMemo(() => {
    const personIncome = (Number(formData.mainIncome) || 0) + (Number(formData.sideJobIncome) || 0);
    const spouseIncome = (Number(formData.spouseMainIncome) || 0) + (Number(formData.spouseSideJobIncome) || 0);
    return getNetIncome(personIncome * 10000) + getNetIncome(spouseIncome * 10000);
  }, [
    formData.mainIncome,
    formData.spouseMainIncome,
    formData.sideJobIncome,
    formData.spouseSideJobIncome,
  ]);

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
    if (!window.history.state?.formInitialized) {
      window.history.pushState({ formInitialized: true, section: 0 }, "", "");
      setCurrentSectionIndex(0);
    }
  }, []);

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
      e.preventDefault();
      e.returnValue = ""; // Chrome, Firefox で有効
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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
                現在の家族構成は？
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
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
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
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
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
                  value={annualRaiseRate}
                  onChange={(e) => setAnnualRaiseRate(parseFloat(e.target.value))}
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
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
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
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
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
                    value={spouseAnnualRaiseRate}
                    onChange={(e) => setSpouseAnnualRaiseRate(parseFloat(e.target.value))}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseSideJobIncome">
                  配偶者の副業年間収入[万円]
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
            </div>

            <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostSimple">
                  生活費（住居費含む、貯蓄・投資除く）[円]
                </label>
                <input
                  type="number"
                  id="livingCostSimple"
                  name="livingCostSimple"
                  value={formData.livingCostSimple}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              </div>

            <div id="detailed-expense" className={`accordion-content ${formData.expenseMethod === '詳細' ? 'open' : ''}`}>
                <h3 className="text-lg font-semibold mb-2">固定費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housingCost">
                    住宅[円]
                  </label>
                  <input type="number" id="housingCost" name="housingCost" value={formData.housingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="utilitiesCost">
                    水道・光熱費[円]
                  </label>
                  <input type="number" id="utilitiesCost" name="utilitiesCost" value={formData.utilitiesCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="communicationCost">
                    通信費[円]
                  </label>
                  <input type="number" id="communicationCost" name="communicationCost" value={formData.communicationCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCost">
                    自動車（ローン含む）[円]
                  </label>
                  <input type="number" id="carCost" name="carCost" value={formData.carCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceCost">
                    保険[円]
                  </label>
                  <input type="number" id="insuranceCost" name="insuranceCost" value={formData.insuranceCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationCost">
                    教養・教育[円]
                  </label>
                  <input type="number" id="educationCost" name="educationCost" value={formData.educationCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherFixedCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherFixedCost" name="otherFixedCost" value={formData.otherFixedCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={0} />
                </div>

                <h3 className="text-lg font-semibold mb-2">変動費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foodCost">
                    食費[円]
                  </label>
                  <input type="number" id="foodCost" name="foodCost" value={formData.foodCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dailyNecessitiesCost">
                    日用品[円]
                  </label>
                  <input type="number" id="dailyNecessitiesCost" name="dailyNecessitiesCost" value={formData.dailyNecessitiesCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transportationCost">
                    交通費[円]
                  </label>
                  <input type="number" id="transportationCost" name="transportationCost" value={formData.transportationCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clothingBeautyCost">
                    衣類・美容[円]
                  </label>
                  <input type="number" id="clothingBeautyCost" name="clothingBeautyCost" value={formData.clothingBeautyCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socializingCost">
                    交際費[円]
                  </label>
                  <input type="number" id="socializingCost" name="socializingCost" value={formData.socializingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hobbyEntertainmentCost">
                    趣味・娯楽[円]
                  </label>
                  <input type="number" id="hobbyEntertainmentCost" name="hobbyEntertainmentCost" value={formData.hobbyEntertainmentCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherVariableCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherVariableCost" name="otherVariableCost" value={formData.otherVariableCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={0} />
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carFirstReplacementAfterYears">
                初回買い替えは今から何年後？[年]
              </label>
              <input type="number" id="carFirstReplacementAfterYears" name="carFirstReplacementAfterYears" value={formData.carFirstReplacementAfterYears} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carPrice">
                今後買い替える車の価格帯は？[万円]
              </label>
              <input type="number" id="carPrice" name="carPrice" value={formData.carPrice} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carReplacementFrequency">
                車を乗り換える頻度は？[年]
              </label>
              <input type="number" id="carReplacementFrequency" name="carReplacementFrequency" value={formData.carReplacementFrequency} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
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
            </div>
            {formData.carLoanUsage === 'はい' && (
              <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carLoanYears">
                  ローン年数は？
                </label>
                <select
                  id="carLoanYears"
                  name="carLoanYears"
                  value={formData.carLoanYears}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">選択してください</option>
                  <option value="3">3年</option>
                  <option value="5">5年</option>
                  <option value="7">7年</option>
                </select>
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
            </div>
            </>
            )}
          </div>
        );
      case 'ライフイベント - 家':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
              <img src="/form/Q4-home.png"></img>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">住まいに関する質問</h2>

            {/* 1. 住居形態の確認 */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の住まいはどちらですか？</label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input type="radio" className="custom-radio" name="housingType" value="賃貸" checked={formData.housingType === '賃貸'} onChange={handleRadioChange} required />
                  <span className="ml-2">賃貸</span>
                </label>
                <label className="inline-flex items-center mr-4">
                  <input type="radio" className="custom-radio" name="housingType" value="持ち家（ローン中）" checked={formData.housingType === '持ち家（ローン中）'} onChange={handleRadioChange} required />
                  <span className="ml-2">持ち家（ローン返済中）</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" className="custom-radio" name="housingType" value="持ち家（完済）" checked={formData.housingType === '持ち家（完済）'} onChange={handleRadioChange} required />
                  <span className="ml-2">持ち家（ローン完済）</span>
                </label>
              </div>
            </div>

            {/* 2. 分岐処理 */}
            {formData.housingType === '賃貸' && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">将来の住宅購入について</h3>
                <label className="block text-gray-700 text-sm font-bold mb-2">将来的に家を購入する予定はありますか？</label>
                <div className="mt-2">
                  <label className="inline-flex items-center mr-4">
                    <input type="radio" className="custom-radio" name="housePurchasePlanToggle" value="yes" onChange={() => setFormData({...formData, housePurchasePlan: { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 }})} />
                    <span className="ml-2">はい</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" className="custom-radio" name="housePurchasePlanToggle" value="no" onChange={() => setFormData({...formData, housePurchasePlan: null})} />
                    <span className="ml-2">いいえ</span>
                  </label>
                </div>

                {formData.housePurchasePlan && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">購入予定年齢</label>
                      <input type="number" name="housePurchasePlan.age" onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">購入金額[万円]</label>
                      <input type="number" name="housePurchasePlan.price" onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">頭金[万円]</label>
                      <input type="number" name="housePurchasePlan.downPayment" onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">ローン期間</label>
                      <input type="number" name="housePurchasePlan.loanYears" onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">ローン金利の想定</label>
                        <div className="mt-2">
                            <label className="inline-flex items-center mr-4">
                            <input type="radio" className="custom-radio" name="housingLoanInterestRateType" value="一般的な想定" checked={formData.housingLoanInterestRateType === '一般的な想定'} onChange={handleRadioChange} />
                            <span className="ml-2">一般的な想定（1.5%）</span>
                            </label>
                            <label className="inline-flex items-center">
                            <input type="radio" className="custom-radio" name="housingLoanInterestRateType" value="指定" checked={formData.housingLoanInterestRateType === '指定'} onChange={handleRadioChange} />
                            <span className="ml-2">自分で金利を指定する</span>
                            </label>
                        </div>
                    </div>
                    {formData.housingLoanInterestRateType === '指定' && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">ローン金利 (%)</label>
                            <input type="number" name="housingLoanInterestRate" value={formData.housingLoanInterestRate} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(formData.housingType === '持ち家（ローン中）' && formData.expenseMethod === '詳細') && (
                 <div className="mt-6">
                 <h3 className="text-lg font-semibold mb-2">現在の住宅ローンについて</h3>
                 <div>
                    <p>入力された住居費：{formData.housingCost || '未入力'}</p>
                    <p>これは月のローン返済額と一致していますか？</p>
                 </div>
                 <div className="mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input type="radio" className="custom-radio" name="housingCostConfirmation" value="yes" onChange={() => setFormData({...formData, housePurchasePlan: { age: 0, price: 0, downPayment: 0, loanYears: 0, interestRate: 0 }})} />
                      <span className="ml-2">はい</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" className="custom-radio" name="housingCostConfirmation" value="no" onChange={() => setFormData({...formData, housePurchasePlan: null})} />
                      <span className="ml-2">いいえ</span>
                    </label>
                  </div>
              </div>
            )}

            {(formData.housingType === '持ち家（ローン中）' && formData.expenseMethod === '簡単') && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">住宅ローンの補足情報</h3>
                <p className="text-sm text-gray-600 mb-4">簡単入力モードのため、生活費に含まれるローン返済額と残りの期間を教えてください。</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">ローン返済額（月額）[円]</label>
                        <input type="number" name="loanMonthlyPayment" value={formData.loanMonthlyPayment} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">ローン残存年数[年]</label>
                        <input type="number" name="loanRemainingYears" value={formData.loanRemainingYears} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                </div>
              </div>
            )}
            
            {(formData.housingType.startsWith('持ち家') || formData.housePurchasePlan) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">リフォーム・修繕の予定</h3>
                <label className="block text-gray-700 text-sm font-bold mb-2">将来的にリフォーム・修繕の予定はありますか？</label>
                <div className="mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input type="radio" className="custom-radio" name="renovationPlanToggle" value="yes" onChange={() => setFormData({...formData, houseRenovationPlans: [{ age: 0, cost: 150 }]})} />
                      <span className="ml-2">はい</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" className="custom-radio" name="renovationPlanToggle" value="no" onChange={() => setFormData({...formData, houseRenovationPlans: []})} />
                      <span className="ml-2">いいえ</span>
                    </label>
                </div>

                {formData.houseRenovationPlans.map((plan, index) => (
                  <div key={index} className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">初回リフォーム年齢</label>
                      <input type="number" name={`houseRenovationPlans[${index}].age`} value={plan.age} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">リフォーム費用[万円]</label>
                      <input type="number" name={`houseRenovationPlans[${index}].cost`} value={plan.cost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">リフォーム周期（任意）</label>
                      <input type="number" name={`houseRenovationPlans[${index}].cycleYears`} value={plan.cycleYears} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                    </div>
                  </div>
                ))}
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
            </div>
            <div className={`accordion-content ${formData.planToMarry === 'する' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="marriageAge">
                    結婚予定年齢は？[歳]
                  </label>
                  <input type="number" id="marriageAge" name="marriageAge" value={formData.marriageAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
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
            </div>
            <div className={`accordion-content ${formData.hasChildren === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfChildren">
                    子供の人数は？[人]
                  </label>
                  <input type="number" id="numberOfChildren" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstBornAge">
                    最初の子が生まれる予定年齢は？[歳]
                  </label>
                  <input type="number" id="firstBornAge" name="firstBornAge" value={formData.firstBornAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
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
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="公立中心">公立中心（〜1,000万円/人）</option>
                    <option value="公私混合">公私混合（〜1,600万円/人）</option>
                    <option value="私立中心">私立中心（〜2,000万円/人）</option>
                  </select>
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

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  {/* ヘッダー：5列を固定幅で定義 */}
                  <div className="grid grid-cols-[180px_160px_180px_200px_min-content] items-center gap-3 px-1 py-2 text-xs text-gray-600 font-semibold border-b">
                    <div>家電名</div>
                    <div>買い替えサイクル（年）</div>
                    <div>初回買い替え（年後）</div>
                    <div>1回あたりの費用（万円）</div>
                    <div className="text-right pr-1">操作</div>
                  </div>

                  {/* 行：ヘッダーと同じ5列テンプレートを使用 */}
                  {applianceReplacements.map((appliance, index) => (
                    <div key={index} className="grid grid-cols-[180px_160px_180px_200px_min-content] items-center gap-3 px-1 py-2 border-b">
                      <input
                        type="text"
                        placeholder="家電名"
                        value={appliance.name}
                        onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
                        className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                      <input
                        type="number"
                        placeholder="買い替えサイクル（年）"
                        value={appliance.cycle}
                        min={0}
                        onChange={(e) => handleApplianceChange(index, 'cycle', e.target.value)}
                        className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                      <input
                        type="number"
                        placeholder="初回買い替え（年後）"
                        value={appliance.firstReplacementAfterYears}
                        min={0}
                        onChange={(e) => handleApplianceChange(index, 'firstReplacementAfterYears', e.target.value)}
                        className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                      <input
                        type="number"
                        placeholder="1回あたりの費用（万円）"
                        value={appliance.cost}
                        min={0}
                        onChange={(e) => handleApplianceChange(index, 'cost', e.target.value)}
                        className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAppliance(index)}
                        className="text-red-500 hover:text-red-700 justify-self-end pr-1"
                        aria-label="この家電行を削除"
                        title="削除"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}

                  <div className="py-3">
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCurrentAge">
                親の現在の年齢[歳]
              </label>
              <input type="number" id="parentCurrentAge" name="parentCurrentAge" value={formData.parentCurrentAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCareStartAge">
                親の要介護開始年齢[歳]
              </label>
              <input type="number" id="parentCareStartAge" name="parentCareStartAge" value={formData.parentCareStartAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
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
            </div>
            <div className={`accordion-content ${formData.parentCareAssumption === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCareMonthlyCost">
                    介護費用の想定（月額）[万円]
                  </label>
                  <input type="number" id="parentCareMonthlyCost" name="parentCareMonthlyCost" value={formData.parentCareMonthlyCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={10} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCareYears">
                    介護期間の想定[年]
                  </label>
                  <input type="number" id="parentCareYears" name="parentCareYears" value={formData.parentCareYears} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={5} />
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="retirementAge">
                退職予定年齢は？[歳]
              </label>
              <input type="number" id="retirementAge" name="retirementAge" value={formData.retirementAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={65} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postRetirementLivingCost">
                老後の生活費（月額）[万円]
              </label>
              <input type="number" id="postRetirementLivingCost" name="postRetirementLivingCost" value={formData.postRetirementLivingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={25} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionStartAge">
                年金の想定受給開始年齢は？[歳]
              </label>
              <input type="number" id="pensionStartAge" name="pensionStartAge" value={formData.pensionStartAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={65} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionAmount">
                年金受給額（月額）[万円]
              </label>
              <input type="number" id="pensionAmount" name="pensionAmount" value={formData.pensionAmount} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={15} />
            </div>
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
              <input type="number" id="currentSavings" name="currentSavings" value={formData.currentSavings} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlySavings">
                毎月の貯蓄額は？[円]
              </label>
              <input type="number" id="monthlySavings" name="monthlySavings" value={formData.monthlySavings} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
          </div>
        );
      case '投資':
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
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="投資信託"
                assetKey="investmentTrust"
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="債券"
                assetKey="investmentBonds"
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="iDeCo"
                assetKey="investmentIdeco"
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="仮想通貨"
                assetKey="investmentCrypto"
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
              <AssetAccordion
                assetName="その他"
                assetKey="investmentOther"
                formData={formData}
                handleInputChange={handleInputChange}
                monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
              />
            </div>
          </div>
        );
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
              <input type="number" id="simulationPeriodAge" name="simulationPeriodAge" value={formData.simulationPeriodAge} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={90} />
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
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyFund">
                生活防衛資金（常に確保したい現金額）[万円]
              </label>
              <input type="number" id="emergencyFund" name="emergencyFund" value={formData.emergencyFund} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={300} />
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

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">入力完了</h2>
          <p className="mb-6">ありがとうございました。入力内容を確認してください。</p>
          <pre className="text-left bg-gray-100 p-4 rounded-md overflow-x-auto" style={{maxHeight: '400px'}}>
            {JSON.stringify(formData, null, 2)}
          </pre>
          <button
            type="button"
            className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleSimulate}
            disabled={loading}
          >
            {loading ? '送信中...' : 'シミュレーション実行'}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">シミュレーション結果</h3>
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-screen bg-gray-100">
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
        {renderFloatingBox(displayTotalIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && displayTotalIncome > 0, "年間収入総額")}
        {renderFloatingBox(displayEstimatedNetIncome, currentSectionIndex === effectiveSections.indexOf('現在の収入') && displayEstimatedNetIncome > 0, "推定手取り総額", "top-[5rem]")}
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
          "結婚費用総額"
        )}
        </div>
        <div className="relative flex">
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
                    onClick={() => setIsCompleted(true)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    完了
                  </button>
                )}
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
      {showBackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">どこに戻りますか？</h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(visitedSections).map(i => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setCurrentSectionIndex(i);
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
    </div>
  );
}
