import React from 'react';
import type { FormDataState } from '../../types/form-types';
import type { YearlyData } from '../../types/simulation-types';
import {
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
import { extractLifePlanEvents, type TimelineEvent } from './life-plan-events';

const formatYen = (value: number | string | undefined, sign = false) => {
  const num = Number(value);
  if (value === undefined || Number.isNaN(num)) return 'N/A';
  const signStr = sign ? (num >= 0 ? '+' : '-') : '';
  return `${signStr}${Math.round(Math.abs(num)).toLocaleString()} 円`;
};

const EventIcon: React.FC<{ iconKey: string }> = ({ iconKey }) => {
  const iconMap: Record<string, React.ReactNode> = {
    user: <User size={20} className="text-blue-500" />,
    marriage: <Heart size={20} className="text-pink-500" />,
    child: <Baby size={20} className="text-teal-500" />,
    education: <GraduationCap size={20} className="text-indigo-500" />,
    house: <Wrench size={20} className="text-green-500" />,
    renovation: <Wrench size={20} className="text-gray-500" />,
    car: <Car size={20} className="text-orange-500" />,
    reemployment: <Briefcase size={20} className="text-blue-600" />,
    care: <Users size={20} className="text-purple-500" />,
    retirement: <Briefcase size={20} className="text-red-500" />,
    pension: <Landmark size={20} className="text-yellow-600" />,
    'lump-sum': <Wallet size={20} className="text-cyan-500" />,
  };
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-4">
      {iconMap[iconKey] || <Activity size={20} />}
    </div>
  );
};

type LifePlanTimelineProps = {
  rawFormData: FormDataState;
  yearlyData: YearlyData[];
  eventsOverride?: TimelineEvent[];
  isForPdf?: boolean;
};

const LifePlanTimeline: React.FC<LifePlanTimelineProps> = ({ rawFormData, yearlyData, eventsOverride}) => {
  const events = React.useMemo(
    () => eventsOverride ?? extractLifePlanEvents(rawFormData),
    [eventsOverride, rawFormData]
  );

  const yearlyDataByAge = React.useMemo(() => {
    const map = new Map<number, YearlyData>();
    yearlyData.forEach(data => map.set(data.age, data));
    return map;
  }, [yearlyData]);

  return (
    <div className="relative pl-8">
      <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {events.map((event, index) => {
        const data = yearlyDataByAge.get(event.age);
        const balance = data ? data.income - data.expense : undefined;
        const isNegativeBalance = balance !== undefined && balance < 0;

        return (
          <div key={`${event.age}-${index}`} className="relative mb-8">
            <div
              className={`absolute left-0 top-1.5 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center transition-colors duration-300 ${
                isNegativeBalance ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  isNegativeBalance ? 'bg-red-500' : 'bg-blue-500'
                }`}
              />
            </div>
            <div className="ml-4">
              <div
                className={`rounded-xl shadow p-4 border transition-colors duration-300 ${
                  isNegativeBalance ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start md:items-center mb-3">
                  <EventIcon iconKey={event.iconKey} />
                  <div>
                    <p className="font-bold text-gray-800">{event.age}歳: {event.title}</p>
                    <div className="text-xs text-gray-500 space-x-2 flex flex-wrap">
                      {event.details.map((d, i) => (
                        <span key={i}>
                          {d.label}: {d.value}
                        </span>
                      ))}
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
                      <PiggyBank size={16} className={isNegativeBalance ? 'text-red-500' : 'text-green-500'} />
                      <div>
                        <p className="text-xs text-gray-500">年間収支</p>
                        <p className={`font-semibold ${isNegativeBalance ? 'text-red-600' : 'text-green-600'}`}>
                          {formatYen(balance, true)}
                        </p>
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
