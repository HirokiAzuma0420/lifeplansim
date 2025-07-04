import { Pencil } from 'lucide-react';

interface PersonalTileProps {
  currentTotalAsset: number;
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editFields: Record<string, boolean>;
  setEditFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleSave: (key: string) => void;
}

const labelMap: Record<string, string> = {
  age: '現在の年齢',
  retireAge: '退職予定年齢',
  income: '年間収入（万円）',
  expense: '年間支出（万円）',
  nisa: 'NISA 積立額（万円）',
  ideco: 'iDeCo 積立額（万円）',
  stockYield: '株式市場の利回り（％）',
  bondYield: '債券の利回り（％）',
  inflation: 'インフレ率（％）',
  medical: '医療費の増加率（％）',
  withdrawRate: '初期取り崩し率（％）',
  totalAsset: '総資産金額（万円）',
};

export default function PersonalTile({
  currentTotalAsset,
  formData,
  setFormData,
  editFields,
  setEditFields,
  handleSave,
}: PersonalTileProps) {
  return (
    <>
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
                    value={key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco' ? (parseInt(val) / 10000).toString() : val}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      [key]:
                        key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco'
                          ? (parseFloat(e.target.value) * 10000).toString()
                          : e.target.value,
                    }))}
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
                <p>{key === 'totalAsset' || key === 'income' || key === 'expense' || key === 'nisa' || key === 'ideco' ? (parseInt(val) / 10000).toLocaleString() : val}</p>
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
    </>
  );
}