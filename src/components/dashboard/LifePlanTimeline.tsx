import React from 'react';
import type { FormDataState } from '../../types/form-types';
import type { YearlyData } from '../../types/simulation-types';
import {
  // n, // `n` は `lucide-react` からではなく、`../../utils/financial` からインポートします。
  Home,
  Car,
  Heart,
  Baby,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Landmark,
  GraduationCap,
  Shield,
  PiggyBank,
  Activity,
  Wallet,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { n } from '../../utils/financial';

const formatYen = (value: number | string | undefined, sign = false) => {
  const num = Number(value);
  if (value === undefined || isNaN(num)) return 'N/A';
  const signStr = sign ? (num >= 0 ? '+' : '-') : '';
  return `${signStr}${Math.round(Math.abs(num)).toLocaleString()} 円`;
};

const formatManYen = (value: number | string | undefined) => {
  const num = Number(value);
  if (value === undefined || isNaN(num)) return '未設定';
  return `${Math.round(num * 10000).toLocaleString()} 円`;
};

const EventIcon: React.FC<{ iconKey: string }> = ({ iconKey }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'user': <User size={20} className="text-blue-500" />,
    'marriage': <Heart size={20} className="text-pink-500" />,
    'child': <Baby size={20} className="text-teal-500" />,
    'education': <GraduationCap size={20} className="text-indigo-500" />,
    'house': <Home size={20} className="text-green-500" />,
    'renovation': <Wrench size={20} className="text-gray-500" />,
    'car': <Car size={20} className="text-orange-500" />,
    'reemployment': <Briefcase size={20} className="text-blue-600" />,
    'care': <Users size={20} className="text-purple-500" />,
    'retirement': <Briefcase size={20} className="text-red-500" />,
    'pension': <Landmark size={20} className="text-yellow-600" />,
    'lump-sum': <Wallet size={20} className="text-cyan-500" />,

  };
  return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-4">{iconMap[iconKey] || <Activity size={20} />}</div>;
};

