﻿import type { PercentileData, YearlyData, AccountBucket } from '../types/simulation';

// グラフ描画用のデータ形式
export type EnrichedYearlyAsset = {
  year: number;
  総資産: number;
  投資元本: number;
  p10?: number;
  p90?: number;
  現金: number;
  NISA: number;
  iDeCo: number;
  課税口座: number;
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

export const buildDashboardDataset = (yearlyData: YearlyData[], percentileData?: PercentileData): DashboardDataset => {
  if (!Array.isArray(yearlyData) || yearlyData.length === 0) {
    return {
      enrichedData: [],
      detailedAssetData: [],
      pieData: [],
      latestYear: undefined,
      firstYear: undefined,
    };
  }

  const enrichedData: EnrichedYearlyAsset[] = yearlyData.map((entry, i) => {
    const totalPrincipal = entry.nisa.principal + entry.ideco.principal + entry.taxable.principal;
    return {
      year: entry.year,
      p10: percentileData?.p10[i],
      p90: percentileData?.p90[i],
      総資産: sanitize(entry.totalAssets),
      投資元本: sanitize(totalPrincipal),
      現金: sanitize(entry.savings),
      NISA: sanitize(entry.nisa.balance),
      iDeCo: sanitize(entry.ideco.balance),
      課税口座: sanitize(entry.taxable.balance),
    };
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
        .filter(([key]) => ['現金', 'NISA', 'iDeCo', '課税口座'].includes(key))
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