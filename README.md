# 資産シミュレーター（ライフプラン）

詳細なライフイベントと投資計画に基づく資産形成・取り崩しの年次シミュレーションを行い、グラフとテーブルで可視化する Web アプリケーションです。React + TypeScript + Vite をフロントエンドに、Vercel Serverless Functions をバックエンドに採用しています。

本ファイル・コードは UTF-8（BOMなし）／改行 LF 前提です。説明・コメントは日本語で記述しています（外部仕様の固有名のみ英語可）。

## 🛠 技術スタック

- フロントエンド: React 19 + TypeScript 5 + Vite 6 + React Router 7
- スタイリング: Tailwind CSS 3
- グラフ描画: Recharts 2
- バックエンド: Vercel Serverless Functions（`api/simulate`）
- テスト/検証: Playwright（開発時のみ）
- パッケージ管理: npm（`package-lock.json` 採用）

## 📊 主な機能

- 入力ウィザード形式のフォームで前提条件を設定（家族構成・収入・支出・ライフイベント・貯蓄・投資・シミュレーション設定）
- 口座種別別の投資管理（課税／非課税（NISA）／iDeCo）と生涯非課税枠・年間上限の自動管理、売却枠の翌年復活
- 生活防衛資金を考慮した取り崩し順序（課税 → NISA → iDeCo）
- 利回りシナリオ（固定／ランダム変動）と暴落イベント注入、モンテカルロシミュレーション
- 年次データの可視化（総資産推移、現金・NISA・iDeCo・課税、積立元本、資産配分、収入・支出内訳、キャッシュフロー）

### 主要入力（抜粋）

- 基本: 初期年齢／配偶者年齢、退職年齢、年金開始年齢
- 収入: 本人・配偶者の給与（主・副）と年次上昇率
- 支出: 簡易（年間）または詳細（固定費・変動費）
- ライフイベント: 自動車（購入・ローン・買替）、住宅（賃貸／ローン中／完済・購入計画・リフォーム）、結婚、子供（教育パターン）、家電、親の介護、老後
- 資産・投資: 現在の現金・投資、毎月積立・スポット、想定利回り、非常用資金
- シミュレーション: 利回りシナリオ、モンテカルロ回数、ストレステスト（シード）

## 🧭 画面構成

- `src/pages/TopPage.tsx`: トップ（カルーセル／導線）
- `src/pages/FormPage.tsx`: 入力フォーム（セクション遷移・確認・実行）
- `src/pages/ResultPage.tsx`: 結果表示（グラフ・表）
- `src/pages/SamplePage.tsx`: サンプルデータでの結果表示

## 🗂 ディレクトリ構成（主要）

```
api/
  simulate/index.ts          # サーバレス関数（POST /api/simulate）
src/
  App.tsx, main.tsx
  components/
    dashboard/*              # ダッシュボード（グラフ・カード類）
    form/*                   # 入力フォームの各セクション
  constants/financial_const.ts   # 制度・上限・UI 定数
  hooks/*                    # フォーム状態管理など
  pages/*                    # 画面
  types/*                    # 入出力型定義（SimulationInputParams, YearlyData 他）
  utils/
    api-adapter.ts           # フォーム → API 入力変換
    financial.ts             # 手取り計算・ローン計算 等
blueprint/
  SIMULATE_LOGIC.md ほか     # 設計・式の詳細
scripts/
  run-sim-from-form.js       # 入力JSONから関数を直接起動（検証用）
  debug_simulation.js        # ロジック単体検証
```

## 🚀 セットアップ／起動

前提: Node.js 18 以上、UTF-8（BOMなし）／LF。

```bash
# 依存インストール
npm ci

# 開発サーバ（フロントエンドのみ、http://localhost:5173）
npm run dev

# 本番ビルド → ローカル確認（静的プレビュー）
npm run build
npm run preview
```

注意: 開発サーバ（`vite`）単体では Vercel Functions（`/api/simulate`）は動作しません。API を含めたローカル統合確認は Vercel CLI の `vercel dev` を利用してください。

```bash
# Vercel CLI のインストール（未導入の場合）
npm i -g vercel

# API を含めたローカル統合実行（http://localhost:3000）
vercel dev
```

## 🔌 API 概要（/api/simulate）

- メソッド: POST
- リクエスト: `{ inputParams: SimulationInputParams }`
- レスポンス（抜粋）: `yearlyData: YearlyData[]`, `percentileData`, `summary`（破綻率 等）
- 代表的な型は `src/types/simulation-types.ts` を参照

