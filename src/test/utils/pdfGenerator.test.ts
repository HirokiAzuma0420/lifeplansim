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
      <div id="pdf-summary-section">Summary Content</div>
      <div id="pdf-total-asset-chart">Total Asset Chart Content</div>
      <div id="pdf-timeline">Timeline Content</div>
      <div id="pdf-peer-comparison-charts">Peer Comparison Content</div>
      <div id="pdf-investment-charts">Investment Chart Content</div>
    `;
  });

  it('各セクションに対してhtml2canvasが呼び出される', async () => {
    await generatePdfReport();

    const expectedSectionIds = [
      'pdf-summary-section',
      'pdf-total-asset-chart',
      'pdf-timeline',
      'pdf-peer-comparison-charts',
      'pdf-investment-charts',
    ];

    expect(html2canvasMocked).toHaveBeenCalledTimes(expectedSectionIds.length);
    expectedSectionIds.forEach(id => {
      expect(html2canvasMocked).toHaveBeenCalledWith(document.getElementById(id), expect.any(Object));
    });
  });

  it('jsPDFが生成され保存される', async () => {
    await generatePdfReport();

    expect(jsPDFMockedConstructor).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('simulation_report.pdf');
  });

  it('各セクションがPDFに描画される', async () => {
    await generatePdfReport();

    expect(mockAddImage).toHaveBeenCalledTimes(5);
    expect(mockSetFontSize).toHaveBeenCalledTimes(5);
    expect(mockText).toHaveBeenCalledTimes(5);
    expect(mockAddImage).toHaveBeenCalledWith(
      'data:image/png;base64,mockImageData',
      'PNG',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('コンテンツが1ページに収まらない場合にページ追加が行われる', async () => {
    html2canvasMocked.mockImplementation(() =>
      Promise.resolve({
        width: 1000,
        height: 2000,
        toDataURL: vi.fn(() => 'data:image/png;base64,mockImageData'),
      })
    );

    await generatePdfReport();

    expect(mockAddPage).toHaveBeenCalled();
  });
});
