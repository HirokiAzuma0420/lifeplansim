import React from 'react';
import type { FormDataState } from '@/types/form-types';
import { n } from '@/utils/financial';

interface RetirementLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const RetirementLifeEventSection: React.FC<RetirementLifeEventSectionProps> = ({ formData, handleInputChange, errors }) => {
  const showReemployment = n(formData.retirementAge) >= 60;
  const showSpouseReemployment = (formData.familyComposition === '既婚' || formData.planToMarry === 'する') && n(formData.spouseRetirementAge) >= 60;

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
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showReemployment ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <label className="block text-gray-700 text-sm font-bold mb-2">60歳以降、定年再雇用を想定しますか？</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input type="radio" name="assumeReemployment" value="true" checked={formData.assumeReemployment === true} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'assumeReemployment', value: 'true', type: 'radio' } })} className="form-radio" />
                <span className="ml-2">はい</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="assumeReemployment" value="false" checked={formData.assumeReemployment === false} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'assumeReemployment', value: 'false', type: 'radio' } })} className="form-radio" />
                <span className="ml-2">いいえ</span>
              </label>
            </div>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${formData.assumeReemployment ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reemploymentReductionRate">60歳時点の年収に対する減給率</label>
              <div className="flex">
                <input type="number" id="reemploymentReductionRate" name="reemploymentReductionRate" value={formData.reemploymentReductionRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">例: 30%減給の場合「30」と入力。60歳から設定した退職年齢まで、この減給率が適用されます。</p>
            </div>
          </div>
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
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showSpouseReemployment ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <label className="block text-gray-700 text-sm font-bold mb-2">パートナーは60歳以降、定年再雇用を想定しますか？</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="spouseAssumeReemployment" value="true" checked={formData.spouseAssumeReemployment === true} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'spouseAssumeReemployment', value: 'true', type: 'radio' } })} className="form-radio" />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="spouseAssumeReemployment" value="false" checked={formData.spouseAssumeReemployment === false} onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'spouseAssumeReemployment', value: 'false', type: 'radio' } })} className="form-radio" />
                  <span className="ml-2">いいえ</span>
                </label>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${formData.spouseAssumeReemployment ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseReemploymentReductionRate">60歳時点の年収に対する減給率</label>
                <div className="flex">
                  <input type="number" id="spouseReemploymentReductionRate" name="spouseReemploymentReductionRate" value={formData.spouseReemploymentReductionRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">例: 30%減給の場合「30」と入力。60歳から設定した退職年齢まで、この減給率が適用されます。</p>
              </div>
            </div>
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
