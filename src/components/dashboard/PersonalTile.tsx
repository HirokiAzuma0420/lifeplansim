
import { useState } from 'react';
import { Pencil } from 'lucide-react';

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

interface FormData {
  totalAsset: string;
  age: string;
  retireAge: string;
  income: string;
  expense: string;
  nisa: string;
  ideco: string;
  stockYield: string;
  bondYield: string;
  inflation: string;
  medical: string;
  withdrawRate: string;
}

interface PersonalTileProps {
  data: FormData;
  onUpdate: (data: FormData) => void;
  menuOpen: boolean;
  setMenuOpen: (isOpen: boolean) => void;
}

export default function PersonalTile({ data, onUpdate, menuOpen, setMenuOpen }: PersonalTileProps) {
  const [editFields, setEditFields] = useState<Record<string, boolean>>({});

  const handleSave = (key: string) => {
    setEditFields((prev) => ({ ...prev, [key]: false }));
  };

  return (
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
            ¥{parseInt(data.totalAsset).toLocaleString()}
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
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">{labelMap[key]}：</label>
                {editFields[key] ? (
                  <div className="flex gap-2">
                    <input
                      value={val as string}
                      onChange={(e) => onUpdate({ ...data, [key]: e.target.value })}
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
                  <p>{key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco' ? parseInt(String(val)).toLocaleString() : String(val)}</p>
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
  );
}
