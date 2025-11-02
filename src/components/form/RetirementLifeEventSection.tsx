import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface RetirementLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const RetirementLifeEventSection: React.FC<RetirementLifeEventSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-retirement.png" alt="Retirement Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">老後に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postRetirementLivingCost">老後の生活費（月額）</label>
        <div className="flex">
          <input type="number" id="postRetirementLivingCost" name="postRetirementLivingCost" value={formData.postRetirementLivingCost} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.postRetirementLivingCost ? 'border-red-500' : ''}`} />
          <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
        </div>
        {errors.postRetirementLivingCost && <p className="text-red-500 text-xs italic mt-1">{errors.postRetirementLivingCost}</p>}
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-semibold text-center mb-4">本人の老後設定</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="retirementAge">退職予定年齢</label>
          <div className="flex">
            <input type="number" id="retirementAge" name="retirementAge" value={formData.retirementAge} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.retirementAge ? 'border-red-500' : ''}`} />
            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
          </div>
          {errors.retirementAge && <p className="text-red-500 text-xs italic mt-1">{errors.retirementAge}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionStartAge">年金の想定受給開始年齢</label>
          <div className="flex">
            <input type="number" id="pensionStartAge" name="pensionStartAge" value={formData.pensionStartAge} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.pensionStartAge ? 'border-red-500' : ''}`} />
            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
          </div>
          {errors.pensionStartAge && <p className="text-red-500 text-xs italic mt-1">{errors.pensionStartAge}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionAmount">年金受給額（月額）</label>
          <div className="flex">
            <input type="number" id="pensionAmount" name="pensionAmount" value={formData.pensionAmount} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.pensionAmount ? 'border-red-500' : ''}`} />
            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
          </div>
          {errors.pensionAmount && <p className="text-red-500 text-xs italic mt-1">{errors.pensionAmount}</p>}
        </div>
      </div>

      {(formData.familyComposition === '既婚' || formData.planToMarry === 'する') && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold text-center mb-4">配偶者の老後設定</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseRetirementAge">配偶者の退職予定年齢</label>
            <div className="flex">
              <input type="number" id="spouseRetirementAge" name="spouseRetirementAge" value={formData.spouseRetirementAge} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.spouseRetirementAge ? 'border-red-500' : ''}`} />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
            </div>
            {errors.spouseRetirementAge && <p className="text-red-500 text-xs italic mt-1">{errors.spouseRetirementAge}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spousePensionStartAge">配偶者の年金受給開始年齢</label>
            <div className="flex">
              <input type="number" id="spousePensionStartAge" name="spousePensionStartAge" value={formData.spousePensionStartAge} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.spousePensionStartAge ? 'border-red-500' : ''}`} />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
            </div>
            {errors.spousePensionStartAge && <p className="text-red-500 text-xs italic mt-1">{errors.spousePensionStartAge}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spousePensionAmount">配偶者の年金受給額（月額）</label>
            <div className="flex">
              <input type="number" id="spousePensionAmount" name="spousePensionAmount" value={formData.spousePensionAmount} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.spousePensionAmount ? 'border-red-500' : ''}`} />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
            </div>
            {errors.spousePensionAmount && <p className="text-red-500 text-xs italic mt-1">{errors.spousePensionAmount}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirementLifeEventSection;
