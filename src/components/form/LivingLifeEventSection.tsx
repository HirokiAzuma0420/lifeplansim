import React from 'react';
import type { FormDataState } from '@/types/form-types';
import { Trash2 } from "lucide-react";
import * as FC from '@/constants/financial_const';

interface LivingLifeEventSectionProps {
  formData: FormDataState;
  handleApplianceChange: (index: number, field: string, value: string) => void;
  addAppliance: () => void;
  handleRemoveAppliance: (index: number) => void;
}

// プリセット家電かどうかを判定
const isPresetAppliance = (name: string) => {
  return FC.DEFAULT_APPLIANCES.some(app => app.name === name);
};

const LivingLifeEventSection: React.FC<LivingLifeEventSectionProps> = ({ formData, handleApplianceChange, addAppliance, handleRemoveAppliance }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < formData.appliances.length) {
        const nextInput = document.getElementById(`appliance-${nextIndex}-firstReplacementAfterYears`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-appliances.png" alt="Living Life Event" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">生活に関する質問</h2>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">家電買い替えサイクルと費用</h3>

        <table className="table-fixed w-full border-separate border-spacing-y-2">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[31%]" />
            <col className="w-[40px]" />
          </colgroup>
          <thead>
            <tr className="text-xs text-gray-600 text-left">
              <th className="text-left px-1">家電名</th>
              <th className="text-left px-1">買い替えサイクル（年）</th>
              <th className="text-left px-1">初回買い替え（年後）</th>
              <th className="text-left px-1">1回あたりの費用（万円）</th>
              <th className="px-1 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {formData.appliances.map((appliance, index) => (
              <tr key={index} className="align-middle">
                <td className="px-1">
                  {isPresetAppliance(appliance.name) ? (
                    <div className="flex items-center h-10 px-3 text-gray-800">
                      {appliance.name}
                    </div>
                  ) : (
                    <input
                      id={`appliance-${index}-name`}
                      type="text"
                      placeholder="家電名"
                      value={appliance.name}
                      onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                    />
                  )}
                </td>
                <td className="px-1">
                  <input
                    id={`appliance-${index}-cycle`}
                    type="number"
                    placeholder="年数"
                    value={appliance.cycle}
                    min={0}
                    onChange={(e) => handleApplianceChange(index, 'cycle', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </td>
                <td className="px-1">
                  <input
                    id={`appliance-${index}-firstReplacementAfterYears`}
                    type="number"
                    placeholder="年後"
                    value={appliance.firstReplacementAfterYears}
                    min={0}
                    onChange={(e) => handleApplianceChange(index, 'firstReplacementAfterYears', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </td>
                <td className="px-1">
                  <input
                    id={`appliance-${index}-cost`}
                    type="number"
                    placeholder="費用（万円）"
                    value={appliance.cost}
                    min={0}
                    onChange={(e) => handleApplianceChange(index, 'cost', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </td>
                <td className="px-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveAppliance(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="この家電行を削除"
                    title="削除"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-3">
          <button
            type="button"
            onClick={addAppliance}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            家電を追加する
          </button>
        </div>
      </div>
    </div>
  );
};

export default LivingLifeEventSection;
