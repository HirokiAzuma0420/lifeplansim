import { vi } from 'vitest';
import type jsPDF from 'jspdf'; // 型情報参照用

export const mockAddPage = vi.fn();
export const mockAddImage = vi.fn();
export const mockSave = vi.fn();
export const mockGetWidth = vi.fn(() => 595.28);
export const mockGetHeight = vi.fn(() => 841.89);
export const mockSetFontSize = vi.fn();
export const mockText = vi.fn();

type JsPdfConstructor = new (
  orientation?: string,
  unit?: string,
  format?: string | number[],
  compress?: boolean
) => jsPDF;

type JsPdfMockType = ReturnType<typeof vi.fn> & JsPdfConstructor;

// jsPDFコンストラクタのモック。ReturnType<typeof vi.fn> を併用し mockClear などを型安全に扱う。
const jsPDFMock = vi.fn(function (this: jsPDF) {
  this.addPage = mockAddPage;
  this.addImage = mockAddImage;
  this.save = mockSave;
  this.internal = {
    pageSize: {
      width: mockGetWidth(),
      height: mockGetHeight(),
      getWidth: mockGetWidth,
      getHeight: mockGetHeight,
    },
  } as unknown as jsPDF['internal'];
  this.setFontSize = mockSetFontSize;
  this.text = mockText;
}) as JsPdfMockType;

export default jsPDFMock;
