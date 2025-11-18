import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { renderHook, act } from '@testing-library/react';

import { useFormState } from '@/hooks/useFormState';

// TC-FORM-020: 詳細生活費入力と合計額の表示（フック側）
describe('TC-FORM-020: 詳細生活費入力と合計額の表示 - useFormState', () => {
  // useFormState は内部で useLocation を利用するため、Router でラップする
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

  it('expenseMethod=詳細 のとき totalExpenses が詳細固定費＋詳細変動費の合計になる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        expenseMethod: '詳細',
        utilitiesCost: '10000',
        communicationCost: '20000',
        insuranceCost: '30000',
        educationCost: '40000',
        otherFixedCost: '5000',
        foodCost: '60000',
        dailyNecessitiesCost: '7000',
        transportationCost: '8000',
        clothingBeautyCost: '9000',
        socializingCost: '10000',
        hobbyEntertainmentCost: '11000',
        otherVariableCost: '12000',
      }));
    });

    const expectedFixed =
      10000 +
      20000 +
      30000 +
      40000 +
      5000;

    const expectedVariable =
      60000 +
      7000 +
      8000 +
      9000 +
      10000 +
      11000 +
      12000;

    const expectedTotal = expectedFixed + expectedVariable;

    expect(result.current.totalExpenses).toBe(expectedTotal);
  });
});

