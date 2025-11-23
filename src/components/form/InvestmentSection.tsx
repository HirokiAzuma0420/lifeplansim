import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { FormDataState, InvestmentCategory, InvestmentProduct } from '@/types/form-types';
import * as FC from '@/constants/financial_const';

type InvestmentSectionProps = {
  formData: FormDataState;
  setFormData?: React.Dispatch<React.SetStateAction<FormDataState>>;
  handleInputChange?: (...args: unknown[]) => void;
  monthlyInvestmentAmounts?: unknown;
};

const CATEGORY_MAP: { key: InvestmentCategory; name: string; nisaEnabled: boolean; defaultRate: number }[] = [
  { key: 'stocks', name: '株式', nisaEnabled: true, defaultRate: FC.DEFAULT_INVESTMENT_RATE.STOCKS },
  { key: 'trust', name: '投資信託', nisaEnabled: true, defaultRate: FC.DEFAULT_INVESTMENT_RATE.TRUST },
  { key: 'bonds', name: '債券', nisaEnabled: false, defaultRate: FC.DEFAULT_INVESTMENT_RATE.BONDS },
  { key: 'ideco', name: 'iDeCo', nisaEnabled: false, defaultRate: FC.DEFAULT_INVESTMENT_RATE.IDECO },
  { key: 'crypto', name: '仮想通貨', nisaEnabled: false, defaultRate: FC.DEFAULT_INVESTMENT_RATE.CRYPTO },
  { key: 'other', name: 'その他', nisaEnabled: true, defaultRate: FC.DEFAULT_INVESTMENT_RATE.OTHER },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'nisa', label: 'NISA口座' },
  { value: 'taxable', label: '特定口座' },
];

const createProduct = (category: InvestmentCategory, defaultRate: number, nisaEnabled: boolean): InvestmentProduct => ({
  id: Date.now(),
  category,
  accountType: nisaEnabled ? 'nisa' : 'taxable',
  name: '',
  currentValue: '',
  monthlyInvestment: '0',
  annualSpot: '0',
  expectedRate: String(defaultRate),
  gainLossSign: '+',
  gainLossRate: '0',
});

