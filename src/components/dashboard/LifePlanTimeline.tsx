import React from 'react';
import type { FormDataState } from '../../pages/FormPage';
import type { YearlyData } from '../../types/simulation';
import {
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
  User,
  Users,
  Wrench,
} from 'lucide-react';

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

const n = (v: unknown): number => {
  const num = Number(v);
  return isFinite(num) ? num : 0;
};

const EventIcon: React.FC<{ title: string }> = ({ title }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    '👤': <User size={20} className="text-blue-500" />,
    '💒': <Heart size={20} className="text-pink-500" />,
    '👶': <Baby size={20} className="text-teal-500" />,
    '🎓': <GraduationCap size={20} className="text-indigo-500" />,
    '🏠': <Home size={20} className="text-green-500" />,
    '🛠️': <Wrench size={20} className="text-gray-500" />,
    '🚗': <Car size={20} className="text-orange-500" />,
    '👨‍👩‍👧‍👦': <Users size={20} className="text-purple-500" />,
    '💼': <Briefcase size={20} className="text-red-500" />,
    '👴': <Landmark size={20} className="text-yellow-600" />,
  };
  const iconKey = title.split(' ')[0];
  return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-4">{iconMap[iconKey] || <Activity size={20} />}</div>;
};

const LifePlanTimeline: React.FC<{ rawFormData: FormDataState, yearlyData: YearlyData[] }> = ({ rawFormData, yearlyData }) => {
  const events = React.useMemo(() => {
    const allEvents: { age: number, title: string, details: { label: string, value: React.ReactNode }[] }[] = [];
    const formData = rawFormData;

    // 結婚
    if (formData.planToMarry === 'する') {
      allEvents.push({
        age: n(formData.marriageAge),
        title: '💒 結婚',
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
          title: `👶 ${i + 1}人目の子供誕生`,
          details: [{ label: '教育費が発生', value: `〜${birthAge + 22}歳まで` }],
        });
        allEvents.push({
          age: birthAge + 22,
          title: `🎓 ${i + 1}人目の子供独立`,
          details: [{ label: '教育費が終了', value: '' }],
        });
      }
    }

    // 住宅購入
    if (formData.housePurchasePlan) {
      allEvents.push({
        age: n(formData.housePurchasePlan.age),
        title: '🏠 住宅購入',
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
          title: `🛠️ リフォーム (${index + 1})`,
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
        title: '🚗 車の買い替え',
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
          title: '👨‍👩‍👧‍👦 親の介護開始',
          details: [{ label: '月額費用', value: formatManYen(plan.monthly10kJPY) }],
        });
      });
    }

    // 退職
    allEvents.push({
      age: n(formData.retirementAge),
      title: '💼 あなたの退職',
      details: [{ label: '給与収入が停止', value: '' }],
    });
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      const spouseRetirementAgeOnPersonTimeline = n(formData.personAge) + (n(formData.spouseRetirementAge) - (formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage)));
      allEvents.push({
        age: spouseRetirementAgeOnPersonTimeline,
        title: '💼 パートナーの退職',
        details: [{ label: '給与収入が停止', value: '' }],
      });
    }

    // 年金
    allEvents.push({
      age: n(formData.pensionStartAge),
      title: '👴 あなたの年金受給開始',
      details: [{ label: '月額', value: formatManYen(formData.pensionAmount) }],
    });
    if (formData.familyComposition === '既婚' || formData.planToMarry === 'する') {
      const spousePensionStartAgeOnPersonTimeline = n(formData.personAge) + (n(formData.spousePensionStartAge) - (formData.familyComposition === '既婚' ? n(formData.spouseAge) : n(formData.spouseAgeAtMarriage)));
      allEvents.push({
        age: spousePensionStartAgeOnPersonTimeline,
        title: '👴 パートナーの年金受給開始',
        details: [{ label: '月額', value: formatManYen(formData.spousePensionAmount) }],
      });
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
        const balance = data ? data.income - data.totalExpense : 0;

        return (
          <div key={index} className="relative mb-8">
            <div className="absolute left-0 top-1.5 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div className="ml-4">
              <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <EventIcon title={event.title} />
                  <div>
                    <p className="font-bold text-gray-800">{event.age}歳: {event.title}</p>
                    <div className="text-xs text-gray-500 space-x-2">
                      {event.details.map((d, i) => <span key={i}>{d.label}: {d.value}</span>)}
                    </div>
                  </div>
                </div>
                {data && (
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
                        <p className="font-semibold">{formatYen(data.totalExpense)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PiggyBank size={16} className={balance >= 0 ? "text-green-500" : "text-red-500"} />
                      <div>
                        <p className="text-xs text-gray-500">年間収支</p>
                        <p className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatYen(balance, true)}</p>
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
