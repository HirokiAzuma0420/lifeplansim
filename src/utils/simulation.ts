import type { YearlyData } from '../types/simulation';

export type EnrichedYearlyAsset = {
  year: number;
  総資産: number;
  投資元本: number;
  [key: string]: number; // 商品別のキーを許容
};

export interface DashboardDataset {
  enrichedData: EnrichedYearlyAsset[];
  pieData: { name: string; value: number }[];
  latestYear?: YearlyData;
  firstYear?: YearlyData;
}

const keyToJapaneseMap: { [key: string]: string } = {
  savings: '現金',
  nisa: 'NISA',
  ideco: 'iDeCo',
  stocks: '株式',
  trust: '投資信託',
  bonds: '債券',
  crypto: '仮想通貨',
  other: 'その他',
};

const sanitize = (value: number | undefined | null): number => {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.round(value as number);
};

export const buildDashboardDataset = (yearlyData: YearlyData[]): DashboardDataset => {
  if (!Array.isArray(yearlyData) || yearlyData.length === 0) {
    return {
      enrichedData: [],
      pieData: [],
      latestYear: undefined,
      firstYear: undefined,
    };
  }

  const enrichedData: EnrichedYearlyAsset[] = yearlyData.map((entry) => {
    const assets: { [key: string]: number } = {};
    
    const allAssets = {
      savings: entry.savings,
      nisa: entry.nisa,
      ideco: entry.ideco,
      ...(entry.products || {}),
    };

    for (const [key, value] of Object.entries(allAssets)) {
      const japaneseKey = keyToJapaneseMap[key] || key;
      assets[japaneseKey] = sanitize(value);
    }

    return {
      year: entry.year,
      ...assets,
      総資産: sanitize(entry.totalAssets),
      投資元本: sanitize(entry.investedPrincipal),
    };
  });

  const latestYear = yearlyData[yearlyData.length - 1];
  const firstYear = yearlyData[0];

  const latestEntry = enrichedData[enrichedData.length - 1];
  const pieData = latestEntry
    ? Object.entries(latestEntry)
        .filter(([key]) => !['year', '総資産', '投資元本'].includes(key))
        .map(([name, value]) => ({ name, value: Math.max(0, value) }))
        .filter((item) => item.value > 0)
    : [];

  return {
    enrichedData,
    pieData,
    latestYear,
    firstYear,
  };
};