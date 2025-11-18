# /api/simulate 年次シミュレーション API テスト報告書

前提: 文字コードは UTF-8（BOM なし）、改行コードは LF。

本報告書は `api/simulate/index.ts` に対して実施した
単体テスト・API レベル結合テスト・ランダム変動シナリオを含む総合テストの実行結果と、
資産保存則プロパティテスト（TC-PROP 系）の結果をまとめたものである。

- テスト仕様の詳細: `blueprint/simulation-api/01_test_spec.md`
- 保存則検証の詳細設計: `blueprint/simulation-api/02_conservation_plan.md`

---

## 1. 実行した主なテストセット

### 1.1 単体テスト・基本ロジック

- 対象テストファイル:
  - `http.test.ts`
  - `period.test.ts`
  - `boundary.test.ts`
  - `income.test.ts`
  - `expense.test.ts`
  - `investment.test.ts`
  - `yearlyData.test.ts`
  - `yearlyData_cases.test.ts`

- 実行内容と結果:
  - 実行コマンド例:
    - `npx vitest run src/test/api/simulate/http.test.ts`
    - `npx vitest run src/test/api/simulate/boundary.test.ts`
    - `npx vitest run src/test/api/simulate/income.test.ts`
    - `npx vitest run src/test/api/simulate/expense.test.ts`
    - `npx vitest run src/test/api/simulate/investment.test.ts`
    - `npx vitest run src/test/api/simulate/yearlyData.test.ts`
    - `npx vitest run src/test/api/simulate/yearlyData_cases.test.ts`
  - 上記はいずれも、直近の再実行で **すべてテストパス**（Vitest 上で `1 file / N tests passed`）であることを確認済み。
  - `period.test.ts` については、環境依存のフォーク起動タイムアウトにより
    「テスト実行前にランナー起動エラー」となったため、同一ロジックを含む他ファイルの結果をもって
    現状は間接的な確認にとどめている（今後、設定調整のうえで再実行予定）。

- カバーしている主な観点:
  - フォーム入力から生成されるパラメータが `SimulationInputParams` に正しくマッピングされていること。
  - `YearlyData` の各項目（収入内訳・支出内訳・資産配分など）が設計通りに計算されること。

### 1.2 赤字補填・税制・NISA 関連

- 対象テストファイル:
  - `deficit.test.ts`

- 実行内容と結果:
  - 実行コマンド:
    - `npx vitest run src/test/api/simulate/deficit.test.ts`
  - 直近の再実行で、6 テストすべて `passed` であることを確認。

- 主な観点:
  - 生活防衛資金を下回った場合に、課税口座 → NISA 口座の順で取り崩されること。
  - NISA 売却時に売却元本分が「翌年復活する NISA 枠」として積算されること。
  - 課税口座売却時の譲渡益課税が期待通りに計算されること。

### 1.3 極端値・安全性・総合テスト

  - `extreme_inputs.test.ts`
  - `monteCarlo.test.ts`
  - `integration_random_lifeEvent.test.ts`
  
  実行メモ:
  - 上記 3 ファイルについて `npx vitest run` を個別に実行し、すべてのテストケースが `passed` であることを直近で確認済み。
  
  主な観点:

- 超高所得・ほぼ無収入・極端な利回り・超長寿などの入力でクラッシュしないこと。
- Monte Carlo シミュレーションで大規模な繰り返し計算を行っても、
  YearlyData の構造や型が崩れないこと。
- ランダム入力＋ライフイベント（結婚など）が組み合わさった総合ケースで、
  API 応答が妥当な範囲に収まっていること。

### 1.4 プロパティテスト（資産保存則）

- `property_random.test.ts`

詳細は次章を参照。

---

## 2. 資産保存則プロパティテスト結果（TC-PROP 系）

### 2.1 TC-PROP-001: 簡略収支恒等式の安全性チェック

