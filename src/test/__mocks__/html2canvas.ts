import { vi } from 'vitest';

// html2canvas関連のモック関数とクラス
export const mockToDataURL = vi.fn(() => 'data:image/png;base64,mockImageData');

export class MockCanvas {
  width = 1000;
  height = 500;
  toDataURL = mockToDataURL;
}

// html2canvasのデフォルトエクスポートとしてモック関数を返す
const defaultExport = vi.fn(() => Promise.resolve(new MockCanvas()));
export default defaultExport;
