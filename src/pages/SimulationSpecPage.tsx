import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Home,
  Car,
  Baby,
  Heart,
  Briefcase,
  BookOpen,
  Repeat,
  Zap,
  Landmark,
  Wallet,
  BrainCircuit,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

const SpecSection = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
      <button
        className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-5">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <ChevronDownIcon isOpen={isOpen} />
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="prose prose-blue max-w-none text-gray-700 p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function SimulationSpecPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <BookOpen className="mx-auto h-12 w-12 text-blue-500" />
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            シミュレーションの仕組み
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            あなたの未来を予測する、シミュレーションの裏側を分かりやすく解説します。
          </p>
        </div>

        <div className="space-y-8">
          <SpecSection title="収入の計算" icon={<TrendingUp size={24} />}>
            <p>毎年の手取り収入は、以下の要素を考慮して計算されます。</p>
            <ul>
              <li>
                <strong>基本収入:</strong> 入力された本業・副業の年収を基にします。昇給率を反映し、将来の収入増をシミュレートします。
              </li>
              <li>
                <strong>退職:</strong> 設定した退職年齢になると、給与収入は0になります。
              </li>
              <li>
                <strong>年金:</strong> 設定した年金受給開始年齢から、入力された金額を受給します。
              </li>
              <li>
                <strong>手取り額への変換:</strong> 税金や社会保険料を差し引いた、実際に使える金額を算出します。iDeCoの掛金は所得控除として考慮されます。
              </li>
            </ul>
          </SpecSection>

          <SpecSection title="支出の計算" icon={<TrendingDown size={24} />}>
            <p>年間の総支出は、日々の生活費と特別なライフイベント費用から構成されます。</p>
            <ul>
              <li>
                <strong>基本生活費:</strong> 「簡単入力」または「詳細入力」で設定した金額が、退職するまでの生活費となります。
              </li>
              <li>
                <strong>老後の生活費:</strong> 退職後は、設定した「老後の生活費」が支出のベースとなります。
              </li>
              <li>
                <strong>ライフイベント費用:</strong> 以下の各イベントを設定した年に、関連費用が支出として計上されます。
                <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                  <li className="flex items-center gap-1"><Home size={16} />住宅購入・リフォーム</li>
                  <li className="flex items-center gap-1"><Car size={16} />車の買い替え</li>
                  <li className="flex items-center gap-1"><Heart size={16} />結婚</li>
                  <li className="flex items-center gap-1"><Baby size={16} />子育て</li>
                  <li className="flex items-center gap-1"><Briefcase size={16} />親の介護</li>
                  <li className="flex items-center gap-1"><Repeat size={16} />家電の買い替え</li>
                </ul>
              </li>
            </ul>
          </SpecSection>

          <SpecSection title="資産の変動" icon={<Landmark size={24} />}>
            <p>収入と支出の差額、そして投資の成果が、あなたの資産を変動させます。</p>
            <ol>
              <li>
                <strong><span className="font-bold">年間収支の計算:</span></strong> <code>（手取り収入 - 総支出）</code>でその年の基本的なキャッシュフローを計算します。
              </li>
              <li>
                <strong><span className="font-bold">投資の実行:</span></strong> 年間収支がプラスの場合、設定した「年間投資額」を上限に、余剰資金から投資が行われます。NISAの非課税枠も考慮されます。
              </li>
              <li>
                <strong><span className="font-bold">利回りの反映:</span></strong> 年末時点の投資残高に対し、設定した利回りに基づいて資産が増減します。
              </li>
              <li>
                <strong><span className="font-bold">現金預金の更新:</span></strong> 最終的な現金の増減を計算し、翌年の現金預金残高が確定します。
              </li>
            </ol>
          </SpecSection>

          <SpecSection title="生活防衛費と資産の取り崩し" icon={<Shield size={24} />}>
            <p>万が一、現金預金が「生活防衛費」として設定した金額を下回った場合の動きです。</p>
            <ul>
              <li>
                <strong>資産の売却:</strong> 不足分を補うため、投資資産を自動的に売却して現金化します。
              </li>
              <li>
                <strong>売却の優先順位:</strong> まず「課税口座」の資産から売却され、それでも足りない場合は「NISA口座」の資産が売却されます。
              </li>
              <li>
                <strong>税金の考慮:</strong> 課税口座の資産を売却する際は、利益に対して約20%の税金が引かれた後の金額が現金に補填されます。
              </li>
            </ul>
          </SpecSection>

          <SpecSection title="利回りシナリオ" icon={<BrainCircuit size={24} />}>
            <p>投資の成果は、選択したシナリオによって変わります。</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold flex items-center gap-2"><Zap size={18} />固定利回り</h4>
                <p className="text-sm mt-1">毎年、設定した利回りで安定的に資産が成長すると仮定する、シンプルなシナリオです。</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold flex items-center gap-2"><Wallet size={18} />ランダム変動</h4>
                <p className="text-sm mt-1">より現実的に、設定した利回りを平均としつつ、年ごとにリターンが変動します。市場の好不調や暴落もランダムに発生する、ストレステストを兼ねたシナリオです。</p>
              </div>
            </div>
          </SpecSection>
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}