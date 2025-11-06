import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { EnrichedYearlyAsset } from '../../utils/dashboard-helper';
import { useOrientation } from '../../hooks/useOrientation';
import RotatePrompt from './RotatePrompt';

interface TotalAssetChartProps {
  enrichedData: EnrichedYearlyAsset[];
  rankInfo: { rank: string; color: string; commenttitle: string; comment: string; image: string };
  COLORS: { [key: string]: string };
  age: number;
  retireAge: number;
  yAxisMax: number;
}

// Rechartsから渡されるカスタムラベルのprops型
interface LabelProps {
  x: number;
  y: number;
  index: number;
}

// Y軸のカスタムティック
interface CustomizedYAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string | number;
  };
}

const CustomizedYAxisTick: React.FC<CustomizedYAxisTickProps> = ({ x = 0, y = 0, payload }) => {
  if (payload) {
    const value = Math.round(Number(payload.value) / 10000);
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize={12}>
          {value.toLocaleString()}<tspan fontSize={10} dy={-1}>万円</tspan>
        </text>
      </g>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EnrichedYearlyAsset;
    
    const total = payload.reduce((sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0), 0);

    return (
      <div className="bg-white p-3 border rounded-lg text-sm shadow-lg">
        <p className="font-bold text-base mb-2">{`${label}年`}</p>
        {payload.map((entry) => {
          const name = String(entry.name);
          const principalKey = `${name}元本` as keyof EnrichedYearlyAsset;
          const principal = data[principalKey] as number | undefined;
          const balance = typeof entry.value === 'number' ? entry.value : 0;

          if (principal === undefined || name === '現金') {
            return (
              <div key={entry.name} className="mb-1">
                <p style={{ color: entry.color }} className="font-semibold">
                  {entry.name}: ¥{balance.toLocaleString()}
                </p>
              </div>
            );
          }
          const gain = balance - principal;

          return (
            <div key={entry.name} className="mb-2">
              <p style={{ color: entry.color }} className="font-semibold">
                {entry.name}: ¥{balance.toLocaleString()}
              </p>
              <ul className="pl-4 text-xs text-gray-600">
                <li>元本: ¥{principal.toLocaleString()}</li>
                <li>含み益: <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>¥{gain.toLocaleString()}</span></li>
              </ul>
            </div>
          );
        })}
        <hr className="my-2" />
        <p className="font-bold">総資産: ¥{total.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function TotalAssetChart({ enrichedData, rankInfo, COLORS, age, retireAge, yAxisMax }: TotalAssetChartProps) {
  const orientation = useOrientation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showRotatePrompt, setShowRotatePrompt] = useState(isMobile && orientation === 'portrait');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    checkMobile(); // 初期チェック
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const retirementYear = enrichedData[0].year + (retireAge - age);

  const assetKeys = ['現金', '課税口座', 'iDeCo', 'NISA'];

  // 安定した積み上げ順序と、最も合計額が小さいものを一番下に表示するためにソートする
  assetKeys.sort((a, b) => {
    const totalA = enrichedData.reduce((sum, d) => sum + (d[a] || 0), 0);
    const totalB = enrichedData.reduce((sum, d) => sum + (d[b] || 0), 0);
    return totalA - totalB;
  });

  // p90とp10の差分を計算した新しいデータを作成
  const dataWithDiff = enrichedData.map(d => ({
    ...d,
    p90_diff: (d.p90 ?? 0) - (d.p10 ?? 0),
  }));

  const CustomizedLabel = (props: LabelProps) => {
    const { x, y, index } = props;

    // 最初のデータ点と、以降10個おきのデータ点にラベルを表示
    const isMobile = window.innerWidth < 768; // モバイルビューの判定 (例: 768px未満)
    const labelInterval = isMobile ? 20 : 10; // モバイルでは20項目おき、PCでは10項目おき

    if (index % labelInterval === 0) {
      const dataPoint = enrichedData[index];
      if (!dataPoint) return null;

      const totalAsset = assetKeys.reduce((sum, key) => sum + (dataPoint[key] || 0), 0);
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
    <div className="relative">
      {isMobile && orientation === 'portrait' && showRotatePrompt && (
        <RotatePrompt onClose={() => setShowRotatePrompt(false)} />
      )}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={dataWithDiff}
          margin={{
            top: 40,
            right: 40,
            left: 60,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tick={<CustomizedYAxisTick />} domain={[0, yAxisMax]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ bottom: 5 }} />
          {assetKeys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={COLORS[key] || '#8884d8'}
              fill={COLORS[key] || '#8884d8'}
              label={key === assetKeys[assetKeys.length - 1] ? CustomizedLabel : undefined}
            />
          ))}
          {retirementYear >= enrichedData[0].year && retirementYear <= enrichedData[enrichedData.length - 1].year && (
            <ReferenceLine x={retirementYear} stroke="red" strokeDasharray="3 3" label={{ value: '退職', position: 'bottom', fill: 'gray', fontSize: isMobile ? 13 : 14, fontWeight: 'normal', dy: isMobile ? 20 : 30 }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
