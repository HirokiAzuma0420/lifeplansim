# FormPage.tsx の入力値に基づくシミュレーションロジック解説

このドキュメントは、フォームで入力された値が `api/simulate/index.ts` のシミュレーションロジックでどのように処理されるかを解説します。

シミュレーションは、ユーザーが設定した開始年齢から終了年齢まで、1年単位のループで実行されます。各年で収入、支出、資産の変動を計算し、その結果を `yearlyData` として記録します。

## 1. シミュレーションの基本ループ

- **期間**: `initialAge` から `endAge` まで、1年ずつ進みます。
- **各年の計算**: ループ内で、現在の年齢 `currentAge` に基づいて各種計算が行われます。

## 2. 収入の計算 (`annualIncome`)

毎年の手取り収入は、以下の要素から計算されます。

1.  **基礎収入の計算**: 
    - **本人**: `currentAge` が `retirementAge` 未満の場合、`mainJobIncomeGross` に `incomeGrowthRate` を反映した額と `sideJobIncomeGross` を合算します。
    - **配偶者**: 結婚後で、かつ `spouseCurrentAge` が `spouseRetirementAge` 未満の場合、`spouseMainJobIncomeGross` に `spouseIncomeGrowthRate` を反映した額と `spouseSideJobIncomeGross` を合算します。
2.  **年金収入**: 本人および配偶者の年齢が、それぞれの年金開始年齢 (`pensionStartAge`, `spousePensionStartAge`) に達すると、設定された年金額が加算されます。
3.  **手取り額への変換**: `computeNetAnnual` 関数により、税金や社会保険料を差し引いた手取り年収が計算されます。
    - iDeCoの拠出額 (`idecoDeductionThisYear`) は、課税所得から控除された上で手取り額が計算されます。

## 3. 支出の計算 (`totalExpense`)

年間総支出は、複数の費目の合計です。

### 3.1. 基本生活費 (`livingExpense`)

- `currentAge` が `retirementAge` 未満の場合に計上されます。
- **入力モード (`expenseMode`) に応じた計算**:
    - `simple` モード: `livingCostSimpleAnnual` が年間の生活費となります。
    - `detailed` モード: `detailedFixedAnnual` と `detailedVariableAnnual` の合計が年間の生活費となります。

### 3.2. 老後生活費 (`retirementExpense`)

- `currentAge` が `retirementAge` 以上の場合に計上されます。
- `postRetirementLiving10kJPY` (老後の年間生活費) から、その年に受給する年金総額 (`pensionAnnual`) を差し引いた**不足額**が、支出として計上されます。

### 3.3. ライフイベント関連費用

特定の年に一括または継続的に発生する支出です。

- **子供費 (`childExpense`)**: 
    - `children.count` の人数分、ループ処理されます。
    - 子供の年齢 (`childAge`) が0歳から22歳の間、`educationPattern` に基づいて算出された年間の教育費が加算されます。

- **介護費 (`careExpense`)**: 
    - `cares` 配列内の各介護プランについて、親の年齢が介護期間内にある場合、設定された年間介護費用が計上されます。

- **結婚費 (`marriageExpense`)**: 
    - `currentAge` が `marriage.age` と一致する年に、結婚関連の費用 (`engagementJPY`, `weddingJPY` など) が一括で計上されます。

- **家電費 (`applianceExpense`)**: 
    - `appliances` 配列内の各家電について、`firstAfterYears` と `cycleYears` に基づいて買い替えの年かどうかを判定し、該当年に `cost10kJPY` が計上されます。

- **自動車費 (`carExpense`)**: 
    - **現在のローン**: `car.currentLoan` が存在する場合、`remainingMonths` が0になるまで、その年に支払うべき月数分の返済額が計上されます。
    - **将来の買い替え**: `firstAfterYears` と `frequencyYears` に基づいて買い替え年を特定します。
        - 現金購入の場合: 買い替え年に `car.priceJPY` が一括支出として計上されます。
        - ローン利用の場合: 買い替え年に新たなローンが `activeCarLoans` 配列に追加され、ローン期間が終了するまで、`calculateLoanPaymentShared` で計算された年間返済額が毎年計上されます。

- **住居費 (`housingExpense`)**: 
    - **現在のローン/家賃**: `housing.type` に応じて、現在のローン返済額または家賃が、期間に応じて計上されます。
    - **将来の購入**: `housing.purchasePlan` があり、`currentAge` が購入年齢に達すると、初年度に頭金 (`downPaymentJPY`) が、以降ローン期間終了まで年間返済額が計上されます。
    - **リフォーム**: `housing.renovations` に基づき、指定された年にリフォーム費用 (`costJPY`) が計上されます。

## 4. 資産の変動

### 4.1. 投資の実行とリターンの反映

1.  **投資の実行 (黒字の場合)**:
    - `currentAge` が `retirementAge` 未満で、かつ現金貯蓄が生活防衛費 (`emergencyFundJPY`) を超えている場合、余剰資金が投資に回されます。
    - `products` 配列で定義された各商品に対し、`recurringJPY` (積立) と `spotJPY` (スポット) で指定された額が拠出されます。
    - **NISA**: 年間投資上限 (360万円) と生涯投資枠 (1800万円) を超えない範囲で拠出されます。
    - **iDeCo**: `IDECO_MAX_CONTRIBUTION_AGE` (デフォルト60歳) まで拠出可能です。
    - 拠出された額は、各商品の `principal` (元本) と `balance` (評価額) の両方に加算されます。

2.  **リターンの決定と反映**:
    - **リターン系列の事前生成**: シミュレーション開始前に、`generateReturnSeries` 関数によって全期間分のリターン系列が商品ごとに生成されます。
        - `interestScenario` が `固定利回り` の場合: `expectedReturn` が全期間のリターンとなります。
        - `interestScenario` が `ランダム変動` の場合: 正規分布に従うリターンを生成し、さらにランダムな**暴落イベント** (-30%〜-60%の下落) が挿入されます。系列全体の平均リターンは目標値に補正されます。
    - **リターンの反映**: 各年のリターンが、その年の拠出額が加算された後の `balance` (評価額) に対して乗算され、資産が成長します。
      - `balance *= (1 + yearlyReturn)`

### 4.2. 現金貯蓄の計算 (`savings`)

1.  **キャッシュフローの計算**: 
    - `年間手取り収入 + 投資収益 - 年間総支出` を計算します。
2.  **貯蓄残高の更新**: 
    - 前年末の貯蓄残高に上記のキャッシュフローを加算します。
3.  **生活防衛資金の補填 (赤字補填)**: 
    - 計算後の `savings` が `emergencyFundJPY` を下回った場合、不足分を補うために投資資産が売却されます。
    - **売却順序**: ①課税口座 → ②非課税口座 (NISA) の順で、口座内の全商品の評価額に応じて**按分して**売却されます。
    - **税金**: 課税口座からの売却時、売却額のうち利益部分に対して `SPECIFIC_ACCOUNT_TAX_RATE` (20.315%) の税金が差し引かれ、その残額が現金に補填されます。
    - **NISA枠の復活**: NISA口座から売却した場合、その元本分は翌年に投資枠として復活します。

## 5. シミュレーション結果の出力

各年の計算結果（収入、各支出項目、資産残高など）は丸め処理をされた後、`yearlyData` 配列にオブジェクトとして追加され、最終的にAPIレスポンスとして返却されます。