例（デプロイ環境または `vercel dev` 実行中に `curl`）:

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d @検証用/input.json \
  http://localhost:3000/api/simulate | jq '.yearlyData[0]'
```

フォームからの呼び出しは `src/pages/FormPage.tsx` 内で `fetch('/api/simulate')` を使用しています。`src/utils/api-adapter.ts` がフォーム状態を `SimulationInputParams` へ変換します。

## 🧪 ロジック単体検証（サーバレス非依存）

Vercel を使わず、直接関数を呼び出して検証できます。

```bash
# 入力JSON（検証用/input.json）を使って関数を直接起動
node scripts/run-sim-from-form.js

# ロジック詳細デバッグ
node scripts/debug_simulation.js
```

## 📈 可視化コンポーネント（例）

- `components/dashboard/TotalAssetChart.tsx`: 総資産推移
- `components/dashboard/SavingsPositionChart.tsx`: 現金ポジション推移
- `components/dashboard/InvestmentPrincipalChart.tsx`: 投資元本推移
- `components/dashboard/AssetPieChart.tsx`: 最終年の配分
- `components/dashboard/CashFlowTable.tsx`: 年次キャッシュフロー

## 📚 設計サマリー（blueprint 由来）

以下は `blueprint/` 配下ドキュメントの要点サマリーです。詳細は各ファイルを参照してください。

- `blueprint/requirements_specification.md`
  - 目的・想定ユーザー・範囲（含む／含まない）
  - 機能要件（入力フォーム、イベント、投資、API 連携、結果可視化）
  - 非機能要件（性能、運用、セキュリティ、アクセシビリティ）
  - 画面一覧、API 仕様（`POST /api/simulate`）、受け入れ基準

- `blueprint/basic_design.md`
  - 全体構成（React/Vite + Vercel Functions）とやり取りの流れ
  - 画面構成（トップ／フォーム／結果）
  - API I/F 例（リクエストとレスポンスの骨子）

- `blueprint/detailed_design.md`
  - 型定義・データフローの詳細（`SimulationInputParams` → `yearlyData`）
  - 投資口座バケット（課税／NISA／iDeCo）とキャッシュフロー反映順序
  - ランダム変動・暴落イベント注入、モンテカルロの扱い

- `blueprint/simulation_logic_from_form.md`
  - フォーム入力から API パラメータ生成までの変換手順
  - 月額→年額換算、口座種別毎の集計、期待利回りの決め方

- `blueprint/simulation_logic_fixes.md`
  - 取り崩し優先順、NISA 売却枠の翌年復活、iDeCo 換金条件などの修正点
  - 計算の境界条件とデバッグ用フラグの整備

- `blueprint/form_based_simulation_conditions.md`
  - 入力条件の網羅（生活費モード、住宅・車・家電・介護・結婚・教育）
  - 退職・年金・非常用資金・投資利回りシナリオ設定

- `blueprint/result_page_visualization.md`
  - グラフ／表の構成（総資産、現金、投資元本、配分、収支、タイムライン）
  - UI 上の注記・指標・比較の表示方針

- `blueprint/implementation_plan.md`
  - 実装フェーズ、マイルストーン、検証手順

- `blueprint/unimplemented_features.md`
  - 今後の拡張候補（アカウント機能、外部データ連携、高精度税・社保 など）

- `blueprint/refactoring/01_initial_refactoring.md`
  - 初期リファクタリング方針（責務分離、型の厳格化、ユーティリティ整理）

## 🔒 エンコード／表記ルール

- 文字コード: UTF-8（BOMなし）／改行: LF
- 説明文・コードコメントは日本語（外部仕様の固有名のみ英語可）

## 🛠 変更手順（実行例）

以下は本 README 更新後の基本的な作業手順の例です。

```bash
# 作業ブランチ作成（任意）
git checkout -b docs/update-readme

# 依存の再取得とフォーマット確認
npm ci

# 型チェックとビルド
npm run build

# ローカル実行（フロントのみ）
npm run dev

# API を含めた統合確認（要: Vercel CLI）
vercel dev

# 変更の確認・コミット
git add README.md
git commit -m "docs: README を最新化"
```

## 📜 ライセンス

社内利用・検証目的で開発中（外部公開時は別途ライセンスを明示）。
