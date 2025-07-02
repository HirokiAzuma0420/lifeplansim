import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  Customized,
} from 'recharts';
import { useState } from 'react';
import { data } from '../assets/sampleData';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { getAssetGrade } from '../assets/getAssetGrade';
import incomeDistribution from '../assets/tingin.json';
import savingsDistribution from '../assets/saving.json';

const COLORS = {
  現金: '#3B82F6',
  NISA: '#10B981',
  iDeCo: '#F59E0B',
};

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

function CustomIncomeMarker({ xAxis, yAxis, xValue, yValue, deviation}: CustomIncomeMarkerProps) {
  const xBand = xAxis.scale(xValue) + (xAxis.scale.bandwidth ? xAxis.scale.bandwidth() / 2 : 0);
  const yPos = yAxis.scale(yValue);
  return (
  <>
    {/* 吹き出しの背景（角丸矩形） */}
    <rect
      x={xBand - 30}
      y={yPos - 75}
      width={60}
      height={40}
      rx={8}
      ry={8}
      fill="white"
      stroke="red"
      strokeWidth={1.5}
    />

    {/* ラベル */}
    <text
      x={xBand}
      y={yPos - 60}
      textAnchor="middle"
      fill="red"
      fontSize="12"
      fontWeight="bold"
    >
      偏差値
    </text>

    <text
      x={xBand}
      y={yPos - 42}
      textAnchor="middle"
      fill="red"
      fontSize="16"
      fontWeight="900"
      fontFamily="'Yu Gothic'"
    >
      {deviation}
    </text>

      <image
        href="/Income_maker.svg"
        x={xBand - 12}
        y={yPos - 24}
        width={24}
        height={24}
      />
    </>
  );
}

