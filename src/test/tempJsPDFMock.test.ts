import { describe, it, expect, vi } from 'vitest';
import jsPDF from './__mocks__/jspdf'; // モックされたjsPDFをインポート
import { mockGetWidth } from './__mocks__/jspdf';

// Vitestにモジュールをモックするよう指示 (ここでは不要だが、念のため記載)
vi.mock('jspdf');

describe('jsPDF Mock Test', () => {
  it('jsPDF constructor should return an instance with internal.pageSize', () => {
    const pdf = new jsPDF('p', 'pt', 'a4'); // generatePdfReport と同じ引数でインスタンス化

    expect(pdf).toBeDefined();
    expect(pdf.internal).toBeDefined();
    expect(pdf.internal.pageSize).toBeDefined();
    expect(pdf.internal.pageSize.getWidth).toBeDefined();
    expect(typeof pdf.internal.pageSize.getWidth).toBe('function');
    expect(pdf.internal.pageSize.getWidth()).toBe(595.28); // モックされた値が返ることを確認

    expect(mockGetWidth).toHaveBeenCalledTimes(1); // 呼ばれた回数も確認
  });
});
