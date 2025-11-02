import React from 'react';
import type { FormDataState } from '@/types/form-types';
import type { CarePlan } from '@/types/simulation-types';
import { Trash2 } from "lucide-react";

interface ParentCareLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
  handleCarePlanChange: (index: number, key: keyof Omit<CarePlan, 'id'>, value: string) => void;
  addCarePlan: () => void;
  removeCarePlan: (index: number) => void;
  totalCareCost: number;
}

const ParentCareLifeEventSection: React.FC<ParentCareLifeEventSectionProps> = ({ formData, handleInputChange, errors, handleCarePlanChange, addCarePlan, removeCarePlan, totalCareCost }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-parenthelp.png" alt="Parent Care Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">親の介護に関する質問</h2>
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
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">はい</span>
          </label>
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="parentCareAssumption"
              value="なし"
              checked={formData.parentCareAssumption === 'なし'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">なし</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="parentCareAssumption"
              value="未定"
              checked={formData.parentCareAssumption === '未定'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">未定</span>
          </label>
        </div>
        {errors.parentCareAssumption && <p className="text-red-500 text-xs italic mt-2">{errors.parentCareAssumption}</p>}
      </div>
      <div className={`accordion-content ${formData.parentCareAssumption === 'はい' ? 'open' : ''}`}>
        {formData.parentCarePlans.map((plan, index) => (
          <div key={plan.id} className="border rounded p-4 mb-4 relative">
            <h3 className="text-lg font-semibold mb-2">{index + 1}人目の親の設定</h3>
            {formData.parentCarePlans.length > 1 && (
              <button
                type="button"
                onClick={() => removeCarePlan(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                aria-label={`${index + 1}人目の設定を削除`}
                title="削除"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].parentCurrentAge`}>
                  現在の年齢[歳]
                </label>
                <input type="number" id={`parentCarePlans[${index}].parentCurrentAge`} value={plan.parentCurrentAge} onChange={(e) => handleCarePlanChange(index, 'parentCurrentAge', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].parentCurrentAge`] ? 'border-red-500' : ''}`} />
                {errors[`parentCarePlans[${index}].parentCurrentAge`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].parentCurrentAge`]}</p>}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].parentCareStartAge`}>
                  介護開始年齢[歳]
                </label>
                <input type="number" id={`parentCarePlans[${index}].parentCareStartAge`} value={plan.parentCareStartAge} onChange={(e) => handleCarePlanChange(index, 'parentCareStartAge', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].parentCareStartAge`] ? 'border-red-500' : ''}`} />
                {errors[`parentCarePlans[${index}].parentCareStartAge`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].parentCareStartAge`]}</p>}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].monthly10kJPY`}>
                  介護費用の想定（月額）[万円]
                </label>
                <input type="number" id={`parentCarePlans[${index}].monthly10kJPY`} value={plan.monthly10kJPY} onChange={(e) => handleCarePlanChange(index, 'monthly10kJPY', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].monthly10kJPY`] ? 'border-red-500' : ''}`} />
                {errors[`parentCarePlans[${index}].monthly10kJPY`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].monthly10kJPY`]}</p>}
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`parentCarePlans[${index}].years`}>
                  介護期間の想定[年]
                </label>
                <input type="number" id={`parentCarePlans[${index}].years`} value={plan.years} onChange={(e) => handleCarePlanChange(index, 'years', e.target.value)} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors[`parentCarePlans[${index}].years`] ? 'border-red-500' : ''}`} />
                {errors[`parentCarePlans[${index}].years`] && <p className="text-red-500 text-xs italic mt-1">{errors[`parentCarePlans[${index}].years`]}</p>}
              </div>
            </div>
          </div>
        ))}
        <div className="mt-4">
          <button type="button" onClick={addCarePlan} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            親の設定を追加する
          </button>
          {totalCareCost > 0 && (
            <div className="mt-4 text-right text-lg font-semibold">
              介護費用総額: <span className="text-blue-600">{totalCareCost.toLocaleString()}</span> 万円
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentCareLifeEventSection;
