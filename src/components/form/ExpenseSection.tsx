import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface ExpenseSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const ExpenseSection: React.FC<ExpenseSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q3.png" className="max-w-full h-auto" alt="Current Expenses" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">現在の支出に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          支出の入力方法を選んでください。
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="expenseMethod"
              value="簡単"
              checked={formData.expenseMethod === '簡単'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">簡単</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="expenseMethod"
              value="詳細"
              checked={formData.expenseMethod === '詳細'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">詳細</span>
          </label>
        </div>
        {errors.expenseMethod && <p className="text-red-500 text-xs italic mt-2">{errors.expenseMethod}</p>}
      </div>

      <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
          <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md mb-4">
            ※住居費、自動車関連費、貯蓄・投資は除いて入力してください。
          </p>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostSimple">
            生活費[円]
          </label>
          <input
            type="number"
            id="livingCostSimple"
            name="livingCostSimple"
            value={formData.livingCostSimple}
            onChange={handleInputChange}
            className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.livingCostSimple ? 'border-red-500' : ''}`}
            required
          />
          {errors.livingCostSimple && <p className="text-red-500 text-xs italic mt-1">{errors.livingCostSimple}</p>}
        </div>
        </div>

      <div id="detailed-expense" className={`accordion-content ${formData.expenseMethod === '詳細' ? 'open' : ''}`}>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md mb-4">
            ※住居費と自動車関連費は、後のセクションで詳細を入力します。
          </p>
          <h3 className="text-lg font-semibold mb-2">固定費</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="utilitiesCost">
              水道・光熱費[円]
            </label>
            <input type="number" id="utilitiesCost" name="utilitiesCost" value={formData.utilitiesCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.utilitiesCost ? 'border-red-500' : ''}`} required />
            {errors.utilitiesCost && <p className="text-red-500 text-xs italic mt-1">{errors.utilitiesCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="communicationCost">
              通信費[円]
            </label>
            <input type="number" id="communicationCost" name="communicationCost" value={formData.communicationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.communicationCost ? 'border-red-500' : ''}`} required />
            {errors.communicationCost && <p className="text-red-500 text-xs italic mt-1">{errors.communicationCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceCost">
              保険[円]
            </label>
            <input type="number" id="insuranceCost" name="insuranceCost" value={formData.insuranceCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.insuranceCost ? 'border-red-500' : ''}`} required />
            {errors.insuranceCost && <p className="text-red-500 text-xs italic mt-1">{errors.insuranceCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationCost">
              教養・教育[円]
            </label>
            <input type="number" id="educationCost" name="educationCost" value={formData.educationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.educationCost ? 'border-red-500' : ''}`} required />
            {errors.educationCost && <p className="text-red-500 text-xs italic mt-1">{errors.educationCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherFixedCost">
              その他[円]
            </label>
            <input type="number" id="otherFixedCost" name="otherFixedCost" value={formData.otherFixedCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.otherFixedCost ? 'border-red-500' : ''}`} defaultValue={0} />
            {errors.otherFixedCost && <p className="text-red-500 text-xs italic mt-1">{errors.otherFixedCost}</p>}
          </div>

          <h3 className="text-lg font-semibold mb-2">変動費</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foodCost">
              食費[円]
            </label>
            <input type="number" id="foodCost" name="foodCost" value={formData.foodCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.foodCost ? 'border-red-500' : ''}`} required />
            {errors.foodCost && <p className="text-red-500 text-xs italic mt-1">{errors.foodCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dailyNecessitiesCost">
              日用品[円]
            </label>
            <input type="number" id="dailyNecessitiesCost" name="dailyNecessitiesCost" value={formData.dailyNecessitiesCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.dailyNecessitiesCost ? 'border-red-500' : ''}`} required />
            {errors.dailyNecessitiesCost && <p className="text-red-500 text-xs italic mt-1">{errors.dailyNecessitiesCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transportationCost">
              交通費[円]
            </label>
            <input type="number" id="transportationCost" name="transportationCost" value={formData.transportationCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.transportationCost ? 'border-red-500' : ''}`} required />
            {errors.transportationCost && <p className="text-red-500 text-xs italic mt-1">{errors.transportationCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clothingBeautyCost">
              衣類・美容[円]
            </label>
            <input type="number" id="clothingBeautyCost" name="clothingBeautyCost" value={formData.clothingBeautyCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.clothingBeautyCost ? 'border-red-500' : ''}`} required />
            {errors.clothingBeautyCost && <p className="text-red-500 text-xs italic mt-1">{errors.clothingBeautyCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socializingCost">
              交際費[円]
            </label>
            <input type="number" id="socializingCost" name="socializingCost" value={formData.socializingCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.socializingCost ? 'border-red-500' : ''}`} required />
            {errors.socializingCost && <p className="text-red-500 text-xs italic mt-1">{errors.socializingCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hobbyEntertainmentCost">
              趣味・娯楽[円]
            </label>
            <input type="number" id="hobbyEntertainmentCost" name="hobbyEntertainmentCost" value={formData.hobbyEntertainmentCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.hobbyEntertainmentCost ? 'border-red-500' : ''}`} required />
            {errors.hobbyEntertainmentCost && <p className="text-red-500 text-xs italic mt-1">{errors.hobbyEntertainmentCost}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherVariableCost">
              その他[円]
            </label>
            <input type="number" id="otherVariableCost" name="otherVariableCost" value={formData.otherVariableCost} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.otherVariableCost ? 'border-red-500' : ''}`} defaultValue={0} />
            {errors.otherVariableCost && <p className="text-red-500 text-xs italic mt-1">{errors.otherVariableCost}</p>}
          </div>
        </div>
    </div>
  );
};

export default ExpenseSection;
