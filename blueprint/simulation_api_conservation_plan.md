# /api/simulate 資産保存則検証 拡張テスト計画書

前提: 文字コード UTF-8（BOM なし）、改行コード LF。

本ドキュメントは、`api/simulate/index.ts` に対して「実際の資産保存則」に基づくプロパティテストを行うために、`YearlyData` および `DebugInfo` の拡張と、それに対応するテストコードの追加方針を整理したものである。
既存のテスト仕様および報告書との関係は以下の通り。

- テスト仕様書: `blueprint/simulation_api_test_spec.md`
  - 4.9「プロパティテスト的チェック」の詳細設計として、本計画書を参照する。
- テスト報告書: `blueprint/simulation_api_test_report.md`
  - 資産保存則に関する今後の拡張方針として、本計画書の内容を引用・要約する。

---

## 1. 背景と目的

### 1.1 背景

現在のプロパティテスト（`TC-PROP-001`）では、

- 初期資産
- 年次の収入
- 年次の支出
- 取り崩し（赤字補填時の現金増加）

のみを用いて、

> 初期資産 + Σ(収入) − Σ(支出) ≒ 最終資産 + Σ(取り崩し)

といった「簡略化された保存則」を検証している。しかし実際のロジックでは、

- 投資リターン（資産が増える要因）
- 課税（給与・投資・退職金などで資産が減る要因）
- iDeCo による節税効果
- NISA の非課税運用
- 現金⇔投資口座間の振替
- 丸め処理

など、多数の要因が存在するため、上記の簡略式では「正常な投資リターン」まで差分としてカウントしてしまい、長期運用シナリオでは数千万円オーダーの差が生じることがある。

### 1.2 目的

そこで、

> 初期資産 + Σ(収入) + Σ(投資リターン) − Σ(支出) − Σ(税・社保) ≒ 最終資産

といった形で、「投資リターン」や「税・社会保険料」といった要因も含めた保存則を、YearlyData/DebugInfo を通じて検証できるようにすることを目的とする。

---

## 2. 検証したい保存則の定義

### 2.1 用語定義（年次ベース）

- 初期資産 `initialAssets`
  - シミュレーション開始時点の現金と投資残高の合計:
    - `initialAssets = currentSavingsJPY + Σ products.currentJPY`
- 年次収入 `incomeYear`
  - 給与・副業・年金・個人年金・一時金などを含む:
    - `incomeYear = incomeDetail.self + incomeDetail.spouse + (publicPension ?? 0) + (personalPension ?? 0) + (oneTime ?? 0)`
- 年次投資リターン `investmentReturnYear`
  - その年の投資による「評価額ベースの増加分」を表す。既存の `investmentIncome`（利回りによる増減）を利用する想定。
- 年次支出 `expenseYear`
  - 年間総支出:
    - `expenseYear = expense`
- 年次税・社会保険料 `taxYear`
  - 以下の合算:
    - 給与・年金等に対する税・社保（`computeNetAnnual` の before/after 差分）
    - 課税口座売却時の税（`withdrawToCoverShortfall` 内で計算）
    - 退職金税（`calculateRetirementIncomeTax`）

### 2.2 保存則の形

全期間で以下の式が「許容誤差の範囲内」で成立することを確認したい:

- 左辺:

```text
L = initialAssets
  + Σ(incomeYear)
  + Σ(investmentReturnYear)
  − Σ(expenseYear)
  − Σ(taxYear)
```

- 右辺:

```text
R = finalTotalAssets
  = 最終年の yearlyData.totalAssets
```

- 判定:
  - `|L − R|` が、
    - 相対誤差（`|L − R| / max(1, |L|)`）で数パーセント以下、
    - 絶対誤差でも数十万〜数百万円以下  
    の範囲に収まること（丸め・モデルの簡略化を考慮した許容範囲内であること）。

---

## 3. YearlyData / DebugInfo 拡張方針

