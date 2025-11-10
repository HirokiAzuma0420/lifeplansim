import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface HomeLifeEventSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
  handleRenovationPlanChange: (index: number, key: keyof ({ age: number; cost: number; cycleYears?: number }), value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
}

const HomeLifeEventSection: React.FC<HomeLifeEventSectionProps> = ({ formData, handleInputChange, errors, handleRenovationPlanChange, setFormData }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-home.png" alt="住まいのイラスト"></img>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">住まいに関する質問</h2>

      {/* 1. 現住居の確認 */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">現在の住まいはどちらですか？</label>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center">
            <input type="radio" className="custom-radio" name="housingType" value="賃貸" checked={formData.housingType === '賃貸'} onChange={handleInputChange} required />
            <span className="ml-2">賃貸</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" className="custom-radio" name="housingType" value="持ち家（ローン中）" checked={formData.housingType === '持ち家（ローン中）'} onChange={handleInputChange} required />
            <span className="ml-2">持ち家（ローン返済中）</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" className="custom-radio" name="housingType" value="持ち家（完済）" checked={formData.housingType === '持ち家（完済）'} onChange={handleInputChange} required />
            <span className="ml-2">持ち家（ローン完済）</span>
          </label>
          {errors.housingType && <p className="text-red-500 text-xs italic mt-2">{errors.housingType}</p>}
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.housingType === '賃貸' ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="mt-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentRentLoanPayment">家賃</label>
            <div className="flex">
              <input type="number" id="currentRentLoanPayment" name="currentRentLoanPayment" value={formData.currentRentLoanPayment} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.currentRentLoanPayment ? 'border-red-500' : ''}`} />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">円/月</span>
            </div>
            {errors.currentRentLoanPayment && <p className="text-red-500 text-xs italic mt-1">{errors.currentRentLoanPayment}</p>}
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.housingType === '持ち家（ローン中）' ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="mt-3 space-y-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanMonthlyPayment">月額返済</label>
              <div className="flex">
                <input type="number" id="loanMonthlyPayment" name="loanMonthlyPayment" value={formData.loanMonthlyPayment} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.loanMonthlyPayment ? 'border-red-500' : ''}`} />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">円/月</span>
              </div>
              {errors.loanMonthlyPayment && <p className="text-red-500 text-xs italic mt-1">{errors.loanMonthlyPayment}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanRemainingYears">残存年数</label>
              <div className="flex">
                <input type="number" id="loanRemainingYears" name="loanRemainingYears" value={formData.loanRemainingYears} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors.loanRemainingYears ? 'border-red-500' : ''}`} />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">年</span>
              </div>
              {errors.loanRemainingYears && <p className="text-red-500 text-xs italic mt-1">{errors.loanRemainingYears}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 将来の住宅購入について */}
      {formData.housingType === '賃貸' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">将来の住宅購入について</h3>
          <label className="block text-gray-700 text-sm font-bold mb-2">将来的に家を購入する予定はありますか？</label>
          <div className="mt-2">
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                className="custom-radio"
              name="housePurchaseIntent"
                value="yes"
              checked={formData.housePurchaseIntent === 'yes'}
                onChange={() => {
                setFormData(prev => ({
                  ...prev,
                  housePurchaseIntent: 'yes',
                  housePurchasePlan: prev.housePurchasePlan === null 
                    ? { age: '', price: '', downPayment: '', loanYears: '', interestRate: '' } 
                    : prev.housePurchasePlan
                }));
                }}
              />
              <span className="ml-2">はい</span>
            </label>
            <label className="inline-flex items-center">
            <input type="radio" className="custom-radio" name="housePurchaseIntent" value="no" checked={formData.housePurchaseIntent === 'no'} onChange={handleInputChange} />
              <span className="ml-2">いいえ</span>
            </label>
          </div>
          {errors.housePurchaseIntent && <p className="text-red-500 text-xs italic mt-2">{errors.housePurchaseIntent}</p>}

          {formData.housePurchasePlan && (
            <div className="mt-4 space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housePurchasePlan.age">購入予定年齢</label>
                <div className="flex">
                  <input type="number" id="housePurchasePlan.age" name="housePurchasePlan.age" value={formData.housePurchasePlan.age ?? ''} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.age'] ? 'border-red-500' : ''}`} required />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
                </div>
                {errors['housePurchasePlan.age'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.age']}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housePurchasePlan.price">予定価格</label>
                <div className="flex">
                  <input type="number" id="housePurchasePlan.price" name="housePurchasePlan.price" value={formData.housePurchasePlan.price ?? ''} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.price'] ? 'border-red-500' : ''}`} required />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
                {errors['housePurchasePlan.price'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.price']}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housePurchasePlan.downPayment">頭金</label>
                <div className="flex">
                  <input type="number" id="housePurchasePlan.downPayment" name="housePurchasePlan.downPayment" value={formData.housePurchasePlan.downPayment ?? ''} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.downPayment'] ? 'border-red-500' : ''}`} required />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
                {errors['housePurchasePlan.downPayment'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.downPayment']}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">ローン年数</label>
                <div className="flex">
                  <input type="number" name="housePurchasePlan.loanYears" value={formData.housePurchasePlan.loanYears ?? ''} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.loanYears'] ? 'border-red-500' : ''}`} required />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">年</span>
                </div>
                {errors['housePurchasePlan.loanYears'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.loanYears']}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">想定金利（%）</label>
                <div className="flex">
                  <input type="number" name="housePurchasePlan.interestRate" value={formData.housePurchasePlan.interestRate ?? ''} onChange={handleInputChange} step="0.1" className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 ${errors['housePurchasePlan.interestRate'] ? 'border-red-500' : ''}`} />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
                </div>
                {errors['housePurchasePlan.interestRate'] && <p className="text-red-500 text-xs italic mt-1">{errors['housePurchasePlan.interestRate']}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {(formData.housingType.startsWith('持ち家') || formData.housePurchasePlan) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">将来リフォームの予定はありますか？</h3>
          <label className="block text-gray-700 text-sm font-bold mb-2">将来的にリフォームする予定はありますか？</label>
          <div className="mt-2">
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                className="custom-radio"
                name="renovationPlanToggle"
                value="yes" checked={formData.houseRenovationPlans.length > 0}
                onChange={() => setFormData((prev: typeof formData) => ({
                  ...prev,
                  houseRenovationPlans:
                    prev.houseRenovationPlans.length > 0 ?
                    prev.houseRenovationPlans :
                    [{ age: undefined as unknown as number, cost: 150, cycleYears: 10 }],
                }))}
              />
              <span className="ml-2">はい</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="custom-radio"
                name="renovationPlanToggle"
                value="no"
                checked={formData.houseRenovationPlans.length === 0}
                onChange={() => setFormData((prev: typeof formData) => ({
                  ...prev,
                  houseRenovationPlans: [],
                }))}
              />
              <span className="ml-2">いいえ</span>
            </label>
          </div>

          {formData.houseRenovationPlans.length > 0 && (() => {
            const plan = formData.houseRenovationPlans[0];
            return (
              <div className="mt-4 space-y-4 border rounded p-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">実施予定年齢</label>
                  <input
                    type="number" 
                    value={plan?.age ?? ''}
                    onChange={(e) => handleRenovationPlanChange(0, 'age', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">費用[万円]</label>
                  <input
                    type="number"
                    value={plan?.cost ?? ''}
                    onChange={(e) => handleRenovationPlanChange(0, 'cost', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">繰り返し頻度[年]</label>
                  <input
                    type="number"
                    value={plan?.cycleYears ?? ''}
                    onChange={(e) => handleRenovationPlanChange(0, 'cycleYears', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default HomeLifeEventSection;
