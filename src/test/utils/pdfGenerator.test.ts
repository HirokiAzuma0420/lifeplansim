import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePdfReport } from '../../utils/pdfGenerator';
import jsPDFMock, { mockAddPage, mockAddImage, mockSave, mockSetFontSize, mockText } from '../__mocks__/jspdf';
import html2canvasMock, { MockCanvas } from '../__mocks__/html2canvas';

vi.mock('jspdf', async () => await import('../__mocks__/jspdf'));
vi.mock('html2canvas', async () => await import('../__mocks__/html2canvas'));

describe('generatePdfReport', () => {
  let html2canvasMocked: typeof html2canvasMock;
  let jsPDFMockedConstructor: typeof jsPDFMock;

  beforeEach(() => {
    vi.clearAllMocks();
    html2canvasMocked = vi.mocked(html2canvasMock);
    jsPDFMockedConstructor = vi.mocked(jsPDFMock);

    html2canvasMocked.mockImplementation(() => Promise.resolve(new MockCanvas()));
    jsPDFMockedConstructor.mockClear();

    document.body.innerHTML = `
      <div id="pdf-render-target">
        <div class="pdf-page" id="page-1">Page 1</div>
        <div class="pdf-page" id="page-2">Page 2</div>
        <div class="pdf-page" id="page-3">Page 3</div>
      </div>
    `;
  });

  it('各ページを順番にキャプチャする', async () => {
    await generatePdfReport();

    expect(html2canvasMocked).toHaveBeenCalledTimes(3);
    ['page-1', 'page-2', 'page-3'].forEach(id => {
      expect(html2canvasMocked).toHaveBeenCalledWith(document.getElementById(id), expect.any(Object));
    });
  });

  it('jsPDFインスタンスを生成して保存する', async () => {
    await generatePdfReport();

    expect(jsPDFMockedConstructor).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('simulation_report.pdf');
  });

  it('各ページをPDFに追加しページ間でaddPageが呼ばれる', async () => {
    await generatePdfReport();

    expect(mockAddImage).toHaveBeenCalledTimes(3);
    expect(mockAddPage).toHaveBeenCalledTimes(2);
  });

  it('ヘッダーとフッターのテキストが描画される', async () => {
    await generatePdfReport();

    const headerCalls = mockText.mock.calls.filter(call => typeof call[0] === 'string' && call[0].includes('ライフプラン'));
    const footerCalls = mockText.mock.calls.filter(call => typeof call[0] === 'string' && call[0].includes('ページ'));

    expect(mockSetFontSize).toHaveBeenCalled();
    expect(headerCalls.length).toBe(3);
    expect(footerCalls.length).toBe(3);
  });
});
