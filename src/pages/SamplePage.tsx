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
import { useState } from 'react';
import { data } from '../assets/sampleData';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

export default function SamplePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    age: '35',
    retireAge: '65',
    income: '6000000',
    expense: '4000000',
    nisa: '600000',
    ideco: '276000',
    stockYield: '5.0',
    bondYield: '1.0',
    inflation: '1.5',
    medical: '2.0',
    withdrawRate: '4.0',
  });

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

  const handleSave = (key: string) => {
    setEditFields((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="relative bg-gray-100 min-h-screen">
      <button
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => navigate('/')}
        aria-label="トップに戻る"
      >
        ×
      </button>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => setMenuOpen(true)}
        aria-label="メニューを開く"
      >
        ≡
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto
        lg:fixed lg:top-0 lg:right-0 lg:h-screen lg:translate-x-0 lg:w-80
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 text-center">
          <button
            className="lg:hidden absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full text-lg"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>

          <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center text-3xl text-blue-600">
            👤
          </div>
          <h2 className="text-lg font-bold">Mark Devid</h2>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">現在の総資産</p>
            <p className="text-xl font-semibold text-blue-600">
              ¥{latest.総資産.toLocaleString()}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">65歳時点予測資産</p>
            <p className="text-xl font-semibold text-green-600">¥64,390,120</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">資産寿命予測</p>
            <p className="text-xl font-semibold text-yellow-600">88歳</p>
          </div>

          <div className="text-left text-sm space-y-2">
            {Object.entries(formData).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="block font-semibold mb-1">{labelMap[key]}：</label>
                  {editFields[key] ? (
                    <div className="flex gap-2">
                      <input
                        value={val}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full border px-2 py-1 text-sm rounded"
                      />
                      <button
                        onClick={() => handleSave(key)}
                        className="bg-blue-600 text-white text-sm px-3 rounded"
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <p>{val}</p>
                  )}
                </div>
                {!editFields[key] && (
                  <button
                    onClick={() => setEditFields((prev) => ({ ...prev, [key]: true }))}
                    className="text-blue-600 mt-6"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold mt-6">
            再シミュレーション実行
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 lg:mr-80">
        <h2 className="text-2xl font-bold text-center mb-6">資産管理ダッシュボード</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4 md:col-span-2">
            <h3 className="text-lg font-semibold mb-2">積立元本推移（〜2050年）</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={enrichedData.filter((d) => d.year <= 2050)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="NISA" stroke="#6366F1" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="iDeCo" stroke="#06B6D4" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4 overflow-x-auto md:col-span-2">
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
        </div>
      </div>
    </div>
  );
}

const labelMap: Record<string, string> = {
  age: '現在の年齢',
  retireAge: '退職予定年齢',
  income: '年間収入（円）',
  expense: '年間支出（円）',
  nisa: 'NISA 積立額（円）',
  ideco: 'iDeCo 積立額（円）',
  stockYield: '株式市場の利回り（％）',
  bondYield: '債券の利回り（％）',
  inflation: 'インフレ率（％）',
  medical: '医療費の増加率（％）',
  withdrawRate: '初期取り崩し率（％）',
};