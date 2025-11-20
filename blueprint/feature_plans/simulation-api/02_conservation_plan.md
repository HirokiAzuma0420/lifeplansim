# /api/simulate 資産保存則検証 詳細計画書（TC-PROP 系）

前提: 文字コードは UTF-8（BOM なし）、改行コードは LF。
本ドキュメントは `api/simulate/index.ts` に対して「実際の資産保存則」に基づくプロパティテストを行うための
設計メモであり、`YearlyData` および `DebugInfo` の拡張方針とテストケース内容をまとめたものである。

- テスト仕様全体: `blueprint/simulation-api/01_test_spec.md`
- 保存則テスト実装・結果サマリ: `blueprint/simulation-api/03_test_report.md`

ここでは特に `TC-PROP-002` / `TC-PROP-003` を中心に記述する。

---

## 1. 検証したい資産保存則の考え方

### 1.1 「シミュレーション内の世界」の定義

本シミュレーションが明示的に追跡している資産は、

- 現金預金（`savings`）
- 課税口座残高（`taxable.balance`）
- NISA 口座残高（`nisa.balance`）
- iDeCo 口座残高（`ideco.balance`）

の合計であり、各年の `yearlyData.totalAssets` で表現される。

給与・年金などにかかる税金や社会保険料は、`computeNetAnnual` により
「額面 → 手取り」へ変換された結果のみがシミュレーション内に流入する。
したがって **給与・年金の税や社保は「シミュレーションの外で消えるお金」** とみなし、
保存則の式では *明示的には扱わない*。

一方で、

- 課税口座売却時の税（譲渡益課税）
- 退職金一時金に対する税

は、実際に `totalAssets` を減少させる形でシミュレーション内から支出されるため、
保存則の式に含める。

### 1.2 年次ベースの用語

- 初期資産 `initialAssets`
  - シミュレーション開始時点の現金と投資残高の合計。
  - 実装上は:

    ```ts
    const initialAssets =
      params.currentSavingsJPY +
      (params.products ?? []).reduce(
        (sum, p) => sum + (p.currentJPY ?? 0),
        0,
      );
    ```

- 年次収入 `incomeYear`
  - その年に実際に「手取り」としてシミュレーション内に流入する金額。
  - `YearlyData.incomeDetail` を用いて、

    ```ts
    incomeYear =
      (y.incomeDetail.self ?? 0) +
      (y.incomeDetail.spouse ?? 0) +
      (y.incomeDetail.publicPension ?? 0) +
      (y.incomeDetail.personalPension ?? 0) +
      (y.incomeDetail.oneTime ?? 0);
    ```

- 年次投資リターン `investmentReturnYear`
  - その年の運用による評価額ベースの増加分。
  - `DebugInfo.investmentReturnThisYear` を利用する。

    ```ts
    investmentReturnYear = debug.investmentReturnThisYear ?? 0;
    ```

- 年次支出 `expenseYear`
  - 生活費や教育費、住宅費等の支出合計。

    ```ts
    expenseYear = y.expense;
    ```

- 年次税額 `taxYear`
  - シミュレーション内の資産から実際に支出される税の合計。
  - 現時点では次の 2 種類のみを対象とする。

    ```ts
    taxYear =
      (debug.taxOnInvestmentThisYear ?? 0) +
      (debug.taxOnRetirementThisYear ?? 0);
    ```

  - `debug.taxOnSalaryThisYear` も `DebugInfo` に保持しているが、
    これは「額面と手取りの差額の観察用」であり、
    資産保存則の式には含めない。

### 1.3 保存則の形

上記の定義に基づき、全期間を通じて次の式が「許容誤差の範囲内で」
成立していることを確認する。

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
  - `diff = |L − R|`
  - `allowed = max(|L| × α, β)` の閾値内に収まっていること。
  - 固定利回りの単純ケースでは `α = 2%`, `β = 100,000`
  - ランダム変動＋赤字補填ありのケースでは `α = 5%`, `β = 500,000`

---

## 2. DebugInfo / YearlyData の拡張方針

### 2.1 DebugInfo 拡張

`src/types/simulation-types.ts` の `DebugInfo` を次のように拡張する。

- 既存フィールドに加え、以下を追加済み:

  ```ts
  export interface DebugInfo {
    // 既存フィールド（省略）
    finalSavingsForYear?: number;
    investmentReturnThisYear?: number;
    taxOnSalaryThisYear?: number;
    taxOnInvestmentThisYear?: number;
    taxOnRetirementThisYear?: number;
    deductionThisYear?: number;
  }
  ```

- 各フィールドの意味:
  - `investmentReturnThisYear`
    - 当該年の運用による評価額ベースの増加額（全口座合算）。
    - `runSimulation` 内で、利回り計算時に積算している `investmentIncome` をそのまま格納。
  - `taxOnSalaryThisYear`
    - 給与・副業に対する税・社保の概算合計。
    - `computeNetAnnual` 適用前後の差分を利用。
    - 保存則の式では利用せず、将来の分析用途とする。
  - `taxOnInvestmentThisYear`
    - 課税口座売却時の譲渡益課税の合計。
    - `withdrawToCoverShortfall` からの戻り値を通じて設定。
  - `taxOnRetirementThisYear`
    - 退職金一時金に対する税の合計。
    - `calculateRetirementIncomeTax` の戻り値を年次に集計。
  - `deductionThisYear`
    - iDeCo 拠出などによる所得控除額合計（年次）。
    - 現時点では保存則の式には含めず、説明用・将来拡張用。

