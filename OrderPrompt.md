## 🎯 修正依頼内容：FormPage で外部離脱時に確認ポップアップ（入力は保存されません。終了しますか？）を表示する

---

### ✅ 背景と目的

現在の実装では、フォーム途中でブラウザの戻るボタンを2回押すとページを離脱してしまい、入力内容が失われる。  
フォームセクション遷移による履歴制御では完全なブロックが困難なため、離脱時に確認ポップアップを表示し、ユーザーに警告を与えたい。

---

### ✅ 実装方針

- window.addEventListener("beforeunload", ...) によってブラウザ離脱時の確認ポップアップを表示する  
- イベントコールバック内で e.preventDefault() と returnValue の設定を行うことで、確認ダイアログが表示される（ブラウザによってはメッセージ非表示）  
- React の useEffect により、マウント時に登録、アンマウント時に解除

---

### 🔧 追加コード（FormPage の useEffect に追加）

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = ""; // Chrome, Firefox で有効
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, []);

---

### ✅ 補足事項

- 表示される文言（「入力は保存されません。終了しますか？」）は **ブラウザ側が自動生成するため、カスタムメッセージは表示されない**（セキュリティ制限による）  
- Safari ではこのポップアップは表示されないが、Chrome・Edge・Firefox・Android Chrome では動作する  
- 「完了」ボタンなどで安全に送信済みとなったあとで、この確認を解除したい場合は `removeEventListener` を明示的に呼び出せばよい

---

### ✅ 任意：完了済みセクションでは警告を解除する場合

// 完了後に確認ダイアログを解除する例（ボタン操作内）

const handleComplete = () => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  // 次のページへ遷移など
};

handleBeforeUnload を useCallback で外に出すことで外部から解除可能
