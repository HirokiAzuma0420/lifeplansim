## 🎯 修正依頼内容：「戻る」ボタン押下時に表示するセクション選択モーダルの誤作動を修正する

---

### ✅ 問題点1：TopPage から遷移直後にポップアップが表示される

【原因】
visitedSections に currentSectionIndex（=0）が useEffect 経由で即座に追加されているため、「戻る」ボタンが表示され、クリックでモーダルが開いてしまう

【修正】
初回マウント時には visitedSections を更新しないよう、currentSectionIndex === 0 の場合はスキップする

【変更内容】
以下の useEffect を次のように修正：

useEffect(() => {
  if (currentSectionIndex === 0) return;
  setVisitedSections(prev => new Set([...prev, currentSectionIndex]));
}, [currentSectionIndex]);

---

### ✅ 問題点2：「戻る」ボタンを押してもモーダルが出ないことがある

【原因】
visitedSections の初期値が空であるため、リロード時に「戻る可能セクション」がゼロ件になっている

【修正】
visitedSections の初期値に currentSectionIndex を含めて初期化する

【変更内容】
visitedSections の useState を以下のように修正：

const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set([0]));

---

### ✅ 期待される動作

- 初回ロード時に「戻る先選択モーダル」は表示されない
- フォームを進めたあとで戻るボタンを押すと、訪問済みセクション一覧がポップアップで選択できる
- キャンセルで閉じられ、選択でそのセクションにジャンプできる
- visitedSections によって進行済みセクションのみが記録され、選択肢に制限が効く

---

### ✅ 補足

- visitedSections の更新処理は「前進時のみ追加」となるよう制御されるため、再訪や連打による重複記録を防止できる
- currentSectionIndex がセクション配列外に出ないよう安全性チェックは別途維持すること