const InvestmentSection: React.FC<InvestmentSectionProps> = ({ formData, setFormData }) => {
  const safeSetFormData: React.Dispatch<React.SetStateAction<FormDataState>> = setFormData ?? (() => undefined);

  const handleAddProduct = (category: InvestmentCategory, defaultRate: number, nisaEnabled: boolean) => {
    safeSetFormData(prev => ({
      ...prev,
      investmentProducts: [...prev.investmentProducts, createProduct(category, defaultRate, nisaEnabled)],
    }));
  };

  const handleRemoveProduct = (globalIndex: number) => {
    safeSetFormData(prev => ({
      ...prev,
      investmentProducts: prev.investmentProducts.filter((_, idx) => idx !== globalIndex),
    }));
  };

  const handleChange = (globalIndex: number, key: keyof InvestmentProduct, value: string) => {
    safeSetFormData(prev => {
      const products = [...prev.investmentProducts];
      if (!products[globalIndex]) return prev;
      products[globalIndex] = { ...products[globalIndex], [key]: value };
      return { ...prev, investmentProducts: products };
    });
  };

  return (
    <div className="p-4">
      <div className="w-full h-auto bg-white mb-8 flex items-center justify-center text-gray-500 max-w-[800px] mx-auto">
        <img src="/form/Q4-investment.png" alt="投資セクション" />
      </div>
      <h2 className="text-2xl font-bold text-center mb-6">投資に関する質問</h2>

      <div className="space-y-8">
        {CATEGORY_MAP.map(({ key, name, nisaEnabled, defaultRate }) => (
          <div key={key} className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">{name}</h3>
            {formData.investmentProducts
              .filter(product => product.category === key)
              .map((product) => {
                const globalIndex = formData.investmentProducts.findIndex(item => item.id === product.id);
                const isNisa = product.accountType === 'nisa';

                return (
                  <div key={product.id} className="p-4 mb-4 border border-blue-200 rounded-md bg-blue-50 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(globalIndex)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      aria-label="削除"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">名称（任意）</label>
                        <input
                          value={product.name}
                          onChange={e => handleChange(globalIndex, 'name', e.target.value)}
                          placeholder={`${name}の名称（例：S&P500指数）`}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                      </div>

                      {nisaEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">口座種別</label>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {ACCOUNT_TYPE_OPTIONS.map(opt => (
                              <label key={opt.value} className="inline-flex items-center gap-2">
                                <input
                                  type="radio"
                                  value={opt.value}
                                  checked={product.accountType === opt.value}
                                  onChange={e => handleChange(globalIndex, 'accountType', e.target.value)}
                                  className="h-4 w-4"
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">現在の評価額</label>
                        <div className="mt-1 flex rounded-md shadow-sm border border-gray-300 overflow-hidden min-w-0">
                          <input
                            type="number"
                            min="0"
                            value={product.currentValue}
                            onChange={e => handleChange(globalIndex, 'currentValue', e.target.value)}
                            className="flex-1 border-0 focus:ring-0 px-3 py-2 bg-white min-w-0"
                          />
                          <span className="inline-flex items-center px-3 bg-gray-50 text-sm text-gray-600 border-l border-gray-300 flex-shrink-0 whitespace-nowrap">円</span>
                        </div>
                      </div>

                      {isNisa && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">評価損益率（NISA）</label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-2">
                              {(['+', '-'] as const).map(sign => (
                                <button
                                  type="button"
                                  key={sign}
                                  onClick={() => handleChange(globalIndex, 'gainLossSign', sign)}
                                  className={`px-3 py-1 border rounded-md shadow-sm transition-colors duration-200 ${product.gainLossSign === sign ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
                                >
                                  {sign}
                                </button>
                              ))}
                            </div>
                            <div className="flex rounded-md shadow-sm border border-gray-300 overflow-hidden">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={product.gainLossRate ?? '0'}
                                onChange={e => handleChange(globalIndex, 'gainLossRate', e.target.value)}
                                className="flex-1 border-0 focus:ring-0 px-3 py-2 bg-white"
                              />
                              <span className="inline-flex items-center px-3 bg-gray-50 text-sm text-gray-600 border-l border-gray-300">%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">月額積立</label>
                        <div className="mt-1 flex rounded-md shadow-sm border border-gray-300 overflow-hidden min-w-0">
                          <input
                            type="number"
                            min="0"
                            value={product.monthlyInvestment}
                            onChange={e => handleChange(globalIndex, 'monthlyInvestment', e.target.value)}
                            className="flex-1 border-0 focus:ring-0 px-3 py-2 bg-white min-w-0"
                          />
                          <span className="inline-flex items-center px-3 bg-gray-50 text-sm text-gray-600 border-l border-gray-300 flex-shrink-0 whitespace-nowrap">円</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">年間スポット購入</label>
                        <div className="mt-1 flex rounded-md shadow-sm border border-gray-300 overflow-hidden min-w-0">
                          <input
                            type="number"
                            min="0"
                            value={product.annualSpot}
                            onChange={e => handleChange(globalIndex, 'annualSpot', e.target.value)}
                            className="flex-1 border-0 focus:ring-0 px-3 py-2 bg-white min-w-0"
                          />
                          <span className="inline-flex items-center px-3 bg-gray-50 text-sm text-gray-600 border-l border-gray-300 flex-shrink-0 whitespace-nowrap">円</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">期待利回り（年率）</label>
                        <div className="mt-1 flex rounded-md shadow-sm border border-gray-300 overflow-hidden min-w-0">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={product.expectedRate}
                            onChange={e => handleChange(globalIndex, 'expectedRate', e.target.value)}
                            className="flex-1 border-0 focus:ring-0 px-3 py-2 bg-white min-w-0"
                          />
                          <span className="inline-flex items-center px-3 bg-gray-50 text-sm text-gray-600 border-l border-gray-300 flex-shrink-0 whitespace-nowrap">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            <button
              type="button"
              onClick={() => handleAddProduct(key, defaultRate, nisaEnabled)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <PlusCircle size={20} />
              <span>{name}の口座を追加</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentSection;
