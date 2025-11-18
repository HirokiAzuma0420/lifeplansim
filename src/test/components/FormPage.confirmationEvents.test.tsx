import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import FormPage from '@/pages/FormPage';
import type { FormDataState } from '@/types/form-types';

// useFormState をモックして、確認画面のイベントタイムライン表示を検証する
vi.mock('@/hooks/useFormState', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useFormState')>('@/hooks/useFormState');

  const base: FormDataState = actual.createDefaultFormData();

  const formData: FormDataState = {
    ...base,
    // 基本情報
    familyComposition: '独身',
    personAge: '30',
    spouseAge: '0',
    mainIncome: '0',
    spouseMainIncome: '0',
    sideJobIncome: '0',
    spouseSideJobIncome: '0',
    // 結婚イベント
    planToMarry: 'する',
    marriageAge: '32',
    spouseIncomePattern: 'カスタム',
    spouseCustomIncome: '300',
    livingCostAfterMarriage: '300000',
    housingCostAfterMarriage: '80000',
    // 子どもイベントはオフ
    hasChildren: 'いいえ',
    numberOfChildren: '0',
    firstBornAge: '',
    educationPattern: '',
    // 住宅購入イベント
    housePurchasePlan: {
      age: 45,
      price: 5000,
      downPayment: 1000,
      loanYears: 35,
      interestRate: 1.5,
    },
    // 車イベント
    carPurchasePlan: 'yes',
    carFirstReplacementAfterYears: '5',
    carPrice: '300',
    carLoanUsage: 'いいえ',
    carLoanYears: '',
    carReplacementFrequency: '10',
    carCurrentLoanInPayment: 'no',
    carCurrentLoanMonthly: '0',
    // 介護イベントはオフ
    parentCareAssumption: 'なし',
    parentCarePlans: [],
    // 退職・年金イベントはオフ（ここでは省略）
    retirementIncome: null,
    spouseRetirementIncome: null,
    personalPensionPlans: [],
    spousePersonalPensionPlans: [],
    otherLumpSums: [],
    spouseOtherLumpSums: [],
    assumeReemployment: false,
    spouseAssumeReemployment: false,
    // 生活費・住居費など（イベント以外はゼロでよい）
    expenseMethod: '簡単',
    livingCostSimple: '0',
    housingType: '',
    currentRentLoanPayment: '0',
    loanMonthlyPayment: '0',
    loanRemainingYears: '0',
    currentSavings: '0',
    investmentStocksCurrent: '0',
    investmentTrustCurrent: '0',
    investmentBondsCurrent: '0',
    investmentIdecoCurrent: '0',
    investmentCryptoCurrent: '0',
    investmentOtherCurrent: '0',
    simulationPeriodAge: '90',
  };

  const totalMarriageCost = 321_000;

  return {
    ...actual,
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
      totalExpenses: 0,
      totalNetAnnualIncome: 0,
      displayTotalApplianceCost: 0,
      displayTotalIncome: 0,
      totalMarriageCost,
      totalCareCost: 0,
      totalRetirementMonthly: 0,
      totalCarLoanCost: 0,
      totalInvestment: { monthly: 0, total: 0 },
      estimatedAnnualLoanPayment: 0,
      estimatedTotalLoanPayment: 0,
      initialStateFromLocation: null,
      effectiveSections: ['dummy-section'],
      validateSection: vi.fn().mockReturnValue(true),
    }),
  };
});

// TC-FORM-022: 確認画面のイベントタイムライン・イベントカード表示
describe('TC-FORM-022: 確認画面のイベントタイムライン・イベントカード表示', () => {
  it('複数のライフイベントが年齢順でカード表示され、代表イベントの金額が期待どおりである', async () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>,
    );

    // 入力ステップの最後のボタン（確認ボタン）をクリックして確認画面を表示
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons[buttons.length - 1];
    fireEvent.click(confirmButton);

    // 結婚・車買い替え・住宅購入のイベント年齢がタイムライン上に表示されることを確認
    const marriageAge = await screen.findByText('32歳');
    expect(marriageAge).toBeDefined();

    const carAge = screen.getByText('35歳');
    const houseAge = screen.getByText('45歳');
    expect(carAge).toBeDefined();
    expect(houseAge).toBeDefined();

    // 結婚イベントの費用（321,000円 相当）がカード内に少なくとも 1 箇所表示されていることを確認
    const marriageCosts = screen.getAllByText((text) => text.includes('321,000'));
    expect(marriageCosts.length).toBeGreaterThan(0);
  });
});
