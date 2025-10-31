# FormPage.tsx の入力値に基づくシミュレーションロジック解説

このドキュメントは、`FormPage.tsx` で入力された数値が、`api/simulate/index.ts` のシミュレーションロジックでどのように処理されるかを解説します。

シミュレーションは、ユーザーが設定した開始年齢から終了年齢まで、1年単位のループで実行されます。各年で収入、支出、資産の変動を計算し、その結果を `yearlyData` として記録します。

## 1. シミュレーションの基本ループ

- **期間**: `initialAge` から `endAge` まで、1年ずつ進みます。
- **各年の計算**: ループ内で、現在の年齢 `currentAge` に基づいて各種計算が行われます。

## 2. 収入の計算 (`annualIncome`)

毎年の手取り収入は、以下の要素から計算されます。

1.  **基礎収入の計算**: 
    - 本人の収入: `mainJobIncomeGross` と `sideJobIncomeGross` を合計し、*修正ポイント*`mainJobIncomeGross`については、`incomeGrowthRate` に基づいて毎年の昇給を反映します。
    - 配偶者の収入: `spouseMainJobIncomeGross` と `spouseSideJobIncomeGross` を合計し、`spouseMainJobIncomeGross`については `spouseIncomeGrowthRate` に基づいて毎年の昇給を反映します。
2.  **退職の反映**: `currentAge` が `retirementAge` に達すると、本人および配偶者の収入は0になります。
3.  **手取り額への変換**: `computeNetAnnual` 関数により、税金や社会保険料を差し引いた手取り年収が計算されます。
    - iDeCoの拠出額 (`idecoDeductionThisYear`) は所得控除として扱われます。

## 3. 支出の計算 (`totalExpense`)

年間総支出は、複数の費目の合計です。

### 3.1. 基本生活費 (`livingExpense`)

- **入力モード (`expenseMode`) に応じた計算**:
    - `simple` モード: `livingCostSimpleAnnual` がそのまま年間の生活費となります。
    - `detailed` モード: `detailedFixedAnnual` と `detailedVariableAnnual` の合計が年間の生活費となります。
- **退職後の扱い**: `currentAge` が `retirementAge` に達すると、この `livingExpense` は0になり、代わりに後述の `retirementExpense` が計上されます。

### 3.2. 老後生活費 (`retirementExpense`)

- `currentAge` が `retirementAge` 以上の場合に計算されます。
- `postRetirementLiving10kJPY` (老後の月間生活費) から `pensionMonthly10kJPY` (月間年金受給額) を差し引いた**月間不足額を12倍し、年間の支出として計上**されます。
- 年金は `pensionStartAge` から受給が開始されると見なされます。

### 3.3. ライフイベント関連費用

特定の年に一括または継続的に発生する支出です。

- **子供費 (`childExpense`)**: 
    - `children.count` の人数分、ループ処理されます。
    - 子供の年齢 (`childAge`) が0歳から21歳の間、`educationPattern` に基づいて算出された年間の教育費が加算されます。

- **介護費 (`careExpense`)**: 
    - `care.assume` が `true` の場合、親の年齢 (`parentAge`) が `parentCareStartAge` から `parentCareStartAge + care.years` の間にある年に、`care.monthly10kJPY` に基づく年間介護費用が計上されます。

- **結婚費 (`marriageExpense`)**: 
    - `currentAge` が `marriage.age` と一致する年に、結婚関連の費用 (`engagementJPY`, `weddingJPY` など) が一括で計上されます。

- **家電費 (`applianceExpense`)**: 
    - `appliances` 配列内の各家電について、`firstAfterYears` と `cycleYears` に基づいて買い替えの年かどうかを判定し、該当年に `cost10kJPY` が計上されます。

