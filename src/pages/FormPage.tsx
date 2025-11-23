﻿import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { YearlyData, SimulationInputParams } from '@/types/simulation-types';
import { createApiParams } from '@/utils/api-adapter';
import { computeNetAnnual } from '@/utils/financial';
import * as FC from '@/constants/financial_const';

import { useFormState } from '@/hooks/useFormState';

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
import RetirementIncomeSection from '@/components/form/RetirementIncomeSection';
import InvestmentSection from '@/components/form/InvestmentSection';
import SimulationSettingsSection from '@/components/form/SimulationSettingsSection';
import { MASTER_SECTIONS, SECTION_NAMES } from '@/constants/financial_const';

// --- Helper Components ---
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

export default function FormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    formData, setFormData, errors, showRestoreModal, isReady,
    restoreFormData, clearAndReady, handleInputChange, handleApplianceChange,
    addAppliance, handleRemoveAppliance, handleCarePlanChange, addCarePlan,
    removeCarePlan, handleRenovationPlanChange, totalExpenses, totalNetAnnualIncome,
    displayTotalApplianceCost, displayTotalIncome, totalMarriageCost, totalCareCost,
    totalRetirementMonthly, totalCarLoanCost, totalInvestment,
    estimatedAnnualLoanPayment, estimatedTotalLoanPayment, initialStateFromLocation,
    effectiveSections, validateSection
  } = useFormState();

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(() => new Set(initialStateFromLocation ? effectiveSections.map((_, i) => i) : [0]));
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<object | string | null>(null);
  const [showBackModal, setShowBackModal] = useState(false);

  useEffect(() => {
    const sectionIndexFromState = (location.state as { sectionIndex?: number })?.sectionIndex ?? 0;
    const originalSectionName = MASTER_SECTIONS[sectionIndexFromState];
    const effectiveIndex = effectiveSections.indexOf(originalSectionName);
    setCurrentSectionIndex(effectiveIndex > -1 ? effectiveIndex : 0);
  }, [effectiveSections, initialStateFromLocation, location.state]);

  useEffect(() => {
    if (initialStateFromLocation) {
      setIsCompleted(false);
    }
  }, [initialStateFromLocation]);

  const goToNextSection = useCallback(() => {
    if (validateSection(currentSectionIndex) && currentSectionIndex < effectiveSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  }, [currentSectionIndex, effectiveSections, validateSection]);

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
      if (!data.yearlyData || yearly.length === 0) {
        throw new Error('シミュレーション結果が空です');
      }
      setResult(null);
      navigate('/result', { state: { yearlyData: data.yearlyData, summary: data.summary, percentileData: data.percentileData, inputParams: params as SimulationInputParams, rawFormData: formData } });
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setResult({ error: error.message });
      } else {
        setResult({ error: '通信エラー' });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formData.expenseMethod === '詳細') {
      const element = document.getElementById('detailed-expense');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [formData.expenseMethod]);

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
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.formInitialized && typeof state.section === "number") {
        setCurrentSectionIndex(state.section);
      } else {
        window.history.pushState({ formInitialized: true, section: 0 }, "", "");
        setCurrentSectionIndex(0);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isReady && !initialStateFromLocation) {
        const cacheItem = {
          timestamp: Date.now(),
          data: formData,
        };
        localStorage.setItem('lifePlanFormDataCache', JSON.stringify(cacheItem));
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData, isReady, initialStateFromLocation]);

  const renderSection = () => {
    const sectionName = effectiveSections[currentSectionIndex];
    const components: { [key: string]: React.ReactElement } = {
      [SECTION_NAMES.FAMILY]: <FamilySection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.INCOME]: <IncomeSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.EXPENSE]: <ExpenseSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.CAR]: <CarLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.HOUSING]: <HomeLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} setFormData={setFormData} handleRenovationPlanChange={handleRenovationPlanChange} />,
      [SECTION_NAMES.MARRIAGE]: <MarriageLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.CHILDREN]: <ChildrenLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.LIVING]: <LivingLifeEventSection formData={formData} handleApplianceChange={handleApplianceChange} errors={errors} addAppliance={addAppliance} handleRemoveAppliance={handleRemoveAppliance} />,
      [SECTION_NAMES.PARENT_CARE]: <ParentCareLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} handleCarePlanChange={handleCarePlanChange} addCarePlan={addCarePlan} removeCarePlan={removeCarePlan} totalCareCost={totalCareCost} />,
      [SECTION_NAMES.RETIREMENT_INCOME]: <RetirementIncomeSection formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} errors={errors} />,
      [SECTION_NAMES.RETIREMENT_PLAN]: <RetirementLifeEventSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.SAVINGS]: <SavingsSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
      [SECTION_NAMES.INVESTMENT]: <InvestmentSection formData={formData} setFormData={setFormData} />,
      [SECTION_NAMES.SIMULATION_SETTINGS]: <SimulationSettingsSection formData={formData} handleInputChange={handleInputChange} errors={errors} />,
    };
    return components[sectionName] || null;
  };

  const progress = ((currentSectionIndex + 1) / effectiveSections.length) * 100;

  const isHouseLoanSection = effectiveSections[currentSectionIndex] === SECTION_NAMES.HOUSING;
  const shouldShowLoanBox = isHouseLoanSection &&
    (
      formData.housingLoanStatus === 'これから借りる' ||
      formData.housingLoanStatus === 'すでに返済中' ||
      formData.housePurchasePlan !== null ||
      (formData.housingType === '持ち家（ローン中）' && Number(formData.loanMonthlyPayment) > 0 && Number(formData.loanRemainingYears) > 0)
    );

  function renderFloatingBox(amount: number, shouldShow: boolean, label: string, topClass: string = 'top-[1.5rem]') {
    return (
      <div className={"absolute " + topClass + " inset-x-0 z-50 transition-opacity duration-500 " + (shouldShow ? "opacity-100" : "opacity-0 pointer-events-none")}>
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
    const events: { age: number, title: string, details: { label: string, value: React.ReactNode }[] }[] = [];
    const selfGrossIncome = n(formData.mainIncome) * FC.YEN_PER_MAN + n(formData.sideJobIncome) * FC.YEN_PER_MAN;
    const selfNetIncome = computeNetAnnual(selfGrossIncome);
    const currentSpouseGrossIncome = formData.familyComposition === '既婚' ? (n(formData.spouseMainIncome) * 10000 + n(formData.spouseSideJobIncome) * 10000) : 0;
    const currentTotalGrossAnnualIncome = selfGrossIncome + currentSpouseGrossIncome;
    const monthlyLivingExpense = formData.expenseMethod === '簡単' ? n(formData.livingCostSimple) : totalExpenses;
    const currentCarLoanMonthly = formData.carCurrentLoanInPayment === 'yes' ? n(formData.carCurrentLoanMonthly) : 0;
    const currentHousingMonthly = formData.housingType === '賃貸' ? n(formData.currentRentLoanPayment) : (formData.housingType === '持ち家（ローン中）' ? n(formData.loanMonthlyPayment) : 0);
    const currentCareMonthly = formData.parentCareAssumption === 'はい' ? formData.parentCarePlans.reduce((sum, plan) => {
      const hasStarted = n(plan.parentCurrentAge) >= n(plan.parentCareStartAge);
      return hasStarted ? sum + n(plan.monthly10kJPY) * FC.YEN_PER_MAN : sum;
    }, 0) : 0;

    let currentEducationMonthly = 0;
    if (formData.hasChildren === 'はい') {
      const educationCostByStage = {
        '公立中心': { preschool: 22, elementary: 32, middle: 49, high: 46, university: 104 },
        '公私混合': { preschool: 22, elementary: 32, middle: 49, high: 107, university: 250 },
        '私立中心': { preschool: 80, elementary: 160, middle: 140, high: 107, university: 250 },
      };
      const pattern = formData.educationPattern as keyof typeof educationCostByStage;
      const costStages = educationCostByStage[pattern];
      for (let i = 0; i < n(formData.numberOfChildren); i++) {
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

    const currentPayments = [
      { label: '住居費', value: currentHousingMonthly },
      { label: '車のローン', value: currentCarLoanMonthly },
      { label: '介護費用', value: currentCareMonthly },
      { label: '教育費(想定)', value: currentEducationMonthly },
    ].filter(p => p.value > 0);

    const totalMonthlyExpense = monthlyLivingExpense + currentHousingMonthly + currentCarLoanMonthly + currentCareMonthly + currentEducationMonthly;
    const currentSpouseNetIncome = formData.familyComposition === '既婚' ? computeNetAnnual(currentSpouseGrossIncome) : 0;
    const currentTotalNetAnnualIncome = selfNetIncome + currentSpouseNetIncome;
    let dynamicTotalNetIncome = currentTotalNetAnnualIncome; // イベントごとに更新される動的な世帯年収

    if (formData.planToMarry === 'する') {
      let spouseIncomeForSim = 0;
      if (formData.spouseIncomePattern === 'パート') spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.PART_TIME;
      else if (formData.spouseIncomePattern === '正社員') spouseIncomeForSim = FC.SPOUSE_INCOME_PATTERNS.FULL_TIME;
      else if (formData.spouseIncomePattern === 'カスタム') spouseIncomeForSim = n(formData.spouseCustomIncome) * FC.YEN_PER_MAN;
      const spouseNetIncomeAfterMarriage = computeNetAnnual(spouseIncomeForSim);
      dynamicTotalNetIncome = selfNetIncome + spouseNetIncomeAfterMarriage; // 結婚後の年収で更新
      events.push({
        age: n(formData.marriageAge),
        title: '💒 結婚',
        details: [
          { label: '結婚費用', value: formatYen(totalMarriageCost) },
          { label: '配偶者の収入が加算', value: `+ ${formatYen(spouseNetIncomeAfterMarriage)} /年` },
          { label: '更新後の世帯手取り年収', value: formatYen(dynamicTotalNetIncome) },
          { label: '月々の生活費', value: `${formatYen(n(formData.livingCostAfterMarriage))}` },
          { label: '月々の住居費', value: `${formatYen(n(formData.housingCostAfterMarriage))}` },
        ]
      });
    }

    if (formData.hasChildren === 'はい') {
      const educationCosts = { '公立中心': 1000, '公私混合': 1600, '私立中心': 2000 };
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

    if (formData.parentCareAssumption === 'はい') {
      formData.parentCarePlans.forEach(plan => {
        const startAge = n(formData.personAge) + (n(plan.parentCareStartAge) - n(plan.parentCurrentAge));
        const endAge = startAge + n(plan.years);
        const annualCost = n(plan.monthly10kJPY) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;
        events.push({
          age: startAge,
          title: '👨‍👩‍👧‍👦 親の介護開始',
          details: [{ label: '年間介護費用', value: `+ ${formatYen(annualCost)} /年 (〜${endAge}歳)` }],
        });
      });
    }

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

    // 定年再雇用
    if (formData.assumeReemployment) {
      events.push({
        age: 60,
        title: '👤 あなたの定年再雇用 開始',
        details: [{ label: '給与収入が減少', value: `${formData.reemploymentReductionRate}%減` }],
      });
    }
    if (formData.spouseAssumeReemployment) {
      const personAge = n(formData.personAge);
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = 60 - spouseBaseAge;
      const eventAgeOnPersonTimeline = personAge + ageDiff;
      events.push({
        age: eventAgeOnPersonTimeline,
        title: '👤 パートナーの定年再雇用 開始',
        details: [{ label: '給与収入が減少', value: `${formData.spouseReemploymentReductionRate}%減` }],
      });
    }


    // 退職金
    if (formData.retirementIncome && n(formData.retirementIncome.age) > 0) {
      events.push({
        age: n(formData.retirementIncome.age),
        title: '💼 あなたの退職金受取',
        details: [
          { label: '受取額', value: formatManYen(formData.retirementIncome.amount) },
          { label: '勤続年数', value: `${formData.retirementIncome.yearsOfService} 年` },
        ]
      });
    }
    if (formData.spouseRetirementIncome && n(formData.spouseRetirementIncome.age) > 0) {
      // パートナーのイベント発生年齢を、本人の年齢タイムラインに換算する
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = n(formData.spouseRetirementIncome.age) - spouseBaseAge;
      const eventAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
      events.push({
        age: eventAgeOnPersonTimeline,
        title: '💼 パートナーの退職金受取',
        details: [
          { label: '受取額', value: formatManYen(formData.spouseRetirementIncome.amount) },
          { label: '勤続年数', value: `${formData.spouseRetirementIncome.yearsOfService} 年` },
        ]
      });
    }

    // 個人年金
    const processPensionPlans = (plans: typeof formData.personalPensionPlans, person: string) => {
      const isSpouse = person === 'パートナー';
      const baseAge = isSpouse ? (formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage)) : n(formData.personAge);
      const personCurrentAge = n(formData.personAge);

      plans?.forEach(plan => {
        const ageDiff = n(plan.startAge) - baseAge;
        const eventAgeOnPersonTimeline = isSpouse ? personCurrentAge + ageDiff : n(plan.startAge);

        if (plan.type === 'lumpSum') {
          events.push({
            age: eventAgeOnPersonTimeline,
            title: `💰 ${person}の個人年金（一括受取）`,
            details: [{ label: '受取総額', value: formatManYen(plan.amount) }]
          });
        } else {
          events.push({
            age: eventAgeOnPersonTimeline,
            title: `💰 ${person}の個人年金（受給開始）`,
            details: [
              { label: '年間受給額', value: formatManYen(plan.amount) },
              { label: '受給期間', value: plan.type === 'fixedTerm' ? `${plan.duration}年間` : '終身' }
            ]
          });
        }
      });
    };

    // その他一時金
    const processOtherLumpSums = (lumpSums: typeof formData.otherLumpSums, person: string) => {
      const isSpouse = person === 'パートナー';
      const baseAge = isSpouse ? (formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage)) : n(formData.personAge);
      const personCurrentAge = n(formData.personAge);

      lumpSums?.forEach(item => {
        const ageDiff = n(item.age) - baseAge;
        const eventAgeOnPersonTimeline = isSpouse ? personCurrentAge + ageDiff : n(item.age);
        events.push({
          age: eventAgeOnPersonTimeline,
          title: `💰 ${person}のその他一時金受取（${item.name || '名称未設定'}）`,
          details: [{ label: '受取額', value: formatManYen(item.amount) }]
        });
      });
    };
    processPensionPlans(formData.personalPensionPlans, 'あなた');
    processPensionPlans(formData.spousePersonalPensionPlans, 'パートナー');
    processOtherLumpSums(formData.otherLumpSums, 'あなた');
    processOtherLumpSums(formData.spouseOtherLumpSums, 'パートナー');

    const retirementAge = n(formData.retirementAge);
    const pensionStartAge = n(formData.pensionStartAge);
    const pensionNetIncome = n(formData.pensionAmount) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;

    // イベントを時系列でソートするために一旦配列に格納
    const incomeEvents: { age: number, title: string, details: { label: string, value: React.ReactNode }[], incomeChange: number, type: 'self-retire' | 'self-pension' | 'spouse-retire' | 'spouse-pension' }[] = [];

    if (selfNetIncome > 0) {
      incomeEvents.push({
        age: retirementAge,
        title: `👤 あなたの${formData.assumeReemployment ? '（完全）' : ''}退職`,
        details: [{ label: '給与収入が停止', value: `手取り年収が減少します` }],
        incomeChange: -selfNetIncome,
        type: 'self-retire',
      });
    }

    if (pensionNetIncome > 0) {
      incomeEvents.push({
        age: pensionStartAge,
        title: '👤 あなたの年金受給開始',
        details: [{ label: '年金受給開始', value: `+ ${formatYen(pensionNetIncome)} /年` }],
        incomeChange: pensionNetIncome,
        type: 'self-pension',
      });
    }

    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      const personAge = n(formData.personAge);
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const spouseRetirementTargetAge = n(formData.spouseRetirementAge);
      const spousePensionStartTargetAge = n(formData.spousePensionStartAge);
      const spousePensionNetIncome = n(formData.spousePensionAmount) * FC.YEN_PER_MAN * FC.MONTHS_PER_YEAR;
      const currentSpouseNetIncome = formData.familyComposition === '既婚' ? computeNetAnnual((n(formData.spouseMainIncome) + n(formData.spouseSideJobIncome)) * FC.YEN_PER_MAN) : 0;

      const spouseBaseNetIncome = (() => {
        if (formData.planToMarry === 'する' && formData.familyComposition !== '既婚') {
          if (formData.spouseIncomePattern === 'パート') return computeNetAnnual(FC.SPOUSE_INCOME_PATTERNS.PART_TIME);
          if (formData.spouseIncomePattern === '正社員') return computeNetAnnual(FC.SPOUSE_INCOME_PATTERNS.FULL_TIME);
          if (formData.spouseIncomePattern === 'カスタム') return computeNetAnnual(n(formData.spouseCustomIncome) * FC.YEN_PER_MAN);
          return 0;
        }
        return currentSpouseNetIncome;
      })();

      const retirementAgeDiff = spouseRetirementTargetAge - spouseBaseAge;
      const spouseRetirementAgeOnPersonTimeline = personAge + retirementAgeDiff;

      const pensionAgeDiff = spousePensionStartTargetAge - spouseBaseAge;
      const spousePensionStartAgeOnPersonTimeline = personAge + pensionAgeDiff;

      if (spouseBaseNetIncome > 0) {
        incomeEvents.push({
          age: spouseRetirementAgeOnPersonTimeline,
          title: `パートナーの${formData.spouseAssumeReemployment ? '（完全）' : ''}退職`,
          details: [{ label: '給与収入が停止', value: `手取り年収が減少します` }],
          incomeChange: -spouseBaseNetIncome,
          type: 'spouse-retire',
        });
      }

      if (spousePensionNetIncome > 0) {
        incomeEvents.push({
          age: spousePensionStartAgeOnPersonTimeline,
          title: 'パートナーの年金受給開始',
          details: [{ label: '年金受給開始', value: `+ ${formatYen(spousePensionNetIncome)} /年` }],
          incomeChange: spousePensionNetIncome,
          type: 'spouse-pension',
        });
      }
    }

    // 収入イベントを時系列でソートし、動的に年収を計算してイベントリストに追加
    incomeEvents.sort((a, b) => a.age - b.age);
    incomeEvents.forEach(event => {
      dynamicTotalNetIncome += event.incomeChange;
      events.push({
        age: event.age,
        title: event.title,
        details: [
          ...event.details,
          { label: '更新後の世帯手取り年収', value: formatYen(dynamicTotalNetIncome) }
        ]
      });
    });

    events.sort((a, b) => a.age - b.age);

    let summaryAnnualExpense = 0;
    if (formData.expenseMethod === '簡単') {
      summaryAnnualExpense += n(formData.livingCostSimple) * FC.MONTHS_PER_YEAR;
    } else {
      summaryAnnualExpense += totalExpenses * FC.MONTHS_PER_YEAR;
    }
    if (formData.housingType === '賃貸') {
      summaryAnnualExpense += n(formData.currentRentLoanPayment) * FC.MONTHS_PER_YEAR;
    } else if (formData.housingType === '持ち家（ローン中）') {
      summaryAnnualExpense += n(formData.loanMonthlyPayment) * FC.MONTHS_PER_YEAR;
    }
    if (formData.carCurrentLoanInPayment === 'yes') {
      summaryAnnualExpense += n(formData.carCurrentLoanMonthly) * FC.MONTHS_PER_YEAR;
    }

    return (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 space-y-6">
          <ConfirmationSection title="👤 プロフィール">
            <ConfirmationItem label="家族構成" value={formData.familyComposition} />
            <ConfirmationItem label="あなたの年齢" value={`${n(formData.personAge)} 歳`} />
            {formData.familyComposition === '既婚' && <ConfirmationItem label="配偶者の年齢" value={`${n(formData.spouseAge)} 歳`} />}
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
            <ConfirmationItem label="総資産" value={formatYen(n(formData.currentSavings) * FC.YEN_PER_MAN + totalInvestment.current)} />
            <ConfirmationItem label="預貯金" value={formatManYen(formData.currentSavings)} />
            <ConfirmationItem label="投資額" value={formatYen(totalInvestment.current)} />
          </ConfirmationSection>
        </div>
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
              {events.map((event, index) => (
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
              ))}
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
              <button onClick={clearAndReady} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">いいえ</button>
              <button onClick={restoreFormData} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">はい</button>
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
                      setIsCompleted(false);
                      setShowBackModal(false);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {effectiveSections[i]}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowBackModal(false)} className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline">キャンセル</button>
          </div>
        </div>
      )}

      <div className={`flex justify-center w-full min-h-screen bg-gray-100 ${!isReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}>
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg md:max-w-5xl overflow-visible relative">
          <div id="floating-header" className="fixed left-0 right-0 z-50 transition-opacity duration-500">
            <div className="relative w-full bg-gray-300 h-4 rounded-t-lg">
              <div className="bg-blue-500 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{Math.round(progress)}%</div>
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
            {renderFloatingBox(totalMarriageCost, currentSectionIndex === effectiveSections.indexOf('ライフイベント - 結婚') && totalMarriageCost > 0, "結婚費用総額")}
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
                  <button type="button" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline" onClick={() => setShowBackModal(true)} disabled={loading}>修正する</button>
                  <button type="button" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline" onClick={handleSimulate} disabled={loading}>{loading ? '実行中...' : 'この内容でシミュレーションを実行'}</button>
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
                      <button onClick={() => setShowBackModal(true)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">戻る</button>
                    )}
                    {currentSectionIndex < effectiveSections.length - 1 ? (
                      <button onClick={goToNextSection} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">次へ</button>
                    ) : (
                      <button onClick={() => { if (validateSection(currentSectionIndex)) { setIsCompleted(true); } }} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400" disabled={Object.keys(errors).length > 0}>完了</button>
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
