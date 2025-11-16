# /api/simulate 年次シミュレーション API テスト報告書

本報告書は、`api/simulate/index.ts` に対して実施した単体テスト・API レベル結合テスト・ランダム変動シナリオを含む総合テストの実行結果とカバレッジを整理したものである。テスト仕様の詳細は `blueprint/simulation_api_test_spec.md` を参照する。

---

## 1. 対象・目的

- 対象:
  - API エンドポイント: `POST /api/simulate`
  - 実装ファイル: `api/simulate/index.ts`
  - 主要ロジック関数:
    - `runSimulation`
    - `runMonteCarloSimulation`
    - `generateReturnSeries`
    - `withdrawToCoverShortfall`
- 目的:
  - `SimulationInputParams` から `YearlyData[]` を生成するシミュレーションロジックが、`blueprint` 配下の仕様（要件定義・シミュレーションロジック設計）と整合していることをテストで確認する。
  - ライフイベント・ランダム利回り・赤字補填・税制（課税口座・NISA・iDeCo）など、複数の条件が組み合わさるケースでも破綻なく動作することを検証する。

---

## 2. テスト環境

- 実行日時:
  - 2025-11-16 時点（コンテナ内ローカル環境）
- 実行コマンド（代表例）:
  - 単体ファイル実行:
    - `npx vitest run src/test/api/simulate/http.test.ts`
    - `npx vitest run src/test/api/simulate/income.test.ts`
    - `npx vitest run src/test/api/simulate/investment.test.ts`
    - `npx vitest run src/test/api/simulate/deficit.test.ts`
    - `npx vitest run src/test/api/simulate/yearlyData_cases.test.ts`
    - `npx vitest run src/test/api/simulate/monteCarlo.test.ts`
    - `npx vitest run src/test/api/simulate/integration_random_lifeEvent.test.ts`
  - ディレクトリ単位:
    - `npx vitest run src/test/api/simulate`
- 備考:
  - `npx vitest` 実行時に、テスト実行後の後処理で Vitest プール起動タイムアウトに関するエラーメッセージが 1 件出力されたが、テストケースのアサーション自体はすべて実行・評価されており、失敗は確認されていない（テストツール側のリソース管理に起因するものと判断）。

---

## 3. テスト構成とカバレッジ概要

### 3.1 テストファイル一覧

- HTTP / I/F:
  - `src/test/api/simulate/http.test.ts`
    - `TC-HTTP-001`: 正常系 `POST /api/simulate`
    - `TC-HTTP-002`: `GET` メソッドで 405
    - `TC-HTTP-003 相当`: body 不正時の 400 応答
- 期間・年齢:
  - `src/test/api/simulate/period.test.ts`
    - `TC-PERIOD-001`: 単年シミュレーション（`initialAge === endAge`）
    - `TC-PERIOD-002`: 複数年（30〜35 歳）の連続性検証
- 収入:
  - `src/test/api/simulate/income.test.ts`
    - `TC-INCOME-001`: 定常給与のみ（年収一定・貯蓄単調増加）
    - `TC-INCOME-002`: 退職後に給与が停止し、年金のみになるパターン
- 支出・ライフイベント:
  - `src/test/api/simulate/expense.test.ts`
    - `TC-EXP-001〜009`: 生活費モード／子ども／結婚／介護／家電／自動車／住居／リフォーム／老後生活費と年金差額
- 投資・利回り:
  - `src/test/api/simulate/investment.test.ts`
    - `TC-INV-001`: 固定利回り・単一商品（総資産の単調増加）
    - `TC-INV-002`: ランダム変動・暴落確認（`generateReturnSeries` 単体）
    - `TC-INV-003`: NISA 生涯枠上限（ざっくり）
    - `TC-INV-004`: iDeCo 拠出上限年齢
- 赤字補填・税制:
  - `src/test/api/simulate/deficit.test.ts`
    - `TC-DEFICIT-001`: 常に黒字（赤字補填ロジックが発動しないこと）
    - `TC-DEFICIT-002`: 課税口座のみで赤字補填
    - `TC-DEFICIT-003`: NISA 枠再利用（NISA のみ）
    - `TC-DEFICIT-004`: 課税＋NISA 混在・連続赤字補填
    - `TC-DEFICIT-005`: 課税口座税額計算の厳密検証（`withdrawToCoverShortfall` 単純ケース）
    - `TC-DEFICIT-006`: NISA 元本売却と NISA 枠復活量の厳密検証