- **自動車費 (`carExpense`)**: 
    - **現在のローン**: `car.currentLoan` が存在する場合、`remainingMonths` が0になる(*確認ポイント* remainingMonthは月数だが年変換されている？)まで毎年の返済額が `carRecurring` に加算されます。
    - **現在のローン**: `car.currentLoan` が存在する場合、`remainingMonths` が0になるまで、**その年に支払うべき月数分（最大12ヶ月）**の返済額が `carRecurring` に加算されます。
    - **将来の買い替え**: `firstAfterYears` と `frequencyYears` に基づいて買い替え年を特定します。
        - ローンを利用しない場合 (`car.loan.use` が `false`): 買い替え年に `car.priceJPY` が一括支出 (`carOneOff`) として計上されます。
        - ローンを利用する場合: 買い替え年からローン期間 (`car.loan.years`) が終了するまで、`calculateLoanPayment` 関数で計算された年間返済額が `carRecurring` に加算されます。

- **住居費 (`housingExpense`)**: 
    - **現在のローン**: `housing.currentLoan` が存在する場合、`remainingYears` が終了するまで毎年の返済額が計上されます。
    - **賃貸**: `housing.type` が `賃貸` で、かつ住宅購入期間やローン返済期間と重複しない場合、`rentMonthlyJPY` (月額家賃) **を12倍した年間家賃**が計上されます。
    - **将来の購入**: `housing.purchasePlan` があり、`currentAge` が購入年齢に達すると、初年度に頭金 (`downPaymentJPY`) が、以降ローン期間終了まで年間返済額が計上されます。
    - **リフォーム**: `housing.renovations` に基づき、指定された年にリフォーム費用 (`costJPY`) が計上されます。

## 4. 資産の変動

### 4.1. 投資資産の計算

1.  **リターンの決定**: 
    - `interestScenario` が `固定利回り` の場合: `expectedReturn` がそのままその年のリターン `currentReturn` となります。
    - `interestScenario` が `ランダム変動` の場合: `stressTest.seed` を基にした乱数と、各資産クラスのリスク (`ASSET_SIGMA`) を用いて、その年のリターン `currentReturn` を生成します。

2.  **拠出額の計算**: 
    - `currentAge` が `retirementAge` 未満の場合に拠出が行われます。
    - **商品別モード (`useProducts` が `true`)**: `products` 配列の各商品について、`recurringJPY` (積立) と `spotJPY` (スポット) を拠出します。
        - **NISA**: 年間上限 (`NISA_RECURRING_ANNUAL_CAP`, `NISA_SPOT_ANNUAL_CAP`) と生涯上限 (`NISA_CONTRIBUTION_CAP`) を超えない範囲で拠出されます。
        - **iDeCo**: 拠出額は所得控除の対象となります。**iDeCoの拠出は、退職年齢ではなく、原則として60歳に達するまで**とします。
    - **口座別モード (`useProducts` が `false`)**: `investmentTaxation` の情報に基づき、NISA口座と課税口座にそれぞれ拠出します。

3.  **資産残高の更新**: 
    - `(前年末残高 * (1 + 今年のリターン)) + 今年の拠出額` の式で、**`products` 配列の各商品ごと**に年末残高を計算します。これにより、NISA、iDeCo、課税口座といった口座種別に関わらず、商品単位での残高が追跡されます。

### 4.2. 現金貯蓄の計算 (`savings`)

1.  **キャッシュフローの計算**: 
    - `年間手取り収入 - 年間総支出 - 年間総投資額 + 年間貯蓄額 (monthlySavingsJPY * 12)` を計算します。
2.  **貯蓄残高の更新**: 
    - 前年末の貯蓄残高に上記のキャッシュフローを加算します。
3.  **生活防衛資金の補填**: 
    - 計算後の `savings` が `emergencyFundJPY` を下回った場合、不足分を補うために、まず課税口座 (`investedPrincipal`)、次にNISA口座 (`nisa`) から資金が取り崩されます。
    - 課税口座からの取り崩し時には、`SPECIFIC_ACCOUNT_TAX_RATE` (20.315%) の税金が差し引かれた額が補填されます。

## 5. シミュレーション結果の出力

各年の計算結果（収入、各支出項目、資産残高など）は丸め処理をされた後、`yearlyData` 配列にオブジェクトとして追加され、最終的にAPIレスポンスとして返却されます。
