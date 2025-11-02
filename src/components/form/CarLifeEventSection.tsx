import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface CarLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const CarLifeEventSection: React.FC<CarLifeEventSectionProps> = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-car.png" alt="Car Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">車に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">現在ローン返済中ですか？</label>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="radio" className="custom-radio" name="carCurrentLoanInPayment" value="yes" checked={formData.carCurrentLoanInPayment === 'yes'} onChange={handleInputChange} />
            <span>はい</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" className="custom-radio" name="carCurrentLoanInPayment" value="no" checked={formData.carCurrentLoanInPayment === 'no'} onChange={handleInputChange} />
            <span>いいえ</span>
          </label>
          {errors.carCurrentLoanInPayment && <p className="text-red-500 text-xs italic mt-2">{errors.carCurrentLoanInPayment}</p>}
        </div>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.carCurrentLoanInPayment === 'yes' ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCurrentLoanMonthly">月々の返済額（円/月）</label>
              <input type="number" id="carCurrentLoanMonthly" name="carCurrentLoanMonthly" value={formData.carCurrentLoanMonthly} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.carCurrentLoanMonthly ? 'border-red-500' : ''}`} />
              {errors.carCurrentLoanMonthly && <p className="text-red-500 text-xs italic mt-1">{errors.carCurrentLoanMonthly}</p>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCurrentLoanRemainingMonths">残り支払い回数（ヶ月）</label>
              <input type="number" id="carCurrentLoanRemainingMonths" name="carCurrentLoanRemainingMonths" value={formData.carCurrentLoanRemainingMonths} onChange={handleInputChange} className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 ${errors.carCurrentLoanRemainingMonths ? 'border-red-500' : ''}`} />
              {errors.carCurrentLoanRemainingMonths && <p className="text-red-500 text-xs italic mt-1">{errors.carCurrentLoanRemainingMonths}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">今後、車を購入/買い替えする予定はありますか？</label>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="radio" className="custom-radio" name="carPurchasePlan" value="yes" checked={formData.carPurchasePlan === 'yes'} onChange={handleInputChange} />
            <span>はい</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" className="custom-radio" name="carPurchasePlan" value="no" checked={formData.carPurchasePlan === 'no'} onChange={handleInputChange} />
            <span>いいえ</span>
          </label>
          {errors.carPurchasePlan && <p className="text-red-500 text-xs italic mt-2">{errors.carPurchasePlan}</p>}
        </div>
      </div>

      <div className={`accordion-content ${formData.carPurchasePlan === 'yes' ? 'open' : ''}`}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carFirstReplacementAfterYears">
          初回買い替えは今から何年後？[年]
        </label>
        <input type="number" id="carFirstReplacementAfterYears" name="carFirstReplacementAfterYears" value={formData.carFirstReplacementAfterYears} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carFirstReplacementAfterYears ? 'border-red-500' : ''}`} />
        {errors.carFirstReplacementAfterYears && <p className="text-red-500 text-xs italic mt-1">{errors.carFirstReplacementAfterYears}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carPrice">
          今後買い替える車の価格帯は？[万円]
        </label>
        <input type="number" id="carPrice" name="carPrice" value={formData.carPrice} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carPrice ? 'border-red-500' : ''}`} required />
        {errors.carPrice && <p className="text-red-500 text-xs italic mt-1">{errors.carPrice}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carReplacementFrequency">
          車を乗り換える頻度は？[年]
        </label>
        <input type="number" id="carReplacementFrequency" name="carReplacementFrequency" value={formData.carReplacementFrequency} onChange={handleInputChange} className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carReplacementFrequency ? 'border-red-500' : ''}`} required />
        {errors.carReplacementFrequency && <p className="text-red-500 text-xs italic mt-1">{errors.carReplacementFrequency}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ローンで購入しますか？
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="carLoanUsage"
              value="はい"
              checked={formData.carLoanUsage === 'はい'}
              onChange={handleInputChange}
            />
            <span className="ml-2">はい</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="carLoanUsage"
              value="いいえ"
              checked={formData.carLoanUsage === 'いいえ'}
              onChange={handleInputChange}
            />
            <span className="ml-2">いいえ</span>
          </label>
        </div>
        {errors.carLoanUsage && <p className="text-red-500 text-xs italic mt-2">{errors.carLoanUsage}</p>}
      </div>
      <div className={`accordion-content ${formData.carLoanUsage === 'はい' ? 'open' : ''}`}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carLoanYears">
            ローン年数は？
          </label>
          <select
            id="carLoanYears"
            name="carLoanYears"
            value={formData.carLoanYears}
            onChange={handleInputChange}
            className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.carLoanYears ? 'border-red-500' : ''}`}
          >
            <option value="">選択してください</option>
            <option value="3">3年</option>
            <option value="5">5年</option>
            <option value="7">7年</option>
          </select>
          {errors.carLoanYears && <p className="text-red-500 text-xs italic mt-1">{errors.carLoanYears}</p>}
        </div>
        <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          ローンの種類は？
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="carLoanType"
              value="銀行ローン"
              checked={formData.carLoanType === '銀行ローン'}
              onChange={handleInputChange}
            />
            <span className="ml-2">銀行ローン</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="carLoanType"
              value="ディーラーローン"
              checked={formData.carLoanType === 'ディーラーローン'}
              onChange={handleInputChange}
            />
            <span className="ml-2">ディーラーローン</span>
          </label>
        </div>
        {errors.carLoanType && <p className="text-red-500 text-xs italic mt-2">{errors.carLoanType}</p>}
      </div>
      </div>
      </div>
    </div>
  );
};

export default CarLifeEventSection;
