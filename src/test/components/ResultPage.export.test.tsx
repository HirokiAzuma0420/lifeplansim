import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResultPage from '../../pages/ResultPage';
import type { SimulationNavigationState, SimulationInputParams } from '../../types/simulation-types';
import { exportToExcel, exportToPdf } from '../../utils/export';

// モック
vi.mock('../../utils/export', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('../../utils/export');
  return {
    ...actual,
    exportToExcel: vi.fn(),
    exportToPdf: vi.fn(),
  };
});

// --- ダミーデータ ---
const mockYearlyData = [
  {
    year: 2025, age: 30, income: 5000000, incomeDetail: { self: 5000000, spouse: 0, investment: 0 }, expense: 3000000, expenseDetail: { living: 2000000, car: 500000, housing: 500000, marriage: 0, children: 0, appliances: 0, care: 0, retirementGap: 0 }, savings: 2000000, nisa: { principal: 1000000, balance: 1100000 }, ideco: { principal: 240000, balance: 250000 }, taxable: { principal: 500000, balance: 550000 }, investmentPrincipal: 1740000, totalAssets: 3900000, balance: 2000000, investedAmount: 1200000, assetAllocation: { cash: 0.51, investment: 0.49, nisa: 0.28, ideco: 0.06 }, products: { 'stocks-0': { principal: 500000, balance: 550000 }, 'nisa-1': { principal: 1000000, balance: 1100000 } },
  },
];

// SimulationInputParams 型を明示的に指定し、必須プロパティをすべて含める
const mockInputParams: SimulationInputParams = {
  initialAge: 30,
  endAge: 90,
  retirementAge: 65,
  pensionStartAge: 65,
  mainJobIncomeGross: 5000000,
  sideJobIncomeGross: 0,
  incomeGrowthRate: 0.01,
  expenseMode: 'simple',
  livingCostSimpleAnnual: 3000000,
  car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
  housing: { type: '賃貸' },
  postRetirementLiving10kJPY: 20,
  pensionMonthly10kJPY: 15,
  currentSavingsJPY: 2000000,
  monthlySavingsJPY: 100000,
  emergencyFundJPY: 1000000,
  stressTest: { enabled: false },
  interestScenario: '固定利回り',
};

const mockState: SimulationNavigationState = {
  yearlyData: mockYearlyData,
  inputParams: mockInputParams,
};

const renderComponent = () => {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/results', state: mockState }]}>
      <Routes>
        <Route path="/results" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>
  );
};


describe('ResultPage Export UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open dropdown menu when "結果を保存" button is clicked', async () => {
    renderComponent();
    const saveButton = screen.getByRole('button', { name: /結果を保存/i });
    await userEvent.click(saveButton);
    
    expect(screen.getByRole('menuitem', { name: /レポートを保存 \(PDF\)/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /詳細データを保存 \(Excel\)/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /生データを保存 \(JSON\)/i })).toBeInTheDocument();
  });

  it('should close dropdown menu when an item is clicked', async () => {
    renderComponent();
    const saveButton = screen.getByRole('button', { name: /結果を保存/i });
    await userEvent.click(saveButton);
    
    const pdfButton = screen.getByRole('menuitem', { name: /レポートを保存 \(PDF\)/i });
    await userEvent.click(pdfButton);

    expect(screen.queryByRole('menuitem', { name: /レポートを保存 \(PDF\)/i })).not.toBeInTheDocument();
  });

  it('should call exportToPdf when PDF option is clicked', async () => {
    renderComponent();
    const saveButton = screen.getByRole('button', { name: /結果を保存/i });
    await userEvent.click(saveButton);
    
    const pdfButton = screen.getByRole('menuitem', { name: /レポートを保存 \(PDF\)/i });
    await userEvent.click(pdfButton);

    expect(exportToPdf).toHaveBeenCalledTimes(1);
  });

  it('should call exportToExcel when Excel option is clicked', async () => {
    renderComponent();
    const saveButton = screen.getByRole('button', { name: /結果を保存/i });
    await userEvent.click(saveButton);
    
    const excelButton = screen.getByRole('menuitem', { name: /詳細データを保存 \(Excel\)/i });
    await userEvent.click(excelButton);

    expect(exportToExcel).toHaveBeenCalledTimes(1);
  });
});