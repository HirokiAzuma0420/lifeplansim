import React from 'react';
import styles from './ReportPrintLayout.module.css';

export const PdfDisclaimerPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold mb-4">免責事項</h2>
        <p className="text-md mb-4">
          本レポートは、お客様にご入力いただいた情報に基づき試算されたものであり、将来の経済状況や個人の状況変化を保証するものではありません。
          表示される結果は将来を約束するものではなく、投資判断やその他の意思決定を行う際の唯一の根拠とすべきではありません。
          本シミュレーション結果により生じたいかなる損害についても、当社は一切の責任を負いません。
          ご自身の判断と責任においてご活用ください。
        </p>
        <p className="text-sm mt-8">Copyright © {new Date().getFullYear()} [Your Company Name]. All rights reserved.</p>
      </div>
    </div>
  );
};
