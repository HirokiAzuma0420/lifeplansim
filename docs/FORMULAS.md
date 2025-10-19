# 計算式一覧（変数名：日本語併記）

このファイルは、本プロジェクトで使用される計算式をファイル単位で整理したものです。数式内の変数は原名（コード上の英語名）を保持し、日本語名を括弧で併記します。将来的にこのファイルを「計算式全体を修正するためのプロンプト」として使えるよう、変数名→日本語名の対応を先頭にまとめています。

注意:
- 同様の計算が UI（FormPage）側と API 側の両方に実装されている箇所は重複を明記しています。
- 行番号は固定ではありません。式の構造と意味を一次情報として参照してください。

## 変数名→日本語名 対応表（共通）

- initialAge: 開始年齢
- endAge: 終了年齢
- retirementAge: 退職年齢
- pensionStartAge: 年金開始年齢
- age: 年齢
- year: 暦年

- mainJobIncomeGross: 本業額面年収
- sideJobIncomeGross: 副業額面年収
- spouseMainJobIncomeGross: 配偶者本業額面年収
- spouseSideJobIncomeGross: 配偶者副業額面年収
- income: 個人額面年収（その年）
- salaryIncomeDeduction: 給与所得控除額
- socialInsurancePremium: 社会保険料
- basicDeduction: 基礎控除額
- taxableIncome: 課税所得
- incomeTax: 所得税
- residentTax: 住民税
- netAnnualIncome: 手取り年収

- principal: 元金（借入額）
- annualInterestRate: 年利（%）
- monthlyInterestRate: 月利（小数）
- totalMonths: 返済回数（月数）
- monthlyPayment: 毎月返済額
- annualPayment: 年間返済額
- totalPayment: 総返済額
- priceJPY: 物件価格（円）
- downPaymentJPY: 頭金（円）
- years: 返済年数
- rate: 年利（%）

- expectedReturn: 期待リターン（小数）
- mu: 期待リターン（小数）
- sigma: 標準偏差
- z: 標準正規乱数
- r: 年次リターン（小数）
- T: 期間年数
- assetReturns: 資産別年次リターン配列
- currentReturn: 当年の想定リターン

- investedPrincipal: 課税口座残高（元本相当推移）
- nisa: NISA残高
- cumulativeNisaContribution: NISA累計拠出額
- remainingNisaAllowance: NISA残枠
- nisaRecurringThisYear: NISA年積立額（定期）
- nisaSpotThisYear: NISA年スポット額
- appliedNisaRecurring / appliedNisaSpot: NISA適用額
- taxableRecurringThisYear / taxableSpotThisYear: 課税口座の年積立・スポット
- combinedContribution: 年間投資総額

- annualSavings: 年間貯蓄（給与由来の現金増分）
- cashFlow: 年間キャッシュフロー
- savings: 現金預貯金残高
- totalAssets: 総資産

- livingExpense: 生活費
- housingExpense: 住居費
- carExpense: 車両費
- applianceExpense: 家電費
- childExpense: 子ども費用
- marriageExpense: 結婚関連費
- careExpense: 介護費
- retirementExpense: 老後不足費
- totalExpense: 年間総支出

- postRetirementLiving10kJPY: 老後生活費（万円/月）
- pensionMonthly10kJPY: 年金（万円/月）
- postRetirementLivingAnnual: 老後生活費（円/年）
- pensionAnnual: 年金（円/年）

- monthlyRecurringInvestment: 月次投資積立合計（円/月）
- yearlyRecurringInvestmentJPY: 年間投資積立合計（円/年）
- yearlySpotJPY: 年間スポット投資合計（円/年）
- totalInvestmentRate: 投資期待利回り平均（%）
- progress: 入力進捗率（%）
- emergencyFundJPY: 生活防衛資金目標（円）
- drawFromNisa: NISA取り崩し額（円）

