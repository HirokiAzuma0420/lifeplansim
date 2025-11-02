import React, { useState, useEffect } from 'react';

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
  const [selectedOption, setSelectedOption] = useState(() => {
    const isPredefined = raiseRateOptions.some(opt => opt.value === String(value));
    return isPredefined ? String(value) : 'custom';
  });

  useEffect(() => {
    const isPredefined = raiseRateOptions.some(opt => opt.value === String(value));
    if (!isPredefined) {
      setSelectedOption('custom');
    }
  }, [value]);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setSelectedOption(nextValue);
    if (nextValue !== 'custom') {
      onChange(name, nextValue);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {raiseRateOptions.map((opt) => (
        <label key={opt.value} className={`cursor-pointer border rounded-md shadow-sm px-3 py-1 transition-colors duration-200 ${selectedOption === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selectedOption === opt.value}
            onChange={handleRadioChange}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
      <div className={`flex items-center max-w-[150px] transition-opacity duration-300 ${selectedOption === 'custom' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {selectedOption === 'custom' && (
          <>
          <input
            type="number"
            value={value}
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