import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized } from 'recharts';
import incomeDistribution from '../../assets/tingin.json';

function getAgeBracket(age: number): string {
  if (age < 30) return '29歳以下';
  if (age < 35) return '30〜34歳';
  if (age < 40) return '35〜39歳';
  if (age < 45) return '40〜44歳';
  if (age < 50) return '45〜49歳';
  if (age < 55) return '50〜54歳';
  if (age < 60) return '55〜59歳';
  if (age < 65) return '60〜64歳';
  return '65歳以上';
}

type IncomeBracket = {
  収入階級: string;
  low: number;
  high: number | null;
  mid: number;
  count: number;
};

type AxisWithScale = {
  scale: {
    (value: string | number): number;
    bandwidth?: () => number;
  };
};

type IncomeDistribution = Record<string, IncomeBracket[]>;

type CustomIncomeMarkerProps = {
  xAxis: AxisWithScale;
  yAxis: AxisWithScale;
  xValue: string;
  yValue: number;
  deviation: number;
};

import { useState, useEffect } from 'react';

function CustomIncomeMarker({ xAxis, yAxis, xValue, yValue, deviation}: CustomIncomeMarkerProps) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const xBand = xAxis.scale(xValue) + (xAxis.scale.bandwidth ? xAxis.scale.bandwidth() / 2 : 0);
  const yPos = yAxis.scale(yValue);

  const isLargeScreen = screenWidth >= 768;

  const rectWidth = isLargeScreen ? 72 : 60;
  const rectHeight = isLargeScreen ? 48 : 40;
  const rectX = isLargeScreen ? xBand - 36 : xBand - 30;
  const rectY = isLargeScreen ? yPos - 90 : yPos - 75;

  const fontSizeLabel = isLargeScreen ? 16 : 12;
  const yPosLabel = isLargeScreen ? yPos - 72 : yPos - 60;

  const fontSizeDeviation = isLargeScreen ? 22 : 16;
  const yPosDeviation = isLargeScreen ? yPos - 50.4 : yPos - 42;

  const imageWidth = isLargeScreen ? 28.8 : 24;
  const imageHeight = isLargeScreen ? 28.8 : 24;
  const imageX = isLargeScreen ? xBand - 14.4 : xBand - 12;
  const imageY = isLargeScreen ? yPos - 28.8 : yPos - 24;

  return (
  <>
    {/* 吹き出しの背景（角丸矩形） */}
    <rect
      x={rectX}
      y={rectY}
      width={rectWidth}
      height={rectHeight}
      rx={8}
      ry={8}
      fill="white"
      stroke="red"
      strokeWidth={1.5}
    />

    {/* ラベル */}
    <text
      x={xBand}
      y={yPosLabel}
      textAnchor="middle"
      fill="red"
      fontSize={fontSizeLabel}
      fontWeight="bold"
    >
      偏差値
    </text>

    <text
      x={xBand}
      y={yPosDeviation}
      textAnchor="middle"
      fill="red"
      fontSize={fontSizeDeviation}
      fontWeight="900"
      fontFamily="'Yu Gothic'"
    >
      {deviation}
    </text>

      <image
        href="/Income_maker.svg"
        x={imageX}
        y={imageY}
        width={imageWidth}
        height={imageHeight}
      />
    </>
  );
}

interface IncomePositionChartProps {
  age: number;
  income: number;
  isForPdf?: boolean;
}

export default function IncomePositionChart({ age, income}: IncomePositionChartProps) {
  const bracketKey = getAgeBracket(age);
  const dist = (incomeDistribution as IncomeDistribution)[bracketKey];
  if (!dist) return <div>該当年齢の分布データがありません</div>;

  const totalCount = dist.reduce((sum, b) => sum + b.count, 0);
  const chartData = dist.map(d => ({
    ...d,
    percentage: (d.count / totalCount) * 100,
  }));

  const incomeInMan = income / 10000;
  const userBracket = chartData.find(
    (b) => incomeInMan >= b.low && (b.high === null || incomeInMan < b.high)
  );

  const values = dist.flatMap((b) => Array(b.count).fill(b.mid));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
  const userZ = (incomeInMan - mean) / stdDev;
  const deviation = Math.round(userZ * 10 + 50);

  const getPercentile = (values: number[], target: number): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const below = sorted.filter(v => v < target).length;
    const equal = sorted.filter(v => v === target).length;
    return Math.round(((below + equal / 2) / sorted.length) * 100);
  };

  const percentile = getPercentile(values, userBracket?.mid ?? 0);
  const topPercent = 100 - percentile;

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">
        年間額面収入の位置（{age}歳時点・本人）<br />
        <span className="text-sm text-gray-600">
          あなたの収入は同年代の中で <strong className="text-blue-600">上位 {topPercent}%</strong> に位置しています
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 100, right: 20, bottom: 20}}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="収入階級" />
          <YAxis 
            tickFormatter={(tick) => `${tick.toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              const groupPercent = (payload[0].value as number).toFixed(1);

              return (
                <div className="bg-white p-2 border rounded text-sm shadow">
                  <p className="font-bold">{label}万円台</p>
                  <p className="text-gray-600">全体の {groupPercent}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="percentage" fill="#60A5FA" />
          {userBracket && (
            <Customized
              component={({ xAxisMap, yAxisMap }: {
                xAxisMap?: Record<string, AxisWithScale>;
                yAxisMap?: Record<string, AxisWithScale>;
              }) => {
                if (!xAxisMap || !yAxisMap || !userBracket) return null;
                const xAxis = Object.values(xAxisMap)[0];
                const yAxis = Object.values(yAxisMap)[0];
                return (
                  <CustomIncomeMarker
                    xAxis={xAxis}
                    yAxis={yAxis}
                    xValue={userBracket.収入階級}
                    yValue={userBracket.percentage}
                    deviation={deviation}
                  />
                );
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}