- SPECIFIC_ACCOUNT_TAX_RATE: 特定口座税率
- NISA_CONTRIBUTION_CAP: NISA生涯投資上限
- n(v): 数値変換ヘルパー

使い方（プロンプト配慮）
- コード変数名は原文を保持し、日本語名はカッコ併記で提示します（例: principal（元金））。
- 後続の計算式修正プロンプトでは、この対応表を参照して日本語で指示しつつ、原変数名を併記してください。

## api/simulate/index.ts

- 疑似乱数（mulberry32）
  - t 更新: `t = Math.imul(t ^ (t >>> 15), t | 1)` → `t ^= t + Math.imul(t ^ (t >>> 7), t | 61)`
  - 0–1 乱数: `((t ^ (t >>> 14)) >>> 0) / 4294967296`

- 標準正規乱数（Box–Muller）
  - `Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)`

- 標準化（平均0・標準偏差1）
  - 平均: `m = xs.reduce((a, b) => a + b, 0) / n（件数）`
  - 標準偏差: `s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1`
  - 標準化: `zs = xs.map(z => (z - m) / s)`

- 住宅・車ローン年額（元利均等・年額に変換）
  - 月利: `monthlyInterestRate（月利） = annualInterestRate（年利%） / 100 / 12`
  - 返済月数: `totalMonths（返済月数） = years（年） * 12`
  - 金利0の特例: `principal（元金） / years（年）`
  - 毎月返済: `monthlyPayment（毎月返済額） = principal * r * (1 + r)^{n} / ((1 + r)^{n} - 1)`（`r = monthlyInterestRate`, `n = totalMonths`）
  - 年額: `monthlyPayment * 12`

- 手取り年収（computeNetAnnual）
  - 給与所得控除（簡易版）: `income（額面）` の区分計算（表参照）
  - 社会保険料（簡略一律）: `socialInsurancePremium（社会保険料） = income * 0.15`
  - 基礎控除: `basicDeduction = 480,000`
  - 課税所得: `taxableIncome = max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction)`
  - 所得税（速算表相当）: 区分・控除額で計算
  - 住民税（簡略）: `residentTax = taxableIncome * 0.1 + 5,000`
  - 手取り: `netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax`（0未満切上げ）

- 期待リターンのクリッピング・シナリオ
  - `mu（期待リターン） = Math.max(-1, Math.min(1, expectedReturn))`
  - 期間: `T（期間年数） = (endAge - initialAge) + 1`
  - 資産ごとの期間リターン: `r（年次リターン） = mu + sigma * z` を `mu ± 3*sigma` にクリップ
  - ランダム時の等ウェイト合成: `currentReturn（当年リターン） = average(assetReturns[k][i])`

- 収入の成長・合算
  - 本人: `selfGrossIncome（本人額面） = mainJobIncomeGross * (1 + incomeGrowthRate)^i + sideJobIncomeGross`
  - 配偶者: `spouseGrossIncome（配偶者額面） = (spouseMainJobIncomeGross ?? 0) * (1 + (spouseIncomeGrowthRate ?? 0))^i + (spouseSideJobIncomeGross ?? 0)`
  - 世帯手取り年収: `annualIncome（世帯手取り） = computeNetAnnual(selfGrossIncome) + computeNetAnnual(spouseGrossIncome)`

- 生活費・年金・老後費
  - 老後生活費/年: `postRetirementLivingAnnual = postRetirementLiving10kJPY * 10000 * 12`
  - 年金/年: `pensionAnnual = (currentAge >= pensionStartAge ? pensionMonthly10kJPY * 10000 * 12 : 0)`
  - 老後不足分: `retirementExpense = Math.max(0, postRetirementLivingAnnual - pensionAnnual)`

- NISA 上限適用・課税/非課税の積立
  - NISA残枠: `remainingNisaAllowance = max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution)`
  - NISA適用（定期/スポット）: `appliedNisaRecurring = min(nisaRecurringThisYear, remainingNisaAllowance)`、`appliedNisaSpot = min(nisaSpotThisYear, remainingNisaAllowance)`
  - 年間投資: `taxableContribution = max(0, taxableRecurringThisYear + taxableSpotThisYear)`、`nisaContribution = max(0, appliedNisaRecurring + appliedNisaSpot)`、`combinedContribution = taxableContribution + nisaContribution`

