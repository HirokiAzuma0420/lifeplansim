import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import InvestmentSection from '@/components/form/InvestmentSection';
import { createDefaultFormData } from '@/hooks/useFormState';
import type { FormDataState } from '@/types/form-types';

// TC-FORM-120: NISA 評価損益入力と状態反映
describe('TC-FORM-120: NISA 評価損益入力と状態反映', () => {
  it('株式をNISA口座にしたときに評価損益率入力が表示され、ボタン操作で状態更新が呼ばれる', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentProducts: [
        {
          id: 1,
          category: 'stocks',
          accountType: 'nisa',
          name: '',
          currentValue: '120',
          monthlyInvestment: '0',
          annualSpot: '0',
          expectedRate: '6',
          gainLossSign: '+',
          gainLossRate: '20',
        },
      ],
    };

    const setFormData = vi.fn();

    render(
      <InvestmentSection
        formData={formData}
        setFormData={setFormData}
      />,
    );

    expect(screen.getByText('評価損益率（NISA）')).toBeInTheDocument();

    const minusButton = screen.getByRole('button', { name: '-' });
    fireEvent.click(minusButton);

    expect(setFormData).toHaveBeenCalled();
  });

  it('課税口座のままの場合は評価損益率入力が表示されない', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentProducts: [
        {
          id: 1,
          category: 'stocks',
          accountType: 'taxable',
          name: '',
          currentValue: '120',
          monthlyInvestment: '0',
          annualSpot: '0',
          expectedRate: '6',
        },
      ],
    };

    render(
      <InvestmentSection
        formData={formData}
      />,
    );

    expect(screen.queryByText('評価損益率（NISA）')).toBeNull();
  });
});
