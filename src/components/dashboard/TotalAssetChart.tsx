import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface TotalAssetChartProps {
  enrichedData: { year: number; 現金: number; NISA: number; iDeCo: number; 総資産: number; }[];
  rankInfo: { rank: string; color: string; commenttitle: string; comment: string; image: string };
  COLORS: { [key: string]: string };
}

// Rechartsから渡されるカスタムラベルのpropsの型
interface LabelProps {
  x: number;
  y: number;
  index: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0), 0);
    return (
      <div className="bg-white p-2 border rounded text-sm shadow">
        <p className="font-bold">{`${label}年`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: ¥{typeof entry.value === 'number' ? entry.value.toLocaleString() : '―'}
          </p>
        ))}
        <hr className="my-1" />
        <p className="font-semibold">総資産: ¥{total.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function TotalAssetChart({ enrichedData, rankInfo, COLORS }: TotalAssetChartProps) {
  const CustomizedLabel = (props: LabelProps) => {
    const { x, y, index } = props;

    // 最初のデータ点と、以降10個おきのデータ点にラベルを表示
    if (index % 10 === 0) {
      const dataPoint = enrichedData[index];
      if (!dataPoint) return null;

      const totalAsset = dataPoint.総資産;
      const formattedValue = `${Math.round(totalAsset / 10000).toLocaleString()}万円`;
      const yearLabel = index === 0 ? 'スタート' : `${index}年後`;

      return (
        <g>
          <text x={x} y={y} dy={-20} fill="#666" fontSize={12} textAnchor="middle">
            {yearLabel}
          </text>
          <text x={x} y={y} dy={-5} fill="#333" fontSize={12} textAnchor="middle" fontWeight="bold">
            {formattedValue}
          </text>
        </g>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 mb-6 relative">
      <h3 className="text-lg font-semibold mb-2">総資産推移</h3>
      {/* ランク表示カード */}
      <div className="w-full flex justify-start pl-[15%]">
        <div className="bg-white relative">
          <div className="flex flex-col md:flex-row items-center md:justify-start w-full p-0 bg-white space-y-4 md:space-y-0 md:space-x-5">
            {/* ランクとコメント (モバイル: order-2, PC: order-1) */}
            <div className="flex items-center space-x-3 order-2 md:order-1">
              <div className="font-mono text-9xl font-extrabold" style={{ color: rankInfo.color }}>
                {rankInfo.rank}
              </div>
              {/* コメント */}
              <div className="font-bold text-base text-gray-700">{rankInfo.commenttitle}<br/>
              <span className="font-normal text-sm text-gray-700">{rankInfo.comment}</span>
              </div>
            </div>

            {/* イラスト (モバイル: order-1, PC: order-2) */}
            <div className="w-60 h-60 order-1 md:order-2 md:ml-auto">
              <img
                src={rankInfo.image}
                alt="ランクイラスト"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
      {/* グラフ本体 */}
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={enrichedData} stackOffset="none" margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}万円`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="現金" stackId="1" stroke={COLORS.現金} fill={COLORS.現金} />
          <Area type="monotone" dataKey="NISA" stackId="1" stroke={COLORS.NISA} fill={COLORS.NISA} />
          <Area type="monotone" dataKey="iDeCo" stackId="1" stroke={COLORS.iDeCo} fill={COLORS.iDeCo} label={CustomizedLabel} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}