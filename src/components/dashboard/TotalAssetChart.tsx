import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface TotalAssetChartProps {
  enrichedData: { year: number; 総資産: number; [key: string]: number }[];
  rankInfo: { rank: string; color: string; commenttitle: string; comment: string; image: string };
  COLORS: { [key: string]: string };
  age: number;
  retireAge: number;
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

export default function TotalAssetChart({ enrichedData, rankInfo, COLORS, age, retireAge }: TotalAssetChartProps) {
  const retirementYear = enrichedData[0].year + (retireAge - age);

  const assetKeys = enrichedData.length > 0
    ? Object.keys(enrichedData[0]).filter(key => !['year', '総資産', '投資元本'].includes(key))
    : [];

  const CustomizedLabel = (props: LabelProps) => {
    const { x, y, index } = props;

    // 最初のデータ点と、以降10個おきのデータ点にラベルを表示
    const isMobile = window.innerWidth < 768; // モバイルビューの判定 (例: 768px未満)
    const labelInterval = isMobile ? 20 : 10; // モバイルでは20項目おき、PCでは10項目おき

    if (index % labelInterval === 0) {
      const dataPoint = enrichedData[index];
      if (!dataPoint) return null;

      const totalAsset = dataPoint.総資産;
      const formattedValue = `${Math.round(totalAsset / 10000).toLocaleString()}万円`;
      const yearLabel = index === 0 ? 'スタート' : `${index}年後`;

      const isMobile = window.innerWidth < 768; // モバイルビューの判定 (例: 768px未満)
      const fontSize = isMobile ? 8 : 16; // モバイルではフォントサイズを小さく
      const dyYear = isMobile ? -18 : -22; // モバイルでは垂直位置を調整
      const dyValue = isMobile ? -3 : -7; // モバイルでは垂直位置を調整

      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      let dxOffset = 0;

      // モバイルビューで端に近い場合はtextAnchorを調整
      if (isMobile) {
        // グラフの左右のパディングを考慮 (ResponsiveContainerのmargin.left/right + AreaChartのmargin.left/right)
        // ここでは簡易的に固定値を使用するか、より正確な計算が必要
        const chartLeftPadding = 20; // AreaChartのmargin.left
        const chartRightPadding = 30; // AreaChartのmargin.right
        const totalChartWidth = window.innerWidth - chartLeftPadding - chartRightPadding; // 簡易的なグラフ幅

        const labelWidthEstimate = 50; // ラベルの幅の概算 (調整が必要な場合あり)

        // x座標がグラフの左端に近い場合
        if (x < chartLeftPadding + labelWidthEstimate / 2) {
          textAnchor = 'start';
          dxOffset = 5; // テキストを少し右にずらす
        }
        // x座標がグラフの右端に近い場合
        else if (x > totalChartWidth - labelWidthEstimate / 2) {
          textAnchor = 'end';
          dxOffset = -5; // テキストを少し左にずらす
        }
      }

      return (
        <g>
          <circle cx={x} cy={y} r={4} fill="white" stroke={rankInfo.color} strokeWidth={2} />
          <text x={x} y={y} dy={dyYear} fill="#666" fontSize={fontSize} textAnchor={textAnchor} dx={dxOffset}>
            {yearLabel}
          </text>
          <text x={x} y={y} dy={dyValue} fill="#333" fontSize={fontSize} textAnchor={textAnchor} fontWeight="bold" dx={dxOffset}>
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
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={enrichedData} stackOffset="none" margin={{ top: 80, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" interval="preserveStartEnd" />
          <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}万円`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ position: 'relative', top: -15 }} />
          {assetKeys.map((assetKey, index) => (
            <Area
              key={assetKey}
              type="monotone"
              dataKey={assetKey}
              stackId="1"
              stroke={COLORS[assetKey] || '#8884d8'}
              fill={COLORS[assetKey] || '#8884d8'}
              label={index === assetKeys.length - 1 ? CustomizedLabel : undefined}
            />
          ))}
          {retirementYear >= enrichedData[0].year && retirementYear <= enrichedData[enrichedData.length - 1].year && (
            <ReferenceLine x={retirementYear} stroke="red" strokeDasharray="3 3" label={{
              value: '退職',
              position: 'bottom',
              fill: 'gray',
              fontSize: window.innerWidth < 768 ? 13 : 14,
              fontWeight: 'normal',
              dy: window.innerWidth < 768 ? 20 : 30,
            }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}