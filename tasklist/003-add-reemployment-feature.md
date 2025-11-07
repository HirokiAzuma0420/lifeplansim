# TASK-003: 定年再雇用シミュレーション機能の追加

- **ステータス**: 進行中
- **担当者**: (未定)
- **期日**: (未定)
- **関連コンポーネント**:
  - `src/types/form-types.ts`
  - `src/types/simulation-types.ts`
  - `src/components/form/RetirementLifeEventSection.tsx`
  - `src/utils/api-adapter.ts`
  - `api/simulate/index.ts`
  - `src/pages/FormPage.tsx`
  - `src/components/dashboard/LifePlanTimeline.tsx`

---

## 概要

現状のシミュレーションでは、60歳以降の収入が退職まで一定の昇給率で伸び続ける想定となっている。
より現実的なキャリアプランを反映させるため、60歳以降に「定年再雇用」を選択し、それに伴う減給をシミュレーションに組み込めるようにする。

## TODOリスト

### ステップ1：データ構造の拡張

- [x] **1-1. 型定義の更新 (`src/types/*.ts`)**
  - [x] `form-types.ts` の `FormDataState` に、本人と配偶者それぞれの再雇用設定フィールドを追加する。
    - `assumeReemployment?: boolean;`
    - `reemploymentReductionRate?: string;`
    - `spouseAssumeReemployment?: boolean;`
    - `spouseReemploymentReductionRate?: string;`
  - [x] `simulation-types.ts` の `SimulationInputParams` に、API計算用の再雇用情報フィールドを追加する。
    - `reemployment?: { startAge: 60; reductionRate: number; };`
    - `spouseReemployment?: { startAge: 60; reductionRate: number; };`

### ステップ2：UIの実装

- [ ] **2-1. 入力フォームの実装 (`src/components/form/RetirementLifeEventSection.tsx`)**
  - [ ] 「あなたの退職年齢」が60歳以上の場合に、「定年再雇用を想定するか？」の選択肢（ラジオボタン等）を表示する。
  - [ ] 「はい」を選択した場合、「60歳時点の年収に対する減給率(%)」の入力フィールドを表示する（デフォルト値: 30）。
  - [ ] 配偶者の退職年齢が60歳以上の場合も、同様のUIセットを表示する。

### ステップ3：フロントエンドとAPIの連携

- [ ] **3-1. APIパラメータ変換ロジックの修正 (`src/utils/api-adapter.ts`)**
  - [ ] `createApiParams` 関数内で、フォームの再雇用設定 (`assumeReemployment` 等) を `SimulationInputParams` の `reemployment` オブジェクト形式に変換するロジックを追加する。

### ステップ4：API計算ロジックの実装

- [ ] **4-1. APIロジックの修正 (`api/simulate/index.ts`)**
  - [ ] `runSimulation` 関数の収入計算部分を修正する。
  - [ ] 60歳以降、設定された退職年齢未満の間、年収に減給率を適用する。
  - [ ] 60歳以降は昇給を停止し、59歳時点の年収を基準に減給額を計算するロジックを実装する。

### ステップ5：結果表示への反映

- [ ] **5-1. 確認画面への反映 (`src/pages/FormPage.tsx`)**
  - [ ] `renderConfirmationView` 内で、60歳のイベントとして「定年再雇用 開始（給与収入がXX%減少）」を表示するロジックを追加する。
  - [ ] 本来の退職イベントのタイトルを「完全退職」などに変更する。
- [ ] **5-2. タイムラインへの反映 (`src/components/dashboard/LifePlanTimeline.tsx`)**
  - [ ] 確認画面と同様に、60歳で「定年再雇用」イベントを表示するロジックを追加する。

### ステップ6：総合テスト

- [ ] **6-1. 動作確認**
  - [ ] 再雇用を設定した場合としない場合で、シミュレーション結果（特に収入と総資産）が正しく変動することを確認する。
  - [ ] 本人、配偶者それぞれで設定が正しく機能することを確認する。
  - [ ] 確認画面と結果タイムラインにイベントが正しく表示されることを確認する。