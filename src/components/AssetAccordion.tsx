import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type {
  InvestmentAccountTypeField,
  InvestmentAssetKey,
  InvestmentFormValues,
  InvestmentMonthlyAmounts,
} from '../types/investment';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'nisa' as const, label: 'NISA口座'},
  { value: 'taxable' as const, label: '特定口座'},
];

interface AssetAccordionProps {
  assetName: string;
  formData: InvestmentFormValues;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  monthlyInvestmentAmounts: InvestmentMonthlyAmounts;
  assetKey: InvestmentAssetKey;
  accountTypeFieldName?: InvestmentAccountTypeField;
  accountTypeValue?: 'nisa' | 'taxable';
}

const AssetAccordion: React.FC<AssetAccordionProps> = ({
  assetName,
  formData,
  handleInputChange,
  monthlyInvestmentAmounts,
  assetKey,
  accountTypeFieldName,
  accountTypeValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-2">
      <button
        type="button"
        className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none"
        onClick={toggleAccordion}
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
          {accountTypeFieldName ? (
            <div className="mb-4">
              <span className="block text-gray-700 text-sm font-bold mb-2">投資に関する質問</span>
              <div className="flex flex-wrap gap-6 mt-2">
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name={accountTypeFieldName}
                      value={option.value}
                      checked={(accountTypeValue ?? 'taxable') === option.value}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}Current`}>
              現在の資産[万円]
            </label>
            <input
              type="number"
              id={`${assetKey}Current`}
              name={`${assetKey}Current`}
              value={formData[`${assetKey}Current`]}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="例：300"
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}Monthly`}>
              月額積立[円]
            </label>
            <input
              type="number"
              id={`${assetKey}Monthly`}
              name={`${assetKey}Monthly`}
              value={monthlyInvestmentAmounts[`${assetKey}Monthly`]}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue="0"
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}AnnualSpot`}>
              年間スポット[円]
            </label>
            <input
              type="number"
              id={`${assetKey}AnnualSpot`}
              name={`${assetKey}AnnualSpot`}
              value={formData[`${assetKey}AnnualSpot`]}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              defaultValue="0"
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`${assetKey}Rate`}>
              想定利率[%]
            </label>
            <input
              type="number"
              id={`${assetKey}Rate`}
              name={`${assetKey}Rate`}
              value={formData[`${assetKey}Rate`]}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAccordion;