### 3.1 DebugInfo の拡張案

`src/types/simulation-types.ts` の `DebugInfo` に、以下の項目を追加する:

- `investmentReturnThisYear?: number;`
  - その年の投資リターン（全口座合算）。
  - 既存の `investmentIncome`（利回りによる増減額）を格納する。
- `taxOnSalaryThisYear?: number;`
  - 給与・副業・年金に対する税・社会保険料の合計。
  - `computeNetAnnual` 呼び出し前後の差分から求める。
- `taxOnInvestmentThisYear?: number;`
  - 課税口座の売却による税額。
  - `withdrawToCoverShortfall` で求めている税額を debug に露出させる。
- `taxOnRetirementThisYear?: number;`
  - 退職金税の合計。
  - `calculateRetirementIncomeTax` の戻り値を積み上げる。
- `deductionThisYear?: number;`
  - iDeCo 拠出等の控除額合計（必要に応じて）。

### 3.2 YearlyData への反映

当面は `YearlyData` の `debug` 内に上記を格納すればプロパティテストには十分だが、将来的に `YearlyData` 本体に集約値（例: `taxTotal`, `investmentReturnTotal`）を追加してもよい。

---

## 4. `runSimulation` 内の実装方針

### 4.1 給与系収入と税・社保

対象: `api/simulate/index.ts` の年次ループ内、収入計算部分。

1. 年次ループ内で、`selfGrossIncome`・`spouseGrossIncome` を計算した後、`computeNetAnnual` を呼び出す前に `grossSelf`・`grossSpouse` を保持する。
2. `netSelf = computeNetAnnual(grossSelf − idecoDeductionThisYear)`、`netSpouse = computeNetAnnual(grossSpouse)` のように手取りを求める。
3. 給与系の税・社保合計を:

```ts
const taxOnSalaryThisYear =
  (grossSelf + grossSpouse) - (netSelf + netSpouse);
```

として求め、`debug.taxOnSalaryThisYear` に格納する。

### 4.2 投資リターン

対象: 投資リターン適用部分（`investmentIncome` を計算している箇所）。

1. 既存ロジックでは、利回り計算の際に `investmentIncome` を加算しているので、その値をそのまま:

```ts
debug.investmentReturnThisYear = investmentIncome;
```

として格納する。

### 4.3 投資売却時の税

対象: `withdrawToCoverShortfall` 関数。

1. 現在、課税口座売却時に `tax` を計算しているので、その合計をローカル変数で積算し、戻り値に含める:

```ts
return {
  newSavings: savings,
  newProductBalances: productBalances,
  nisaRecycleAmount: totalNisaRecycled,
  taxPaidThisYear: totalTaxPaid, // 追加
};
```

2. `runSimulation` 側では、`withdrawToCoverShortfall` の戻り値から `taxPaidThisYear` を受け取り、

```ts
debug.taxOnInvestmentThisYear = (debug.taxOnInvestmentThisYear ?? 0) + result.taxPaidThisYear;
```

のように年次合計として格納する。

### 4.4 退職金税

対象: `calculateRetirementIncomeTax` を呼び出している箇所。

1. 退職金税の計算結果を一時変数に保持し、その値を `debug.taxOnRetirementThisYear` に加算する。
2. 年に複数の退職金イベントがある場合も合算されるようにする。

### 4.5 控除額

対象: iDeCo 等の控除計算部分。

1. 既存の `idecoDeductionThisYear`（年間控除額）を、そのまま `debug.deductionThisYear` に格納する。
2. 必要であれば、将来的に他の控除（個人年金控除など）もここに加算する。

---

## 5. プロパティテストの設計

### 5.1 新テストケース TC-PROP-002（固定利回り・単純ケース）

- 目的:
  - ランダム性・赤字補填・複雑なライフイベントを極力排除したシンプルなケースで、保存則が「ほぼ」成り立つことを確認する。
