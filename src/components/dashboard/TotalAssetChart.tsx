
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAssetGrade } from '../../assets/getAssetGrade';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

export default function TotalAssetChart({ data, totalAsset }: { data: any[], totalAsset: number }) {
  const rankInfo = getAssetGrade(totalAsset);

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 relative">
      <h3 className="text-lg font-semibold mb-2">総資産推移</h3>
      {/* ランク表示カード */}
      <div className="w-full flex justify-center">
        <div className="bg-white p-6 mb-6 relative">
          <div className="flex items-center space-x-4 p-4 bg-white">
            <div className="flex items-center space-x-3">
              <div className="font-mono text-9xl font-extrabold" style={{ color: rankInfo.color }}>
                {rankInfo.rank}
              </div>
              {/* コメント */}
              <div className="font-bold text-base text-gray-700">{rankInfo.commenttitle}<br/>
              <span className="font-normal text-sm text-gray-700">{rankInfo.comment}</span>
              </div>
            </div>

            {/* イラスト */}
            <div className="w-40 h-40 ml-auto">
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
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} stackOffset="none">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload || payload.length === 0) return null;
              const total = payload.reduce(
                (sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0),
                0
              );
              return (
                <div className="bg-white p-2 border rounded text-sm shadow">
                  <p className="font-bold">{label}年</p>
                  {payload.map((entry, index) => {
                    const value = entry.value;
                    return (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.name}: ¥{typeof value === 'number' ? value.toLocaleString() : '―'}
                      </p>
                    );
                  })}
                  <hr className="my-1" />
                  <p className="font-semibold">総資産: ¥{total.toLocaleString()}</p>
                </div>
              );
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="現金" stackId="1" stroke={COLORS.現金} fill={COLORS.現金} />
          <Area type="monotone" dataKey="NISA" stackId="1" stroke={COLORS.NISA} fill={COLORS.NISA} />
          <Area type="monotone" dataKey="iDeCo" stackId="1" stroke={COLORS.iDeCo} fill={COLORS.iDeCo} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
