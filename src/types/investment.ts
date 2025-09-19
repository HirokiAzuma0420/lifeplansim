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
  | 'investmentTrustAccountType';

export type InvestmentMonthlyField = `${InvestmentAssetKey}Monthly`;

export type InvestmentFormValues = Record<InvestmentValueField, string>;

export type InvestmentMonthlyAmounts = Record<InvestmentMonthlyField, string>;
