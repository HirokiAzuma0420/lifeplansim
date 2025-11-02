import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface SavingsSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const SavingsSection: React.FC<SavingsSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-savings.png" alt="Savings" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">貯蓄に関する質問</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentSavings">
          現在の預貯金総額は？[万円]
        </label>
        <input type="number" id="currentSavings" name="currentSavings" value={formData.currentSavings} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.currentSavings ? 'border-red-500' : ''}`} required />
        {errors.currentSavings && <p className="text-red-500 text-xs italic mt-1">{errors.currentSavings}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlySavings">
          毎月の貯蓄額は？[円]
        </label>
        <input type="number" id="monthlySavings" name="monthlySavings" value={formData.monthlySavings} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.monthlySavings ? 'border-red-500' : ''}`} required />
        {errors.monthlySavings && <p className="text-red-500 text-xs italic mt-1">{errors.monthlySavings}</p>}
      </div>
    </div>
  );
};

export default SavingsSection;
