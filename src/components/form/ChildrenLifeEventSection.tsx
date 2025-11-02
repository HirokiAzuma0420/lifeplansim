import React from 'react';
import type { FormDataState } from '@/types/form-types';
import * as FC from '@/constants/financial_const';

interface ChildrenLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const ChildrenLifeEventSection: React.FC<ChildrenLifeEventSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-children.png" alt="Children Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">子供に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          {formData.familyComposition === '既婚'
            ? '子供はいますか？（今後の予定を含む）'
            : '将来、子供を持つ予定はありますか？'}
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="hasChildren"
              value="はい"
              checked={formData.hasChildren === 'はい'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">{formData.familyComposition === '既婚' ? 'はい' : 'ある'}</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="hasChildren"
              value="いいえ"
              checked={formData.hasChildren === 'いいえ'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">{formData.familyComposition === '既婚' ? 'いいえ' : 'ない'}</span>
          </label>
        </div>
        {errors.hasChildren && <p className="text-red-500 text-xs italic mt-2">{errors.hasChildren}</p>}
      </div>
      <div className={`accordion-content ${formData.hasChildren === 'はい' ? 'open' : ''}`}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfChildren">
              子供の人数は？[人]
            </label>
            <input type="number" id="numberOfChildren" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.numberOfChildren ? 'border-red-500' : ''}`} required />
            {errors.numberOfChildren && <p className="text-red-500 text-xs italic mt-1">{errors.numberOfChildren}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstBornAge">
              最初のお子さんが生まれた（または生まれる予定）のあなたの年齢は？[歳]
            </label>
            <input type="number" id="firstBornAge" name="firstBornAge" value={formData.firstBornAge} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.firstBornAge ? 'border-red-500' : ''}`} required />
            {errors.firstBornAge && <p className="text-red-500 text-xs italic mt-1">{errors.firstBornAge}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationPattern">
              教育費の想定パターンは？
            </label>
            <select 
              id="educationPattern"
              name="educationPattern"
              value={formData.educationPattern}
              onChange={handleInputChange}
              className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.educationPattern ? 'border-red-500' : ''}`}
              required
            >
              <option value="">選択してください</option>
              <option value="公立中心">公立中心（〜{FC.EDUCATION_COST_SUMMARY['公立中心']}万円/人）</option>
              <option value="公私混合">公私混合（〜{FC.EDUCATION_COST_SUMMARY['公私混合']}万円/人）</option>
              <option value="私立中心">私立中心（〜{FC.EDUCATION_COST_SUMMARY['私立中心']}万円/人）</option>
            </select>
            {errors.educationPattern && <p className="text-red-500 text-xs italic mt-1">{errors.educationPattern}</p>}
          </div>
        </div>
    </div>
  );
};

export default ChildrenLifeEventSection;
