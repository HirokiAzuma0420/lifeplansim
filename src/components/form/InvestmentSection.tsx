import React from 'react';
import type { FormDataState, InvestmentMonthlyAmounts } from '@/types/form-types';
import AssetAccordion from "@/components/AssetAccordion";

interface InvestmentSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  monthlyInvestmentAmounts: InvestmentMonthlyAmounts;
}

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
}

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ formData, handleInputChange, monthlyInvestmentAmounts }) => {
  const investmentFormValues: InvestmentFormValues = {
    investmentStocksCurrent: formData.investmentStocksCurrent,
    investmentStocksAnnualSpot: formData.investmentStocksAnnualSpot,
    investmentStocksRate: formData.investmentStocksRate,
    investmentTrustCurrent: formData.investmentTrustCurrent,
    investmentTrustAnnualSpot: formData.investmentTrustAnnualSpot,
    investmentTrustRate: formData.investmentTrustRate,
    investmentBondsCurrent: formData.investmentBondsCurrent,
    investmentBondsAnnualSpot: formData.investmentBondsAnnualSpot,
    investmentBondsRate: formData.investmentBondsRate,
    investmentIdecoCurrent: formData.investmentIdecoCurrent,
    investmentIdecoAnnualSpot: formData.investmentIdecoAnnualSpot,
    investmentIdecoRate: formData.investmentIdecoRate,
    investmentCryptoCurrent: formData.investmentCryptoCurrent,
    investmentCryptoAnnualSpot: formData.investmentCryptoAnnualSpot,
    investmentCryptoRate: formData.investmentCryptoRate,
    investmentOtherCurrent: formData.investmentOtherCurrent,
    investmentOtherAnnualSpot: formData.investmentOtherAnnualSpot,
    investmentOtherRate: formData.investmentOtherRate,
  };

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
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentStocksAccountType"
          accountTypeValue={formData.investmentStocksAccountType}
        />
        <AssetAccordion
          assetName="投資信託"
          assetKey="investmentTrust"
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentTrustAccountType"
          accountTypeValue={formData.investmentTrustAccountType}
        />
        <AssetAccordion
          assetName="債券"
          assetKey="investmentBonds"
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        />
        <AssetAccordion
          assetName="iDeCo"
          assetKey="investmentIdeco"
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        />
        <AssetAccordion
          assetName="仮想通貨"
          assetKey="investmentCrypto"
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
        />
        <AssetAccordion
          assetName="その他"
          assetKey="investmentOther"
          formData={investmentFormValues}
          handleInputChange={handleInputChange}
          monthlyInvestmentAmounts={monthlyInvestmentAmounts}
          accountTypeFieldName="investmentOtherAccountType"
          accountTypeValue={formData.investmentOtherAccountType}
        />
      </div>
    </div>
  );
};

export default InvestmentSection;