- 状態: 実装済み・テスト成功。
- 概要:
  - 乱数で収入・支出・投資条件を変化させた複数シナリオを生成。
  - 「初期資産＋全収入−全支出」と「最終資産＋取り崩し総額」の差分 `diff` を計算。
  - `diff` の数値そのものではなく、`Number.isFinite(diff)` が常に `true` であることを確認。
- 目的:
  - 長期のシミュレーションでオーバーフローや `NaN` / `Infinity` が発生していないかを検知する。
  - 厳密な資産保存則は TC-PROP-002/003 で扱う。

### 2.2 TC-PROP-002: 固定利回り・単純ケースでの保存則検証

- 状態: 実装済み。
  - `npx vitest run src/test/api/simulate/property_random.test.ts` にてグリーンを確認。
- シナリオ概要:
  - `interestScenario = '固定利回り'`, `expectedReturn = 0.03`
  - 課税口座・NISA 口座それぞれ 1 本ずつの投資商品。
  - 年金・退職金・ライフイベントなし。
  - 収入 > 支出となるように設定し、長期にわたり黒字が続くケース。
- 評価した保存則（概略）:

  ```text
  L = 初期資産
    + Σ(手取りベースの年次収入)
    + Σ(投資リターン)
    − Σ(年次支出)
    − Σ(投資税＋退職金税)

  R = 最終年の totalAssets
  diff = |L − R|
  allowed = max(|L| × 2%, 100,000)
  ```

- 実行結果（要約）:
  - 実行コマンド:
    - `npx vitest run src/test/api/simulate/property_random.test.ts`
  - 該当テスト:
    - `TC-PROP-002`（シナリオ数 3）
  - Vitest の結果:
    - 該当テストはいずれも「passed」となり、`diff <= allowed` を満たさないケースは観測されなかった。
  - 補足:
    - 同テストファイル内の `TC-PROP-001` も同時に実行され、`diff` が常に有限であることを確認済み。

### 2.3 TC-PROP-003: ランダム変動＋赤字補填ありでの保存則検証

- 状態: 実装済み。
  - 同じく `property_random.test.ts` に含まれ、個別実行でグリーンを確認。
- シナリオ概要:
  - `interestScenario = 'ランダム変動'`
  - `Math.random` を Xorshift 風の擬似乱数でモックし、シード固定。
  - 収入・支出・投資額をレンジ内で乱数生成。
  - 課税口座売却・NISA 取り崩し・赤字補填が発生しうる現実的なケースを複数生成。
- 評価した保存則:
  - TC-PROP-002 と同じ式を用いるが、許容誤差を緩めて

    ```text
    allowed = max(|L| × 5%, 500,000)
    ```

    とし、`diff <= allowed` を期待値とする。

- 実行結果（要約）:
  - 実行コマンド:
    - `npx vitest run src/test/api/simulate/property_random.test.ts`
  - 該当テスト:
    - `TC-PROP-003`（シナリオ数 5）
  - Vitest の結果:
    - 該当テストはいずれも「passed」となり、`diff <= allowed` を満たさないケースは観測されなかった。
  - 併走テストへの影響確認:
    - 保存則用フィールド追加・赤字補填ロジックの拡張に伴い、
      `npx vitest run src/test/api/simulate/deficit.test.ts` も再実行し、
      既存の TC-DEFICIT 系テストがすべてグリーンであることを確認している。

---

## 3. 所感と今後の課題

- 資産保存則は「投資リターン」と「投資・退職金に対する税」を明示的に取り込むことで、
  モデルとして大きく破綻していないことが確認できた。
- 給与・年金に対する税・社会保険料については、
  `DebugInfo.taxOnSalaryThisYear` に概算値を保持しているが、
  現状の保存則検証では「シミュレーション外で消えるお金」とみなして式には含めていない。
  - 将来的には「額面 − 税・社保 − 控除 ≒ 手取り」という別種の保存則テストとして利用する余地がある。
- Monte Carlo シミュレーション（`monteCarlo.test.ts`）側からも、
  保存則の崩れを統計的に監視する仕組みを追加することで、
  長期運用シナリオにおけるバグ検知精度をさらに高められると考えられる。
