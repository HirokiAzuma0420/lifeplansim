import React from 'react';
import type { FormDataState, InvestmentMonthlyAmounts } from '@/types/form-types';
import AssetAccordion from '@/components/AssetAccordion';

interface InvestmentSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  monthlyInvestmentAmounts: InvestmentMonthlyAmounts;
}
/*
interface InvestmentFormValues {
  investmentStocksCurrent: string | number;
  investmentStocksAnnualSpot: string | number;
  investmentStocksRate: string | number;
  investmentTrustCurrent: string | number;
  investmentTrustAnnualSpot: string | number;
  investmentTrustRate: string | number;
  investmentBondsCurrent: string | number;
  investmentBondsAnnualSpot: string | number;
  investmentBondsRate: string | number;
  investmentIdecoCurrent: string | number;
  investmentIdecoAnnualSpot: string | number;
  investmentIdecoRate: string | number;
  investmentCryptoCurrent: string | number;
  investmentCryptoAnnualSpot: string | number;
  investmentCryptoRate: string | number;
  investmentOtherCurrent: string | number;
  investmentOtherAnnualSpot: string | number;
  investmentOtherRate: string | number;
}*/

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ formData, handleInputChange, monthlyInvestmentAmounts }) => {
  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-investment.png" alt="Investment" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">投資に関する質問</h2>
      <div className="space-y-4">
        <AssetAccordion
          assetName="株式"
          assetKey="investmentStocks"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentStocksAccountType"
          accountTypeValue={formData.investmentStocksAccountType}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentStocksCurrent" value={formData.investmentStocksCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentStocksRate" value={formData.investmentStocksRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
        <AssetAccordion
          assetName="投資信託"
          assetKey="investmentTrust"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentTrustAccountType"
          accountTypeValue={formData.investmentTrustAccountType}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentTrustCurrent" value={formData.investmentTrustCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentTrustRate" value={formData.investmentTrustRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
        <AssetAccordion
          assetName="債券"
          assetKey="investmentBonds"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentBondsCurrent" value={formData.investmentBondsCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentBondsRate" value={formData.investmentBondsRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
        <AssetAccordion
          assetName="iDeCo"
          assetKey="investmentIdeco"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentIdecoCurrent" value={formData.investmentIdecoCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentIdecoRate" value={formData.investmentIdecoRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
        <AssetAccordion
          assetName="仮想通貨"
          assetKey="investmentCrypto"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentCryptoCurrent" value={formData.investmentCryptoCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentCryptoRate" value={formData.investmentCryptoRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
        <AssetAccordion
          assetName="その他"
          assetKey="investmentOther"
          formData={formData}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentOtherAccountType"
          accountTypeValue={formData.investmentOtherAccountType}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">現在の評価額</label>
              <div className="flex">
                <input type="number" name="investmentOtherCurrent" value={formData.investmentOtherCurrent} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">期待利回り（年率）</label>
              <div className="flex">
                <input type="number" name="investmentOtherRate" value={formData.investmentOtherRate} onChange={handleInputChange} className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700" />
                <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </AssetAccordion>
      </div>
    </div>
  );
};

export default InvestmentSection;
