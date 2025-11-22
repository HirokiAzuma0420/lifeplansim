import React from 'react';
import styles from './ReportPrintLayout.module.css';

export const PdfCoverPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <img src="/Topview.png" alt="Key Visual" className="w-64 mb-8" />
        <h1 className="text-4xl font-bold mb-4">ライフプラン シミュレーションレポート</h1>
        <p className="text-xl mb-2">作成日: {new Date().toLocaleDateString('ja-JP')}</p>
        {/* TODO: 対象者名を追加 */}
        <p className="text-lg">このレポートは、お客様の入力情報に基づき作成された試算です。</p>
      </div>
    </div>
  );
};
