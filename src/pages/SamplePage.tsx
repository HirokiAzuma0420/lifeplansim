import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { data } from '../assets/sampleData';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

export default function SamplePage() {
  const navigate = useNavigate();

  const enrichedData = data.map((d) => ({
    ...d,
    総資産: d.現金 + d.NISA + d.iDeCo,
  }));

  const latest = enrichedData[enrichedData.length - 1];
  const pieData = [
    { name: '現金', value: latest.現金 },
    { name: 'NISA', value: latest.NISA },
    { name: 'iDeCo', value: latest.iDeCo },
  ];
  const pieColors = [COLORS.現金, COLORS.NISA, COLORS.iDeCo];

  return (
    <div className="relative p-4 md:p-8 bg-gray-100 min-h-screen">
      {/* ✖️ 閉じるボタン */}
      <button
        className="absolute top-4 right-4 w-10 h-10 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-100 transition duration-150 flex items-center justify-center text-xl font-bold"
        onClick={() => navigate('/')}
        aria-label="閉じる"
        title="トップへ戻る"
      >
        ×
      </button>

      <h2 className="text-2xl font-bold text-center mb-6">資産管理ダッシュボード</h2>

      <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
        {/* ① 総資産推移グラフ */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">総資産時系列推移</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={enrichedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="現金" stroke={COLORS.現金} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="NISA" stroke={COLORS.NISA} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="iDeCo" stroke={COLORS.iDeCo} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ② 保有割合（円グラフ） */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">資産保有割合（最新年）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(1)}%`
                }
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ③ 積立元本推移（〜2050年） */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">積立元本推移（〜2050年）</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={enrichedData.filter((d) => d.year <= 2050)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="NISA累積" stroke="#6366F1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="iDeCo累積" stroke="#06B6D4" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ④ 資産詳細テーブル */}
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">資産詳細テーブル</h3>
          <div className="overflow-x-auto max-h-[360px] overflow-y-scroll">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-2 py-1">年</th>
                  <th className="px-2 py-1">現金</th>
                  <th className="px-2 py-1">NISA</th>
                  <th className="px-2 py-1">iDeCo</th>
                  <th className="px-2 py-1">総資産</th>
                  <th className="px-2 py-1">NISA累積</th>
                  <th className="px-2 py-1">iDeCo累積</th>
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
                    <td className="px-2 py-1">{d['NISA累積']?.toLocaleString() ?? '-'}</td>
                    <td className="px-2 py-1">{d['iDeCo累積']?.toLocaleString() ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
