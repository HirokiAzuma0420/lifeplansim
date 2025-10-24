import type { YearlyData } from '../types/simulation';

export type EnrichedYearlyAsset = {
  year: number;
  現金: number;
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
    const productAssets = (entry.products && typeof entry.products === 'object')
      ? Object.fromEntries(
          Object.entries(entry.products).map(([key, value]) => [key, sanitize(value)])
        )
      : {};

    return {
      year: entry.year,
      現金: sanitize(entry.savings),
      nisa: sanitize(entry.nisa),
      ideco: sanitize(entry.ideco),
      ...productAssets,
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