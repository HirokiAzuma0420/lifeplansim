import { act, renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useFormState } from './useFormState';
import { createDefaultFormData } from './useFormState';

// 各テストの前にストアの状態をリセット
beforeEach(() => {
  // カスタムフックのテストでは、各テストが独立しているため
  // renderHookが毎回新しい状態を生成します。
  // そのため、グローバルなリセット処理は不要です。
});

describe('useFormState - 状態クリーンアップロジック (UT-009)', () => {  
  // useFormStateは内部でuseLocationを使っているため、Routerでラップする必要がある
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

  test('家族構成を「独身」に変更すると、配偶者関連のデータがリセットされる', async () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    // 1. 配偶者情報を含むダミーデータをセット
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        familyComposition: '既婚', // まず既婚状態にする
        spouseAge: '30', // ダミーデータ
        spouseMainIncome: '400', // ダミーデータ
        spouseSideJobIncome: '50', // ダミーデータ
        useSpouseNisa: true, // ダミーデータ
      }));
    });

    // 2. 家族構成を「独身」に変更するアクションを実行
    act(() => {
      result.current.handleInputChange({
        target: { name: 'familyComposition', type: 'radio', value: '独身' },
      });
    });

    // 3. 関連データが初期値に戻っていることを確認
    // useEffectが実行されるのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    })

    const defaultData = createDefaultFormData();
    // 家族構成が「独身」になった場合、配偶者関連の収入がリセットされることを確認
    expect(result.current.formData.spouseMainIncome).toBe(defaultData.spouseMainIncome);
    expect(result.current.formData.spouseSideJobIncome).toBe(defaultData.spouseSideJobIncome);
  });

  test('住居タイプを「賃貸」以外に変更すると、将来の購入プランがリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        housingType: '賃貸',
        housePurchaseIntent: 'yes',
        housePurchasePlan: { age: 40, price: 4000, downPayment: 1000, loanYears: 35, interestRate: 1.5 },
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'housingType', type: 'radio', value: '持ち家（ローン中）' },
      });
    });

    expect(result.current.formData.housePurchaseIntent).toBe('no');
    expect(result.current.formData.housePurchasePlan).toBeNull();
  });

  // NOTE: 以下のテストは、useFormState.tsにリセットロジックが実装されていないため、
  //       現状では失敗します。将来的にロジックが追加された際に有効化してください。
  test('子供の有無を「なし」に変更すると、子供関連のデータがリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        hasChildren: 'はい',
        numberOfChildren: '2',
        firstBornAge: '35',
        educationPattern: '私立中心',
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'hasChildren', type: 'radio', value: 'なし' },
      });
    });

    const defaultData = createDefaultFormData();
    expect(result.current.formData.numberOfChildren).toBe(defaultData.numberOfChildren);
    expect(result.current.formData.firstBornAge).toBe(defaultData.firstBornAge);
    expect(result.current.formData.educationPattern).toBe(defaultData.educationPattern);
  });
  
  test('結婚予定を「しない」に変更すると、結婚関連のデータがリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const defaultData = createDefaultFormData();

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        planToMarry: 'する',
        marriageAge: '35',
        spouseAgeAtMarriage: '33',
        spouseIncomePattern: '正社員',
        engagementCost: '999',
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'planToMarry', type: 'radio', value: 'しない' },
      });
    });

    expect(result.current.formData.marriageAge).toBe(defaultData.marriageAge);
    expect(result.current.formData.spouseAgeAtMarriage).toBe(defaultData.spouseAgeAtMarriage);
    expect(result.current.formData.spouseIncomePattern).toBe(defaultData.spouseIncomePattern);
    expect(result.current.formData.engagementCost).toBe(defaultData.engagementCost);
  });

  test('支出入力方法を「簡易入力」に変更すると、詳細支出項目がリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const defaultData = createDefaultFormData();

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        expenseMethod: '詳細',
        utilitiesCost: '10000',
        foodCost: '50000',
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'expenseMethod', type: 'radio', value: '簡単' },
      });
    });

    expect(result.current.formData.utilitiesCost).toBe(defaultData.utilitiesCost);
    expect(result.current.formData.foodCost).toBe(defaultData.foodCost);
  });

  test('車の購入予定を「なし」に変更すると、車関連のデータがリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const defaultData = createDefaultFormData();

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        carPurchasePlan: 'yes',
        carPrice: '300',
        carLoanUsage: 'はい',
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'carPurchasePlan', type: 'radio', value: 'no' },
      });
    });

    expect(result.current.formData.carPrice).toBe(defaultData.carPrice);
    expect(result.current.formData.carLoanUsage).toBe(defaultData.carLoanUsage);
  });

  test('親の介護想定を「なし」に変更すると、介護計画がリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const defaultData = createDefaultFormData();

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        parentCareAssumption: 'はい',
        parentCarePlans: [{ id: 1, parentCurrentAge: 75, parentCareStartAge: 85, monthly10kJPY: 15, years: 10 }],
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'parentCareAssumption', type: 'radio', value: 'なし' },
      });
    });

    // idはDate.now()で生成されるため、比較から除外する
    // 介護計画の主要なプロパティがデフォルト値にリセットされていることを確認する
    expect(result.current.formData.parentCarePlans.length).toBe(1);
    expect(result.current.formData.parentCarePlans[0].parentCurrentAge).toBe(defaultData.parentCarePlans[0].parentCurrentAge);
    expect(result.current.formData.parentCarePlans[0].parentCareStartAge).toBe(defaultData.parentCarePlans[0].parentCareStartAge);
    expect(result.current.formData.parentCarePlans[0].monthly10kJPY).toBe(defaultData.parentCarePlans[0].monthly10kJPY);
    expect(result.current.formData.parentCarePlans[0].years).toBe(defaultData.parentCarePlans[0].years);
  });

  test('定年再雇用を「想定しない」に変更すると、減給率がリセットされる', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const defaultData = createDefaultFormData();

    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        assumeReemployment: true,
        reemploymentReductionRate: '50',
      }));
    });

    act(() => {
      result.current.handleInputChange({
        target: { name: 'assumeReemployment', type: 'checkbox', checked: false, value: 'on' },
      });
    });

    expect(result.current.formData.reemploymentReductionRate).toBe(defaultData.reemploymentReductionRate);
  });

  test('clearAndReady: フォームデータを初期化し、キャッシュを削除する', () => {
    const { result } = renderHook(() => useFormState(), { wrapper });
    const cacheKey = 'lifePlanFormDataCache';
    
    // 1. ダミーデータとキャッシュを設定
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: { personAge: '99' } }));
    act(() => {
      result.current.setFormData(prev => ({...prev, personAge: '50'}));
    });
    expect(localStorage.getItem(cacheKey)).not.toBeNull();
    expect(result.current.formData.personAge).toBe('50');

    // 2. clearAndReadyを実行
    act(() => {
      result.current.clearAndReady();
    })

    // 3. フォームデータが初期化され、キャッシュが削除されたことを確認
    const defaultData = createDefaultFormData();
    expect(result.current.formData.personAge).toBe(defaultData.personAge);
    expect(localStorage.getItem(cacheKey)).toBeNull();
    expect(result.current.isReady).toBe(true);
  });
});