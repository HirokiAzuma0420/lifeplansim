# シミュレーション計算ロジック（api/simulate/index.ts）

本書は `api/simulate/index.ts` に実装されている年次シミュレーションの各項目の計算ロジックをまとめたものです。数式の詳細は実装を優先し、分岐条件・上限処理を含めて要点を記載します。

## 前提・定数
- 税率（特定口座の売却時想定）: `SPECIFIC_ACCOUNT_TAX_RATE = 0.20315`（api/simulate/index.ts:16）
- 新NISA 生涯拠出上限の目安: `NISA_CONTRIBUTION_CAP = 18_000_000`（api/simulate/index.ts:17）
- 新NISA 年間上限（参考）
  - つみたて枠相当: `NISA_RECURRING_ANNUAL_CAP = 1_200_000`
  - 成長投資枠相当: `NISA_SPOT_ANNUAL_CAP = 2_400_000`
- 乱数・リターン生成
  - 乱数: Mulberry32 + Box-Muller で標準化し、資産ごとに `sigma` を適用（api/simulate/index.ts:372-403）
  - 使用資産とボラティリティ: `ASSET_SIGMA`（国内米国株0.20、外国株ファンド0.18、先進国債券0.04、BTC0.70 など）
  - 期待リターン `mu` は `expectedReturn` を [-1, 1] にクリップ
  - ストレステスト有効時は年ごとの資産リターンの等ウェイト平均を使用

## ユーティリティ関数
- 年間実効手取りの概算: `computeNetAnnual(grossAnnualIncome)`（api/simulate/index.ts:215）
  - サラリーマン控除（段階的）、社会保険料15%、基礎控除48万円を差し引き、所得税（超過累進）+住民税（10%+5千円）を控除した値。
- ローン年額の計算: `calculateLoanPayment(principal, annualRatePercent, years)`（api/simulate/index.ts:198）
  - 月利 = 年利/12、返済回数 = 年数*12、元利均等の月額を算出し×12で年額化。年利0%時は本体/年数。

## 年次ループの流れ（概観）
1. 年齢・年（i 年目）に応じて収入・支出・投資・資産更新を順番に計算
2. 投資拠出は NISA 上限と退職年齢以降の停止ルールを適用
3. キャッシュ残高が緊急予備資金を下回る場合、課税口座→NISA の順に取り崩し
4. 年次のスナップショット（YearlyData）を配列に追加

## 各項目の算出ロジック

- 収入 `income`（api/simulate/index.ts:457 近辺）
  - 本人: `mainJobIncomeGross*(1+incomeGrowthRate)^i + sideJobIncomeGross`
  - 配偶者: `spouseMainJobIncomeGross*(1+spouseIncomeGrowthRate)^i + spouseSideJobIncomeGross`
  - 退職年齢以上では本人・配偶者ともに総収入=0。
  - 実収入は両者の総収入に対して `computeNetAnnual` を適用して合算。

- 生活費 `livingExpense`（api/simulate/index.ts:469-482）
  - `expenseMode === 'simple'` の場合: `livingCostSimpleAnnual` を採用（年額）
  - `expenseMode === 'detailed'` の場合: `detailedFixedAnnual + detailedVariableAnnual`
  - 退職年齢以上では `livingExpense=0` に置換（下記の退職後費用を別途計上）

- 退職後費用 `retirementExpense`（api/simulate/index.ts:484-492）
  - 退職年齢以上: `max(0, postRetirementLiving10kJPY*10000*12 - 年金年額)`
  - 年金年額 = `currentAge>=pensionStartAge ? pensionMonthly10kJPY*10000*12 : 0`

- 子ども教育費 `childExpense`（api/simulate/index.ts:502-519）
  - 子どもの誕生年齢: `firstBornAge + 3*c`（3年間隔）
  - 子年齢が0〜21歳の各年に発生し、教育パターン別に以下を年額で加算
    - 公立中心: 10,000,000 / 22
    - 公私混在: 16,000,000 / 22
    - 私立中心: 20,000,000 / 22

- 介護費 `careExpense`（api/simulate/index.ts:521-529）
  - `assume` が真かつ必要項目が揃っている場合、
    - 親年齢 = `parentCurrentAge + i`
    - 親年齢が `[parentCareStartAge, parentCareStartAge + years)` の期間は `monthly10kJPY*10000*12` を年額で計上

- 結婚費 `marriageExpense`（api/simulate/index.ts:531-535）
  - 対象年（`currentAge === marriage.age`）に、`engagement + wedding + honeymoon + moving` を一括計上

