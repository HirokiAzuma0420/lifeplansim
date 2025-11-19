import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import AssetTable from '@/components/dashboard/AssetTable';

// TC-FORM-121: 資産テーブルでの NISA 積立と評価額の分離表示
describe('TC-FORM-121: 資産テーブルでの NISA 積立と評価額の分離表示', () => {
  it('NISA の評価額と積立額が別々の列に表示される', () => {
    const enrichedData = [
      {
        year: 2025,
        現金: 0,
        NISA: 1_200_000,
        iDeCo: 0,
        課税口座: 0,
        総資産: 1_200_000,
        NISA積立: 200_000,
        iDeCo積立: 0,
      } as any,
    ];

    render(<AssetTable enrichedData={enrichedData} />);

    const rows = screen.getAllByRole('row');
    const headerRow = rows[0];
    const dataRow = rows[1];

    // ヘッダーに NISA 積立 / iDeCo 積立 の列があること
    expect(within(headerRow).getByText('NISA積立')).toBeInTheDocument();
    expect(within(headerRow).getByText('iDeCo積立')).toBeInTheDocument();

    // 年度と NISA 評価額 / 積立額が行に表示されていること
    expect(within(dataRow).getByText('2025')).toBeInTheDocument();

    // NISA 評価額（セルが存在することのみを確認）
    const nisaCells = within(dataRow).getAllByText('1,200,000');
    expect(nisaCells.length).toBeGreaterThanOrEqual(1);
    // NISA 積立額
    expect(within(dataRow).getByText('200,000')).toBeInTheDocument();
  });
});
