import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface FamilySectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const FamilySection: React.FC<FamilySectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q1.png" alt="Family Composition" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">家族構成に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          現在の家族構成は？<span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="familyComposition"
              value="独身"
              checked={formData.familyComposition === '独身'}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">既婚</span>
          </label>
        </div>
        {errors.familyComposition && <p className="text-red-500 text-xs italic mt-2">{errors.familyComposition}</p>}
      </div>
    </div>
  );
};

export default FamilySection;