- 投資残高の推移（課税口座・NISA）
  - 課税口座: `investedPrincipal（課税残高） = investedPrincipal * (1 + currentReturn) + taxableContribution`
  - NISA: `nisa（NISA残高） = nisa * (1 + currentReturn) + nisaContribution`

- キャッシュフローと貯蓄の更新
  - 年間貯蓄: `annualSavings = (currentAge < retirementAge) ? monthlySavingsJPY * 12 : 0`
  - 年間CF: `cashFlow = annualIncome - totalExpense - combinedContribution + annualSavings`
  - 現金残高: `savings += cashFlow`

- 生活防衛資金の取り崩し（課税→NISA の順）
  - 不足額: `remainingShortfall = emergencyFundJPY - savings`
  - 課税枠の純額上限: `maxNetFromTaxable = investedPrincipal * (1 - SPECIFIC_ACCOUNT_TAX_RATE（特定口座税率）)`
  - 取り崩し純額: `netFromTaxable = min(remainingShortfall, maxNetFromTaxable)`
  - 必要総額: `grossRequired = netFromTaxable / (1 - SPECIFIC_ACCOUNT_TAX_RATE)`
  - 更新: `investedPrincipal = max(0, investedPrincipal - grossRequired)`／`savings += netFromTaxable`
  - NISA から: `drawFromNisa（NISA取崩） = min(remainingShortfall, nisa)` → `nisa -= drawFromNisa; savings += drawFromNisa`

- 総資産
  - `totalAssets（総資産） = savings + nisa + ideco + investedPrincipal`

## src/pages/FormPage.tsx

UI 入力を API 用パラメータに変換するための計算、および簡易プレビュー用の計算が含まれます。多くが API 側と対応（重複）しています。以降の式も原変数名（日本語名）を併記します。

- 手取り年収（computeNetAnnual）…API と同一のロジック（重複）
  - 給与所得控除の区分計算、社会保険料の簡易係数、課税所得、所得税、住民税、手取りの算出（上記参照）

- 金額・単位変換・集計
  - 所得（万円→円）: `mainJobIncomeGross（本業額面） = n(mainIncome) * 10000`（配偶者・副業も同様）
  - 固定費（月→年）: `detailedFixedAnnual（固定費/年） = (monthlyFixedExpense + monthlyCarExpense) * 12`
  - 変動費（月→年）: `detailedVariableAnnual（変動費/年） = monthlyVariableExpense * 12`
  - 投資現在高（万円合算→円）: `currentInvestmentsJPY（投資現在高） = (…合計…) * 10000`
  - 月積立合計→年額: `yearlyRecurringInvestmentJPY（年積立） = monthlyRecurringInvestment * 12`
  - 年間スポット合計: `yearlySpotJPY（年スポット） = …合計…`
  - 口座別振分（NISA/課税）: `nisaCurrentHoldingsJPY（NISA現保有）`, `taxableCurrentHoldingsJPY（課税現保有）`, `nisaRecurringAnnualJPY（NISA年積立）`, `taxableRecurringAnnualJPY（課税年積立）`, `nisaSpotAnnualJPY（NISA年スポット）`, `taxableSpotAnnualJPY（課税年スポット）`
  - 期待リターン（%→小数）: `incomeGrowthRate（昇給率） = annualRaiseRate / 100`、`expectedReturn（期待リターン） = totalInvestmentRate / 100`
  - 生活費簡易入力（月→年）: `livingCostSimpleAnnual（簡易生活費/年） = livingCostSimple * 12`

