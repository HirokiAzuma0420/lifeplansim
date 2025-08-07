# ローカルLLMへの厳密プロンプト：ローン返済計上・子供支出修正指示

---

## 【目的】
1. 車・住宅ローンの支出は「ローン期間中、毎年返済額を加算」するようロジックを修正せよ（初年度のみの一括計上は不可）。
2. 子供支出（教育費）は「firstBornAgeから22年間」childExpenseを均等割で毎年加算し、その年の支出に反映させること。
3. 入力値（numberOfChildren, firstBornAgeなど）はstring型で渡ることがあるため、ロジック内で必ずNumber()型変換し、バリデーション・計算の判定漏れが起きないようにせよ。

---

## 【Step1】車ローン返済ロジック修正

### A. 年ループ内で
- 車をローンで購入した場合、ローン返済開始年（初回買替年）からローン終了年（ローン年数分）まで、毎年carExpenseに年額返済額を加算するようにすること。

### B. 例
for (let age = initialAge; age <= endAge; age++) {
// ...略...
// 車ローン返済年管理
// carRepaymentPeriods: 車のローン開始年配列
carRepaymentPeriods.forEach(startYear => {
if (age >= startYear && age < startYear + carLoanYears) {
carExpense += loanAnnualPayment;
}
});
}

- 「毎回の買い替えイベントでローン返済期間分、返済年額を支出計上」できる設計にすること。

---

## 【Step2】住宅ローン返済ロジック修正

### A. 持ち家（ローン中）の場合
- 住宅購入年からローン年数分、毎年housingExpenseにローン年額を加算すること。
- 既存ローン継続中の場合も、loanMonthlyPayment×12をローン終了まで毎年加算する。

### B. 例
if (housingType === '賃貸' && housePurchasePlan && age >= housePurchasePlan.age && age < housePurchasePlan.age + housePurchasePlan.loanYears) {
housingExpense = loanAnnualPayment;
currentYearExpense += housingExpense;
}

---

## 【Step3】子供支出ロジック修正

### A. 子供支出の年齢範囲・入力バリデーション
- hasChildren, numberOfChildren, educationPattern, firstBornAgeを必ずNumber()で変換
- 35歳（firstBornAge）から22年間、childExpenseに「教育費合計÷22年×人数」を加算すること

### B. 例
const childStart = Number(firstBornAge);
const childEnd = childStart + 22;
if (hasChildren === 'はい' && numberOfChildren > 0 && age >= childStart && age < childEnd) {
// 教育パターンに応じて金額決定
let educationCostPerChild = ...;
childExpense = (educationCostPerChild * numberOfChildren) / 22;
currentYearExpense += childExpense;
}


---

## 【Step4】入力値型変換の徹底

- すべての年齢・金額入力値をNumber()で明示的に変換し、string型のままif判定や加算をしないこと。
- 不正な値（NaN, null, undefined）は必ず0として扱う。

---

## 【Step5】テスト・バリデーション

- 修正後のロジックで、output.jsonの各年のcarExpense, housingExpense, childExpenseが「ローン・教育費期間中ずっと毎年計上されている」ことを検証すること。

---

この手順を厳密に実施し、ローン返済と子供支出の計上漏れ・バグを完全に解消せよ。