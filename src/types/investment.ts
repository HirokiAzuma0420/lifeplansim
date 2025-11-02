export type InvestmentAssetKey =
  | 'investmentStocks'
  | 'investmentTrust'
  | 'investmentBonds'
  | 'investmentIdeco'
  | 'investmentCrypto'
  | 'investmentOther';

export type InvestmentValueField =
  | `${InvestmentAssetKey}Current`
  | `${InvestmentAssetKey}AnnualSpot`
  | `${InvestmentAssetKey}Rate`;

export type InvestmentAccountTypeField =
  | 'investmentStocksAccountType'
  | 'investmentTrustAccountType'
  | 'investmentOtherAccountType';

export type InvestmentMonthlyField = `${InvestmentAssetKey}Monthly`;

export type InvestmentFormValues = Record<InvestmentValueField, string | number>;

export type InvestmentMonthlyAmounts = Record<InvestmentMonthlyField, string | number>;
