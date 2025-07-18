## 🎯 修正依頼内容：「戻る」ボタン押下時のポップアップが想定外に表示されたり、閉じられない不具合を修正する

---

### ✅ 問題1：TopPage.tsx から遷移直後でも visitedSections に 0 が入っており、戻るボタンが表示されてポップアップが出てしまう

【原因】
- useEffect により currentSectionIndex が 0 のときでも visitedSections に登録されているため
- visitedSections に 1つしかセクションがない状態でも「戻る」ボタンが出てしまう

【修正方針】
- currentSectionIndex > 0 のときのみ visitedSections を更新する
- visitedSections.size > 1 のときのみ「戻る」ボタンとポップアップを表示可能にする

【対応コード】
1. visitedSections の更新 useEffect を以下に変更：

useEffect(() => {
  if (currentSectionIndex > 0) {
    setVisitedSections(prev => new Set([...prev, currentSectionIndex]));
  }
}, [currentSectionIndex]);

2. 戻るボタン表示条件を修正：

{visitedSections.size > 1 && currentSectionIndex > 0 && (
  <button onClick={() => setShowBackModal(true)} ... >戻る</button>
)}

---

### ✅ 問題2：ポップアップを開いて項目をクリックしても閉じない、または閉じた後に currentSectionIndex の更新が反映されない

【原因】
- setState（setCurrentSectionIndex）で遷移しても、visitedSections が未更新のままだと UI が再描画されないことがある
- また、モーダルの hidden 制御が正しく切り替わっていない可能性

【修正方針】
- setShowBackModal(false) を setCurrentSectionIndex より後で明示的に呼び出す
- モーダルの表示・非表示条件に `hidden={!showBackModal}` を使うのではなく、`{showBackModal && (...)}` で分岐レンダリングする方が確実

【対応コード例】
<button
  onClick={() => {
    setCurrentSectionIndex(i);
    setShowBackModal(false);
  }}
>

【または安全策として setTimeout を挟む場合】
onClick={() => {
  setCurrentSectionIndex(i);
  setTimeout(() => setShowBackModal(false), 0);
}}

---

### ✅ 追加安全策（任意）

- visitedSections を useRef にして重複追加を防止する
- セクション遷移履歴がリセットされないよう、URLクエリやセッション保存を併用する

---

### ✅ 修正後の期待挙動

- TopPage → FormPage 遷移直後は戻るボタンが表示されない
- 2ページ目以降に進んでから戻るを押すと、ポップアップが出現し、セクション選択が可能
- 選択後はモーダルが閉じ、該当セクションに遷移する
- visitedSections の記録は重複せず、常に進行済みのページのみが表示される
