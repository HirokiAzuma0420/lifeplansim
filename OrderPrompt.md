## 🎯 修正依頼内容：「ライフイベント - 結婚」セクションで結婚関連費用の合計額をフロートボックス表示する

---

### ✅ 目的

ユーザーが結婚に関する各費用（婚約・結婚式・新婚旅行・引越し）を入力するセクションにおいて、合計額（万円）の目安をリアルタイムでフロートボックスに表示したい。

---

### ✅ 表示内容

- ラベル：結婚費用総額  
- 表示単位：円  
- 表示条件：`sections[currentSectionIndex] === 'ライフイベント - 結婚'` かつ `planToMarry === 'する'`  

---

### 🔧 修正内容

#### 1. useMemo を追加：結婚費用合計を算出

const totalMarriageCost = useMemo(() => {
  if (formData.planToMarry !== 'する') return 0;
  return (
    (Number(formData.engagementCost) || 0) +
    (Number(formData.weddingCost) || 0) +
    (Number(formData.honeymoonCost) || 0) +
    (Number(formData.newHomeMovingCost) || 0)
  ) * 10000; // 万円 → 円に変換
}, [
  formData.planToMarry,
  formData.engagementCost,
  formData.weddingCost,
  formData.honeymoonCost,
  formData.newHomeMovingCost,
]);

---

#### 2. renderFloatingBox の呼び出しを追記（floating-header 内）

{renderFloatingBox(
  totalMarriageCost,
  currentSectionIndex === sections.indexOf('ライフイベント - 結婚') && totalMarriageCost > 0,
  \"結婚費用総額\"
)}

---

### ✅ 表示位置

- 他の renderFloatingBox と同様、`floating-header` 内に配置  
- すでにある家・投資・家電などの金額フロートと同一レイヤーで表示

---

### ✅ 補足事項

- `defaultValue` で初期値（例：200, 330, 35, 50万円）があるため、フォーム初期表示時点で自動的に表示される  
- 円換算時に 10000 を掛けてフロート表示と整合  
- 表示切り替えは planToMarry が \"する\" であることが条件となるため、不要な表示はされない
