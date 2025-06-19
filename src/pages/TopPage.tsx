import { useNavigate } from 'react-router-dom';

export default function TopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* 画像 */}
        <img
          src="/Topview.png"
          alt="ライフプランシミュレータ"
          className="w-full h-auto object-cover rounded-2xl shadow-lg mb-6"
        />

        {/* 見出し */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">新しいシミュレーション</h1>

        {/* インジケーター */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
        </div>

        {/* 入力欄 */}
        <input
          type="text"
          placeholder="プラン名を入力"
          className="w-full mb-4 rounded-full border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />

        {/* ボタン群 */}
        <div className="flex w-full gap-3">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold shadow transition duration-200"
            onClick={() => navigate('/form')}
          >
            プランを作成
          </button>
          <button
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-full font-semibold shadow transition duration-200" onClick={() => navigate('/sample')}
          >
            サンプルを見る
          </button>
        </div>
      </div>
    </div>
  );
}
