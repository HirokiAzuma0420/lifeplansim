import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FormDataState, InvestmentMonthlyAmounts, InvestmentAssetKey, InvestmentAccountTypeField } from '@/types/form-types';

interface InvestmentSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  monthlyInvestmentAmounts: InvestmentMonthlyAmounts;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'nisa' as const, label: 'NISA口座' },
  { value: 'taxable' as const, label: '特定口座' },
];

interface AssetAccordionProps {
  assetName: string;
  assetKey: InvestmentAssetKey;
  accountTypeFieldName?: InvestmentAccountTypeField;
  children: (isNisa: boolean) => React.ReactNode;
}

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ formData, handleInputChange, monthlyInvestmentAmounts }) => {
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  const toggleAccordion = (assetKey: string) => {
    setOpenAccordions(prev =>
      prev.includes(assetKey) ? prev.filter(k => k !== assetKey) : [...prev, assetKey]
    );
  };

  const renderAssetAccordion = ({ assetName, assetKey, accountTypeFieldName, children }: AssetAccordionProps) => {
    const isOpen = openAccordions.includes(assetKey);
    const accountTypeValue = accountTypeFieldName ? formData[accountTypeFieldName] : 'taxable';
    const isNisa = accountTypeValue === 'nisa';

    return (
      <div className="border border-gray-200 rounded-lg mb-2">
        <button
          type="button"
          className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none"
          onClick={() => toggleAccordion(assetKey)}
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${assetKey}`}
        >
          <span>{assetName}</span>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div
          id={`accordion-content-${assetKey}`}
          role="region"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 border-t border-gray-200">
            {accountTypeFieldName && (
              <div className="mb-4">
                <span className="block text-gray-700 text-sm font-bold mb-2">口座を選択</span>
                <div className="flex flex-wrap gap-6 mt-2">
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={accountTypeFieldName}
                        value={option.value}
                        checked={accountTypeValue === option.value}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {children(isNisa)}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}Monthly`}>
                月額積立
              </label>
              <div className="flex">
                <input
                  type="number"
                  id={`${assetKey}Monthly`}
                  name={`${assetKey}Monthly`}
                  value={monthlyInvestmentAmounts[`${assetKey}Monthly`]}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  defaultValue="0"
                  min="0"
                />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">円</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}AnnualSpot`}>
                年間スポット
              </label>
              <div className="flex">
                <input
                  type="number"
                  id={`${assetKey}AnnualSpot`}
                  name={`${assetKey}AnnualSpot`}
                  value={formData[`${assetKey}AnnualSpot`]}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  defaultValue="0"
                  min="0"
                />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">円</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}Rate`}>
                想定利率（年率）
              </label>
              <div className="flex">
                <input
                  type="number"
                  id={`${assetKey}Rate`}
                  name={`${assetKey}Rate`}
                  value={formData[`${assetKey}Rate`]}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.1"
                  min="0"
                />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNisaFields = (assetKey: InvestmentAssetKey) => {
    const gainLossSignKey = `${assetKey}GainLossSign` as keyof FormDataState;
    const gainLossRateKey = `${assetKey}GainLossRate` as keyof FormDataState;

    return (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">評価損益率</label>
        <div className="flex items-center">
          <div className="flex">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={gainLossSignKey}
                value="+"
                checked={formData[gainLossSignKey] === '+'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">+</span>
            </label>
            <label className="inline-flex items-center ml-4">
              <input
                type="radio"
                name={gainLossSignKey}
                value="-"
                checked={formData[gainLossSignKey] === '-'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-red-600"
              />
              <span className="ml-2 text-gray-700">-</span>
            </label>
          </div>
          <div className="flex ml-4">
            <input
              type="number"
              name={gainLossRateKey}
              value={formData[gainLossRateKey] as string | number}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700"
              step="0.1"
            />
            <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-investment.png" alt="Investment" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">投資に関する質問</h2>
      <div className="space-y-4">
        {renderAssetAccordion({
          assetName: '株式',
          assetKey: 'investmentStocks',
          accountTypeFieldName: 'investmentStocksAccountType',
          children: (isNisa) => (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{isNisa ? '現在の評価総額' : '現在の評価額'}</label>
                <div className="flex">
                  <input type="number" name="investmentStocksCurrent" value={formData.investmentStocksCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
              </div>
              {isNisa && renderNisaFields('investmentStocks')}
            </>
          ),
        })}
        {renderAssetAccordion({
          assetName: '投資信託',
          assetKey: 'investmentTrust',
          accountTypeFieldName: 'investmentTrustAccountType',
          children: (isNisa) => (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{isNisa ? '現在の評価総額' : '現在の評価額'}</label>
                <div className="flex">
                  <input type="number" name="investmentTrustCurrent" value={formData.investmentTrustCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
              </div>
              {isNisa && renderNisaFields('investmentTrust')}
            </>
          ),
        })}
        {renderAssetAccordion({
          assetName: '債券',
          assetKey: 'investmentBonds',
          children: () => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentBondsCurrent" value={formData.investmentBondsCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
          ),
        })}
        {renderAssetAccordion({
          assetName: 'iDeCo',
          assetKey: 'investmentIdeco',
          children: () => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentIdecoCurrent" value={formData.investmentIdecoCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
          ),
        })}
        {renderAssetAccordion({
          assetName: '仮想通貨',
          assetKey: 'investmentCrypto',
          children: () => (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentCryptoCurrent" value={formData.investmentCryptoCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
          ),
        })}
        {renderAssetAccordion({
          assetName: 'その他',
          assetKey: 'investmentOther',
          accountTypeFieldName: 'investmentOtherAccountType',
          children: (isNisa) => (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{isNisa ? '現在の評価総額' : '現在の評価額'}</label>
                <div className="flex">
                  <input type="number" name="investmentOtherCurrent" value={formData.investmentOtherCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                  <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
                </div>
              </div>
              {isNisa && renderNisaFields('investmentOther')}
            </>
          ),
        })}
      </div>
    </div>
  );
};

export default InvestmentSection;