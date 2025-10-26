import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InvestmentPrincipalChartProps {
  enrichedData: { year: number; [key: string]: any }[];
  COLORS: Record<string, string>;
  age: number;
  retireAge: number;
}

export default function InvestmentPrincipalChart({ enrichedData, COLORS, age, retireAge }: InvestmentPrincipalChartProps) {
  const principalKeys = useMemo(() => {
    if (enrichedData.length === 0) return [];
    // '投資元本' を除外
    return Object.keys(enrichedData[0]).filter(key => key.endsWith('元本') && key !== '投資元本');
  }, [enrichedData]);

  const nameMapping: Record<string, string> = {
    'NISA元本': 'NISA',
    'iDeCo元本': 'iDeCo',
    'stocks (課税)元本': '株式 (課税)',
    'trust (課税)元本': '投資信託 (課税)',
    'bonds (課税)元本': '債券 (課税)',
    'crypto (課税)元本': '仮想通貨 (課税)',
    'other (課税)元本': 'その他 (課税)',
  };

  const retirementYear = (enrichedData[0]?.year ?? new Date().getFullYear()) + (retireAge - age);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">積立元本推移（〜{retirementYear}年）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart 
          data={enrichedData.filter((d) => d.year <= retirementYear)}
          margin={{ top: 20, right: 20, left: 50, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            tickFormatter={(v) => `${(v / 10000).toFixed(0)}万円`} 
          />
          <Tooltip formatter={(v: number) => `${(v / 10000).toLocaleString()}万円`} />
          <Legend />
          {principalKeys.map((key, index) => {
            const name = nameMapping[key] || key.replace('元本', '').trim();
            const colorKey = name.split(' ')[0]; // '株式 (課税)' -> '株式'
            const color = COLORS[colorKey as keyof typeof COLORS] || Object.values(COLORS)[index % Object.keys(COLORS).length];
            return (
              <Line key={key} type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={3} dot={false} />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}