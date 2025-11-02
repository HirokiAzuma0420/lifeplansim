import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface MarriageLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const MarriageLifeEventSection: React.FC<MarriageLifeEventSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-marriage.png" alt="Marriage Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">結婚に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          結婚を予定していますか？
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="planToMarry"
              value="する"
              checked={formData.planToMarry === 'する'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">する</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="planToMarry"
              value="しない"
              checked={formData.planToMarry === 'しない'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">しない</span>
          </label>
        </div>
        {errors.planToMarry && <p className="text-red-500 text-xs italic mt-2">{errors.planToMarry}</p>}
      </div>
      <div className={`accordion-content ${formData.planToMarry === 'する' ? 'open' : ''}`}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="marriageAge">
              結婚予定年齢は？[歳]
            </label>
            <input type="number" id="marriageAge" name="marriageAge" value={formData.marriageAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.marriageAge ? 'border-red-500' : ''}`} required />
            {errors.marriageAge && <p className="text-red-500 text-xs italic mt-1">{errors.marriageAge}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAgeAtMarriage">
              結婚時点での配偶者の年齢は？[歳]
            </label>
            <input type="number" id="spouseAgeAtMarriage" name="spouseAgeAtMarriage" value={formData.spouseAgeAtMarriage} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spouseAgeAtMarriage ? 'border-red-500' : ''}`} />
            {errors.spouseAgeAtMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.spouseAgeAtMarriage}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">配偶者の収入は？</label>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="パート" checked={formData.spouseIncomePattern === 'パート'} onChange={handleInputChange} /><span className="ml-2">パート (106万円)</span></label>
              <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="正社員" checked={formData.spouseIncomePattern === '正社員'} onChange={handleInputChange} /><span className="ml-2">正社員 (300万円)</span></label>
              <label className="inline-flex items-center"><input type="radio" className="custom-radio" name="spouseIncomePattern" value="カスタム" checked={formData.spouseIncomePattern === 'カスタム'} onChange={handleInputChange} /><span className="ml-2">カスタム入力</span></label>
            </div>
            {errors.spouseIncomePattern && <p className="text-red-500 text-xs italic mt-2">{errors.spouseIncomePattern}</p>}
          </div>
          {formData.spouseIncomePattern === 'カスタム' && (
            <div className="mb-4 pl-4 border-l-4 border-blue-300">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseCustomIncome">
                配偶者の年収[万円]
              </label>
              <input type="number" id="spouseCustomIncome" name="spouseCustomIncome" value={formData.spouseCustomIncome} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.spouseCustomIncome ? 'border-red-500' : ''}`} />
              {errors.spouseCustomIncome && <p className="text-red-500 text-xs italic mt-1">{errors.spouseCustomIncome}</p>}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostAfterMarriage">
              結婚後の生活費（月額）[円]
            </label>
            <input
              type="number"
              id="livingCostAfterMarriage"
              name="livingCostAfterMarriage"
              value={formData.livingCostAfterMarriage}
              onChange={handleInputChange}
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${errors.livingCostAfterMarriage ? 'border-red-500' : ''}`}
            />
            {errors.livingCostAfterMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.livingCostAfterMarriage}</p>}
            <p className="text-xs text-gray-500 mt-1">独身時の生活費の1.5倍が自動入力されます。自由に編集可能です。</p>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-bold mb-2 ${formData.housingType === '持ち家（ローン中）' ? 'text-gray-400' : 'text-gray-700'}`} htmlFor="housingCostAfterMarriage">
              結婚後の住居費（月額）[円]
            </label>
            <input
              type="number"
              id="housingCostAfterMarriage"
              name="housingCostAfterMarriage"
              value={formData.housingType === '持ち家（ローン中）' ? '' : formData.housingCostAfterMarriage}
              onChange={handleInputChange}
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.housingCostAfterMarriage ? 'border-red-500' : ''} ${formData.housingType === '持ち家（ローン中）' ? 'bg-gray-200 cursor-not-allowed' : ''}`}
              disabled={formData.housingType === '持ち家（ローン中）'}
            />
            {errors.housingCostAfterMarriage && <p className="text-red-500 text-xs italic mt-1">{errors.housingCostAfterMarriage}</p>}
            {formData.housingType === '持ち家（ローン中）' ? (
              <p className="text-xs text-gray-500 mt-1">※現在「持ち家（ローン中）」のため、結婚後も住宅ローンの返済が継続されます。</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">独身時の住居費の1.3倍が自動入力されます。自由に編集可能です。</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="engagementCost">
              婚約関連費用（指輪・結納金など）[万円]
            </label>
            <input type="number" id="engagementCost" name="engagementCost" value={formData.engagementCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={200} />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="weddingCost">
              結婚式費用[万円]
            </label>
            <input type="number" id="weddingCost" name="weddingCost" value={formData.weddingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={330} />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="honeymoonCost">
              新婚旅行費用[万円]
            </label>
            <input type="number" id="honeymoonCost" name="honeymoonCost" value={formData.honeymoonCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={35} />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHomeMovingCost">
              新居への引っ越し費用[万円]
            </label>
            <input type="number" id="newHomeMovingCost" name="newHomeMovingCost" value={formData.newHomeMovingCost} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={50} />
          </div>
        </div>
    </div>
  );
};

export default MarriageLifeEventSection;
