import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfReport = async () => {
  const target = document.getElementById('pdf-render-target');
  if (!target) {
    console.warn('PDFレイアウトが見つかりません');
    return;
  }

  const pages = Array.from(target.getElementsByClassName('pdf-page')) as HTMLElement[];
  if (pages.length === 0) {
    console.warn('PDF化対象のページ要素が存在しません');
    return;
  }

  // 生成中のローダーを表示
  const loaderId = 'pdf-loader-overlay';
  const loader = document.createElement('div');
  loader.id = loaderId;
  loader.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9999; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <div style="color: white; font-size: 18px; margin-bottom: 12px;">PDFを生成しています...（数秒〜1分かかる場合があります）</div>
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #10B981; border-radius: 50%; width: 42px; height: 42px; animation: codex-spin 1.2s linear infinite;"></div>
      <style>
        @keyframes codex-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </div>
  `;
  document.body.appendChild(loader);

  const prevDisplay = target.style.display;
  const prevPosition = target.style.position;
  const prevLeft = target.style.left;
  target.style.display = 'block';
  target.style.position = 'absolute';
  target.style.left = '-9999px';

  try {
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compressPdf: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const maxContentHeight = pdfHeight - margin * 2;
    const contentWidth = pdfWidth - margin * 2;

    const captureScale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: captureScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      const widthRatio = contentWidth / canvas.width;
      const heightRatio = maxContentHeight / canvas.height;
      const renderScale = Math.min(1, widthRatio, heightRatio);
      const renderWidth = canvas.width * renderScale;
      const renderHeight = canvas.height * renderScale;
      const offsetX = (pdfWidth - renderWidth) / 2;
      const offsetY = (pdfHeight - renderHeight) / 2;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'MEDIUM');
    }

    pdf.save('simulation_report.pdf');
  } catch (error) {
    console.error('PDF生成に失敗しました', error);
  } finally {
    target.style.display = prevDisplay;
    target.style.position = prevPosition;
    target.style.left = prevLeft;
    const appendedLoader = document.getElementById(loaderId);
    if (appendedLoader?.parentElement) {
      appendedLoader.parentElement.removeChild(appendedLoader);
    }
  }
};
