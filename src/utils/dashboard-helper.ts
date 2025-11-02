import type { PercentileData, YearlyData, AccountBucket, SimulationInputParams } from '../types/simulation-types';

// グラフ描画用のデータ形式
export interface EnrichedYearlyAsset {
  age: number;
  year: number;
  総資産: number;
  投資元本: number;
  現金: number;
  年間支出: number;
  年間収入: number;
  年間投資額: number;
  年間収支: number;
  NISA: number;
  iDeCo: number;
  課税口座: number;
  [key: string]: number | undefined;
}

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
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num);
};

export const buildDashboardDataset = (
  yearlyData: YearlyData[],
  _inputParams: SimulationInputParams | undefined,
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

  const enrichedData: EnrichedYearlyAsset[] = yearlyData.map((entry, i) => {
    const nisaPrincipal = sanitize(entry.nisa.principal);
    const idecoPrincipal = sanitize(entry.ideco.principal);
    const taxablePrincipal = sanitize(entry.taxable.principal);

    const prevEntry = i > 0 ? yearlyData[i - 1] : null;
    const prevNisaPrincipal = prevEntry ? sanitize(prevEntry.nisa.principal) : 0;
    const prevIdecoPrincipal = prevEntry ? sanitize(prevEntry.ideco.principal) : 0;
    const prevTaxablePrincipal = prevEntry ? sanitize(prevEntry.taxable.principal) : 0;

    // 年間投資額を元本の差分から計算。ただし初年度はシミュレーションの値を正とする
    const principalChange = (nisaPrincipal - prevNisaPrincipal) + (idecoPrincipal - prevIdecoPrincipal) + (taxablePrincipal - prevTaxablePrincipal); // 投資額は元本の差分
    const investmentAmount = i === 0 ? sanitize(entry.investmentPrincipal - (prevEntry?.investmentPrincipal ?? 0)) : Math.max(0, principalChange);

    const nisaContribution = Math.max(0, nisaPrincipal - prevNisaPrincipal);
    const idecoContribution = Math.max(0, idecoPrincipal - prevIdecoPrincipal);

    const result: EnrichedYearlyAsset = {
      age: entry.age,
      year: entry.year,
      p10: sanitize(percentileData?.p10[i]),
      p90: sanitize(percentileData?.p90[i]),
      総資産: sanitize(entry.totalAssets),
      投資元本: sanitize(entry.investmentPrincipal),
      年間収入: sanitize(entry.income),
      年間投資額: investmentAmount, // 修正後の値を使用
      年間収支: sanitize(entry.balance), // APIからの値を直接使用
      年間支出: sanitize(entry.expense),
      現金: sanitize(entry.savings),
      NISA: sanitize(entry.nisa.balance),
      iDeCo: sanitize(entry.ideco.balance),
      課税口座: sanitize(entry.taxable.balance),
      NISA元本: nisaPrincipal,
      iDeCo元本: idecoPrincipal,
      課税口座元本: taxablePrincipal,
      NISA積立: nisaContribution,
      iDeCo積立: idecoContribution,
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
        .map(([name, value]) => ({ name, value: Math.max(0, value || 0) }))
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