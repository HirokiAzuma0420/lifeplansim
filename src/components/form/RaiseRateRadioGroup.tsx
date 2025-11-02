import React from 'react';

const raiseRateOptions = [
  { value: '0', label: 'なし' },
  { value: '0.8', label: '低め' },
  { value: '1.3', label: '平均的' },
  { value: '2.0', label: '高め' },
  { value: 'custom', label: 'カスタム' },
];

export const RaiseRateRadioGroup: React.FC<{
  name: string;
  value: string | number;
  onChange: (name: string, value: string) => void;
}> = ({ name, value, onChange }) => {
  const isCustom = !raiseRateOptions.some(opt => opt.value === String(value));
  const radioValue = isCustom ? 'custom' : String(value);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (nextValue !== 'custom') {
      onChange(name, nextValue);
    } else {
      // カスタム選択時は現在のカスタム値を維持（もしなければデフォルト値）
      onChange(name, isCustom ? String(value) : '1.5');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {raiseRateOptions.map((opt) => (
        <label key={opt.value} className={`cursor-pointer border rounded-md shadow-sm px-3 py-1 transition-colors duration-200 ${radioValue === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={radioValue === opt.value}
            onChange={handleRadioChange}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
      <div className={`flex items-center max-w-[150px] transition-opacity duration-300 ${radioValue === 'custom' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {radioValue === 'custom' && (
          <>
          <input
            type="number"
            value={isCustom ? value : 1.5}
            min={0}
            max={20}
            step={0.1}
            onChange={(e) => onChange(name, e.target.value)}
            className="shadow appearance-none border rounded-l w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <span className="inline-flex items-center px-3 h-8 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
          </>
        )}
      </div>
    </div>
  );
};

export default RaiseRateRadioGroup;