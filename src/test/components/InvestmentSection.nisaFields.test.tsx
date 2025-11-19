import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import InvestmentSection from '@/components/form/InvestmentSection';
import { createDefaultFormData } from '@/hooks/useFormState';
import type { FormDataState } from '@/types/form-types';

// TC-FORM-120: NISA 評価損益入力と状態反映
describe('TC-FORM-120: NISA 評価損益入力と状態反映', () => {
  it('株式をNISA口座にしたときに評価損益率入力が表示され、入力イベントがハンドラに渡される', () => {
    const base: FormDataState = createDefaultFormData();

    const formData: FormDataState = {
      ...base,
      investmentStocksAccountType: 'nisa',
      investmentStocksCurrent: '120',
      investmentStocksGainLossSign: '+',
      investmentStocksGainLossRate: '20',
    };

    const handleInputChange = vi.fn();

    const { container } = render(
      <InvestmentSection
        formData={formData}
        handleInputChange={handleInputChange}
        monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
      />,
    );

    // 株式セクションを開く
    fireEvent.click(screen.getByRole('button', { name: '株式' }));

    // 評価損益率のラベルが表示されていること
    expect(screen.getByText('評価損益率')).toBeInTheDocument();

    // プラス側のラジオボタンがチェックされていること
    const plusRadio = screen.getByRole('radio', { name: '+' });
    expect(plusRadio).toBeChecked();

    // 評価損益率の数値入力に初期値が入っていること
    const rateInput = container.querySelector(
      'input[name="investmentStocksGainLossRate"]',
    ) as HTMLInputElement | null;

    expect(rateInput).not.toBeNull();
    expect(rateInput?.value).toBe('20');

    // ラジオボタンをマイナスに切り替えるとハンドラにイベントが渡されること
    const minusRadio = screen.getByRole('radio', { name: '-' });
    fireEvent.click(minusRadio);

    expect(handleInputChange).toHaveBeenCalled();
    const lastCallEvent = handleInputChange.mock.calls[
      handleInputChange.mock.calls.length - 1
    ][0] as { target: { name: string; value: string } };
    expect(lastCallEvent.target.name).toBe('investmentStocksGainLossSign');
    expect(lastCallEvent.target.value).toBe('-');
  });

  it('課税口座のままの場合は評価損益率入力が表示されない', () => {
    const base: FormDataState = createDefaultFormData();

    const formData: FormDataState = {
      ...base,
      investmentStocksAccountType: 'taxable',
    };

    const handleInputChange = vi.fn();

    render(
      <InvestmentSection
        formData={formData}
        handleInputChange={handleInputChange}
        monthlyInvestmentAmounts={formData.monthlyInvestmentAmounts}
      />,
    );

    // 株式セクションを開く
    fireEvent.click(screen.getByRole('button', { name: '株式' }));

    // NISA 以外の口座種別では評価損益率入力が表示されないこと
    expect(screen.queryByText('評価損益率')).toBeNull();
  });
});

