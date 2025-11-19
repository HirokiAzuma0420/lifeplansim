# タスク: NISA結果表示の更新

## 概要

シミュレーション結果の表示コンポーネントを修正し、元本ベースの計算結果を反映させる。

## 手順

1.  `src/components/dashboard/AssetTable.tsx`を修正する。
    -   初年度のNISA積立額が、元本を基準とした金額で表示されるようにする。計画書によれば、カラム構成の変更は不要。
2.  `src/components/dashboard/TotalAssetChart.tsx`および`src/components/dashboard/AssetPieChart.tsx`を確認する。
    -   これらのチャートは引き続き評価額ベースで資産を表示するため、大きな変更は不要だが、データの受け渡しに問題がないか確認する。
