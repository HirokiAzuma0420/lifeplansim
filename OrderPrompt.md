## 🎯 修正依頼内容：FormPage.tsx に以下6点の改修を実装してください

---

### ✅ 1. ライフイベント - 車：ローン設定項目と総額表示の追加

【フォーム項目の追加】
- ローンで購入しますか？（name: carLoanUsage, options: はい／いいえ）
- ローン年数は？（name: carLoanYears, options: 3／5／7、carLoanUsage が "はい" のときのみ表示）

【formData に以下の項目を追加】
- carLoanUsage: ''
- carLoanYears: ''

【ローン総額の useMemo を追加】
const totalCarLoanCost = useMemo(() => {
  if (formData.carLoanUsage !== 'はい') return 0;
  const principal = Number(formData.carPrice) * 10000 || 0;
  const years = Number(formData.carLoanYears) || 0;
  const interestRate = 0.025 / 12;
  const months = years * 12;
  if (principal <= 0 || years <= 0) return 0;
  const monthly = principal * interestRate * Math.pow(1 + interestRate, months) / (Math.pow(1 + interestRate, months) - 1);
  const total = monthly * months;
  return Math.ceil(total);
}, [formData.carPrice, formData.carLoanUsage, formData.carLoanYears]);

【フロートボックス表示を追加】
renderFloatingBox(totalCarLoanCost, currentSectionIndex === sections.indexOf('ライフイベント - 車') && totalCarLoanCost > 0, '車ローン総額')

---

### ✅ 2. ライフイベント - 結婚：既婚者には表示しない

renderSection() 内の 'ライフイベント - 結婚' セクション分岐に以下を追加：

if (formData.familyComposition === '既婚') return null;

---

### ✅ 3. ライフイベント - 親の介護：金額表示を画面内から削除し、フロート化

【削除】
- 画面内の「介護費用総額: ○○万円」の h3 タグを削除

【追加】
renderFloatingBox(totalCareCost * 10000, currentSectionIndex === sections.indexOf('ライフイベント - 親の介護') && totalCareCost > 0, '介護費用総額')

---

### ✅ 4. ライフイベント - 老後：「老後の月間不足額」の画面内表示を削除し、フロート化

【削除】
- 老後セクション内の「老後の月間不足額: ○○万円」の h3 タグ

【追加】
renderFloatingBox(totalRetirementMonthly * 10000, currentSectionIndex === sections.indexOf('ライフイベント - 老後') && totalRetirementMonthly > 0, '老後の不足額')

---

### ✅ 5. 貯蓄セクション：フロートボックスでの表示を削除

【削除】
renderFloatingBox(displayTotalSavings, currentSectionIndex === sections.indexOf('貯蓄') && displayTotalSavings > 0, '貯蓄総額')

---

### ✅ 6. シミュレーション設定：「運用リスク許容度」関連を完全に削除

【削除対象】
- input要素（selectタグとoption）
- ラベルやラップ要素
- formData.riskTolerance の定義

---