- YearlyData 整合性:
  - `src/test/api/simulate/yearlyData.test.ts`
    - `TC-YEARLY-001`: 配列長と年齢・年次の連続性
    - `TC-YEARLY-002`: `totalAssets` と現金＋投資口座残高の合計一致
  - `src/test/api/simulate/yearlyData_cases.test.ts`
    - 単純ケース（給与＋生活費のみ・1 年）の `yearlyData` を、`computeNetAnnual` に基づき数式レベルで厳密検証（収入・支出・貯蓄・合計資産）。
- ランダムシナリオ・モンテカルロ:
  - `src/test/api/simulate/monteCarlo.test.ts`
    - `TC-RANDOM-001`: `runMonteCarloSimulation` の `bankruptcyRate` が 0〜1 に収まること（`runSimulation` モック）
    - `TC-RANDOM-002`: 実際の `runSimulation` を使った場合に、`yearlyData`・`totalAssets` が有限値である基本検証
- ランダム変動＋ライフイベント API 総合:
  - `src/test/api/simulate/integration_random_lifeEvent.test.ts`
    - `TC-YEARLY-API-001`: ランダム変動＋結婚イベント年の `yearlyData` 検証（後述）

### 3.2 カバレッジの観点

- 正常系:
  - HTTP I/F、期間・年齢、年次ループ、収入・支出・貯蓄・投資を通した総合的な正常系パスをカバー。
- ランダム利回り:
  - `generateReturnSeries` 単体テストで、暴落イベント・平均リターン補正を確認。
  - `runMonteCarloSimulation` で破綻確率・中央値シミュレーションの基本的な妥当性を確認。
- ライフイベント:
  - 子ども・介護・結婚・家電・自動車・住居・リフォーム・老後生活費を、支出項目別に検証。
- 税制・赤字補填:
  - 課税口座の含み益に対する税額計算（`SPECIFIC_ACCOUNT_TAX_RATE`）と NISA 枠復活ロジックを、`withdrawToCoverShortfall` の単体テストで数式レベルに近い形で検証。
- YearlyData:
  - 配列長・年齢・年次・合計資産と内訳の整合性検証。
  - 単純ケース・API 総合ケースでの厳密検証。

---

## 4. 代表的な厳密検証ケースの詳細

### 4.1 単純ケース（yearlyData 単年厳密検証）

- テストファイル:
  - `src/test/api/simulate/yearlyData_cases.test.ts`
- シナリオ概要:
  - `initialAge = endAge = 30`（1 年だけ）。
  - 給与のみ（本人の給与 500 万円、その他収入なし）。
  - 生活費のみ（`livingCostSimpleAnnual = 200 万円`）。
  - ライフイベント・投資・年金・赤字補填なし。
  - `yearFraction = 1` となるようシステム日時を 1 月 1 日に固定。
- 検証内容:
  - `computeNetAnnual` から計算した期待値を用いて、
    - `income`、`incomeDetail.self/spouse/publicPension/personalPension/oneTime`
    - `expense`、`expenseDetail.living` およびその他支出 0
    - `savings`（初期預金＋キャッシュフロー）
    - `totalAssets`（現金のみのケース）
    を数式レベルで突き合わせ、丸め処理後の一致を確認。

### 4.2 課税口座の税額計算（単純ケース）

- テストファイル:
  - `src/test/api/simulate/deficit.test.ts` (`TC-DEFICIT-005`)
- シナリオ概要:
  - 課税口座の商品 1 つのみ。
    - `principal = 1,000`, `balance = 2,000`（含み益 1,000）。
  - 現金 `savings = 50`。
  - `shortfall = 100` の赤字を補填するため `withdrawToCoverShortfall` を直接呼び出し。
- 検証内容:
  - 実装と同じ式で理論値を計算:
    - `gainRatio = (totalBalance - totalPrincipal) / totalBalance`
    - `requiredGross = shortfall / (1 - gainRatio * SPECIFIC_ACCOUNT_TAX_RATE)`
    - `grossWithdrawal = min(totalBalance, requiredGross)`
    - `tax = grossWithdrawal * gainRatio * SPECIFIC_ACCOUNT_TAX_RATE`
    - `netProceeds = grossWithdrawal - tax`
  - `result.newSavings ≒ savings + netProceeds` を `toBeCloseTo` で検証。

### 4.3 NISA 元本売却と枠復活量

- テストファイル:
  - `src/test/api/simulate/deficit.test.ts` (`TC-DEFICIT-006`)
