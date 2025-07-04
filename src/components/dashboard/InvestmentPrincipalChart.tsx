import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InvestmentPrincipalChartProps {
  enrichedData: { year: number; NISA: number; iDeCo: number; }[];
}

export default function InvestmentPrincipalChart({ enrichedData }: InvestmentPrincipalChartProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">積立元本推移（〜2050年）</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart 
          data={enrichedData.filter((d) => d.year <= 2050)}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} 
            label={{ value: '金額', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="NISA" stroke="#6366F1" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="iDeCo" stroke="#06B6D4" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}