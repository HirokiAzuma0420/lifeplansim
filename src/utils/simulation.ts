﻿import type { PercentileData, YearlyData, AccountBucket, SimulationInputParams, InvestmentProduct } from '../types/simulation';

// グラフ描画用のデータ形式
export type EnrichedYearlyAsset = {
  age: number;
  year: number;
  総資産: number;
  投資元本: number;
  p10?: number;
  p90?: number;
  現金: number;
  年間支出: number;
  NISA: number;
  iDeCo: number;
  課税口座: number;
  // 動的に追加されるプロパティを許容
  [key: string]: any;
};

// ツールチップ表示用の詳細データ形式
export type DetailedAssetData = {
  year: number;
  NISA: AccountBucket;
  iDeCo: AccountBucket;
  課税口座: AccountBucket;
};

export interface DashboardDataset {
  enrichedData: EnrichedYearlyAsset[];
  detailedAssetData: DetailedAssetData[]; // ツールチップ用の詳細データを追加
  pieData: { name: string; value: number }[];
  latestYear?: YearlyData;
  firstYear?: YearlyData;
}

const sanitize = (value: number | undefined | null): number => {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.round(value as number);
};

export const buildDashboardDataset = (
  yearlyData: YearlyData[],
  inputParams: SimulationInputParams | undefined,
  percentileData?: PercentileData): DashboardDataset => {
  if (!Array.isArray(yearlyData) || yearlyData.length === 0) {
    return {
      enrichedData: [],
      detailedAssetData: [],
      pieData: [],
      latestYear: undefined,
      firstYear: undefined,
    };
  }

  const productList = inputParams?.products ?? [];

  const enrichedData: EnrichedYearlyAsset[] = yearlyData.map((entry, i) => {
    const nisaPrincipal = sanitize(entry.nisa.principal);
    const idecoPrincipal = sanitize(entry.ideco.principal);
    const taxablePrincipal = sanitize(entry.taxable.principal);
    const totalPrincipal = nisaPrincipal + idecoPrincipal + taxablePrincipal;

    const prevEntry = i > 0 ? yearlyData[i - 1] : null;
    const prevNisaPrincipal = prevEntry ? sanitize(prevEntry.nisa.principal) : 0;
    const prevIdecoPrincipal = prevEntry ? sanitize(prevEntry.ideco.principal) : 0;
    const nisaContribution = nisaPrincipal - prevNisaPrincipal;
    const idecoContribution = idecoPrincipal - prevIdecoPrincipal;

    const productPrincipals: Record<string, number> = {};
    if (entry.products && productList.length > 0) {
      productList.forEach((p: InvestmentProduct, index: number) => {
        const productId = `${p.key}-${index}`;
        const productData = entry.products[productId];
        if (productData) {
          // iDeCoとNISAは専用のキーで集計済みなので、ここでは課税口座のみを対象とする
          if (p.account === '課税') {
            const name = `${p.key} (${p.account})元本`;
            productPrincipals[name] = (productPrincipals[name] || 0) + productData.principal;
          }
        }
      });
    }


    const result: EnrichedYearlyAsset = {
      age: entry.age,
      year: entry.year,
      p10: percentileData?.p10[i],
      p90: percentileData?.p90[i],
      総資産: sanitize(entry.totalAssets),
      投資元本: totalPrincipal,
      年間支出: sanitize(entry.totalExpense),
      現金: sanitize(entry.savings),
      NISA: sanitize(entry.nisa.balance),
      iDeCo: sanitize(entry.ideco.balance),
      課税口座: sanitize(entry.taxable.balance),
      NISA元本: nisaPrincipal,
      iDeCo元本: idecoPrincipal,
      NISA積立: nisaContribution,
      iDeCo積立: idecoContribution,
      ...productPrincipals,
    };

    return result;
  });

  const detailedAssetData: DetailedAssetData[] = yearlyData.map(entry => ({
    year: entry.year,
    NISA: entry.nisa,
    iDeCo: entry.ideco,
    課税口座: entry.taxable,
  }));

  const latestYear = yearlyData[yearlyData.length - 1];
  const firstYear = yearlyData[0];

  const latestEntry = enrichedData[enrichedData.length - 1];
  const pieData = latestEntry
    ? Object.entries(latestEntry)
        .filter(([key]) => ['現金', 'NISA', 'iDeCo', '課税口座', '株式', '投資信託', '債券', '仮想通貨', 'その他'].includes(key))
        .map(([name, value]) => ({ name, value: Math.max(0, value) }))
        .filter((item) => item.value > 0)
    : [];

  return {
    enrichedData,
    detailedAssetData,
    pieData,
    latestYear,
    firstYear,
  };
};