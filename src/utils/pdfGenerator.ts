import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfReport = async () => {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 20; // ページの余白
  let yPos = margin; // 現在のY座標

  // 複数の要素を処理するためのヘルパー関数
  const addElementToPdf = async (elementId: string, pageTitle: string = '') => {
    const element = document.getElementById(elementId);
    if (element) {
      // 既存のコンテンツがある場合のみページを追加
      if (yPos !== margin) {
        pdf.addPage();
        yPos = margin;
      }

      // ページタイトルを追加
      if (pageTitle) {
        pdf.setFontSize(16);
        pdf.text(pageTitle, margin, yPos);
        yPos += 30; // タイトルの高さ分Y座標を移動
      }

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdfWidth - 2 * margin; // 画像の幅はPDFの幅から左右のマージンを引いたもの
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let currentY = 0;

      // 初回描画
      if (yPos + imgHeight > pdfHeight - margin) { // 最初の画像がページに収まらない場合
        // 画像を分割して追加
        while (heightLeft > 0) {
          const sHeight = Math.min(heightLeft, pdfHeight - margin - yPos);
          const imgSlice = canvas.toDataURL('image/png'); // スライスごとにキャプチャし直す必要がある場合は工夫が必要

          pdf.addImage(
            imgSlice,
            'PNG',
            margin,
            yPos,
            imgWidth,
            sHeight,
            undefined,
            'FAST',
            currentY / (canvas.height / sHeight) // この行はhtml2canvasのimgDataURIオプションの代わり
          ); // imgDataURIでcropする機能がないため、このままでは正しいスライスができない
          heightLeft -= sHeight;
          currentY += sHeight;
          if (heightLeft > 0) {
            pdf.addPage();
            yPos = margin;
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 20; // 画像の下に余白
      }
    }
  };

  // ページタイトルと対応する要素IDのマップ
  const sectionsToCapture = [
    { id: 'pdf-summary-section', title: 'サマリー' },
    { id: 'pdf-total-asset-chart', title: '総資産推移' },
    { id: 'pdf-timeline', title: 'ライフプラン・タイムライン' },
    { id: 'pdf-peer-comparison-charts', title: '収入・貯蓄の同世代比較' },
    { id: 'pdf-investment-charts', title: '投資の状況' },
    // TODO: AssetTableとCashFlowTableはIDがないため、直接キャプチャするには追加のDOM操作かID付与が必要
  ];

  for (const section of sectionsToCapture) {
    await addElementToPdf(section.id, section.title);
  }

  pdf.save('simulation_report.pdf');
};
