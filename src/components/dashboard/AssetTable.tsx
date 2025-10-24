interface AssetTableProps {
  enrichedData: { year: number; 現金?: number; NISA?: number; iDeCo?: number; 総資産?: number; [key: string]: any }[];
}

export default function AssetTable({ enrichedData }: AssetTableProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-2">資産詳細テーブル</h3>
      <div className="overflow-x-auto max-h-[360px] overflow-y-scroll">
        <table className="min-w-full table-auto text-sm">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-2 py-1">年</th>
              <th className="px-2 py-1">現金</th>
              <th className="px-2 py-1">NISA</th>
              <th className="px-2 py-1">iDeCo</th>
              <th className="px-2 py-1">総資産</th>
              <th className="px-2 py-1">NISA積立</th>
              <th className="px-2 py-1">iDeCo積立</th>
            </tr>
          </thead>
          <tbody>
            {enrichedData.map((d) => (
              <tr key={d.year} className="text-right border-b">
                <td className="px-2 py-1 text-left">{d.year}</td>
                <td className="px-2 py-1">{d.現金.toLocaleString()}</td>
                <td className="px-2 py-1">{d.NISA.toLocaleString()}</td>
                <td className="px-2 py-1">{d.iDeCo.toLocaleString()}</td>
                <td className="px-2 py-1 font-semibold">{d.総資産.toLocaleString()}</td>
                <td className="px-2 py-1">{d['NISA']?.toLocaleString() ?? '-'}</td>
                <td className="px-2 py-1">{d['iDeCo']?.toLocaleString() ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}