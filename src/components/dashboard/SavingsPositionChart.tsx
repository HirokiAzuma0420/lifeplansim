import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized } from 'recharts';
import savingsDistribution from '../../assets/saving.json';

const savingsMidpoints: { [key: string]: number } = {
  '金融資産非保有': 0,
  '100万円未満': 50,
  '100～200万円未満': 150,
  '200～300万円未満': 250,
  '300～400万円未満': 350,
  '400～500万円未満': 450,
  '500～700万円未満': 600,
  '700～1,000万円未満': 850,
  '1,000～1,500万円未満': 1250,
  '1,500～2,000万円未満': 1750,
  '2,000～3,000万円未満': 2500,
  '3,000万円以上': 3500, // Assumption for open-ended
};

function getSavingsAgeBracket(age: number): string {
  if (age < 30) return '20歳代';
  if (age < 40) return '30歳代';
  if (age < 50) return '40歳代';
  if (age < 60) return '50歳代';
  if (age < 70) return '60歳代';
  return '70歳代以上';
}

function getIncomeBracketForSavings(income: number): string {
    const incomeInMan = income / 10000;
    if (incomeInMan < 300) return '300万円未満';
    if (incomeInMan < 500) return '300～500万円未満';
    if (incomeInMan < 750) return '500～750万円未満';
    if (incomeInMan < 1000) return '750～1,000万円未満';
    if (incomeInMan < 1200) return '1,000～1,200万円未満';
    return '1,200万円以上';
}

type RawAssetGroup = {
    min: number;
    max: number | null;
    percent: number;
};

type SavingsDataItem = {
    ageRange: string;
    incomeRange: string;
    assetGroups: RawAssetGroup[];
};

type SavingsDistribution = SavingsDataItem[];

const processedSavings = (savingsDistribution as unknown as SavingsDistribution).reduce((acc, item) => {
    if (!acc[item.ageRange]) {
        acc[item.ageRange] = {};
    }
    acc[item.ageRange][item.incomeRange] = item.assetGroups;
    return acc;
}, {} as Record<string, Record<string, RawAssetGroup[]>>);

function formatNumberForKeys(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function createAssetLabel(min: number, max: number | null): string {
    if (min === 0 && max === 0) return '金融資産非保有';
    if (min === 1 && max === 99) return '100万円未満';
    if (max === null) return `${formatNumberForKeys(min)}万円以上`;
    return `${formatNumberForKeys(min)}～${formatNumberForKeys(max + 1)}万円未満`;
}

type AxisWithScale = {
  scale: {
    (value: string | number): number;
    bandwidth?: () => number;
  };
};

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

interface SavingsPositionChartProps {
  age: number;
  income: number;
  savings: number;
}

export default function SavingsPositionChart({ age, income, savings }: SavingsPositionChartProps) {
  const ageBracket = getSavingsAgeBracket(age);
  const incomeBracket = getIncomeBracketForSavings(income);
  
  const distributionAssetGroups = processedSavings[ageBracket]?.[incomeBracket];

  if (!distributionAssetGroups) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">金融資産の分布データがありません (検索キー: 年齢={ageBracket}, 収入={incomeBracket})</div>;
  }

  const chartData = distributionAssetGroups.map(group => {
    const label = createAssetLabel(group.min, group.max);
    const midpoint = savingsMidpoints[label] ?? 0;
    return {
      金融資産額: label,
      割合: group.percent,
      midpoint: midpoint,
    };
  });

  const savingsInMan = savings / 10000;

  const userBracket = distributionAssetGroups.find(group => {
    const min = group.min;
    const max = group.max;
    let isMatch = false;

    if (min === 0 && max === 0) { // Financial assets not held
      isMatch = savingsInMan <= 0;
    } else if (min === 1 && max === 99) { // Less than 100万円
      isMatch = savingsInMan > 0 && savingsInMan < 100;
    } else if (max === null) { // 3,000万円以上
      isMatch = savingsInMan >= min;
    } else { // Other ranges
      const upperExclusive = max + 1; // treat JSON max as inclusive man-unit boundary
      isMatch = savingsInMan >= min && savingsInMan < upperExclusive;
    }
    return isMatch;
  });

  // Find the corresponding chartData item for the found userBracket
  const userBracketLabel = userBracket ? createAssetLabel(userBracket.min, userBracket.max) : undefined;
  const userChartDataItem = userBracketLabel ? chartData.find(item => item.金融資産額 === userBracketLabel) : undefined;

  if (!userBracket || !userChartDataItem) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">ユーザーの金融資産データが見つからないか、分布範囲外です。</div>;
  }

  const totalWeight = chartData.reduce((sum, b) => sum + b.割合, 0);
  const mean = chartData.reduce((sum, b) => sum + b.midpoint * b.割合, 0) / totalWeight;
  const stdDev = Math.sqrt(chartData.reduce((sum, b) => sum + Math.pow(b.midpoint - mean, 2) * b.割合, 0) / totalWeight);

  const userZ = stdDev === 0 ? 0 : (savingsInMan - mean) / stdDev;
  const deviation = Math.round(userZ * 10 + 50);

  let cumulativePercent = 0;
  const percentileData = chartData.map(d => {
      const lowerBound = cumulativePercent;
      cumulativePercent += d.割合;
      return { ...d, lowerBound, upperBound: cumulativePercent };
  });

  const userPercentileBracket = percentileData.find(b => b.金融資産額 === userChartDataItem.金融資産額);
  const percentile = userPercentileBracket ? userPercentileBracket.lowerBound + userPercentileBracket.割合 / 2 : 0;
  const topPercent = Math.round(100 - percentile);

  return (
    <div className="bg-white rounded-xl shadow p-3 mb-6">
      <h3 className="text-lg font-semibold mb-2">
        {ageBracket}・年間額面収入{Math.round(income / 10000).toLocaleString()}万円における金融資産の位置<br />
        <span className="text-sm text-gray-600">
          あなたの金融資産は <strong className="text-blue-600">上位 {topPercent}%</strong> に位置しています
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={450} >
        <BarChart data={chartData} margin={{ top: 60, right: 20, bottom: 100, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="金融資産額" angle={-60} textAnchor="end" height={120} interval={0} />
          <YAxis 
            tickFormatter={(tick) => `${tick.toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const percent = payload[0].value as number;
              return (
                <div className="bg-white p-2 border rounded text-sm shadow">
                  <p className="font-bold">{label}</p>
                  <p className="text-gray-600">{percent.toFixed(1)}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="割合" fill="#60A5FA" />
          {userBracket && userChartDataItem && (
            <Customized
              component={({ xAxisMap, yAxisMap }: {
                xAxisMap?: Record<string, AxisWithScale>;
                yAxisMap?: Record<string, AxisWithScale>;
              }) => {
                if (!xAxisMap || !yAxisMap || !userChartDataItem) return null;
                const xAxis = Object.values(xAxisMap)[0];
                const yAxis = Object.values(yAxisMap)[0];
                return (
                  <CustomIncomeMarker
                    xAxis={xAxis}
                    yAxis={yAxis}
                    xValue={userChartDataItem.金融資産額}
                    yValue={userChartDataItem.割合}
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