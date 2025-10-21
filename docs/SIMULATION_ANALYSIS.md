# 資産シミュレーション機能の要求定義と実装の比較分析

## 1. 要求通りに実装されている点

- **入力フォーム (`FormPage.tsx`):**
    - 要求定義にあるほとんどの入力項目（年齢、収入、支出、各ライフイベント等）がフォームに存在し、`handleSimulate` 関数でAPIに送信するパラメータとして整形されている。
    - 商品別の投資情報（現在価値、積立額、スポット額、期待リターン）を入力するUIが存在し、`products` 配列としてAPIに渡すロジックが組まれている。

- **シミュレーションロジック (`api/simulate/index.ts`):**
    - `products` 配列を受け取った場合に、商品別の残高を計算する `useProducts` モードが存在する。
    - NISAの生涯拠出上限 (`NISA_CONTRIBUTION_CAP`) を超えた場合に、以降のNISA拠出を停止するロジックが実装されている。
    - 緊急予備資金が不足した場合に、課税口座 (`investedPrincipal`) → NISA口座の順で資産を取り崩すロジックが存在する。
    - ストレスシナリオ（ランダム変動）が実装されている。

- **結果表示 (`ResultPage.tsx`):**
    - シミュレーション結果のサマリーカード（初年度/最終年の総資産、増減額など）が表示されている。
    - 総資産推移グラフ (`TotalAssetChart`)、元本推移グラフ (`InvestmentPrincipalChart`) が表示されている。
    - 最新年の資産配分を示す円グラフ (`AssetPieChart`) が表示されている。
    - **【要求通り】** 最新年の商品別残高を示すテーブルが実装されている (`latestProducts` を使用)。

## 2. 要求通りに実装されていない点（ギャップ）

- **APIの出力仕様:**
    - **[GAP-01] `productTotals` の欠如:** 要求仕様では、年次データ (`YearlyData`) に商品別の合算残高 `productTotals: Record<string, number>` を含めることになっているが、`api/simulate/index.ts` の実装では、課税口座の商品残高 `products` のみが出力されており、全口座（課税, NISA, iDeCo）を合算した商品別残高が出力されていない。
    - **[GAP-02] `productAccounts` の欠如:** 要求仕様では、商品ごとの口座別内訳 `productAccounts: Record<string, { taxable: number; nisa: number; ideco: number }>` を出力することになっているが、このフィールドは `YearlyData` に含まれていない。

- **結果ページの可視化仕様:**
    - **[GAP-03] 商品別時系列チャートの欠如:** 要求仕様にある「商品別の時系列チャート（全口座合算の折れ線/積上げ）」が `ResultPage.tsx` に実装されていない。現在の `TotalAssetChart` は現金・NISA・iDeCo・課税投資の合計を表示するのみで、商品別の内訳推移は可視化できていない。
    - **[GAP-04] 年次表の商品別列の欠如:** 要求仕様では、年次表に商品別の列を表示することになっているが、現在の `AssetTable` コンポーネントでは、総資産や現金などの主要項目のみが表示されており、商品別の残高推移が一覧できない。（`AssetTable.tsx` の実装詳細に依存するが、渡されているデータからはその機能がないと推測される）
    - **[GAP-05] 円グラフの切替機能の欠如:** 要求仕様では、円グラフを「商品別」と「口座別」で切り替えられるようにすることが提案されているが、現在の `AssetPieChart` は `dataset.pieData` に基づく固定表示となっており、切替機能がない。

- **既知の別件:**
    - 要求仕様の「既知の別件」にリストされている項目（住宅ローン金利の単位ずれ、二重計上問題など）は、`api/simulate/index.ts` のコードを見る限り、まだ修正されていない可能性が高い。例えば、住宅ローンの二重計上を示唆するようなコード (`housingExpense += ...` が複数箇所にある) が見受けられる。

## 3. 改善案

- **APIの修正 (`api/simulate/index.ts`):**
    - **[GAP-01, GAP-02対応]** シミュレーションループの最後に `YearlyData` を構築する箇所で、`productTotals` と `productAccounts` を計算して追加する。
        - ループ内で商品ごとの残高を口座別に保持する一時変数（例: `currentProductBalances: Record<string, { taxable: number, nisa: number, ideco: number }>`) を用意する。
        - 投資ロジックの部分で、各商品の残高をこの変数に格納する。
        - ループの最後に、この一時変数から `productTotals`（全口座の合計）と `productAccounts` を生成し、`yearlyData.push` するオブジェクトに含める。
        - `YearlyData` の型定義にもこれらのフィールドを追加する。

- **結果ページの修正 (`ResultPage.tsx` および関連コンポーネント):**
    - **[GAP-03対応]** 新しいコンポーネント `ProductStackChart.tsx` を作成する。
        - このコンポーネントは `yearlyData` を受け取り、`productTotals` (または `productAccounts`) を使って、Rechartsなどのライブラリで商品別の積み上げ棒グラフまたは折れ線グラフを描画する。
        - `ResultPage.tsx` 内の `TotalAssetChart` の下あたりにこの新しいチャートを追加する。
    - **[GAP-04対応]** `AssetTable.tsx` コンポーネントを修正する。
        - `yearlyData` から `productTotals` を受け取れるようにする。
        - テーブルの列を動的に生成し、既存の列（年、総資産など）に加えて、`productTotals` のキー（商品名）をヘッダーとする列を追加する。テーブルが長くなるため、横スクロール可能なコンテナでラップする。
    - **[GAP-05対応]** `AssetPieChart.tsx` を修正する。
        - `useState` を使って表示モード（`'product'` or `'account'`）を管理する。
        - `yearlyData` の最終年から、口座別データ (`assetAllocation`) と商品別データ (`productTotals`) の両方を参照できるようにする。
        - 表示モードに応じて、円グラフに渡すデータを切り替えるロジックを追加する。
        - 切り替え用のUI（ボタンやトグルスイッチ）をコンポーネント内に追加する。

- **既知の別件の修正:**
    - 要求仕様に記載の「既知の別件」について、それぞれ影響範囲を特定し、個別のタスクとして修正を行う。例えば、住宅ローンの二重計上問題については、`housingExpense` への加算ロジックを再レビューし、重複している計算を削除または統合する。
