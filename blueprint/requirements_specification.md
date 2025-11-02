# 要件整理書（Requirements Specification）- ライフプラン・シミュレーター

本書は本プロジェクトの現行実装（フロントエンド/バックエンド/資産）を踏まえて、目的・範囲・機能要件・非機能要件・I/F・画面・受け入れ基準を整理したものです。設計系ドキュメント（basic_design.md, detailed_design.md）と相互補完します。

## 1. 背景と目的
- 目的: ユーザーが自身の家計・資産形成（現金/NISA/iDeCo/投資）とライフイベント（住宅・車・結婚・子育て・介護・老後）を入力し、年次の資産推移をシミュレーションして可視化/比較できるようにする。
- 想定ユーザー: 個人の家計管理・将来設計を行いたい一般ユーザー。FP/家計相談の補助利用も視野。
- 成果物: Web アプリ（Vite + React + TypeScript, Recharts/Tailwind）＋ サーバーレス API（Vercel Functions: TypeScript）。

## 2. スコープ
- 含む（現行実装）
  - 年次シミュレーション結果（現金・投資元本・NISA・iDeCo・課税口座を内訳に持つ総資産）の推移可視化
  - **利回りシナリオ**: 固定利回りに加え、**モンテカルロ法**に基づく**ランダム変動**（暴落イベント含む）に対応。
  - **詳細な入力項目**: 収入/支出（簡単/詳細）、住宅（複数リフォーム対応）、車、結婚、子育て、家電更新、親の介護（複数プラン対応）、老後生活費、年金、投資（積立/スポット、NISA生涯枠・売却枠再利用考慮）。
  - **入力支援**: 段階式の入力フォーム、入力途中での`localStorage`への**自動キャッシュと復元機能**。
  - **サーバーレスAPI**: `/api/simulate` による年次データ算出。
  - **リッチな結果表示**: `ResultPage.tsx` による多様なグラフ、タイムライン、サマリー表示。
- 含まない（現時点）
  - ユーザーアカウント・複数プランの恒久的な保存/比較機能。
  - 実務レベルでの高精度な税/社会保険料の算出（現状は簡略化）。
  - 外部統計データとのリアルタイム連携（偏差値等の根拠データは内蔵）。

## 3. 現行構成（実装資産の確認）
- フロントエンド
  - ルーティング: `src/App.tsx`, `src/main.tsx`（React Router）
  - ページ: `src/pages/TopPage.tsx`, `src/pages/FormPage.tsx`, `src/pages/ResultPage.tsx`
  - ダッシュボード/可視化: `src/components/dashboard/*`（Recharts）
  - スタイル: Tailwind（`tailwind.config.js`, `src/index.css`）
- バックエンド
  - Vercel Functions: `api/simulate/index.ts`（年次データ `yearlyData` を返却）
- 設定/その他
  - Vite: `vite.config.ts`
  - ビルド/起動: `package.json`（React 18 / React Router 6 / Vite 5）
  - 画像/静的資産: `public/*`
  - 設計系ドキュメント: `blueprint/basic_design.md`, `blueprint/detailed_design.md`
  - 未実装一覧: `blueprint/unimplemented_features.md`

## 4. 用語・データモデル（要点）
- 年次データ（API応答）: `yearlyData: YearlyData[]`
  - 主要項目: `age, year, income, expense, savings, nisa, ideco, taxable, investmentPrincipal, totalAssets, assetAllocation{...}`
- 入力パラメータ（API）: `SimulationInputParams`
  - `initialAge, endAge, retirementAge, pensionStartAge`
  - 収入: `mainJobIncomeGross, sideJobIncomeGross, ...`（年収、成長率）
  - 支出モード: `expenseMode: 'simple' | 'detailed'` と年間費目
  - ライフイベント: `housing, car, marriage, children, appliances, cares` 等
  - 投資: `products: InvestmentProduct[]`, `interestScenario`
  - 安全資金: `emergencyFundJPY`

