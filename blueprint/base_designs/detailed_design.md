# 詳細設計書 - ライフプランシミュレーター

## 1. 概要
本ドキュメントは、基本設計書の内容を基に、実装可能なレベルまで詳細化した設計を記述する。

## 2. フロントエンドコンポーネント設計

```
src/
├── components/
│   ├── dashboard/           # 結果表示（ダッシュボード）関連コンポーネント
│   │   ├── TotalAssetChart.tsx
│   │   ├── CashFlowTable.tsx
│   │   ├── IncomePositionChart.tsx
│   │   ├── LifePlanTimeline.tsx
│   │   └── ...
│   └── form/                # 入力フォームの各セクションコンポーネント
│       ├── FamilySection.tsx
│       ├── IncomeSection.tsx
│       └── ...
├── constants/
│   └── financial_const.ts   # 金融関連のマジックナンバーを定数化
├── hooks/
│   └── useFormState.ts      # フォームの状態管理とロジックをカプセル化
├── pages/
│   ├── FormPage.tsx         # 入力フォームページのコンテナ
│   ├── ResultPage.tsx       # 結果表示ページのコンテナ
│   └── TopPage.tsx
├── types/
│   ├── form-types.ts        # フォームのUI状態に関する型定義
│   └── simulation-types.ts  # シミュレーションのコア（I/O）に関する型定義
└── utils/
    ├── api-adapter.ts       # フォームデータをAPI入力パラメータに変換
    ├── dashboard-helper.ts  # シミュレーション結果を描画用に加工
    └── financial.ts         # 手取り計算など、共有の金融計算ロジック
```

## 3. 主要コンポーネント・フック・ページ詳細

### 3.1. `FormPage.tsx`
- **責務**:
    - 各入力セクションコンポーネント (`FamilySection` など) を統括し、プログレスバーと連動した表示制御を行う。
    - `useFormState` カスタムフックを呼び出し、フォームの状態と更新ロジックを取得する。
    - 「シミュレーション実行」ボタンのクリックイベントをハンドルし、`utils/api-adapter.ts` を使ってフォームデータをAPIの要求する `SimulationInputParams` 形式に変換した上で、APIを呼び出す。
    - API実行中はローディング状態を表示し、完了後に結果データ (`yearlyData`, `inputParams` 等) を `navigate` の state に詰めて結果ページへ遷移させる。

### 3.2. `useFormState.ts` (カスタムフック)
- **責務**:
    - `useState` を使用して、フォーム全体の巨大な状態 (`FormDataState`) を管理する。
    - `handleInputChange` や、配列を扱うための各種ハンドラ (`addAppliance`, `handleCarePlanChange` など) を提供する。
    - **キャッシュ管理**: `useEffect` を使用してフォームの入力内容を `localStorage` に自動保存し、ページ再読み込み時に復元モーダルを表示する。
    - **副作用の管理**: `useEffect` を用い、特定の入力値（例: 独身から既婚へ）の変更に応じて他の入力値を自動計算・更新する。
    - **値のメモ化**: `useMemo` を使い、入力値から算出される表示用の値（合計支出、ローン総額など）を計算し、パフォーマンスを最適化する。
    - **バリデーション**: `validateSection` 関数を提供し、セクション単位での入力チェックを行う。
    - `FormPage` コンポーネントに対し、状態 (`formData`)、セッター、各種ハンドラ、計算済み表示値などをまとめて提供する。

### 3.3. `ResultPage.tsx`
- **責務**:
    - `useLocation` フック経由で `FormPage` から渡されたシミュレーション結果 (`yearlyData`) と入力パラメータ (`inputParams`) を受け取る。
    - `utils/dashboard-helper.ts` の `buildDashboardDataset` を使い、APIからの生データをグラフ描画用に加工・リッチ化する。
    - 加工したデータを各ダッシュボードコンポーネントに `props` として渡し、結果を多角的に可視化する。
    - 主要な可視化コンポーネント:
        - `TotalAssetChart`: 総資産の推移（積立グラフ）
        - `LifePlanTimeline`: 主要なライフイベントを時系列で表示
        - `IncomePositionChart`, `SavingsPositionChart`: 収入と貯蓄額を同世代と比較
        - `InvestmentPrincipalChart`: 投資元本と評価額の推移
        - `AssetPieChart`: 最終的な資産の内訳（円グラフ）
        - `CashFlowTable`: 年単位の収支詳細テーブル

## 4. バックエンド (API) 詳細

### `api/simulate/index.ts` (Vercel Serverless Function)

1.  **リクエスト受信**:
    - `POST` メソッド以外は `405 Method Not Allowed` を返す。
    - リクエストボディ (JSON) をパースする。
2.  **入力データ検証 (Validation)**:
    - カスタムの型ガード関数 `isInputParamsBody` を使用し、リクエストボディに必要な `inputParams` オブジェクトが含まれているか、最低限のプロパティ（`initialAge` など）が存在するかをチェックする。
    - 不正なデータの場合は `400 Bad Request` とエラー詳細を返す。
3.  **シミュレーション実行**:
    - メインの計算ロジックは同ファイル内の `runSimulation` 関数および `runMonteCarloSimulation` 関数に実装されている。
    - **`runSimulation`**:
        - 1年ずつループし、各年の収入（昇給率考慮）、支出（ライフイベント、ローン返済等）、投資リターンを計算し、資産残高を更新する。
        - 生活防衛費が尽きた場合の資産取り崩しロジックも含む。
        - NISA枠の管理（生涯投資枠、年間投資枠、売却枠の再利用）も行う。
    - **`runMonteCarloSimulation`**:
        - `interestScenario` が「ランダム変動」の場合に選択される。
        - `generateReturnSeries` を用いて、設定された期待リターンとボラティリティに基づき、正規分布に従うリターン系列を生成する。この際、ランダムな**暴落イベント**も挿入される。
        - `runSimulation` を複数回（例: 100回）実行し、各年の結果の平均値を最終的な結果として返す。
4.  **レスポンス返却**:
    - 計算が成功したら、`{ yearlyData: YearlyData[] }` 形式のオブジェクトをJSONとして `200 OK` で返す。
    - 計算中にエラーが発生した場合は `500 Internal Server Error` を返す。
