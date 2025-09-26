import type { YearlyData } from '../types/simulation';

export type EnrichedYearlyAsset = {
  year: number;
  現金: number;
  NISA: number;
  iDeCo: number;
  総資産: number;
  投資元本: number;
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

  const enrichedData: EnrichedYearlyAsset[] = yearlyData.map((entry) => ({
    year: entry.year,
    現金: sanitize(entry.savings),
    NISA: sanitize(entry.nisa),
    iDeCo: sanitize(entry.ideco),
    総資産: sanitize(entry.totalAssets),
    投資元本: sanitize(entry.investedPrincipal),
  }));

  const latestYear = yearlyData[yearlyData.length - 1];
  const firstYear = yearlyData[0];

  const latestEntry = enrichedData[enrichedData.length - 1];
  const pieData = latestEntry
    ? ([
        { name: '現金', value: Math.max(0, latestEntry.現金) },
        { name: 'NISA', value: Math.max(0, latestEntry.NISA) },
        { name: 'iDeCo', value: Math.max(0, latestEntry.iDeCo) },
      ] as const).filter((item) => item.value > 0)
    : [];

  return {
    enrichedData,
    pieData,
    latestYear,
    firstYear,
  };
};