# TASK-001: グラフのラベル・データポイントが見切れる問題の修正

- **ステータス**: 完了
- **担当者**: Gemini
- **期日**: 2025/11/07
- **関連コンポーネント**: `src/components/dashboard/TotalAssetChart.tsx`, `src/components/dashboard/SavingsPositionChart.tsx`, `src/components/dashboard/IncomePositionChart.tsx`

---

## 概要

一部の環境（特にPCの幅狭ウィンドウやスマートフォンの縦画面）で、資産推移グラフのラベルやデータポイントが見切れるという報告があった。ユーザー体験を損なうため、レスポンシブ対応を強化し、表示を改善する必要がある。

### 具体的な事象

- Y軸の数値ラベル（例: `1000万円`）の左側が切れる。
- X軸の年号ラベルが重なって判読不能になる、またはコンテナからはみ出る。
- `CustomizedLabel` で表示しているデータポイントのラベルが、グラフの左右の端で部分的に隠れる。
- グラフ上部のカスタムラベルや吹き出しが見切れる。
- 退職年を示す `ReferenceLine` のラベルが下部に見切れる。

## 原因分析

1.  **余白不足**: `AreaChart` の `margin` プロパティで確保している余白が、長いY軸ラベルや、将来的に傾ける可能性のあるX軸ラベルに対して不十分。
2.  **X軸ラベルの密集**: 画面幅が狭くなった際に、X軸のラベルを間引いたり傾けたりする処理が不足している。
3.  **カスタムラベルの位置調整**: `CustomizedLabel` コンポーネント内の、ラベルをグラフの端で折り返す (`textAnchor` の動的変更) ロジックが、実際の描画領域と合っておらず、見切れが発生している。

## TODOリスト

### 1. グラフの余白調整 (`margin`) - :white_check_mark: 完了

- [x] `AreaChart`, `BarChart` コンポーネントの `margin` プロパティを見直す。
  - [x] `left`: Y軸の数値ラベルが完全に見えるように値を増やす（`TotalAssetChart.tsx`）。
  - [x] `bottom`: X軸ラベルや `ReferenceLine` のラベルが下に見切れないように値を増やす（`TotalAssetChart.tsx`）。
  - [x] `right`: 右端の `CustomizedLabel` が見切れないように値を調整する（`TotalAssetChart.tsx`）。
  - [x] `top`: 上部のカスタムラベルや吹き出しが見切れないように値を増やす（`TotalAssetChart.tsx`, `SavingsPositionChart.tsx`, `IncomePositionChart.tsx`）。

### 2. X軸ラベルのレスポンシブ対応

- [-] `XAxis` コンポーネントのプロパティを画面幅に応じて動的に変更する。
  - [-] スマートフォンなどの狭い画面では、`interval` プロパティを設定し、ラベルを間引いて表示する（例: `interval="preserveStartEnd"` や `interval={4}` など）。
  - [-] または、`angle={-45}` と `textAnchor="end"` を設定してラベルを斜めに表示し、`height` でX軸自体の高さを確保する。

### 3. `CustomizedLabel` の位置調整ロジック改善

- [-] `CustomizedLabel` コンポーネント内で、ラベルの `textAnchor` を切り替える条件式をより正確なものに修正する。
  - [-] `window.innerWidth` ではなく、Rechartsから渡されるグラフの描画領域のサイズ情報を基に判定ロジックを構築する。

### 4. 動作確認

- [x] PCのブラウザでウィンドウ幅を伸縮させて表示崩れがないか確認する。
- [x] スマートフォンの実機またはブラウザのデベロッパーツールで、縦画面・横画面の両方で表示を確認する。