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
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-4">年間収支詳細</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">年</th>
              <th className="px-4 py-2 text-right">年間収入</th>
              <th className="px-4 py-2 text-right">年間支出</th>
              <th className="px-4 py-2 text-right">年間投資額</th>
              <th className="px-4 py-2 text-right">年間収支</th>
              <th className="px-4 py-2 text-right">現金預金残高</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {enrichedData.map((d, index) => {
              const prevSavings = index > 0 ? enrichedData[index - 1].現金 : 0;
              const cashFlow = d.現金 - prevSavings;
              const investment = d.投資元本 - (index > 0 ? enrichedData[index - 1].投資元本 : 0);
              // 収入と支出は直接データがないため、キャッシュフローと投資額から逆算
              // この計算は概算であり、APIから直接データを受け取る方が正確
              const income = cashFlow + investment + d.年間支出;

              return (
                <tr key={d.year} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{d.year}年 ({d.age}歳)</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(income)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(d.年間支出)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(investment)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${cashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {cashFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow)}
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(d.現金)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}