import React from 'react';
import type { FormDataState } from '@/types/form-types';
import RaiseRateRadioGroup from './RaiseRateRadioGroup';

interface IncomeSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: Partial<Record<keyof FormDataState, string>>;
}

const IncomeSection: React.FC<IncomeSectionProps> = ({ formData, handleInputChange, errors }) => {
  const handleRaiseRateChange = (name: string, value: string) => {
    handleInputChange({
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="p-4 text-left">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q2.png" alt="Current Income" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">現在の収入に関する質問</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="personAge">
              あなたの年齢
            </label>
            <div className="flex">
              <input
                type="number"
                id="personAge"
                name="personAge"
                value={formData.personAge || ''}
                onChange={handleInputChange}
                className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.personAge ? 'border-red-500' : ''}`}
                required
              />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
            </div>
            {errors.personAge && <p className="text-red-500 text-xs italic mt-1">{errors.personAge}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mainIncome">
              あなたの手取り年収
            </label>
            <div className="flex">
              <input
                type="number"
                id="mainIncome"
                name="mainIncome"
                value={formData.mainIncome}
                onChange={handleInputChange}
                className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.mainIncome ? 'border-red-500' : ''}`}
                required
              />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
            </div>
            {errors.mainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.mainIncome}</p>}
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="block text-gray-700 text-sm font-bold mb-2">
            あなたの昇給率（年率）
          </legend>
          <RaiseRateRadioGroup name="annualRaiseRate" value={formData.annualRaiseRate} onChange={handleRaiseRateChange} />
        </fieldset>

        {formData.familyComposition === '既婚' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAge">配偶者の年齢</label>
                <div className="flex">
                  <input type="number" id="spouseAge" name="spouseAge" value={formData.spouseAge || ''} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.spouseAge ? 'border-red-500' : ''}`} />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
                </div>
                {errors.spouseAge && <p className="text-red-500 text-xs italic mt-1">{errors.spouseAge}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseMainIncome">配偶者の手取り年収</label>
                <div className="flex">
                  <input type="number" id="spouseMainIncome" name="spouseMainIncome" value={formData.spouseMainIncome} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.spouseMainIncome ? 'border-red-500' : ''}`} />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
                {errors.spouseMainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.spouseMainIncome}</p>}
              </div>
            </div>

            <fieldset className="mb-4">
              <legend className="block text-gray-700 text-sm font-bold mb-2">
                配偶者の昇給率（年率）
              </legend>
              <RaiseRateRadioGroup name="spouseAnnualRaiseRate" value={formData.spouseAnnualRaiseRate} onChange={handleRaiseRateChange} />
            </fieldset>
          </>
        )}
      </div>
    </div>
  );
};

export default IncomeSection;
