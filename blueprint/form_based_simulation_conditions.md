# FormPage.tsx から想定されるシミュレーション条件

`src/pages/FormPage.tsx` の入力フォームから生成され、 `/api/simulate` に送信されるシミュレーションのパラメータ（条件）一覧です。

## 1. 基本設定 (Basic Settings)

- `initialAge`: シミュレーション開始時の本人の年齢 (歳)
- `spouseInitialAge`: シミュレーション開始時の配偶者の年齢 (歳) ※既婚の場合のみ
- `endAge`: シミュレーション終了年齢 (歳)
- `retirementAge`: 本人の退職予定年齢 (歳)
- `pensionStartAge`: 年金受給開始年齢 (歳)
- `emergencyFundJPY`: 生活防衛資金 (円)

## 2. 収入 (Income)

- `mainJobIncomeGross`: 本人の本業の年間総収入 (円)
- `sideJobIncomeGross`: 本人の副業の年間総収入 (円)
- `spouseMainJobIncomeGross`: 配偶者の本業の年間総収入 (円) ※既婚の場合のみ
- `spouseSideJobIncomeGross`: 配偶者の副業の年間総収入 (円) ※既婚の場合のみ
- `incomeGrowthRate`: 本人の収入増加率 (年率)
- `spouseIncomeGrowthRate`: 配偶者の収入増加率 (年率) ※既婚の場合のみ

## 3. 支出 (Expenses)

- `expenseMode`: 支出の入力モード (`simple` または `detailed`)
- `livingCostSimpleAnnual`: 年間生活費 (円) ※簡単入力モードの場合
- `detailedFixedAnnual`: 年間固定費 (円) ※詳細入力モードの場合
- `detailedVariableAnnual`: 年間変動費 (円) ※詳細入力モードの場合
- `postRetirementLiving10kJPY`: 退職後の生活費 (万円/月)

## 4. ライフイベント (Life Events)

### 4.1. 自動車 (Car)

- `car.priceJPY`: 購入する車の価格 (円)
- `car.firstAfterYears`: 初回の買い替えまでの年数 (年)
- `car.frequencyYears`: 買い替え頻度 (年)
- `car.loan.use`: ローンを利用するかどうか (boolean)
- `car.loan.years`: ローン年数 (年)
- `car.loan.type`: ローンの種類 (`銀行ローン` | `ディーラーローン`)
- `car.currentLoan`: 現在の自動車ローン情報
    - `monthlyPaymentJPY`: 毎月の返済額 (円)
    - `remainingMonths`: 残り支払い回数 (ヶ月)

### 4.2. 住居 (Housing)

- `housing.type`: 住居タイプ (`賃貸` | `持ち家（ローン中）` | `持ち家（完済）`)
- `housing.rentMonthlyJPY`: 月々の家賃 (円) ※賃貸の場合
- `housing.currentLoan`: 現在の住宅ローン情報 ※持ち家（ローン中）の場合
    - `monthlyPaymentJPY`: 毎月の返済額 (円)
    - `remainingYears`: 残りの返済年数 (年)
- `housing.purchasePlan`: 将来の住宅購入計画
    - `age`: 購入予定年齢 (歳)
    - `priceJPY`: 物件価格 (円)
    - `downPaymentJPY`: 頭金 (円)
    - `years`: ローン年数 (年)
    - `rate`: 金利 (年率)
- `housing.renovations`: リフォーム計画 (配列)
    - `age`: 実施予定年齢 (歳)
    - `costJPY`: 費用 (円)
    - `cycleYears`: 繰り返し頻度 (年)

### 4.3. 結婚 (Marriage)

- `marriage.age`: 結婚予定年齢 (歳)
- `marriage.engagementJPY`: 婚約関連費用 (円)
- `marriage.weddingJPY`: 結婚式費用 (円)
- `marriage.honeymoonJPY`: 新婚旅行費用 (円)
- `marriage.movingJPY`: 新居への引っ越し費用 (円)

### 4.4. 子供 (Children)

- `children.count`: 子供の人数 (人)
- `children.firstBornAge`: 第一子が生まれる予定年齢 (歳)
- `children.educationPattern`: 教育費パターン (`公立中心` | `公私混合` | `私立中心`)

### 4.5. 家電 (Appliances)

- `appliances`: 家電の買い替え計画 (配列)
    - `name`: 家電名
    - `cycleYears`: 買い替えサイクル (年)
    - `firstAfterYears`: 初回買い替えまでの年数 (年)
    - `cost10kJPY`: 費用 (万円)

### 4.6. 親の介護 (Parental Care)

- `care.assume`: 介護が発生すると想定するかどうか (boolean)
- `care.parentCurrentAge`: 親の現在の年齢 (歳)
- `care.parentCareStartAge`: 親の要介護開始年齢 (歳)
- `care.years`: 介護期間 (年)
- `care.monthly10kJPY`: 月々の介護費用 (万円)

## 5. 年金 (Pension)

- `pensionMonthly10kJPY`: 年金受給額 (万円/月)

## 6. 貯蓄と投資 (Savings & Investments)

### 6.1. 貯蓄 (Savings)

- `currentSavingsJPY`: 現在の預貯金総額 (円)
- `monthlySavingsJPY`: 毎月の貯蓄額 (円)

### 6.2. 投資 (Investments)

- `products`: 投資商品の詳細 (配列)
    - `key`: 商品キー (`stocks`, `trust`, `bonds`, `crypto`, `other`, `ideco`)
    - `account`: 口座種別 (`課税`, `非課税`, `iDeCo`)
    - `currentJPY`: 現在の評価額 (円)
    - `recurringJPY`: 年間積立額 (円)
    - `spotJPY`: 年間スポット購入額 (円)
    - `expectedReturn`: 期待リターン (年率)
- `interestScenario`: 利回りシナリオ (`固定利回り` | `ランダム変動`)
- `stressTest.enabled`: ストレステストを有効にするか (boolean)
- `stressTest.seed`: ストレステストのシード値
