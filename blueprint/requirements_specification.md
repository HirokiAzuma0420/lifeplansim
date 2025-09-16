# 要件整理書（Requirements Specification）- ライフプラン・シミュレーター

本書は本プロジェクトの現行実装（フロントエンド/バックエンド/資産）を踏まえて、目的・範囲・機能要件・非機能要件・I/F・画面・受け入れ基準を整理したものです。設計系ドキュメント（basic_design.md, detailed_design.md）と相互補完します。

## 1. 背景と目的
- 目的: ユーザーが自身の家計・資産形成（現金/NISA/iDeCo/投資）とライフイベント（住宅・車・結婚・子育て・介護・老後）を入力し、年次の資産推移をシミュレーションして可視化/比較できるようにする。
- 想定ユーザー: 個人の家計管理・将来設計を行いたい一般ユーザー。FP/家計相談の補助利用も視野。
- 成果物: Web アプリ（Vite + React + TypeScript, Recharts/Tailwind）＋ サーバーレス API（Vercel Functions: TypeScript）。

## 2. スコープ
- 含む（MVP）
  - 年次シミュレーション結果（現金・投資元本・NISA・iDeCoを内訳に持つ総資産）の推移可視化
  - 収入/支出（簡単モード・詳細モード）、住宅、車、結婚、子育て、家電更新、介護、老後生活費、年金、投資（積立/スポット/利回りシナリオ）
  - 入力フォーム（段階式）、サンプルダッシュボード表示
  - サーバーレスAPI `/api/simulate` による年次データ算出
- 含まない（現時点）
  - ユーザーアカウント・保存/復元・複数プラン比較の恒久保存
  - 高精度な税/社会保険料の実務レベルの算出（現状は簡略化）
  - 外部統計データ連携（偏差値等の厳密な根拠）

## 3. 現行構成（実装資産の確認）
- フロントエンド
  - ルーティング: `src/App.tsx`, `src/main.tsx`（React Router）
  - ページ: `src/pages/TopPage.tsx`, `src/pages/FormPage.tsx`, `src/pages/SamplePage.tsx`
  - ダッシュボード/可視化: `src/components/dashboard/*`（Recharts）
  - スタイル: Tailwind（`tailwind.config.js`, `src/index.css`）
- バックエンド
  - Vercel Functions: `api/simulate/index.ts`（年次データ `yearlyData` を返却）
- 設定/その他
  - Vite: `vite.config.ts`
  - ビルド/起動: `package.json`（React 19 / React Router 7 / Vite 6）
  - 画像/静的資産: `public/*`
  - 設計系ドキュメント: `blueprint/basic_design.md`, `blueprint/detailed_design.md`
  - 未実装一覧: `blueprint/unimplemented_features.md`

## 4. 用語・データモデル（要点）
- 年次データ（API応答）: `yearlyData: YearlyData[]`
  - 主要項目: `age, year, income, totalExpense, savings, nisa, ideco, investedPrincipal, totalAssets, assetAllocation{cash, investment, nisa, ideco}`
- 入力パラメータ（一部）
  - `initialAge, endAge, retirementAge, pensionStartAge`
  - 収入: `mainJobIncomeGross, sideJobIncomeGross, ...`（年収、成長率）
  - 支出モード: `expenseMode: 'simple' | 'detailed'` と年間費目
  - ライフイベント: `housing, car, marriage, children, appliances, care` 等
  - 投資: `currentInvestmentsJPY, yearlyRecurringInvestmentJPY, yearlySpotJPY, expectedReturn, interestScenario`
  - 安全資金: `emergencyFundJPY`

## 5. 主要ユースケース
1) ユーザーがトップからプラン作成を開始する（`/` → `/form`）
2) 入力フォームで家族構成/収入/支出/イベント/投資/老後条件を順に入力
3) シミュレーション実行 → 年次データを取得
4) 結果グラフ（総資産推移、内訳、投資元本推移、資産比率）・サマリー表示
5) 必要に応じて設定を調整して再実行

## 6. 機能要件（MVP時点）
- 入力フォーム
  - セクション分割（家族構成、収入、支出［簡単/詳細］、車、住宅、結婚、子育て、家電、介護、老後、貯蓄、投資、設定）
  - 入力の基本バリデーション（数値、必須、範囲）
  - 進捗バー、セクション移動（戻る/次へ）、入力補助（概算表示）
- シミュレーション API 連携
  - `POST /api/simulate` に入力JSONを送信し、年次配列を受領
  - 退職後の収入/支出・投資/取り崩し・緊急資金補填の反映
- 可視化/ダッシュボード
  - 総資産推移（現金/投資/NISA/iDeCoの積上げ、退職年基準線）
  - 投資元本推移、資産構成比（円グラフ）、年次表
  - ランク/コメント等のサマリー表示（サンプル実装に準拠）
- ルーティング/表示
  - トップ/フォーム/結果（現状はサンプル画面あり。結果ページは要整備）

## 7. 非機能要件
- パフォーマンス: クライアント描画は中規模データ（年次100件程度）で快適に操作可能
- 可用性/運用: Vercel デプロイ、APIはサーバーレスでスケール
- 開発性: TypeScript/ESLint/Tailwind、テスト（後述の計画で強化）
- セキュリティ: 入力値検証、APIでのメソッド/ペイロード検証、CIで依存脆弱性の検知
- アクセシビリティ: フォーカス制御とARIA属性の基本対応

## 8. 画面一覧（現在のコード整合）
- トップ: `src/pages/TopPage.tsx`（スライダー、プラン開始/サンプル導線）
- 入力フォーム: `src/pages/FormPage.tsx`（大規模フォーム、進捗/各種サマリー表示）
- サンプルダッシュボード: `src/pages/SamplePage.tsx`（Rechartsコンポーネントの集約表示）
- 結果ページ（未整備）: `ResultPage.tsx` 相当を今後実装（実装計画参照）

## 9. API 仕様（要点）
- エンドポイント: `POST /api/simulate`（`api/simulate/index.ts`）
- リクエスト: 入力一式（4章「入力パラメータ」参照）
- レスポンス: `yearlyData: YearlyData[]`（4章「年次データ」参照）
- エラー: 400（バリデーション）/405（メソッド）/500（内部エラー）

## 10. 制約/前提
- ライブラリ/バージョン: React 19 / React Router 7 / Vite 6 / Recharts / Tailwind
- デプロイ: Vercel（`vercel.json` によるリライト設定あり）
- データ保全: 現時点で永続化なし（リロードで消失）

## 11. 既知の課題（抜粋）
- 高精度な税/社会保険料計算は未反映（簡略式）
- 結果ページの統合（API応答とグラフ群の統合表示）は未完成
- 型共有（フロント/バック）と入力バリデーション（zod等）の強化余地
- フォームの巨大化に伴う保守性/可読性の低下
- テスト/CIの不足

## 12. 受け入れ基準（MVP）
- 入力 → API 実行 → 年次データ受領 → 結果画面でグラフ/サマリー表示が一連に動作
- 代表的なライフイベント（住宅/車/結婚/子育て/介護/老後）が入出力に反映
- 入力の基本バリデーションで異常系を抑止
- 主要ブラウザの最新版（Chrome/Edge/Safari）で表示/操作可能

---
本要件は `blueprint/unimplemented_features.md` の拡張項目と整合を取りつつ、`blueprint/実装計画書.md` で段階的に実現します。