## 5. 主要ユースケース
1) ユーザーがトップからプラン作成を開始する（`/` → `/form`）
2) 入力フォームで家族構成/収入/支出/イベント/投資/老後条件を順に入力する。
3) 全入力完了後、確認画面を経てシミュレーションを実行する。
4) 結果ページに遷移し、総資産推移、ライフプラン、各種グラフ、詳細テーブルを確認する。
5) 必要に応じて「条件を修正する」ボタンからフォームの特定セクションに戻り、再実行する。

## 6. 機能要件（現行実装）
- 入力フォーム (`FormPage.tsx`)
  - セクション分割（家族構成、収入、支出［簡単/詳細］、車、住宅、結婚、子育て、生活、介護、老後、貯蓄、投資、設定）
  - 入力の基本バリデーション（数値、必須、範囲）
  - 進捗バー、セクション移動（戻る/次へ）、入力補助（概算表示）
  - 入力内容の`localStorage`への自動キャッシュと、再訪問時の復元機能。
- シミュレーション API 連携
  - `POST /api/simulate` に `SimulationInputParams` 形式のJSONを送信し、年次配列を受領。
  - 退職後の収入/支出・投資/取り崩し・緊急資金補填のロジックを反映。
- 可視化/ダッシュボード (`ResultPage.tsx`)
  - **総資産推移**: 現金/NISA/iDeCo/課税口座の積上げグラフ。
  - **ライフプラン・タイムライン**: 主要イベントを時系列で表示。
  - **同世代比較**: 収入と貯蓄額の偏差値を表示。
  - **投資分析**: 投資元本と評価額の推移、最終的な資産構成比（円グラフ）。
  - **詳細データ**: 資産詳細テーブル、年間収支テーブル。
  - 最終資産額に基づく**総合ランク評価**を表示。

## 7. 非機能要件
- パフォーマンス: クライアント描画は中規模データ（年次100件程度）で快適に操作可能。
- 可用性/運用: Vercel デプロイ、APIはサーバーレスでスケール。
- 開発性: TypeScript/ESLint/Tailwind、テスト（後述の計画で強化）。
- セキュリティ: 入力値検証、APIでのメソッド/ペイロード検証、CIで依存脆弱性の検知。
- アクセシビリティ: フォーカス制御とARIA属性の基本対応。

## 8. 画面一覧（現在のコード整合）
- トップ: `src/pages/TopPage.tsx`（スライダー、プラン開始導線）
- 入力フォーム: `src/pages/FormPage.tsx`（マルチステップ形式のフォーム、進捗/各種サマリー表示）
- **結果ページ**: `src/pages/ResultPage.tsx`（APIからの結果を基にした、インタラクティブなダッシュボード）

## 9. API 仕様（要点）
- エンドポイント: `POST /api/simulate`（`api/simulate/index.ts`）
- リクエスト: `{ inputParams: SimulationInputParams }`
- レスポンス: `{ yearlyData: YearlyData[] }`
- エラー: 400（バリデーション）/405（メソッド）/500（内部エラー）

## 10. 制約/前提
- ライブラリ/バージョン: React 18 / React Router 6 / Vite 5 / Recharts / Tailwind
- デプロイ: Vercel（`vercel.json` によるリライト設定あり）
- **データ保全**: `localStorage` によるブラウザ単位での一時保存のみ。サーバーサイドでの永続化はなし。

## 11. 既知の課題（抜粋）
- 高精度な税/社会保険料計算は未反映（簡略式）。
- 型共有（フロント/バック）と入力バリデーション（zod等）の強化余地。
- フォームの巨大化に伴う保守性/可読性の低下。
- テスト/CIの不足。

## 12. 受け入れ基準（MVP）
- 入力 → API 実行 → 年次データ受領 → 結果画面でグラフ/サマリー表示が一連に動作する。
- 代表的なライフイベント（住宅/車/結婚/子育て/介護/老後）がシミュレーション結果に反映される。
- 入力の基本バリデーションで異常系を抑止できる。
- 主要ブラウザの最新版（Chrome/Edge/Safari）で表示/操作可能である。

---
本要件は `blueprint/unimplemented_features.md` の拡張項目と整合を取りつつ、`blueprint/実装計画書.md` で段階的に実現します。
