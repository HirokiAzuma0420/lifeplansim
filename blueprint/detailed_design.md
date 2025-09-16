# 詳細設計書 - ライフプランシミュレーター

## 1. 概要
本ドキュメントは、基本設計書の内容を基に、実装可能なレベルまで詳細化した設計を記述する。

## 2. フロントエンドコンポーネント設計

```
src/
├── components/
│   ├── common/              # 共通UIコンポーネント (Button, Input, etc.)
│   ├── form/                # 入力フォーム関連コンポーネント
│   │   ├── PersonalInfoSection.tsx
│   │   ├── IncomeSection.tsx
│   │   └── ...
│   └── result/              # 結果表示関連コンポーネント
│       ├── TotalAssetsChart.tsx   # 総資産推移グラフ
│       ├── DeviationScore.tsx     # 偏差値表示
│       ├── ResultRank.tsx         # ランク・コメント表示
│       └── CashFlowTable.tsx      # キャッシュフロー表
├── pages/
│   ├── FormPage.tsx           # 入力フォームページのコンテナ
│   ├── ResultPage.tsx         # 結果表示ページのコンテナ
│   └── TopPage.tsx            # トップページ
├── hooks/
│   └── useSimulation.ts       # シミュレーションAPI呼び出しと状態管理のカスタムフック
├── services/
│   └── api.ts                 # APIクライアント
├── store/
│   └── formStore.ts           # フォームの状態を管理 (Zustand/Redux)
└── types/
    └── simulation.ts        # シミュレーション関連の型定義
```

### 3. 主要コンポーネント詳細

#### 3.1. `FormPage.tsx`
- **責務**:
    - 各入力セクションコンポーネントを統括する。
    - フォーム全体の入力状態を管理する（`formStore` を利用）。
    - 「シミュレーション実行」ボタンのクリックイベントをハンドルし、`useSimulation` フック経由でAPIを呼び出す。
    - API実行中はローディング状態を表示し、完了後に結果ページへ遷移させる。

#### 3.2. `TotalAssetsChart.tsx`
- **Props**: `data: SimulationResult['annualData']`
- **責務**:
    - `Chart.js` や他のチャートライブラリを用いて、年次の総資産推移を折れ線グラフで描画する。
    - 資産の内訳（預金、投資など）を積み上げグラフで表現する。
    - 退職年齢のラインなど、補助的な情報を表示する。

#### 3.3. `useSimulation.ts` (カスタムフック)
- **責務**:
    - シミュレーションの実行に関するロジックをカプセル化する。
    - 外部に `execute(input: SimulationInput)` 関数、`isLoading`、`error`、`result` 状態を公開する。
    - `execute` が呼ばれたら、`services/api.ts` を使ってバックエンドAPIにPOSTリクエストを送信する。
    - レスポンスを状態として保持する。

## 4. バックエンド (API) 詳細

### `api/simulate.ts` (Vercel Serverless Function)

1.  **リクエスト受信**:
    - `POST` メソッド以外は `405 Method Not Allowed` を返す。
    - リクエストボディ (JSON) をパースする。
2.  **入力データ検証 (Validation)**:
    - `zod` などのライブラリを使用し、入力データが `SimulationInput` の型に準拠しているか、値が妥当な範囲か（例: 年齢が0以上など）を検証する。
    - 不正なデータの場合は `400 Bad Request` とエラー詳細を返す。
3.  **シミュレーション実行**:
    - メインの計算ロジックを呼び出す。このロジックは別のモジュール (`simulation-core.ts` など) に分離することが望ましい。
    - 計算ロジック:
        - 初期資産を設定。
        - シミュレーション期間（例: 100歳まで）を1年ずつループ。
        - 各年で、収入（昇給率を考慮）、支出（恒常費、ライフイベント費）、投資リターンの計算を行う。
        - 資産残高を更新する。
        - 各年の計算結果を配列に格納する。
4.  **レスポンス返却**:
    - 計算が成功したら、`SimulationResult` 型のオブジェクトをJSONとして `200 OK` で返す。
    - 計算中にエラーが発生した場合は `500 Internal Server Error` を返す。
