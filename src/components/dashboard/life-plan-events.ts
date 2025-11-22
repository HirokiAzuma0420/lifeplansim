import type { FormDataState } from '../../types/form-types';
import { n } from '../../utils/financial';

export interface TimelineEvent {
  age: number;
  iconKey: string;
  title: string;
  details: { label: string; value: string }[];
}

// TODO: 既存のLifePlanTimeline内ロジックと統合して重複を排除する
export const extractLifePlanEvents = (rawFormData: FormDataState): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const formData = rawFormData;

  if (formData.planToMarry === 'する') {
    events.push({
      age: n(formData.marriageAge),
      iconKey: 'marriage',
      title: '結婚',
      details: [
        {
          label: '結婚関連費用',
          value: `${((n(formData.engagementCost) + n(formData.weddingCost) + n(formData.honeymoonCost) + n(formData.newHomeMovingCost)) * 10000).toLocaleString()} 円`,
        },
      ],
    });
  }

  if (formData.hasChildren === 'はい') {
    for (let i = 0; i < n(formData.numberOfChildren); i++) {
      const birthAge = n(formData.firstBornAge) + i * 3;
      events.push({
        age: birthAge,
        iconKey: 'child',
        title: `${i + 1}人目の出産`,
        details: [{ label: '進学想定', value: `${birthAge + 22}歳まで` }],
      });
    }
  }

  if (formData.housePurchasePlan) {
    events.push({
      age: n(formData.housePurchasePlan.age),
      iconKey: 'house',
      title: '住宅購入',
      details: [
        { label: '物件価格', value: `${Math.round(n(formData.housePurchasePlan.price) * 10000).toLocaleString()} 円` },
        { label: '頭金', value: `${Math.round(n(formData.housePurchasePlan.downPayment) * 10000).toLocaleString()} 円` },
        { label: 'ローン返済期間', value: `${formData.housePurchasePlan.loanYears}年` },
      ],
    });
  }

  formData.houseRenovationPlans.forEach((plan, index) => {
    if (n(plan.age) > 0) {
      events.push({
        age: n(plan.age),
        iconKey: 'renovation',
        title: `リフォーム (${index + 1})`,
        details: [
          { label: '費用', value: `${Math.round(n(plan.cost) * 10000).toLocaleString()} 円` },
          { label: '発生頻度', value: plan.cycleYears ? `${plan.cycleYears}年ごと` : '単発' },
        ],
      });
    }
  });

  if (formData.carPurchasePlan === 'yes' && n(formData.carFirstReplacementAfterYears) > 0) {
    events.push({
      age: n(formData.personAge) + n(formData.carFirstReplacementAfterYears),
      iconKey: 'car',
      title: '自動車購入',
      details: [
        { label: '価格', value: `${Math.round(n(formData.carPrice) * 10000).toLocaleString()} 円` },
        { label: '買い替え頻度', value: `${formData.carReplacementFrequency}年ごと` },
      ],
    });
  }

  if (formData.parentCareAssumption === 'はい') {
    formData.parentCarePlans.forEach(plan => {
      const startAge = n(formData.personAge) + (n(plan.parentCareStartAge) - n(plan.parentCurrentAge));
      events.push({
        age: startAge,
        iconKey: 'care',
        title: '親の介護開始',
        details: [{ label: '月額費用', value: `${Math.round(n(plan.monthly10kJPY) * 10000).toLocaleString()} 円` }],
      });
    });
  }

  if (formData.assumeReemployment) {
    events.push({
      age: 60,
      iconKey: 'reemployment',
      title: '再雇用開始',
      details: [{ label: '収入減少率', value: `${formData.reemploymentReductionRate}%` }],
    });
  }
  if (formData.spouseAssumeReemployment) {
    const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
    const ageDiff = 60 - spouseBaseAge;
    const eventAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
    events.push({
      age: eventAgeOnPersonTimeline,
      iconKey: 'reemployment',
      title: '配偶者の再雇用開始',
      details: [{ label: '収入減少率', value: `${formData.spouseReemploymentReductionRate}%` }],
    });
  }

  events.push({
    age: n(formData.retirementAge),
    iconKey: 'retirement',
    title: `本人の退職${formData.assumeReemployment ? '（再雇用あり）' : ''}`,
    details: [{ label: '退職', value: '' }],
  });
  if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
    const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
    const ageDiff = n(formData.spouseRetirementAge) - spouseBaseAge;
    const spouseRetirementAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
    events.push({
      age: spouseRetirementAgeOnPersonTimeline,
      iconKey: 'retirement',
      title: `配偶者の退職${formData.spouseAssumeReemployment ? '（再雇用あり）' : ''}`,
      details: [{ label: '退職', value: '' }],
    });
  }

  events.push({
    age: n(formData.pensionStartAge),
    iconKey: 'pension',
    title: '本人の公的年金 受給開始',
    details: [{ label: '年間受給額', value: `${Math.round(n(formData.pensionAmount) * 12 * 10000).toLocaleString()} 円` }],
  });
  if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
    const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
    const ageDiff = n(formData.spousePensionStartAge) - spouseBaseAge;
    const spousePensionStartAgeOnPersonTimeline = n(formData.personAge) + ageDiff;

    events.push({
      age: spousePensionStartAgeOnPersonTimeline,
      iconKey: 'pension',
      title: '配偶者の公的年金 受給開始',
      details: [{ label: '年間受給額', value: `${Math.round(n(formData.spousePensionAmount) * 12 * 10000).toLocaleString()} 円` }],
    });
  }

  if (formData.retirementIncome && n(formData.retirementIncome.age) > 0) {
    events.push({
      age: n(formData.retirementIncome.age),
      iconKey: 'lump-sum',
      title: '退職金 受給開始',
      details: [{ label: '受給額', value: `${Math.round(n(formData.retirementIncome.amount) * 10000).toLocaleString()} 円` }],
    });
  }

  return events.sort((a, b) => a.age - b.age);
};

export const chunkEvents = (events: TimelineEvent[], perPage: number): TimelineEvent[][] => {
  const result: TimelineEvent[][] = [];
  for (let i = 0; i < events.length; i += perPage) {
    result.push(events.slice(i, i + perPage));
  }
  return result;
};
