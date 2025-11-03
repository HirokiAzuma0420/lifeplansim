import React from 'react';
import type { FormDataState } from '@/types/form-types';

interface SimulationSettingsSectionProps {
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: { [key: string]: string };
}

const SimulationSettingsSection: React.FC<SimulationSettingsSectionProps> = ({ formData, handleInputChange, errors }) => {
  // 配偶者がいる（または将来いる）場合にのみNISA合算オプションを表示
  const showSpouseNisaOption = formData.familyComposition === '既婚' || formData.planToMarry === 'する';

  return (
    <div className="p-4">
      {/* Image placeholder */}
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q5-settings.png" alt="Simulation Settings" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">シミュレーション設定に関する質問</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="simulationPeriodAge">シミュレーションの対象期間（何歳まで）</label>
        <div className="flex">
          <input type="number" id="simulationPeriodAge" name="simulationPeriodAge" value={formData.simulationPeriodAge} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.simulationPeriodAge ? 'border-red-500' : ''}`} />
          <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">歳</span>
        </div>
        {errors.simulationPeriodAge && <p className="text-red-500 text-xs italic mt-1">{errors.simulationPeriodAge}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          利回りシナリオの選択
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="radio"
              className="custom-radio"
              name="interestRateScenario"
              value="固定利回り"
              checked={formData.interestRateScenario === '固定利回り'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">固定利回り（例：年3%）</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="custom-radio"
              name="interestRateScenario"
              value="ランダム変動"
              checked={formData.interestRateScenario === 'ランダム変動'}
              onChange={handleInputChange}
              required
            />
            <span className="ml-2">ランダム変動（ストレステストあり）</span>
          </label>
        </div>
        {errors.interestRateScenario && <p className="text-red-500 text-xs italic mt-2">{errors.interestRateScenario}</p>}
        <div className={`accordion-content ${formData.interestRateScenario === '固定利回り' ? 'open' : ''}`}>
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fixedInterestRate">
              固定利率
            </label>
            <div className="flex">
              <input
                type="number"
                id="fixedInterestRate"
                name="fixedInterestRate"
                value={formData.fixedInterestRate}
                onChange={handleInputChange}
                step="0.1"
                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              この設定を有効にすると投資セクションの個別利率は無視されます。
            </p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyFund">生活防衛資金（常に確保したい現金額）</label>
        <div className="flex">
          <input type="number" id="emergencyFund" name="emergencyFund" value={formData.emergencyFund} onChange={handleInputChange} className={`shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.emergencyFund ? 'border-red-500' : ''}`} />
          <span className="inline-flex items-center px-3 rounded-r border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">万円</span>
        </div>
        {errors.emergencyFund && <p className="text-red-500 text-xs italic mt-1">{errors.emergencyFund}</p>}
      </div>

      {showSpouseNisaOption && (
        <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
          <label className="flex items-center text-gray-700 text-sm font-bold">
            <input
              type="checkbox"
              name="useSpouseNisa"
              checked={formData.useSpouseNisa}
              onChange={handleInputChange}
              className="custom-checkbox"
            />
            <span className="ml-2">配偶者のNISA枠も合算して投資を最大化する</span>
          </label>
          <p className="text-xs text-gray-600 mt-2 pl-6">
            チェックを入れると、NISAの生涯投資上限額が夫婦2人分の3,600万円として計算されます。
            これにより、より積極的な非課税投資のシミュレーションが可能になります。
          </p>
        </div>
      )}

    </div>
  );
};

export default SimulationSettingsSection;
