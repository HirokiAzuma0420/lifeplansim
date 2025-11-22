import type { SimulationInputParams } from '../../types/simulation-types';

export type AssumptionItem = {
  category: string;
  label: string;
  value: string;
};

const formatYen = (value?: number) => `¥${Math.round(value ?? 0).toLocaleString('ja-JP')}`;
const formatPercent = (value?: number) => `${((value ?? 0) * 100).toFixed(2)}%`;

export const buildAssumptionItems = (inputParams: SimulationInputParams): AssumptionItem[] => {
  const items: AssumptionItem[] = [];

  // 基本情報
  items.push({ category: '基本情報', label: '現在年齢', value: `${inputParams.initialAge} 歳` });
  if (inputParams.spouseInitialAge !== undefined) {
    items.push({ category: '基本情報', label: '配偶者年齢', value: `${inputParams.spouseInitialAge} 歳` });
  }
  items.push({ category: '基本情報', label: 'シミュレーション終了年齢', value: `${inputParams.endAge} 歳` });
  items.push({ category: '基本情報', label: '退職予定年齢', value: `${inputParams.retirementAge} 歳` });
  if (inputParams.spouseRetirementAge !== undefined) {
    items.push({ category: '基本情報', label: '配偶者退職年齢', value: `${inputParams.spouseRetirementAge} 歳` });
  }

  // 収入・貯蓄
  items.push({ category: '収入・貯蓄', label: '本人年収（主）', value: formatYen(inputParams.mainJobIncomeGross) });
  items.push({ category: '収入・貯蓄', label: '本人年収（副）', value: formatYen(inputParams.sideJobIncomeGross) });
  if (inputParams.spouseMainJobIncomeGross !== undefined) {
    items.push({ category: '収入・貯蓄', label: '配偶者年収（主）', value: formatYen(inputParams.spouseMainJobIncomeGross) });
  }
  if (inputParams.spouseSideJobIncomeGross !== undefined) {
    items.push({ category: '収入・貯蓄', label: '配偶者年収（副）', value: formatYen(inputParams.spouseSideJobIncomeGross) });
  }
  items.push({ category: '収入・貯蓄', label: '現在の預金額', value: formatYen(inputParams.currentSavingsJPY) });
  items.push({ category: '収入・貯蓄', label: '毎月の積立額', value: formatYen(inputParams.monthlySavingsJPY) });

  // 生活費
  if (inputParams.expenseMode === 'simple') {
    items.push({ category: '生活費', label: '年間生活費（シンプル）', value: formatYen(inputParams.livingCostSimpleAnnual) });
  } else {
    items.push({ category: '生活費', label: '年間固定費（詳細）', value: formatYen(inputParams.detailedFixedAnnual) });
    items.push({ category: '生活費', label: '年間変動費（詳細）', value: formatYen(inputParams.detailedVariableAnnual) });
  }

  // 住宅
  if (inputParams.housing) {
    items.push({ category: '住宅', label: '住居形態', value: inputParams.housing.type });
    if (inputParams.housing.rentMonthlyJPY !== undefined) {
      items.push({ category: '住宅', label: '家賃（月額）', value: formatYen(inputParams.housing.rentMonthlyJPY) });
    }
    if (inputParams.housing.currentLoan?.monthlyPaymentJPY !== undefined) {
      items.push({ category: '住宅', label: '住宅ローン（月額）', value: formatYen(inputParams.housing.currentLoan.monthlyPaymentJPY) });
    }
    if (inputParams.housing.purchasePlan) {
      if (inputParams.housing.purchasePlan.age !== undefined) {
        items.push({ category: '住宅', label: '住宅購入予定年齢', value: `${inputParams.housing.purchasePlan.age} 歳` });
      }
      items.push({ category: '住宅', label: '住宅購入価格', value: formatYen(inputParams.housing.purchasePlan.priceJPY) });
      items.push({ category: '住宅', label: '頭金', value: formatYen(inputParams.housing.purchasePlan.downPaymentJPY) });
      items.push({ category: '住宅', label: 'ローン期間', value: `${inputParams.housing.purchasePlan.years} 年` });
      if (inputParams.housing.purchasePlan.rate !== undefined) {
        items.push({ category: '住宅', label: 'ローン金利', value: formatPercent(inputParams.housing.purchasePlan.rate) });
      }
    }
    if (inputParams.housing.renovations) {
      inputParams.housing.renovations.forEach((reno, idx) => {
        items.push({
          category: '住宅リフォーム',
          label: `リフォーム${idx + 1}（年齢: ${reno.age} 歳）`,
          value: `${formatYen(reno.costJPY)} / 周期: ${reno.cycleYears ? `${reno.cycleYears}年ごと` : '単発'}`,
        });
      });
    }
  }

  // 自動車
  if (inputParams.car) {
    items.push({ category: '自動車', label: '車両価格', value: formatYen(inputParams.car.priceJPY) });
    items.push({ category: '自動車', label: '初回買い替え（年）', value: `${inputParams.car.firstAfterYears} 年後` });
    items.push({ category: '自動車', label: '買い替え頻度', value: `${inputParams.car.frequencyYears} 年ごと` });
    items.push({ category: '自動車', label: 'ローン利用', value: inputParams.car.loan.use ? '利用する' : '利用しない' });
    if (inputParams.car.loan.use && inputParams.car.loan.years !== undefined) {
      items.push({ category: '自動車', label: '自動車ローン期間', value: `${inputParams.car.loan.years} 年` });
    }
  }

  // 退職後・年金
  items.push({ category: '退職後', label: '退職後生活費（月額10k）', value: `${inputParams.postRetirementLiving10kJPY} 万円` });
  items.push({ category: '年金', label: '年金開始年齢', value: `${inputParams.pensionStartAge} 歳` });
  items.push({ category: '年金', label: '年金受給額（月額10k）', value: `${inputParams.pensionMonthly10kJPY} 万円` });
  if (inputParams.spousePensionStartAge !== undefined) {
    items.push({ category: '年金', label: '配偶者年金開始年齢', value: `${inputParams.spousePensionStartAge} 歳` });
  }
  if (inputParams.spousePensionAmount !== undefined) {
    items.push({ category: '年金', label: '配偶者年金額（月額10k）', value: `${inputParams.spousePensionAmount} 万円` });
  }

  // 退職金
  if (inputParams.retirementIncome) {
    items.push({ category: '退職金', label: '退職金受給年齢', value: `${inputParams.retirementIncome.age} 歳` });
    items.push({ category: '退職金', label: '退職金額', value: formatYen(inputParams.retirementIncome.amountJPY) });
    items.push({ category: '退職金', label: '勤続年数', value: `${inputParams.retirementIncome.yearsOfService} 年` });
  }
  if (inputParams.spouseRetirementIncome) {
    items.push({ category: '退職金', label: '配偶者退職金受給年齢', value: `${inputParams.spouseRetirementIncome.age} 歳` });
    items.push({ category: '退職金', label: '配偶者退職金額', value: formatYen(inputParams.spouseRetirementIncome.amountJPY) });
    items.push({ category: '退職金', label: '配偶者勤続年数', value: `${inputParams.spouseRetirementIncome.yearsOfService} 年` });
  }

  // 個人年金
  if (inputParams.personalPensionPlans) {
    inputParams.personalPensionPlans.forEach((plan, idx) => {
      items.push({
        category: '個人年金',
        label: `本人個人年金${idx + 1}`,
        value: `開始: ${plan.startAge} 歳 / 金額: ${formatYen(plan.amountJPY)} / 種別: ${plan.type}${plan.duration ? ` (${plan.duration}年)` : ''}`,
      });
    });
  }
  if (inputParams.spousePersonalPensionPlans) {
    inputParams.spousePersonalPensionPlans.forEach((plan, idx) => {
      items.push({
        category: '個人年金',
        label: `配偶者個人年金${idx + 1}`,
        value: `開始: ${plan.startAge} 歳 / 金額: ${formatYen(plan.amountJPY)} / 種別: ${plan.type}${plan.duration ? ` (${plan.duration}年)` : ''}`,
      });
    });
  }

  // 投資・リスク
  if ((inputParams.expectedReturn ?? 0) !== 0) {
    items.push({ category: '投資・リスク', label: '期待利回り', value: formatPercent(inputParams.expectedReturn) });
  }
  items.push({ category: '投資・リスク', label: '緊急予備資金', value: formatYen(inputParams.emergencyFundJPY) });
  items.push({ category: '投資・リスク', label: 'ストレステスト', value: inputParams.stressTest.enabled ? '有効' : '無効' });
  items.push({ category: '投資・リスク', label: '利回りシナリオ', value: inputParams.interestScenario });

  // 投資商品
  if (inputParams.products && inputParams.products.length > 0) {
    inputParams.products.forEach((p, idx) => {
      items.push({
        category: '投資商品',
        label: `商品${idx + 1}（口座: ${p.account}）`,
        value: `評価額: ${formatYen(p.currentJPY)} / 月額積立: ${formatYen(p.recurringJPY)} / スポット: ${formatYen(p.spotJPY)} / 想定利回り: ${formatPercent(p.expectedReturn)}`,
      });
    });
  }

  return items;
};

export const chunkAssumptions = (items: AssumptionItem[], perPage: number): AssumptionItem[][] => {
  const result: AssumptionItem[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    result.push(items.slice(i, i + perPage));
  }
  return result;
};
