import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

// useFormState をモックして、totalExpenses の値がフローティングボックスにそのまま表示されるかを確認する
vi.mock('@/hooks/useFormState', () => {
  const totalExpenses = 123456;

  const formData = {
    familyComposition: '独身',
    personAge: '30',
    mainIncome: '0',
    spouseMainIncome: '0',
    sideJobIncome: '0',
    spouseSideJobIncome: '0',
    expenseMethod: '詳細',
    livingCostSimple: '',
    housingType: '',
    currentRentLoanPayment: '',
    carCurrentLoanInPayment: '',
    carCurrentLoanMonthly: '',
    parentCareAssumption: '',
    parentCarePlans: [],
    currentSavings: '0',
    investmentStocksCurrent: '0',
    investmentTrustCurrent: '0',
    investmentBondsCurrent: '0',
    investmentIdecoCurrent: '0',
    investmentCryptoCurrent: '0',
    investmentOtherCurrent: '0',
  } as any;

  return {
    useFormState: () => ({
      formData,
      setFormData: vi.fn(),
      errors: {},
      showRestoreModal: false,
      isReady: true,
      restoreFormData: vi.fn(),
      clearAndReady: vi.fn(),
      handleInputChange: vi.fn(),
      handleApplianceChange: vi.fn(),
      addAppliance: vi.fn(),
      handleRemoveAppliance: vi.fn(),
      handleCarePlanChange: vi.fn(),
      addCarePlan: vi.fn(),
      removeCarePlan: vi.fn(),
      handleRenovationPlanChange: vi.fn(),
      totalExpenses,
      totalNetAnnualIncome: 0,
      displayTotalApplianceCost: 0,
      displayTotalIncome: 0,
      totalMarriageCost: 0,
      totalCareCost: 0,
      totalRetirementMonthly: 0,
      totalCarLoanCost: 0,
      totalInvestment: { monthly: 0, total: 0 },
      estimatedAnnualLoanPayment: 0,
      estimatedTotalLoanPayment: 0,
      initialStateFromLocation: null,
      effectiveSections: [],
      validateSection: vi.fn().mockReturnValue(true),
    }),
  };
});

import FormPage from '@/pages/FormPage';

// TC-FORM-020: 詳細生活費入力と合計額の表示（フローティングボックス側）
describe('TC-FORM-020: 詳細生活費入力と合計額の表示 - FormPage フローティングボックス', () => {
  it('「生活費総額」のフローティングボックスに totalExpenses 相当の金額が表示される', async () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>,
    );

    const label = await screen.findByText(/生活費総額:/);

    // totalExpenses = 123456 を toLocaleString した値が円として表示されていることを確認
    expect(label.textContent).toContain('生活費総額: 123,456');
    expect(label.textContent).toContain('円');
  });
});

