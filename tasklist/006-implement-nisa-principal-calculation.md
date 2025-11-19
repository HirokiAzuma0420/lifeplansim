# タスク: NISA元本計算ロジックの実装

## 概要

フォームで入力された評価総額と評価損益率から、NISAの投資元本を計算するロジックを`api-adapter.ts`に実装する。

## 手順

1.  `src/utils/api-adapter.ts`を修正する。
    -   評価総額と評価損益率から元本を算出する関数を追加する。
    -   計算式: `元本 = 評価総額 / (1 + (評価損益率 / 100))`
2.  `src/types/simulation-types.ts`を修正する。
    -   `SimulationInput`の`investment.nisa`に、計算した元本を保持するための`initialPrincipal`プロパティ（または同様のプロパティ）を追加する。
3.  `api-adapter.ts`内で、算出した元本をシミュレーションAPIへの入力データに設定する。