function IncomePositionChart({ age, income }: { age: number; income: number }) {
  const bracketKey = getAgeBracket(age);
  const dist = (incomeDistribution as IncomeDistribution)[bracketKey];
  if (!dist) return <div>該当年齢の分布データがありません</div>;

  const incomeInMan = income / 10000;
  const userBracket = dist.find(
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
        年齢 {age} 歳における年間収入の位置<br />
        <span className="text-sm text-gray-600">
          あなたの収入は同年代の中で <strong className="text-blue-600">上位 {topPercent}%</strong> に位置しています
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dist} margin={{ top: 60, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="収入階級" />
          <YAxis label={{ value: '人数', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              const groupCount = payload[0].value as number;
              const totalCount = dist.reduce((sum, b) => sum + b.count, 0);
              const groupPercent = ((groupCount / totalCount) * 100).toFixed(1);

              return (
                <div className="bg-white p-2 border rounded text-sm shadow">
                  <p className="font-bold">{label}万円台</p>
                  <p className="text-gray-600">全体の {groupPercent}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill="#60A5FA" />
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
                    yValue={userBracket.count}
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

function SavingsPositionChart({ age, income, savings }: { age: number; income: number; savings: number }) {
  const ageBracket = getSavingsAgeBracket(age);
  const incomeBracket = getIncomeBracketForSavings(income);
  
  const distributionAssetGroups = processedSavings[ageBracket]?.[incomeBracket];

  if (!distributionAssetGroups) {
    console.log(`金融資産の分布データがありません (検索キー: 年齢=${ageBracket}, 収入=${incomeBracket})`);
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">金融資産の分布データがありません (検索キー: 年齢={ageBracket}, 収入={incomeBracket})</div>;
  }

  const chartData = distributionAssetGroups.map(group => {
    const label = createAssetLabel(group.min, group.max);
    const midpoint = savingsMidpoints[label] ?? 0;
    console.log(`ChartData item: label=${label}, midpoint=${midpoint}`);
    return {
      金融資産額: label,
      割合: group.percent,
      midpoint: midpoint,
    };
  });

  const savingsInMan = savings / 10000;
  console.log("Savings in Man (万円):", savingsInMan);

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
      isMatch = savingsInMan >= min && savingsInMan < max;
    }
    console.log(`  Checking group: min=${min}, max=${max}, isMatch=${isMatch}`);
    return isMatch;
  });

  console.log("Found userBracket:", userBracket);

  // If userBracket is not found, it means the user's savings fall outside the defined brackets.
  // In this case, we should not display the marker.
  if (!userBracket) {
    console.log("User bracket not found.");
    return (
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">
          同年代・同年収における金融資産の位置<br />
          <span className="text-sm text-gray-600">
            あなたの金融資産は分布範囲外です。
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 60, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="金融資産額" angle={-30} textAnchor="end" height={80} interval={0} />
            <YAxis label={{ value: '割合 (%)', angle: -90, position: 'insideLeft' }} />
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
            <Bar dataKey="割合" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Find the corresponding chartData item for the found userBracket
  const userBracketLabel = createAssetLabel(userBracket.min, userBracket.max);
  console.log("User bracket label:", userBracketLabel);
  const userChartDataItem = chartData.find(item => item.金融資産額 === userBracketLabel);
  console.log("Found userChartDataItem:", userChartDataItem);

  if (!userChartDataItem) {
    console.log("User chart data item not found.");
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">ユーザーの金融資産データが見つかりません。</div>;
  }

  const totalWeight = chartData.reduce((sum, b) => sum + b.割合, 0);
  const mean = chartData.reduce((sum, b) => sum + b.midpoint * b.割合, 0) / totalWeight;
  const stdDev = Math.sqrt(chartData.reduce((sum, b) => sum + Math.pow(b.midpoint - mean, 2) * b.割合, 0) / totalWeight);

  const userZ = stdDev === 0 ? 0 : (savingsInMan - mean) / stdDev;
  const deviation = Math.round(userZ * 10 + 50);

  console.log("Deviation:", deviation);

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
        同年代・同年収における金融資産の位置<br />
        <span className="text-sm text-gray-600">
          あなたの金融資産は <strong className="text-blue-600">上位 {topPercent}%</strong> に位置しています
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={400} >
        <BarChart data={chartData} margin={{ top: 60, right: 20, bottom: 50, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="金融資産額" angle={-60} textAnchor="end" height={120} interval={0} />
          <YAxis label={{ value: '割合 (%)', angle: -90, position: 'outsideLeft' }} />
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
          <Bar dataKey="割合" fill="#8884d8" />
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

export default function SamplePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});
  const enrichedData = data.map((d) => ({
    ...d,
    総資産: d.現金 + d.NISA + d.iDeCo,
  }));

  const latest = enrichedData[enrichedData.length - 1];

  const [formData, setFormData] = useState(() => ({
    totalAsset: latest.総資産.toString(), 
    age: '35',
    retireAge: '65',
    income: '6000000',
    expense: '4000000',
    nisa: '600000',
    ideco: '276000',
    stockYield: '5.0',
    bondYield: '1.0',
    inflation: '1.5',
    medical: '2.0',
    withdrawRate: '4.0',
  }));

  const currentTotalAsset = parseFloat(formData.totalAsset) || latest.総資産;

  const pieData = [
    { name: '現金', value: latest.現金 },
    { name: 'NISA', value: latest.NISA },
    { name: 'iDeCo', value: latest.iDeCo },
  ];
  const pieColors = [COLORS.現金, COLORS.NISA, COLORS.iDeCo];

  const handleSave = (key: string) => {
    setEditFields((prev) => ({ ...prev, [key]: false }));
  };

  const rankInfo = getAssetGrade(currentTotalAsset);

  return (
    <div className="relative bg-gray-100 min-h-screen">
      <button
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => navigate('/')}
        aria-label="トップに戻る"
      >
        ×
      </button>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center text-xl font-bold"
        onClick={() => setMenuOpen(true)}
        aria-label="メニューを開く"
      >
        ≡
      </button>

      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto lg:fixed lg:top-0 lg:right-0 lg:h-screen lg:translate-x-0 lg:w-80 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 text-center">
          <button
            className="lg:hidden absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full text-lg"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>

          <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center text-3xl text-blue-600">
            👤
          </div>
          <h2 className="text-lg font-bold">Mark Devid</h2>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">現時点での総資産</p>
            <p className="text-xl font-semibold text-blue-600">
              ¥{currentTotalAsset.toLocaleString()}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">65歳時点予測資産</p>
            <p className="text-xl font-semibold text-green-600">¥64,390,120</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">資産寿命予測</p>
            <p className="text-xl font-semibold text-yellow-600">88歳</p>
          </div>

          <div className="text-left text-sm space-y-2">
            {Object.entries(formData).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="block font-semibold mb-1">{labelMap[key]}：</label>
                  {editFields[key] ? (
                    <div className="flex gap-2">
                      <input
                        value={val}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full border px-2 py-1 text-sm rounded"
                        type={key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco' ? 'number' : 'text'}
                      />
                      <button
                        onClick={() => handleSave(key)}
                        className="bg-blue-600 text-white text-sm px-3 rounded"
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <p>{key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco' ? parseInt(val).toLocaleString() : val}</p>
                  )}
                </div>
                {!editFields[key] && (
                  <button
                    onClick={() => setEditFields((prev) => ({ ...prev, [key]: true }))}
                    className="text-blue-600 mt-6"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold mt-6">
            再シミュレーション実行
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 lg:mr-80">
        <h2 className="text-2xl font-bold text-center mb-6">資産管理ダッシュボード</h2>

        <IncomePositionChart
          age={parseInt(formData.age)}
          income={parseInt(formData.income)}
        />

        <SavingsPositionChart
          age={parseInt(formData.age)}
          income={parseInt(formData.income)}
          savings={currentTotalAsset}
        />

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
            <AreaChart data={enrichedData} stackOffset="none">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">積立元本推移（〜2050年）</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={enrichedData.filter((d) => d.year <= 2050)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `¥${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="NISA" stroke="#6366F1" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="iDeCo" stroke="#06B6D4" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">資産保有割合（最新年）</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">資産詳細テーブル</h3>
          <div className="overflow-x-auto max-h-[360px] overflow-y-scroll">
            <table className="min-w-full table-auto text-sm">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-2 py-1">年</th>
                  <th className="px-2 py-1">現金</th>
                  <th className="px-2 py-1">NISA</th>
                  <th className="px-2 py-1">iDeCo</th>
                  <th className="px-2 py-1">総資産</th>
                  <th className="px-2 py-1">NISA積立</th>
                  <th className="px-2 py-1">iDeCo積立</th>
                </tr>
              </thead>
              <tbody>
                {enrichedData.map((d) => (
                  <tr key={d.year} className="text-right border-b">
                    <td className="px-2 py-1 text-left">{d.year}</td>
                    <td className="px-2 py-1">{d.現金.toLocaleString()}</td>
                    <td className="px-2 py-1">{d.NISA.toLocaleString()}</td>
                    <td className="px-2 py-1">{d.iDeCo.toLocaleString()}</td>
                    <td className="px-2 py-1 font-semibold">{d.総資産.toLocaleString()}</td>
                    <td className="px-2 py-1">{d['NISA']?.toLocaleString() ?? '-'}</td>
                    <td className="px-2 py-1">{d['iDeCo']?.toLocaleString() ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelMap: Record<string, string> = {
  age: '現在の年齢',
  retireAge: '退職予定年齢',
  income: '年間収入（円）',
  expense: '年間支出（円）',
  nisa: 'NISA 積立額（円）',
  ideco: 'iDeCo 積立額（円）',
  stockYield: '株式市場の利回り（％）',
  bondYield: '債券の利回り（％）',
  inflation: 'インフレ率（％）',
  medical: '医療費の増加率（％）',
  withdrawRate: '初期取り崩し率（％）',
  totalAsset: '総資産金額（円）',
};
