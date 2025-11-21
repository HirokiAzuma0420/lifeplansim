# 計画書: 投資セクションの機能拡張

## 1. 概要

### 1.1. 目的

現在の投資セクションの機能を拡張し、ユーザーが同一の金融商品（株式、投資信託など）を複数の口座（特定口座、NISA口座）で別々に登録・管理できるようにする。

### 1.2. 背景

現状のフォームでは、「株式」や「投資信託」といったカテゴリごとに1つの入力欄しか提供されていない。しかし、ユーザーは同じ「株式」を「特定口座」と「NISA口座」の両方で保有している場合がある。このような実際の保有状況をフォームで正確に表現できないため、シミュレーションの精度に限界が生じている。

この問題を解決するため、介護プランの入力で実現されているような、動的にフォームセットを追加・削除できるインターフェースを投資セクションにも導入する。

## 2. 具体的な変更計画

### 2.1. データ構造の変更 (`src/types/form-types.ts`)

フォームの状態を管理する `FormDataState` のデータ構造を、配列ベースに変更する。

1.  **`InvestmentProduct` 型の新規定義**:
    個々の金融商品を表す新しいインターフェースを定義する。

    ```typescript
    export type InvestmentCategory = 'stocks' | 'trust' | 'bonds' | 'ideco' | 'crypto' | 'other';

    export interface InvestmentProduct {
      id: number; // useFieldArrayのためのユニークID
      category: InvestmentCategory;
      // 'bonds', 'ideco', 'crypto' では 'taxable' 固定
      accountType: 'nisa' | 'taxable';
      // ユーザーが任意で設定できる名前
      name: string;
      currentValue: string | number;
      monthlyInvestment: string | number;
      annualSpot: string | number;
      expectedRate: string | number;
      // NISA口座の場合のみ入力
      gainLossSign?: '+' | '-';
      gainLossRate?: string | number;
    }
    ```

2.  **`FormDataState` の更新**:
    既存のフラットな `investment...` 関連のプロパティをすべて削除し、代わりに `InvestmentProduct` の配列を追加する。

    ```typescript
    export interface FormDataState {
      // ... 他プロパティはそのまま

      // 既存の investment... プロパティを削除
      // investmentStocksCurrent: string | number;
      // investmentTrustCurrent: string | number;
      // ... etc.

      // 新しい配列ベースのプロパティを追加
      investmentProducts: InvestmentProduct[];

      // ...
    }
    ```

### 2.2. UI/UXの変更 (`src/components/form/InvestmentSection.tsx`)

`react-hook-form` の `useFieldArray` を利用して、動的なフォームを実現する。

1.  **カテゴリごとの管理**: UIを「株式」「投資信託」などのカテゴリでグループ化する。
2.  **動的な追加機能**: 各カテゴリ内に「口座を追加」ボタンを設置する。このボタンをクリックすると、`useFieldArray` の `append` 関数を呼び出し、対応する `category` を持つ新しい `InvestmentProduct` オブジェクトを `investmentProducts` 配列に追加する。
3.  **動的なフォーム生成**: `investmentProducts` 配列を `filter` と `map` でループ処理し、各カテゴリに対応するフォームセットを動的に描画する。
4.  **削除機能**: 各フォームセットに「削除」ボタンを設置し、`useFieldArray` の `remove` 関数を呼び出して特定の商品を配列から削除できるようにする。
5.  **コンポーネントの再利用**: 口座種別（NISA/特定）、評価額、評価損益率などの入力フィールドは、再利用可能なサブコンポーネントとして実装することを検討する。

### 2.3. 関連ロジックの更新

1.  **初期値の更新 (`src/hooks/useFormState.ts`)**:
    `createDefaultFormData` 関数内の `investment...` 関連の初期値を削除し、`investmentProducts: []` を設定する。

2.  **APIアダプタの修正 (`src/utils/api-adapter.ts`)**:
    `createApiParams` 関数を修正する。新しい `investmentProducts` 配列を走査し、シミュレーションAPIが要求するデータ形式（`products` 配列）に正しく変換するロジックを実装する。
    **特に、NISA口座 (`accountType: 'nisa'`) の場合、フォーム入力の評価額 (`currentValue`) と評価損益率 (`gainLossRate`) から、APIが必要とする元本 (`initialPrincipal`) を計算するロジックを正確に実装する必要がある。**

### 2.4. バックエンド(API)の確認

`api/simulate/index.ts` のシミュレーションロジックを確認した結果、以下の点が判明した。

-   **NISA/課税口座の分離計算に既に対応済み**:
    APIの入力パラメータ `SimulationInputParams.products` 配列内の各商品オブジェクトが `account: '非課税'` または `account: '課税'` プロパティを持つことで、シミュレーションエンジンは両者を区別して計算を実行する。
    -   投資実行時には、NISAの非課税枠（年間・生涯）が考慮される。
    -   資産売却（赤字補填）時には、課税口座が優先され、その売却益に対しては正しく課税計算が行われる。

-   **結論**:
    **`api-adapter.ts` がAPIの要求するデータ形式を正しく生成すれば、`api/simulate/index.ts` 自体に大規模な改修は不要である。** 影響範囲はフロントエンドとAPIアダプタに限定される。

## 3. 影響範囲

-   `src/types/form-types.ts`
-   `src/components/form/InvestmentSection.tsx`
-   `src/hooks/useFormState.ts`
-   `src/utils/api-adapter.ts`
-   `api/simulate/index.ts` (**大規模な変更は不要**)
-   上記変更に伴うすべての関連テストファイル（例: `src/test/util/api-adapter.test.ts`）

## 4. 実装ステップ

1.  **Step 1: データ構造の更新**
    -   `src/types/form-types.ts` に `InvestmentProduct` 型を追加し、`FormDataState` を更新する。

2.  **Step 2: フォームの初期値更新**
    -   `src/hooks/useFormState.ts` の `createDefaultFormData` を修正する。

3.  **Step 3: UIの改修**
    -   `src/components/form/InvestmentSection.tsx` を `useFieldArray` を使って全面的に改修する。

4.  **Step 4: API連携ロジックの更新**
    -   `src/utils/api-adapter.ts` の `createApiParams` を新しいデータ構造に対応させる。

5.  **Step 5: テストの修正と追加**
    -   既存の単体テスト、コンポーネントテストを新しい仕様に合わせて修正する。
    -   複数の商品を追加・削除するシナリオや、NISAと特定口座が混在するシナリオのテストを追加する。
