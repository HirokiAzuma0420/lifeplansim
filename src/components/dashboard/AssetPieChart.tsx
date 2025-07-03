
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

export default function AssetPieChart({ data }: { data: any[] }) {
  const pieColors = [COLORS.現金, COLORS.NISA, COLORS.iDeCo];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">資産保有割合（最新年）</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
