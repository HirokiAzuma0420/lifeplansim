import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { renderHook, act } from '@testing-library/react';

import { useFormState } from '@/hooks/useFormState';
import * as FC from '@/constants/financial_const';

// このテストファイルは、TC-FORM-002 に対応し、
// useFormState の validateSection が各セクションで適切なフィールドを検証しているかを確認する
describe('TC-FORM-002: バリデーションロジック', () => {
  // useFormState は内部で useLocation を利用するため、Router でラップする
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

  // --- FAMILY セクション ---
  it('FAMILY セクション: 初期状態では validateSection が false を返し、家族構成を選択すると true になる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.FAMILY);
    expect(index).toBeGreaterThanOrEqual(0);

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '独身',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- INCOME セクション ---
  it('INCOME セクション: 初期状態では validateSection が false を返す', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.INCOME);
    expect(index).toBeGreaterThanOrEqual(0);

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });

    expect(isValid).toBe(false);
  });

  it('INCOME セクション: 独身の場合は本人の年齢と収入だけで通る', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.INCOME);
    expect(index).toBeGreaterThanOrEqual(0);

    // 「現在の収入」セクションで最低限となる値を設定する
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '独身',
        personAge: '30',
        mainIncome: '600',
      }));
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validateSection(index);
    });

    expect(isValid).toBe(true);
  });

  it('INCOME セクション: 既婚の場合は配偶者関連の必須値が未入力だと通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.INCOME);
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '既婚',
        personAge: '35',
        mainIncome: '600',
        spouseAge: '',
        spouseMainIncome: '',
      }));
    });

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        spouseAge: '33',
        spouseMainIncome: '400',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- EXPENSE セクション ---
  it('EXPENSE セクション: 入力方法未選択や必須値不足のときは通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.EXPENSE);
    expect(index).toBeGreaterThanOrEqual(0);

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // 簡単モードで必要な値を入力すると通る
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        expenseMethod: '簡単',
        livingCostSimple: '300',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 詳細モードで一部の詳細項目が空だと通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        expenseMethod: '詳細',
        utilitiesCost: '',
        communicationCost: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- CAR セクション ---
  it('CAR セクション: 現在ローン無し・購入予定無しなら通るが、購入予定ありで必須が空だと通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.CAR);
    expect(index).toBeGreaterThanOrEqual(0);

    // 初期状態では必須が空なので通らない
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // 現在ローン無し・購入予定無しにすると通る
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        carCurrentLoanInPayment: 'no',
        carPurchasePlan: 'no',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 購入予定ありだが必須項目が不足している場合は通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        carPurchasePlan: 'yes',
        carPrice: '',
        carLoanUsage: 'はい',
        carLoanYears: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- HOUSING セクション ---
  it('HOUSING セクション: 住居タイプと購入意向・購入プラン・リフォームの条件付き必須が効く', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.HOUSING);
    expect(index).toBeGreaterThanOrEqual(0);

    // 初期状態では必須が空なので通らない
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // 賃貸かつ購入意向なしであれば通る
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        housingType: '賃貸',
        housePurchaseIntent: 'no',
        currentRentLoanPayment: '10',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 購入意向ありだが housePurchasePlan.age が不足していると通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '独身',
        personAge: '30',
        housingType: '賃貸',
        housePurchaseIntent: 'yes',
        housePurchasePlan: {
          age: '',
          price: 4000,
          downPayment: 1000,
          loanYears: 35,
          interestRate: 1.5,
        },
        houseRenovationPlans: [{ age: 45, cost: 300, cycleYears: 10 }],
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // age を妥当な値にすると通る
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        housePurchasePlan: {
          age: 40,
          price: 4000,
          downPayment: 1000,
          loanYears: 35,
          interestRate: 1.5,
        },
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- MARRIAGE セクション ---
  it('MARRIAGE セクション: 独身で結婚予定未選択だと通らず、「しない」を選択すれば通る', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.MARRIAGE);
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '独身',
        planToMarry: '',
      }));
    });

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        planToMarry: 'しない',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 結婚する場合はカスタム収入などの条件付き必須が効く
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        planToMarry: 'する',
        marriageAge: '',
        spouseAgeAtMarriage: '',
        spouseIncomePattern: 'カスタム',
        spouseCustomIncome: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- CHILDREN セクション ---
  it('CHILDREN セクション: 子どもの有無と人数・年齢・教育パターンで条件付き必須が効く', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.CHILDREN);
    expect(index).toBeGreaterThanOrEqual(0);

    // 初期状態では通らない
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // 子どもなしであれば他の項目が空でも通る
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        hasChildren: 'いいえ',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 子どもありだが詳細が不足している場合は通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        hasChildren: 'はい',
        numberOfChildren: '',
        firstBornAge: '',
        educationPattern: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- LIVING セクション ---
  it('LIVING セクション: 家電リストが空なら通るが、不完全な要素があると通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.LIVING);
    expect(index).toBeGreaterThanOrEqual(0);

    // デフォルト家電のままでも全て妥当なら通る想定
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 不完全な家電要素があると通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        appliances: [
          {
            name: 'エアコン',
            cycle: '',
            cost: '',
          },
        ],
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- PARENT_CARE セクション ---
  it('PARENT_CARE セクション: 親の介護想定が未選択だと通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.PARENT_CARE);
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        parentCareAssumption: '',
      }));
    });

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        parentCareAssumption: 'なし',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- RETIREMENT_PLAN セクション ---
  it('RETIREMENT_PLAN セクション: デフォルト状態では通り、再雇用関連の条件付き必須も効く', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.RETIREMENT_PLAN);
    expect(index).toBeGreaterThanOrEqual(0);

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 再雇用を想定しているのに減給率が未入力だと通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        assumeReemployment: true,
        reemploymentReductionRate: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- RETIREMENT_INCOME セクション ---
  it('RETIREMENT_INCOME セクション: 退職金や個人年金を設定した場合の条件付き必須が効く', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.RETIREMENT_INCOME);
    expect(index).toBeGreaterThanOrEqual(0);

    // デフォルト状態では通る（すべて任意）
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 退職金を設定したが詳細が不足している場合は通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '独身',
        personAge: '40',
        retirementIncome: {
          amount: '',
          age: '',
          yearsOfService: '',
        },
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    // 個人年金（fixedTerm）の duration が不足している場合も通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        personalPensionPlans: [
          {
            id: 1,
            type: 'fixedTerm',
            amount: '100',
            startAge: '65',
            duration: '',
          },
        ],
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });

  // --- SAVINGS セクション ---
  it('SAVINGS セクション: 現在の預貯金が未入力だと通らない', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.SAVINGS);
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        currentSavings: '',
      }));
    });

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        currentSavings: '0',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- INVESTMENT セクション ---
  it('INVESTMENT セクション: 初期状態で validateSection が通ることを確認する', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.INVESTMENT);
    expect(index).toBeGreaterThanOrEqual(0);

    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);
  });

  // --- SIMULATION_SETTINGS セクション ---
  it('SIMULATION_SETTINGS セクション: 固定利回り選択時に fixedInterestRate の必須が効く', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    const index = result.current.effectiveSections.indexOf(FC.SECTION_NAMES.SIMULATION_SETTINGS);
    expect(index).toBeGreaterThanOrEqual(0);

    // デフォルト状態（ランダム変動）では通る
    let isValid = true;
    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(true);

    // 固定利回りを選択しつつ fixedInterestRate が空だと通らない
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        interestRateScenario: '固定利回り',
        fixedInterestRate: '',
      }));
    });

    act(() => {
      isValid = result.current.validateSection(index);
    });
    expect(isValid).toBe(false);
  });
});