- ローン見積（関数 calculateLoanPayment）
  - `monthlyInterestRate（月利） = annualInterestRate（年利%） / 100 / 12`
  - `totalMonths（返済月数） = years（年） * 12`
  - 金利0: `annualPayment（年間返済） = principal（元金） / years`
  - `monthlyPayment（毎月返済） = principal * r * (1 + r)^{n} / ((1 + r)^{n} - 1)`
  - `annualPayment = monthlyPayment * 12`
  - `totalPayment（総返済） = annualPayment * years`
  - 丸め: `Math.ceil(x / 1000) * 1000`

- 車ローン合計（概算・UI プレビュー）
  - `interestRate（月利） = annualRate（年利） / 12`, `months（返済月数） = years * 12`
  - `monthly（毎月返済） = principal * r * (1 + r)^{n} / ((1 + r)^{n} - 1)`
  - `total（総返済） = monthly * months`、`Math.ceil(total)`

- 既存住宅ローンの年額・総額（UI プレビュー）
  - `annualPayment（年間返済） = Math.ceil(loanMonthlyPayment * 12 / 1000) * 1000`
  - `totalPayment（総返済） = Math.ceil(annualPayment * loanRemainingYears / 1000) * 1000`

- 老後の月次差額（UI プレビュー）
  - `totalRetirementMonthly（老後差額/月） = postRetirementLivingCost - pensionAmount`

- 入力ウィザード進捗率
  - `progress（進捗率%） = ((currentSectionIndex + 1) / effectiveSections.length) * 100`

## src/pages/JsonTestPage.tsx

JSON 入力から API への変換時に使用。

- 月積立の集計と年額化
  - `monthlyRecurringInvestment（月積立合計） = Object.values(…monthlyInvestmentAmounts…).reduce((acc, v) => acc + toNum(v), 0)`
  - `yearlyRecurringInvestmentJPY（年積立） = monthlyRecurringInvestment * 12`

- 年間スポットの集計
  - `yearlySpotJPY（年スポット） = (…)reduce((acc, v) => acc + toNum(v), 0)`

- 投資現在高の単位変換
  - `stocksCurrentYen（株式現保有） = toNum(investmentStocksCurrent) * 10000`（他資産も同様）

- 期待リターン（% 配列の平均 → 小数）
  - `expectedReturn（期待リターン） = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100`

- 住宅・車の入力正規化・単位変換（一部）
  - 住宅価格・頭金（万円→円）: `priceJPY（価格） = toNum(price) * 10000`, `downPaymentJPY（頭金） = toNum(downPayment) * 10000`
  - 金利（%想定）: `rate（年利%） = toNum(interestRate)`（% を前提、API での扱いに注意）

## その他

- 定数・パラメータ
  - `SPECIFIC_ACCOUNT_TAX_RATE = 0.20315`（特定口座の税率）
  - `NISA_CONTRIBUTION_CAP = 18_000_000`（NISA 生涯投資上限）

### 追記: NISA 年間上限の適用

- 年間上限（先に適用し、その後に生涯残枠で制限）
  - つみたて投資枠（定期）: `min(baseAnnualNisaRecurring, 1,200,000)` 円/年
  - 成長投資枠（スポット）: `min(baseAnnualNisaSpot, 2,400,000)` 円/年
- 上記で年額をクリップした後、`remainingNisaAllowance = max(0, NISA_CONTRIBUTION_CAP - cumulativeNisaContribution)` を用いて、
  - `appliedNisaRecurring = min(nisaRecurringThisYear, remainingNisaAllowance)` → 残枠減算 →
  - `appliedNisaSpot = min(nisaSpotThisYear, remainingNisaAllowance)` の順で適用します。
 - 退職年齢に到達した年以降は、`nisaRecurringThisYear = 0` および `nisaSpotThisYear = 0`（拠出停止）。
 - 生涯拠出枠 `cumulativeNisaContribution >= NISA_CONTRIBUTION_CAP` 到達後も、同様に `nisaRecurringThisYear = 0`, `nisaSpotThisYear = 0`。

— 以上 —