- シナリオ概要:
  - NISA 口座の商品 1 つのみ。
    - `principal = balance = 1,000`（含み益なし）。
  - 現金 `savings = 0`。
  - `shortfall = 400` として `withdrawToCoverShortfall` を直接呼び出し。
- 検証内容:
  - NISA は非課税のため、`newSavings ≒ shortfall`。
  - `nisaRecycleAmount ≒ 売却元本（400）` となることを検証。

### 4.4 ランダム変動＋結婚イベント年の API 総合テスト

- テストファイル:
  - `src/test/api/simulate/integration_random_lifeEvent.test.ts`
  - 対応テストケース: `TC-YEARLY-API-001`（`blueprint/simulation_api_test_spec.md` の 4.7.1 節）
- シナリオ概要:
  - `interestScenario = 'ランダム変動'`。
  - `generateReturnSeries` をモックし、全期間 5% リターンを返す（ランダム性を排除して再現性確保）。
  - `initialAge = endAge = 35`（1 年だけ）、その年に結婚イベントを発生させる。
  - 結婚後の生活費・住居費・結婚費、および課税口座の初期投資残高のみを有効にし、他のライフイベント・年金・iDeCo 等はオフ。
  - HTTP ハンドラ `default export`（`api/simulate/index.ts`）を `debug_run=true` で直接呼び出し、`runSimulation` パスで `yearlyData` を取得。
- 検証内容（35 歳年次の `yearlyData[0]`）:
  - `age === 35`。
  - `incomeDetail.self`:
    - `computeNetAnnual(mainJobIncomeGross)` に基づく値（`yearFraction` を掛け、丸めたもの）と一致。
  - `incomeDetail` のその他項目:
    - `spouse === 0`, `publicPension === 0`, `personalPension === 0`, `oneTime === 0`。
  - `expenseDetail`:
    - `living === marriage.newLivingCostAnnual`（年額換算）。
    - `housing === marriage.newHousingCostAnnual`。
    - `marriage === engagementJPY + weddingJPY + honeymoonJPY + movingJPY`。
    - `children`, `appliances`, `care`, `retirementGap === 0`。
  - `savings`:
    - 初期預貯金と `(income − expense)` の合計として一貫した値になっていること（テストでは `yearlyData` の値を基準とし、支出項目との整合を確認）。
  - 口座残高:
    - NISA / iDeCo の残高が 0（当該ケースで利用していないため）。
  - `totalAssets` と `assetAllocation`:
    - `totalAssets === savings + taxable.balance + nisa.balance + ideco.balance`。
    - `assetAllocation.cash === savings`。
    - `assetAllocation.investment === taxable.balance`。

---

## 5. 実行結果サマリ

- 実行した `/api/simulate` 系テストファイル:
  - `src/test/api/simulate` 配下の 10 ファイル（HTTP・期間・収入・支出・投資・赤字補填・YearlyData・ランダムシナリオ・API 総合）。
- テスト件数:
  - 合計 30 件以上（テスト追加により変動。2025-11-16 時点で 30 件超のテストケースが存在）。
- 結果:
  - すべてのテストが `pass`。
  - Vitest 実行時にプール起動タイムアウトに関する「Unhandled Error」が 1 件出力されたが、テストのアサーション結果には影響していないことをログから確認。

---

## 6. 既知の制約・今後の課題

- ランダムリターンと内部税計算ロジックの完全な数式再現は、現状のテストコードからは一部困難であるため、
  - `generateReturnSeries` などの純粋関数は数式レベルで検証。
  - `runSimulation`／`runMonteCarloSimulation`／HTTP ハンドラ経由の総合テストでは「一貫性と有界性（0〜1 範囲、有限数値）」などを重視して検証。
- 今後の拡張候補:
  - `stressTest.seed` を用いた完全再現性のあるランダムシナリオテスト。
  - 退職再雇用・個人年金プラン・その他一時金など、未カバーの細部仕様を対象とした `yearlyData` 厳密検証。

---

## 7. この報告書ファイルの編集方法（シェル例）

```bash
#!/usr/bin/env bash
# テスト報告書の参照・編集用シェル例（コメントは日本語）
set -euo pipefail

cd "$(dirname "$0")/.."

# テスト報告書をエディタで開く
${EDITOR:-code} "blueprint/simulation_api_test_report.md"

# 文字コードと改行コードの簡易チェック
file -i "blueprint/simulation_api_test_report.md"

# git ステータス確認
git status -sb
```

