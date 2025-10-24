import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InvestmentPrincipalChartProps {
  enrichedData: { year: number; NISA?: number; iDeCo?: number; [key: string]: any }[];
}

export default function InvestmentPrincipalChart({ enrichedData }: InvestmentPrincipalChartProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">積立元本推移（〜2050年）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart 
          data={enrichedData.filter((d) => d.year <= 2050)}
          margin={{ top: 20, right: 20, left: 50, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            tickFormatter={(v) => `${(v / 10000).toFixed(0)}万円`} 
          />
          <Tooltip formatter={(v: number) => `${(v / 10000).toLocaleString()}万円`} />
          <Legend />
          <Line type="monotone" dataKey="NISA" stroke="#6366F1" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="iDeCo" stroke="#06B6D4" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}