const LifePlanTimeline: React.FC<{ rawFormData: FormDataState, yearlyData: YearlyData[] }> = ({ rawFormData, yearlyData }) => {
  const events = React.useMemo(() => {
    const allEvents: { age: number, iconKey: string, title: string, details: { label: string, value: React.ReactNode }[] }[] = [];
    const formData = rawFormData;

    // 結婚
    if (formData.planToMarry === 'する') {
      allEvents.push({
        age: n(formData.marriageAge),
        iconKey: 'marriage',
        title: '結婚',
        details: [
          { label: '結婚費用', value: formatYen((n(formData.engagementCost) + n(formData.weddingCost) + n(formData.honeymoonCost) + n(formData.newHomeMovingCost)) * 10000) },
        ],
      });
    }

    // 子供
    if (formData.hasChildren === 'はい') {
      for (let i = 0; i < n(formData.numberOfChildren); i++) {
        const birthAge = n(formData.firstBornAge) + i * 3;
        allEvents.push({
          age: birthAge,
          iconKey: 'child',
          title: `${i + 1}人目の子供誕生`,
          details: [{ label: '教育費が発生', value: `〜${birthAge + 22}歳まで` }],
        });
      }
    }

    // 住宅購入
    if (formData.housePurchasePlan) {
      allEvents.push({
        age: n(formData.housePurchasePlan.age),
        iconKey: 'house',
        title: '住宅購入',
        details: [
          { label: '物件価格', value: formatManYen(formData.housePurchasePlan.price) },
          { label: '頭金', value: formatManYen(formData.housePurchasePlan.downPayment) },
          { label: 'ローン返済開始', value: `${formData.housePurchasePlan.loanYears}年間` },
        ],
      });
    }
    
    // リフォーム
    formData.houseRenovationPlans.forEach((plan, index) => {
      if (n(plan.age) > 0) {
        allEvents.push({
          age: n(plan.age),
          iconKey: 'renovation',
          title: `リフォーム (${index + 1})`,
          details: [
            { label: '費用', value: formatManYen(plan.cost) },
            { label: '繰り返し', value: plan.cycleYears ? `${plan.cycleYears}年ごと` : '1回のみ' },
          ]
        });
      }
    });

    // 車
    if (formData.carPurchasePlan === 'yes' && n(formData.carFirstReplacementAfterYears) > 0) {
      allEvents.push({
        age: n(formData.personAge) + n(formData.carFirstReplacementAfterYears),
        iconKey: 'car',
        title: '車の買い替え',
        details: [
          { label: '価格', value: formatManYen(formData.carPrice) },
          { label: '頻度', value: `${formData.carReplacementFrequency}年ごと` },
        ],
      });
    }

    // 介護
    if (formData.parentCareAssumption === 'はい') {
      formData.parentCarePlans.forEach(plan => {
        const startAge = n(formData.personAge) + (n(plan.parentCareStartAge) - n(plan.parentCurrentAge));
        allEvents.push({
          age: startAge,
          iconKey: 'care',
          title: '親の介護開始',
          details: [{ label: '月額費用', value: formatManYen(plan.monthly10kJPY) }],
        });
      });
    }

    // 定年再雇用
    if (formData.assumeReemployment) {
      allEvents.push({
        age: 60,
        iconKey: 'reemployment',
        title: 'あなたの定年再雇用 開始',
        details: [{ label: '給与収入が減少', value: `${formData.reemploymentReductionRate}%減` }],
      });
    }
    if (formData.spouseAssumeReemployment) {
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = 60 - spouseBaseAge;
      const eventAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
      allEvents.push({
        age: eventAgeOnPersonTimeline,
        iconKey: 'reemployment',
        title: 'パートナーの定年再雇用 開始',
        details: [{ label: '給与収入が減少', value: `${formData.spouseReemploymentReductionRate}%減` }],
      });
    }

    // 退職
    allEvents.push({
      age: n(formData.retirementAge),
      iconKey: 'retirement',
      title: `あなたの${formData.assumeReemployment ? '（完全）' : ''}退職`,
      details: [{ label: '給与収入が停止', value: '' }],
    });
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = n(formData.spouseRetirementAge) - spouseBaseAge;
      const spouseRetirementAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
      allEvents.push({
        age: spouseRetirementAgeOnPersonTimeline,
        iconKey: 'retirement',
        title: `パートナーの${formData.spouseAssumeReemployment ? '（完全）' : ''}退職`,
        details: [{ label: '給与収入が停止', value: '' }],
      });
    }

    // 年金
    allEvents.push({
      age: n(formData.pensionStartAge),
      iconKey: 'pension',
      title: 'あなたの公的年金 受給開始',
      details: [{ label: '年間受給額', value: formatYen(n(formData.pensionAmount) * 12 * 10000) }],
    });
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = n(formData.spousePensionStartAge) - spouseBaseAge;
      const spousePensionStartAgeOnPersonTimeline = n(formData.personAge) + ageDiff;

      allEvents.push({
        age: spousePensionStartAgeOnPersonTimeline,
        iconKey: 'pension',
        title: 'パートナーの公的年金 受給開始',
        details: [{ label: '年間受給額', value: formatYen(n(formData.spousePensionAmount) * 12 * 10000) }],
      });
    }

    // 退職金
    if (formData.retirementIncome && n(formData.retirementIncome.age) > 0) {
      allEvents.push({
        age: n(formData.retirementIncome.age),
        iconKey: 'retirement',
        title: 'あなたの退職金',
        details: [
          { label: '受取額', value: formatManYen(formData.retirementIncome.amount) },
          { label: '勤続年数', value: `${formData.retirementIncome.yearsOfService} 年` },
        ]
      });
    }
    if (formData.spouseRetirementIncome && n(formData.spouseRetirementIncome.age) > 0) {
      const spouseBaseAge = formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage);
      const ageDiff = n(formData.spouseRetirementIncome.age) - spouseBaseAge;
      const eventAgeOnPersonTimeline = n(formData.personAge) + ageDiff;
      allEvents.push({
        age: eventAgeOnPersonTimeline,
        iconKey: 'retirement',
        title: 'パートナーの退職金',
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
        if (plan.type === 'lumpSum') {
          const ageDiff = n(plan.startAge) - baseAge;
          const eventAgeOnPersonTimeline = isSpouse ? personCurrentAge + ageDiff : n(plan.startAge);
          allEvents.push({
            age: eventAgeOnPersonTimeline,
            iconKey: 'lump-sum',
            title: `${person}の個人年金（一括）`,
            details: [{ label: '受取総額', value: formatManYen(plan.amount) }]
          });
        } else {
          const ageDiff = n(plan.startAge) - baseAge;
          const eventAgeOnPersonTimeline = isSpouse ? personCurrentAge + ageDiff : n(plan.startAge);
          allEvents.push({
            age: eventAgeOnPersonTimeline,
            iconKey: 'pension',
            title: `${person}の個人年金（受給開始）`,
            details: [
              { label: '年間受給額', value: formatManYen(plan.amount) },
              { label: '受給期間', value: plan.type === 'fixedTerm' ? `${plan.duration}年間` : '終身' }
            ]
          });
        }
      });
    };

    const processOtherLumpSums = (lumpSums: typeof formData.otherLumpSums, person: string) => {
      const isSpouse = person === 'パートナー';
      const baseAge = isSpouse ? (formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage)) : n(formData.personAge);
      const personCurrentAge = n(formData.personAge);

      lumpSums?.forEach(item => {
        const ageDiff = n(item.age) - baseAge;
        const eventAgeOnPersonTimeline = isSpouse ? personCurrentAge + ageDiff : n(item.age);
        allEvents.push({
          age: eventAgeOnPersonTimeline,
          iconKey: 'lump-sum',
          title: `${person}のその他一時金受取（${item.name || '名称未設定'}）`,
          details: [{ label: '受取額', value: formatManYen(item.amount) }]
        });
      });
    };

    processPensionPlans(formData.personalPensionPlans, 'あなた');
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      processPensionPlans(formData.spousePersonalPensionPlans, 'パートナー');
    }

    processOtherLumpSums(formData.otherLumpSums, 'あなた');
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      processOtherLumpSums(formData.spouseOtherLumpSums, 'パートナー');
    }

    return allEvents.sort((a, b) => a.age - b.age);
  }, [rawFormData]);

  const yearlyDataByAge = React.useMemo(() => {
    const map = new Map<number, YearlyData>();
    yearlyData.forEach(data => map.set(data.age, data));
    return map;
  }, [yearlyData]);

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {events.map((event, index) => {
        const data = yearlyDataByAge.get(event.age);
        const balance = data ? data.income - data.expense : undefined;
        const isNegativeBalance = balance !== undefined && balance < 0;

        return (
          <div key={index} className="relative mb-8">
            <div className={`absolute left-0 top-1.5 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center transition-colors duration-300 ${
              isNegativeBalance ? 'border-red-300' : 'border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${isNegativeBalance ? 'bg-red-500' : 'bg-blue-500'}`} />
            </div>
            <div className="ml-4">
              <div className={`rounded-xl shadow p-4 border transition-colors duration-300 ${
                isNegativeBalance ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-start md:items-center mb-3">
                  <EventIcon iconKey={event.iconKey} />
                  <div>
                    <p className="font-bold text-gray-800">{event.age}歳: {event.title}</p>
                    <div className="text-xs text-gray-500 space-x-2">
                      {event.details.map((d, i) => <span key={i}>{d.label}: {d.value}</span>)}
                    </div>
                  </div>
                </div>
                {data && balance !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm border-t pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">年間収入</p>
                        <p className="font-semibold">{formatYen(data.income)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-500" />
                      <div>
                        <p className="text-xs text-gray-500">年間支出</p>
                        <p className="font-semibold">{formatYen(data.expense)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PiggyBank size={16} className={isNegativeBalance ? "text-red-500" : "text-green-500"} />
                      <div>
                        <p className="text-xs text-gray-500">年間収支</p>
                        <p className={`font-semibold ${isNegativeBalance ? 'text-red-600' : 'text-green-600'}`}>{formatYen(balance, true)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">年末総資産</p>
                        <p className="font-semibold">{formatYen(data.totalAssets)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LifePlanTimeline;
