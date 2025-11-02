import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface IncomeSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const IncomeSection: React.FC<IncomeSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q2.png" alt="Current Income" />
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
          className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.personAge ? 'border-red-500' : ''}`}
          required
        /> 
        {errors.personAge && <p className="text-red-500 text-xs italic mt-1">{errors.personAge}</p>}
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
            className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.mainIncome ? 'border-red-500' : ''}`}
            required
          />
          {errors.mainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.mainIncome}</p>}
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
            name="annualRaiseRate"
            value={formData.annualRaiseRate || ''}
            onChange={handleInputChange}
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
            className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.spouseAge ? 'border-red-500' : ''}`}
            required
          />
          {errors.spouseAge && <p className="text-red-500 text-xs italic mt-1">{errors.spouseAge}</p>}
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
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.spouseMainIncome ? 'border-red-500' : ''}`}
              required
            />
            {errors.spouseMainIncome && <p className="text-red-500 text-xs italic mt-1">{errors.spouseMainIncome}</p>}
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
              name="spouseAnnualRaiseRate"
              value={formData.spouseAnnualRaiseRate || ''}
              onChange={handleInputChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''}`}>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseSideJobIncome">
            配偶者の副業年間収入（額面）[万円]
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
};

export default IncomeSection;
