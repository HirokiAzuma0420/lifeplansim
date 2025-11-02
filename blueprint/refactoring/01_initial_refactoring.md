# リファクタリング計画書 - 01.初期構造改善

## 1. はじめに

### 1.1. 目的

本計画書は、プロジェクト初期段階で肥大化したコンポーネントの構造を改善し、コードベースの健全性を高めることを目的としたリファクタリングについて記述します。

具体的には、以下の課題を解決します。

- **コンポーネントの肥大化**: `FormPage.tsx` への責務集中
- **マジックナンバーの多用**: `10000` などのハードコードされた数値
- **ファイル名・責務の曖昧さ**: `simulation.ts` のような汎用的なファイル名
- **ロジックと型の重複**: フロントエンドとAPI間での重複

### 1.2. 計画の進め方

以下の3フェーズに分けて、段階的かつ安全にリファクタリングを進めます。各タスクは独立して実施・レビュー可能であり、デグレードのリスクを最小限に抑えます。

---

## 2. リファクタリングタスク一覧

### 2.1. タスクサマリー

*   **凡例**: `[ ]` 未着手, `[/]` 進行中, `[x]` 完了

| ID  | フェーズ | ステータス | タスク概要 | 担当 | 完了日 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1-1** | 1. 基盤整備 | `[x]` | マジックナンバーの定数化 | Gemini | 2025-11-02 |
| **1-2** | 1. 基盤整備 | `[x]` | 共有ロジックの分離 | Gemini | 2025-11-02 |
| **1-3** | 1. 基盤整備 | `[x]` | ファイル/ディレクトリ構成の見直し |Gemini | 2025-11-02 |
| **2-1** | 2. データ構造 | `[x]` | 型定義の集約と命名規則の改善 | Gemini | 2025-11-02 |
| **2-2** | 2. データ構造 | `[x]` | APIパラメータ変換ロジックの分離 | Gemini | 2025-11-02 |
| **3-1** | 3. 構造改善 | `[ ]` | フォームセクションのコンポーネント化 | | |
| **3-2** | 3. 構造改善 | `[ ]` | 状態管理のカスタムフック化 | | |

---

## 3. 各タスクの詳細

### フェーズ1: 基盤整備と明確化 (低リスク・即効性)

#### **タスク 1-1: マジックナンバーの定数化**
- **目的**: マジックナンバーを廃絶し、コードの意図を明確にする。
- **影響範囲**:
  - `api/simulate/index.ts`
  - `src/pages/FormPage.tsx`
  - `src/pages/SamplePage.tsx`
  - `src/components/dashboard/LifePlanTimeline.tsx`
- **手順**:
  1. `src/constants/` ディレクトリを作成する。
  2. `financial_const.ts` を作成し、`YEN_PER_MAN = 10000` や `MONTHS_PER_YEAR = 12`、各種デフォルト値（退職年齢など）を意味のある名前でエクスポートする。
  3. 影響範囲のファイルで、直接書かれた数値を定数に置き換える。

#### **タスク 1-2: 共有ロジックの分離と明確化**
- **目的**: フロントエンドとAPIで重複している計算ロジックを一元化する。
- **影響範囲**:
  - `api/simulate/index.ts`
  - `src/utils/financial.ts` (新規)
  - `src/pages/FormPage.tsx`
- **手順**:
  1. `src/utils/financial.ts` を作成する。
  2. `api/simulate/index.ts` 内にある手取り年収計算 (`computeNetAnnual`) やローン計算 (`calculateLoanPayment`) などの汎用的な関数を `src/utils/financial.ts` に移動させる。
  3. `api/simulate/index.ts` と `src/pages/FormPage.tsx` の両方から、この共通化された関数をインポートして利用するように修正する。

#### **タスク 1-3: ファイル/ディレクトリ構成の見直し**
- **目的**: 曖昧なファイル名を具体的にし、責務を明確にする。
- **影響範囲**:
  - `src/utils/simulation.ts` → `src/utils/dashboard-helper.ts`
  - `src/types/simulation.ts`
- **手順**:
  1. `src/utils/simulation.ts` を `src/utils/dashboard-helper.ts` にリネームする。（ダッシュボード表示用のデータ加工が主目的のため）
  2. `src/types/simulation.ts` を `src/types/` 配下の、より具体的なファイルに分割する。（詳細はフェーズ2-1）

### フェーズ2: 型とデータ構造の整理 (中リスク・保守性向上)

#### **タスク 2-1: 型定義の集約と命名規則の改善**
- **目的**: 複数のファイルに散らばる型定義を、単一の信頼できる情報源 (Single Source of Truth) に集約する。
- **影響範囲**:
  - `api/simulate/index.ts`
  - `src/types/` (配下全体)
- **手順**:
  1. `src/types/` ディレクトリを型定義の唯一の置き場所と定める。
  2. `src/types/simulation.ts` の内容を、以下のファイルに分割・移動する。
     - `src/types/form-types.ts`: `FormDataState` など、UIの状態に特化した型。
     - `src/types/simulation-types.ts`: APIのI/O (`SimulationInputParams`, `YearlyData`) など、シミュレーションコアに関連する型。
  3. `api/simulate/index.ts` 内の型定義を削除し、`src/types/simulation-types.ts` を参照するように `tsconfig.json` の `paths` を設定・修正する。

#### **タスク 2-2: APIパラメータ変換ロジックの分離**
- **目的**: `FormPage.tsx` から、APIリクエストのパラメータを組み立てる複雑なロジックを分離する。
- **影響範囲**:
  - `src/pages/FormPage.tsx`
  - `src/utils/api-adapter.ts` (新規)
- **手順**:
  1. `src/utils/api-adapter.ts` を作成する。
  2. `handleSimulate` 内の `formData` から `SimulationInputParams` へ変換するロジックを、`createApiParams(formData: FormDataState): SimulationInputParams` のような関数としてこのファイルに移植する。
  3. `FormPage.tsx` はこの関数を呼び出すだけにする。

### フェーズ3: コンポーネントの構造的改善 (高リスク・抜本的改善)

#### **タスク 3-1: フォームセクションのコンポーネント化**
- **目的**: `FormPage.tsx` の `renderSection` 内にある巨大な `switch` 文を解体し、各セクションを独立したコンポーネントに分割する。
- **影響範囲**:
  - `src/pages/FormPage.tsx`
  - `src/components/form/*` (新規)
- **手順**:
  1. `src/components/form/` ディレクトリを作成する。
  2. `FamilySection.tsx`, `IncomeSection.tsx`, `ExpenseSection.tsx` のように、セクションごとにコンポーネントファイルを作成する。
  3. 各コンポーネントは `formData`, `handleInputChange`, `errors` などを `props` として受け取る。
  4. `FormPage.tsx` は、現在のセクションに応じてこれらのコンポーネントを動的に描画する「コンテナ」の役割に専念させる。

#### **タスク 3-2: 状態管理のカスタムフック化**
- **目的**: `FormPage.tsx` に残った状態管理ロジックをカスタムフックとして抽出し、UIとロジックを完全に分離する。
- **影響範囲**:
  - `src/pages/FormPage.tsx`
  - `src/hooks/useFormState.ts` (新規)
- **手順**:
  1. `src/hooks/useFormState.ts` を作成する。
  2. `FormPage.tsx` 内の `useState<FormDataState>`、入力ハンドラ (`handleInputChange` 等)、バリデーション (`validateSection`)、キャッシュ処理 (`useEffect` 内のロジック) をこのフックに移動する。
  3. `FormPage.tsx` は `const { formData, handleInputChange, ... } = useFormState();` のように、このフックを呼び出すだけで済むようにする。