- シナリオ:
  - `interestScenario = '固定利回り'`。
  - 投資商品 1〜2 個（課税＋NISA）を設定し、毎年一定額の積立。
  - 年金・退職金・赤字補填が発生しないよう、収入と支出を黒字寄りに調整。
- 式と判定:

```ts
const initialAssets =
  params.currentSavingsJPY +
  (params.products ?? []).reduce((sum, p) => sum + p.currentJPY, 0);

// 各年について
incomeYear = y.incomeDetail.self
           + y.incomeDetail.spouse
           + (y.incomeDetail.publicPension ?? 0)
           + (y.incomeDetail.personalPension ?? 0)
           + (y.incomeDetail.oneTime ?? 0);

investmentReturnYear = debug.investmentReturnThisYear ?? 0;

expenseYear = y.expense;

taxYear = (debug.taxOnSalaryThisYear ?? 0)
        + (debug.taxOnInvestmentThisYear ?? 0)
        + (debug.taxOnRetirementThisYear ?? 0);

L = initialAssets
  + Σ(incomeYear)
  + Σ(investmentReturnYear)
  − Σ(expenseYear)
  − Σ(taxYear);

R = lastYear.totalAssets;

diff = Math.abs(L - R);
allowed = Math.max(Math.abs(L) * 0.02, 100_000); // 2% または 10 万円
expect(diff).toBeLessThanOrEqual(allowed);
```

### 5.2 ランダムシナリオ TC-PROP-003（ランダム変動＋赤字補填あり）

- 目的:
  - ランダム利回り・赤字補填・複数商品が絡む現実的なシナリオでも、保存則が「壊滅的には崩れていない」ことを確認する。
- シナリオ:
  - 擬似乱数 `createPrng` で `SimulationInputParams` を複数生成。
  - `interestScenario = 'ランダム変動'`。
  - 複数の商品（課税・NISA・iDeCo）を持ち、赤字補填ロジックが時々発動するように設定。
- 式と判定:
  - TC-PROP-002 と同様の式を用いるが、許容誤差を少し緩める（例: 5% または 50 万円）。
  - 差分が極端に大きくなっていないこと（丸めとモデル簡略化の範囲内）を確認する。

---

## 6. 実装とテストの手順

1. `DebugInfo` の型を拡張する。
2. `withdrawToCoverShortfall` の戻り値に `taxPaidThisYear`（仮称）を追加し、既存呼び出し箇所を更新する。
3. `runSimulation` の年次ループ内で:
   - 給与系税・社保を `taxOnSalaryThisYear` に格納。
   - 投資リターンを `investmentReturnThisYear` に格納。
   - 投資税・退職金税・控除額をそれぞれの debug フィールドに格納。
4. `YearlyData.push(...)` の前に、`debug` に新フィールドを集約してセットする。
5. `TC-PROP-002`（固定利回りケース）を `property_random.test.ts` に追加し、保存則を検証。
6. 余力があれば `TC-PROP-003`（ランダムシナリオ）も追加。
7. `npx vitest run src/test/api/simulate/property_random.test.ts` および `npx vitest run src/test/api/simulate/deficit.test.ts` を再実行し、テストがすべて通ることを確認。
8. `simulation_api_test_spec.md` および `simulation_api_test_report.md` に、保存則テスト追加の旨と代表的な結果を追記する。

---

## 7. 今後の拡張余地

- `YearlyData` 本体に「年次投資リターン」「年次税額」「年次控除額」などを持たせ、デバッグ用途だけでなく UI 側での詳細分析にも利用できるようにする。
- `runMonteCarloSimulation` 側でも、保存則に基づく異常検知（破綻確率とは別軸の「計算崩壊検知」）を導入する。
- 保存則テストを CI の一部として位置づけ、将来のロジック変更時に資産保存則が大きく崩れた場合は警告を出すようにする。