### 2.2 実装上の主な変更点

- `api/simulate/index.ts`
  - `DebugInfo` ローカル型にも同じフィールドを追加。
  - 年次ループ内で:
    - 給与系の `grossSelf`, `grossSpouse` と `computeNetAnnual` の結果から
      `taxOnSalaryThisYear` を計算し、`debug.taxOnSalaryThisYear` に格納。
    - `investmentIncome` の値を `debug.investmentReturnThisYear` に格納。
    - 退職金一時金に対する税額を `retirementTaxThisYear` に積算し、
      `debug.taxOnRetirementThisYear` に格納。
    - iDeCo 控除額を `idecoDeductionThisYear` として計算し、
      `debug.deductionThisYear` に格納。
- `withdrawToCoverShortfall`
  - 戻り値に `taxPaid: number` を追加。
  - 課税口座売却時に計算した税額を `totalTaxPaid` として積算し、
    戻り値の `taxPaid` に含める。
  - `runSimulation` 側では、赤字補填発生時に

    ```ts
    debugInfo.taxOnInvestmentThisYear =
      (debugInfo.taxOnInvestmentThisYear ?? 0) + result.taxPaid;
    ```

    として年次税額に反映。

---

## 3. プロパティテスト設計

### 3.1 TC-PROP-001（既存）: 安全性チェック

既存の `TC-PROP-001`（`property_random.test.ts`）は、

- 簡略版の保存則
  - `初期資産 + Σ収入 − Σ支出 ≒ 最終資産 + Σ取り崩し`
- から導かれる差分 `diff` が「有限であること」のみを確認する安全性チェックとして運用する。
- 投資リターンや税を考慮しないため、差が数千万円単位でも正常とみなす。

### 3.2 TC-PROP-002: 固定利回り・単純ケース

- ファイル: `src/test/api/simulate/property_random.test.ts`
- シナリオ:
  - `interestScenario = '固定利回り'`
  - 商品は課税＋NISA の 2 本のみ。
  - 年金・退職金・ライフイベントは利用せず、黒字を維持するように設定。
  - シードを変えた 3 シナリオをループ実行。
- チェック式（概略）:

  ```ts
  const initialAssets = /* 現金＋初期投資残高 */;

  const { sumIncome, sumExpense, sumInvestmentReturn, sumTax } =
    aggregateFromYearlyData(yearly);

  const lhs =
    initialAssets +
    sumIncome +
    sumInvestmentReturn -
    sumExpense -
    sumTax;

  const rhs = yearly[yearly.length - 1]?.totalAssets ?? 0;

  const diff = Math.abs(lhs - rhs);
  const allowed = Math.max(Math.abs(lhs) * 0.02, 100_000);

  expect(diff).toBeLessThanOrEqual(allowed);
  ```

- ここで `sumTax` は

  ```ts
  taxYear =
    (debug.taxOnInvestmentThisYear ?? 0) +
    (debug.taxOnRetirementThisYear ?? 0);
  ```

  を年次に積算したもの。

### 3.3 TC-PROP-003: ランダム変動＋赤字補填あり

- ファイル: `src/test/api/simulate/property_random.test.ts`
- シナリオ:
  - `interestScenario = 'ランダム変動'`
  - `Math.random` を `createPrng` でモックしてシード固定。
  - 収入・支出・投資額をランダムレンジから生成し、
    赤字補填や課税口座売却が頻繁に発生しうる形にする。
  - シード違いで 5 シナリオを実行。
- チェック式は TC-PROP-002 と同じだが、許容誤差を緩める:

  ```ts
  const allowed = Math.max(Math.abs(lhs) * 0.05, 500_000);
  ```

  - ランダム利回り・赤字補填・丸め誤差等を考慮し、
    「桁違いに大きな差」が出ていないことを確認する位置づけ。

---

## 4. 実装状況と今後の拡張

### 4.1 実装状況

- `DebugInfo` の拡張: 実装済み。
- `withdrawToCoverShortfall` の `taxPaid` 追加と、
  `runSimulation` での `taxOnInvestmentThisYear` への反映: 実装済み。
- `taxOnRetirementThisYear` の集計: 実装済み。
- `TC-PROP-002` / `TC-PROP-003`:
  - `src/test/api/simulate/property_random.test.ts` に実装済み。
  - `npx vitest run src/test/api/simulate/property_random.test.ts` は成功。

### 4.2 今後の拡張候補

- `YearlyData` 本体に「年次投資リターン」「年次税額」「年次控除額」を持たせ、
  UI 側からも保存則の各項目を確認できるようにする。
- `taxOnSalaryThisYear` / `deductionThisYear` を用いて、
  「額面ベースの収入 − 税・社保 − 控除 ≒ 手取り」の別種の保存則を検証するテストを追加する。
- `runMonteCarloSimulation` 側で、保存則の崩れを統計的に監視し、
  異常なシナリオを早期検知する仕組みを導入する。