- 家電買い替え `applianceExpense`（api/simulate/index.ts:537-549）
  - 有効データのみ抽出（名称あり/費用>0/サイクル>0）
  - 初回年齢: `initialAge + firstAfterYears`
  - `diff=0`（初回）または `diff % cycleYears === 0` の年に `cost10kJPY*10000` を加算

- 車関連 `carExpense`（api/simulate/index.ts:551-574, 576-597）
  - 既存ローン: `monthlyPaymentJPY` を「残回数がある限り」今年分（月最大12）のみ年額へ加算
  - 今後の買い替え
    - 基準年齢: `base = initialAge + firstAfterYears`
    - `base` 以降、`frequencyYears` ごとにイベント発生
    - ローン購入の場合
      - 年利（目安）: 銀行1.5%、ディーラー4.5%、その他2.5%
      - 年額返済 = `calculateLoanPayment(priceJPY, 年利％, years)`
      - 返済年齢期間 `[eventAge, eventAge+years)` に毎年加算
    - 現金購入の場合
      - `currentAge === eventAge` の年に車両価格を一括計上

- 住居関連 `housingExpense`（api/simulate/index.ts:599-647 近辺）
  - 現在ローン: `i < remainingYears` の間、`monthlyPaymentJPY*12` を加算
  - 購入計画が進行中 `[age, age+years)`
    - 初年度に頭金 `downPaymentJPY` を一括
    - 毎年、ローン元本 = `priceJPY - downPaymentJPY` に対して `calculateLoanPayment(元本, 年利％, years)` を加算
  - リフォーム: `age` に達し、かつ `cycleYears` があればその周期で `costJPY` を都度加算
  - レント（保険的な扱い）: 購入予定が開始されておらず、現在ローンもなく、`rentMonthlyJPY` が設定されている場合に `rentMonthlyJPY*12` を加算

- 合計支出 `totalExpense`（api/simulate/index.ts:667-675）
  - `livingExpense + childExpense + careExpense + (carRecurring+carOneOff) + housingExpense + marriageExpense + applianceExpense + retirementExpense`

- 投資と資産
  - 年次リターン `currentReturn`（api/simulate/index.ts:600-605）
    - 通常: `mu`
    - 乱高下相場かつストレステスト有効: 各資産のリターンの等ウェイト平均
  - 年間拠出（退職年齢以上は全て0）
    - 課税: `baseAnnualTaxableRecurring + baseAnnualTaxableSpot`
    - NISA: それぞれ年間上限でクリップし、かつ生涯上限の残余枠に対し「つみたて→スポット」の順に適用（api/simulate/index.ts:612-632）
  - 残高更新（年末時点）
    - 課税口座: `investedPrincipal = investedPrincipal*(1+currentReturn) + taxableContribution`
    - NISA: `nisa = nisa*(1+currentReturn) + nisaContribution`
  - キャッシュフローと貯蓄 `savings`（api/simulate/index.ts:636-646）
    - 年間貯蓄: 退職前は `monthlySavingsJPY*12`、退職後は0
    - 現金増減: `cashFlow = income - totalExpense - totalInvestmentOutflow + annualSavings`
    - `savings += cashFlow`
  - 緊急予備資金（取り崩し）（api/simulate/index.ts:647-665）
    - `savings < emergencyFundJPY` の場合、まず課税口座から税引後で充当
      - 税引後最大: `investedPrincipal*(1 - SPECIFIC_ACCOUNT_TAX_RATE)`
      - 必要総額（税引前）: `net / (1 - 税率)` を売却として元本から控除
    - なお不足分があれば NISA から取り崩し
  - 総資産 `totalAssets`（api/simulate/index.ts:669-675）
    - `savings + nisa + ideco + investedPrincipal`（`ideco` は 0 として固定）
  - アロケーション `assetAllocation`
    - cash = `savings` / investment = `investedPrincipal` / nisa = `nisa` / ideco = `ideco`

- 出力 `YearlyData`（api/simulate/index.ts:673-697）
  - 各数値は `Math.round` で丸めて格納
  - `medicalExpense` と `longTermCareExpense` は現状 0（対象外）

## 注意点・仕様メモ
- 子どもは3年間隔で誕生する想定（教育費の同時期重複を表現）
- 住居の現在ローン加算は型分岐の都合で似た処理が2か所にあり、条件が重なる入力では二重計上の可能性があるため入力設計で回避する前提
- iDeCo は現状シミュレーション対象外（常に 0）
- 期待リターン `mu` は入力値を [-1, 1] に丸めて使用
- NISA拠出は「つみたて→スポット」の順で生涯上限枠に適用

---
このドキュメントは実装（api/simulate/index.ts）に忠実に要約したものです。仕様変更時は実装差分に合わせて本書を更新してください。
