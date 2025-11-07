# TASK-002: 退職金・個人年金等の一時金収入と退職所得控除の対応

- **ステータス**: 未着手
- **担当者**: (未定)
- **期日**: (未定)
- **関連コンポーネント**:
  - `src/pages/FormPage.tsx`
  - `src/components/form/RetirementIncomeSection.tsx` (新規作成)
  - `src/types/form-types.ts`
  - `src/types/simulation-types.ts`
  - `pages/api/simulate/index.ts`
  - `src/utils/financial.ts`
  - `src/pages/ResultPage.tsx`
  - `src/components/dashboard/LifePlanTimeline.tsx`

---

## 概要

現状のシミュレーションでは、老後の一時的な大きな収入（勤務先の退職金、企業型DCの一括受取、個人年金保険の一括受取など）を考慮できていない。
また、iDeCoは全額非課税で現金化される前提だが、実際には退職所得控除の枠を他の退職金と共有するため、控除枠を超えた部分には課税が発生する。

より現実的な老後のキャッシュフローをシミュレーションするため、これらの一時金収入を入力項目として追加し、iDeCo受け取り時の税金計算ロジックを精緻化する。

## TODOリスト

### ステップ1：データ構造の定義とコア計算ロジックの実装

- [x] **1-1. 型定義の更新 (`src/types/*.ts`)**
  - [x] `form-types.ts`:
    - [x] `RetirementIncome` 型（受取額、年齢、勤続年数）を定義。
    - [x] `PersonalPensionPlan` 型（種類: `lumpSum` | `fixedTerm` | `lifeTime`、額、期間など）を定義。
    - [x] `OtherLumpSum` 型（名称、額、年齢）を定義。
    - [x] `FormDataState` に本人・配偶者それぞれの退職金、個人年金プラン配列、その他一時金配列のフィールドを追加。
  - [x] `simulation-types.ts`:
    - [x] 上記に対応する型を `SimulationInputParams` に追加。
- [x] **1-2. 退職所得控除の計算ロジック実装 (`src/utils/financial.ts`)**
  - [x] `calculateRetirementIncomeTax` 関数を新規作成（引数: 総退職所得額, 勤続年数）。
  - [x] 勤続年数に応じた退職所得控除額を計算するロジックを実装。
  - [x] 課税退職所得金額 (`(所得 - 控除) / 2`) を計算するロジックを実装。
  - [x] 所得税・住民税を計算するロジックを実装。
  - [x] **【確認】**: この関数を単体テストし、税額計算の正しさを検証する。

### ステップ2：APIロジックの実装と検証

- [x] **2-1. APIロジックの修正 (`api/simulate/index.ts`)**
  - [x] `SimulationInputParams` から退職金・個人年金などの新しいパラメータを受け取れるようにする。
  - [ ] **退職金・iDeCoの税計算**:
    - [x] 受取年に、退職所得（退職金、iDeCo等）を合算する。
    - [x] `calculateRetirementIncomeTax` を呼び出して税額を計算し、手取り額を `savings` に加算する。
  - [x] **個人年金の処理**:
    - [x] 一括受取の場合は、指定年に `savings` に加算する（今回は簡易的に非課税扱い）。
    - [x] 年金形式の場合は、指定期間中の `income` に毎年加算する。
  - [x] **その他一時金の処理**:
    - [x] 指定年に `savings` に加算する。
  - **【確認】**: APIを直接実行（例: `curl`）し、返却されるJSONデータで一時金や税金が正しく反映されているか検証する。

### ステップ3：UI実装とフロントエンドへの反映

- [x] **3-1. 入力フォームの実装 (`FormPage.tsx`, `RetirementIncomeSection.tsx`)**
  - [x] `FormPage.tsx` に新規セクション「退職・年金」を追加し、`RetirementIncomeSection.tsx` を作成する。
  - [x] **本人向けUI**:
    - [x] 「退職金」の受け取り有無を選択させ、詳細（額、年齢、勤続年数）を入力するUIを実装。
    - [x] 「個人年金」の受け取り有無を選択させ、プラン（一括/年金形式）を複数追加できるUIを実装。
    - [x] 「その他一時金」を複数追加できるUIを実装。
  - [x] **配偶者向けUI**:
    - [x] 家族構成に応じて、本人と同様の入力UIセットをアコーディオン等で表示する。
  - [x] **投資セクションの修正**:
    - [x] `InvestmentSection.tsx` の「iDeCo」ラベルを「iDeCo / 企業型DC」に変更する。
- [x] **3-2. 結果表示への反映 (`FormPage.tsx`, `LifePlanTimeline.tsx`)**
  - [x] **`FormPage.tsx` 確認画面**:
    - [x] `renderConfirmationView` 内で、入力された退職金・個人年金イベントを時系列で表示するロジックを追加。
  - [x] **`LifePlanTimeline.tsx`**:
    - [x] 退職金、個人年金（一括・年金開始/終了）などのイベントをアイコン付きで表示するロジックを追加。
  - [ ] **その他**:
    - [ ] `CashFlowTable.tsx` や `TotalAssetChart` に新しい収入・資産が反映されることを確認。（※要動作確認）

### ステップ4：総合テストと最終確認