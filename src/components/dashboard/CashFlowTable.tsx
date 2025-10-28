import type { EnrichedYearlyAsset } from '../../utils/simulation';

interface CashFlowTableProps {
  enrichedData: EnrichedYearlyAsset[];
}

const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '¥ -';
  }
  return `¥${Math.round(value).toLocaleString()}`;
};

export default function CashFlowTable({ enrichedData }: CashFlowTableProps) {
  if (!enrichedData || enrichedData.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2">年</th>
            <th className="px-4 py-2 text-right">①年間収入</th>
            <th className="px-4 py-2 text-right">②年間支出</th>
            <th className="px-4 py-2 text-right">③年間投資額</th>
            <th className="px-4 py-2 text-right">年間収支(①‐(②+③))</th>
            <th className="px-4 py-2 text-right">現金預金残高</th>
            <th className="px-4 py-2 text-right">金融商品残高</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {enrichedData.map((d) => (
            <tr key={d.year} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{d.year}年 ({d.age}歳)</td>
              <td className="px-4 py-2 text-right">{formatCurrency(d.年間収入)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(d.年間支出)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(d.年間投資額)}</td>
              <td className={`px-4 py-2 text-right font-semibold ${d.年間収支 >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {d.年間収支 >= 0 ? '+' : ''}{formatCurrency(d.年間収支)}
              </td>
              <td className="px-4 py-2 text-right">{formatCurrency(d.現金)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency((d.NISA || 0) + (d.iDeCo || 0) + (d.課税口座 || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}