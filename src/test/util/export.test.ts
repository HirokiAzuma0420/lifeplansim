import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { exportToExcel, exportToPdf } from '../../utils/export';
import type { YearlyData, SimulationInputParams, InvestmentProduct } from '../../types/simulation-types';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// --- モック ---

// xlsxのモック
vi.mock('xlsx', async () => {
  const actual = await vi.importActual('xlsx');
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

// jspdfのモック (クラスとしてモック)
const mockSave = vi.fn();
const mockAddImage = vi.fn();
const mockAddPage = vi.fn();
vi.mock('jspdf', () => {
    class MockJsPDF {
        internal = {
            pageSize: {
                getWidth: () => 210,
                getHeight: () => 297,
            }
        };
        save = mockSave;
        addImage = mockAddImage;
        addPage = mockAddPage;

        constructor() {
            // コンストラクタが呼ばれたことを確認できるように
            return this;
        }
    }
    return {
        default: MockJsPDF,
    };
});

// html2canvasのモック
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,',
    width: 500,
    height: 300,
  }),
}));


// --- ダミーデータ ---
const mockYearlyData: YearlyData[] = [
  {
    year: 2025,
    age: 30,
    income: 5000000,
    incomeDetail: { self: 5000000, spouse: 0, investment: 0 },
    expense: 3000000,
    expenseDetail: { living: 2000000, car: 500000, housing: 500000, marriage: 0, children: 0, appliances: 0, care: 0, retirementGap: 0 },
    savings: 2000000,
    nisa: { principal: 1000000, balance: 1100000 },
    ideco: { principal: 240000, balance: 250000 },
    taxable: { principal: 500000, balance: 550000 },
    investmentPrincipal: 1740000,
    totalAssets: 3900000,
    balance: 2000000,
    investedAmount: 1200000,
    assetAllocation: { cash: 0.51, investment: 0.49, nisa: 0.28, ideco: 0.06 },
    products: { 'stocks-0': { principal: 500000, balance: 550000 }, 'nisa-1': { principal: 1000000, balance: 1100000 } },
  },
];

const mockInputParams: SimulationInputParams & { products?: InvestmentProduct[] } = {
  initialAge: 30,
  endAge: 90,
  retirementAge: 65,
  mainJobIncomeGross: 5000000,
  sideJobIncomeGross: 0,
  monthlySavingsJPY: 100000,
  expenseMode: 'simple',
  livingCostSimpleAnnual: 3000000,
  currentSavingsJPY: 2000000,
  emergencyFundJPY: 1000000,
  pensionStartAge: 65,
  car: { priceJPY: 0, firstAfterYears: 0, frequencyYears: 0, loan: { use: false } },
  housing: { type: '賃貸' },
  postRetirementLiving10kJPY: 20,
  pensionMonthly10kJPY: 15,
  stressTest: { enabled: false },
  interestScenario: '固定利回り',
  incomeGrowthRate: 0.01,
  products: [
      { key: 'stocks', account: '課税', currentJPY: 500000, recurringJPY: 0, spotJPY: 0, expectedReturn: 0.05 },
      { key: 'world-stock', account: '非課税', currentJPY: 1000000, recurringJPY: 1200000, spotJPY: 0, expectedReturn: 0.05 }
  ]
};

// --- テストスイート ---
describe('Export Utilities', () => {
  beforeEach(() => {
    // 各テストの前にモックとDOMをリセット
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('exportToExcel', () => {
    it('should call XLSX.writeFile with the correct data and filename', () => {
      exportToExcel(mockYearlyData, mockInputParams, 'test.xlsx');

      expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
      const writeCall = (XLSX.writeFile as Mock).mock.calls[0];
      const workbook = writeCall[0];
      const filename = writeCall[1];
      
      expect(filename).toBe('test.xlsx');
      expect(workbook.SheetNames).toEqual(['年次データサマリー', '商品別資産詳細', '入力パラメータ']);
    });

    it('should not call XLSX.writeFile if data is empty', () => {
        exportToExcel([], mockInputParams);
        expect(XLSX.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('exportToPdf', () => {
    it('should call html2canvas and jspdf.save', async () => {
        // テストケース内でDOM要素をセットアップ
        const mockElement = document.createElement('div');
        mockElement.id = 'test-id';
        document.body.appendChild(mockElement);

        await exportToPdf(['test-id'], 'test.pdf');
        
        expect(html2canvas).toHaveBeenCalledWith(mockElement, { scale: 2 });
        expect(mockAddImage).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledWith('test.pdf');
    });

    it('should call save even if an element is not found', async () => {
        await exportToPdf(['non-existent-id'], 'empty.pdf');
        // html2canvas should not be called
        expect(html2canvas).not.toHaveBeenCalled();
        // but the process should continue and try to save the (empty) pdf
        expect(mockSave).toHaveBeenCalledWith('empty.pdf');
    });
  });
});
