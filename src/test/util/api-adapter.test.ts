import { describe, it, expect } from 'vitest';
import { createApiParams } from '../../utils/api-adapter';
import type { FormDataState } from '../../types/form-types';
import { createDefaultFormData } from '../../hooks/useFormState';
import * as FC from '../../constants/financial_const';

describe('NISA元本計算のためのcreateApiParams', () => {
  it('NISA口座の場合、株式のinitialPrincipal（元本）を計算できる', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentStocksAccountType: 'nisa',
      investmentStocksCurrent: '120', // 120万円
      investmentStocksGainLossSign: '+',
      investmentStocksGainLossRate: '20', // +20%
    };

    const params = createApiParams(formData);
    const stocksProduct = params.products?.find(p => p.key === 'stocks');
    const expectedPrincipal = 100 * FC.YEN_PER_MAN;

    expect(stocksProduct).toBeDefined();
    expect(stocksProduct?.account).toBe('非課税');
    expect(stocksProduct?.initialPrincipal).toBe(expectedPrincipal);
    expect(stocksProduct?.currentJPY).toBe(120 * FC.YEN_PER_MAN);
  });

  it('NISA口座の場合、投資信託のinitialPrincipal（元本）を計算できる', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentTrustAccountType: 'nisa',
      investmentTrustCurrent: '80', // 80万円
      investmentTrustGainLossSign: '-',
      investmentTrustGainLossRate: '20', // -20%
    };

    const params = createApiParams(formData);
    const trustProduct = params.products?.find(p => p.key === 'trust');
    const expectedPrincipal = 100 * FC.YEN_PER_MAN;

    expect(trustProduct).toBeDefined();
    expect(trustProduct?.account).toBe('非課税');
    expect(trustProduct?.initialPrincipal).toBe(expectedPrincipal);
    expect(trustProduct?.currentJPY).toBe(80 * FC.YEN_PER_MAN);
  });

  it('課税口座の場合はinitialPrincipal（元本）を計算しない', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentStocksAccountType: 'taxable',
      investmentStocksCurrent: '120',
    };

    const params = createApiParams(formData);
    const stocksProduct = params.products?.find(p => p.key === 'stocks');

    expect(stocksProduct).toBeDefined();
    expect(stocksProduct?.account).toBe('課税');
    expect(stocksProduct?.initialPrincipal).toBeUndefined();
    expect(stocksProduct?.currentJPY).toBe(120 * FC.YEN_PER_MAN);
  });

  it('株式と投資信託の両方がNISA口座の場合を処理できる', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentStocksAccountType: 'nisa',
      investmentStocksCurrent: '120',
      investmentStocksGainLossSign: '+',
      investmentStocksGainLossRate: '20',
      investmentTrustAccountType: 'nisa',
      investmentTrustCurrent: '80',
      investmentTrustGainLossSign: '-',
      investmentTrustGainLossRate: '20',
    };

    const params = createApiParams(formData);
    const stocksProduct = params.products?.find(p => p.key === 'stocks');
    const trustProduct = params.products?.find(p => p.key === 'trust');

    const expectedStocksPrincipal = 100 * FC.YEN_PER_MAN;
    const expectedTrustPrincipal = 100 * FC.YEN_PER_MAN;

    expect(stocksProduct).toBeDefined();
    expect(stocksProduct?.account).toBe('非課税');
    expect(stocksProduct?.initialPrincipal).toBe(expectedStocksPrincipal);

    expect(trustProduct).toBeDefined();
    expect(trustProduct?.account).toBe('非課税');
    expect(trustProduct?.initialPrincipal).toBe(expectedTrustPrincipal);
  });

  it('評価損益率がゼロの場合を処理できる', () => {
    const formData: FormDataState = {
      ...createDefaultFormData(),
      investmentStocksAccountType: 'nisa',
      investmentStocksCurrent: '100',
      investmentStocksGainLossSign: '+',
      investmentStocksGainLossRate: '0',
    };

    const params = createApiParams(formData);
    const stocksProduct = params.products?.find(p => p.key === 'stocks');
    const expectedPrincipal = 100 * FC.YEN_PER_MAN;

    expect(stocksProduct).toBeDefined();
    expect(stocksProduct?.initialPrincipal).toBe(expectedPrincipal);
  });
});
