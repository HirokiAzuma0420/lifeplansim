# /api/simulate 年次シミュレーション API テスト仕様書

前提: 文字コード UTF-8（BOM なし）、改行コード LF。

本ドキュメントは、`api/simulate/index.ts` が `blueprint` 配下の仕様（`requirements_specification.md`, `form_based_simulation_conditions.md`, `simulation_logic_from_form.md`, `simulation_logic_fixes.md` など）を満たしているかを確認するためのテスト観点と代表テストケースを整理したものである。

---

## 1. 対象と目的

- 対象
  - Vercel Functions エンドポイント `POST /api/simulate`
  - 実装ファイル `api/simulate/index.ts`
  - 入力型 `SimulationInputParams`
  - 出力型 `YearlyData[]`
- 目的
  - `FormPage.tsx` から送信される `SimulationInputParams` に対し、仕様通りの年次シミュレーション結果 `yearlyData` を返却していることを検証する。
  - 特に、すべてのライフイベント（子ども・介護・結婚・家電・自動車・住居・リフォーム・老後生活費など）の計算式が仕様どおり動作していることをテストで担保する。
  - 将来のリファクタリングや仕様変更時に、挙動の劣化を自動テストで検知できるようにする。

---

## 2. テスト範囲と前提条件

### 2.1 テスト範囲

- HTTP / I/F
  - メソッド・パス・リクエストボディ・レスポンス形式。
- ドメインロジック
  - 年次ループ・年齢の進行・期間制御。
  - 収入計算（本人・配偶者の給与、副業、年金、一時収入）。
  - 支出計算（生活費、老後生活費、子ども、介護、結婚、家電、自動車、住居、リフォーム）。
  - 投資拠出・資産残高・評価額の成長。
  - NISA / iDeCo / 課税口座・税制・赤字補填・NISA 枠再利用。
  - 利回りシナリオ（固定利回り・ランダム変動）とリターン系列生成。
  - `YearlyData` の整合性・数値範囲。
- 異常系
  - 想定外メソッド／不正ペイロード時のステータスコードとエラー応答。

### 2.2 テスト前提条件・環境

- Node.js / Vite / TypeScript のバージョンは `package.json` / `tsconfig*.json` に従う。
- テストは原則としてローカル環境で `api/simulate/index.ts` を直接呼び出す。
  - ルートハンドラ関数を直接インポートしてユニットテストする想定（Vercel 実行環境には依存しない）。
- 疑似乱数
  - ランダムリターン（`generateReturnSeries`, `Math.random` 利用）を含むテストでは、再現性のために乱数をモックするか、固定系列を注入できる設計を前提にテストケースを定義する。
  - 現時点で `stressTest.seed` が未使用の場合は、その旨をコメントし、将来対応時のテスト観点として保持する。

---

## 3. テスト観点（高レベル）

### 3.1 HTTP / I/F レベル

1. メソッドチェック
   - `POST /api/simulate` 以外（`GET` など）のメソッドに対して 405 が返ること。
2. リクエスト形式
   - JSON ボディが `{ inputParams: SimulationInputParams }` であること。
   - 必須フィールド欠如時に 400 もしくは明示的なバリデーションエラーとなること。
3. レスポンス形式
   - 正常時 200 で `{ yearlyData: YearlyData[] }` が返ること。
   - `yearlyData.length === endAge - initialAge + 1` であること。

### 3.2 期間・年齢とループ制御

1. ループ範囲
   - `initialAge` から `endAge` まで、両端を含めて 1 歳刻みでループしていること。
2. 年次と暦年
   - `year` が `baseYear` から 1 ずつ増加していること。
3. 初年度の月数補正
   - 初年度のみ、残り月数に応じた `yearFraction`（残り月数 / 12）が生活費・ローン返済などの月ベース支出に反映されていること。

### 3.3 収入計算

1. 本人の給与収入
   - `currentAge < retirementAge` 期間中のみ、`mainJobIncomeGross + sideJobIncomeGross` に `incomeGrowthRate` を反映した年収が計上されること。
2. 配偶者の給与収入
   - 結婚前は配偶者収入が 0。
   - 結婚後かつ `spouseCurrentAge < spouseRetirementAge` の期間にのみ、設定された収入が計上されること。
3. 年金収入
   - 本人・配偶者それぞれの年齢が `pensionStartAge` / `spousePensionStartAge` に達した年から年金が加算されること。
4. 手取り変換
   - `computeNetAnnual` により、課税所得と iDeCo 控除を反映した手取り年収になっていること。
5. 一時収入
   - 退職金など一時収入がある場合は該当年にのみ計上されること。

### 3.4 支出計算（ライフイベント含む）

1. 生活費
   - `expenseMode = 'simple'` の場合、`livingCostSimpleAnnual` が生活費として反映されること。
   - `expenseMode = 'detailed'` の場合、`detailedFixedAnnual + detailedVariableAnnual` が生活費として反映されること。
   - `currentAge < retirementAge` の期間にのみ生活費が計上されること。
2. 老後生活費
   - `currentAge >= retirementAge` の年に、`postRetirementLiving10kJPY`（丁単位）から当年の年金総額を差し引いた不足分が支出として計上されること。
3. 子ども教育費
   - 子どもの年齢が教育対象年齢帯にある場合にのみ、`children.educationPattern` に応じた教育費が計上されること。
4. 介護費
   - 各 `CarePlan` について、親の年齢が `parentCareStartAge`〜`parentCareStartAge + years` の期間に該当する年にのみ介護費が計上されること。
5. 結婚費用
   - `marriage.age` の年にのみ、婚約・結婚式・新婚旅行・引っ越し費用が一括で支出として計上されること。
6. 家電買い替え費用
   - `appliances` の各要素について、`firstAfterYears` および `cycleYears` に基づき、該当年に `cost10kJPY`（丁単位）×1 万円が支出として計上されること。
7. 自動車費用
   - `car.currentLoan` がある場合、残り月数の範囲でローン返済が計上されること。
   - さらに将来の買い替え計画に基づき、現金購入／ローン購入のいずれの場合も、買い替え年およびローン期間に応じた支出が計上されること。
8. 住居費用
   - 賃貸時は家賃のみ、持ち家ローン中はローン返済のみ、完済後は住居費 0 となること。
   - 賃貸から持ち家購入への切り替え時、購入年に頭金が一括計上され、その後ローン期間に応じた返済額が計上されること。
9. リフォーム費用
   - `housing.renovations` に基づき、指定年・周期ごとにリフォーム費用が支出として計上されること。

### 3.5 投資・リターン・NISA / iDeCo

1. 初期残高
   - 各 `products.currentJPY` が、`principal` と `balance` の初期値として反映されていること。
2. 黒字時の投資拠出
   - 生活防衛資金 `emergencyFundJPY` を超える余剰キャッシュフローがある年のみ、`recurringJPY` / `spotJPY` が各商品に拠出されること。
3. NISA 拠出制限
   - 年間枠・生涯枠を超える拠出が行われないこと。
4. iDeCo 拠出制限
   - `IDECO_MAX_CONTRIBUTION_AGE` を超える年には iDeCo 拠出が行われないこと。
5. リターンの適用
   - 固定利回りシナリオでは、全期間で `expectedReturn` が適用されること。
   - ランダム変動シナリオでは、暴落イベントを含みつつ、算術平均リターンが目標値に一致するよう補正されていること。

### 3.6 赤字補填・税制・NISA 枠再利用

1. キャッシュフロー計算
   - `手取り収入＋投資からの流入−総支出` が正しく計算されていること。
2. 生活防衛資金の維持
   - キャッシュフロー反映後に `savings < emergencyFundJPY` となる場合のみ赤字補填ロジックが実行されること。
3. 売却順序
   - 課税口座 → NISA 口座の順に売却が行われること。
4. 課税
   - 課税口座の売却利益に対して `SPECIFIC_ACCOUNT_TAX_RATE` が適用されること。
5. NISA 枠再利用
   - NISA 口座から売却した元本分が翌年の NISA 投資枠として復活すること。

### 3.7 YearlyData 整合性

1. 配列長
   - `yearlyData.length === endAge - initialAge + 1`。
2. 年齢・年次
   - 各要素の `age` と `year` が連続して増加していること。
3. 金額
   - すべての金額フィールドが有限数値であり、NaN / Infinity を含まないこと。
4. 合計資産
   - `totalAssets` が現金と全投資口座残高の合計と一致していること。

### 3.8 異常系

1. メソッド不一致
   - `GET` などのメソッドでは 405 が返ること。
2. ボディ不正
   - 必須フィールド欠如時に 400 など明示的なエラーとなり、予期せぬ 500 は発生しないこと。

---

## 4. 代表テストケース一覧

ここでは、上記観点をカバーする代表的なテストケースを列挙する。実際のテストコードでは、ここに挙げたケースを最小セットとしつつ、必要に応じて境界値テストを追加する。

### 4.1 HTTP / I/F 周り

- TC-HTTP-001: `POST /api/simulate` 正常系
  - 条件:
    - 最小限の必須フィールドのみを設定した `SimulationInputParams` を送信。
  - 期待結果:
    - ステータス 200。
    - `yearlyData.length === endAge - initialAge + 1`。
- TC-HTTP-002: 不正メソッド
  - 条件:
    - `GET /api/simulate` を実行。
  - 期待結果:
    - ステータス 405。
    - JSON 形式のエラーメッセージ。

### 4.2 期間・年齢

- TC-PERIOD-001: 単年シミュレーション
  - 条件:
    - `initialAge === endAge`。
  - 期待結果:
    - `yearlyData.length === 1`。
    - `yearlyData[0].age === initialAge`。
- TC-PERIOD-002: 複数年シミュレーション
  - 条件:
    - `initialAge = 30, endAge = 35`。
  - 期待結果:
    - `yearlyData.length === 6`。
    - `age` が 30〜35 まで 1 ずつ増加。

### 4.3 収入・退職・年金

- TC-INCOME-001: 定常給与のみ
  - 条件:
    - `initialAge = 30, endAge = 32, retirementAge = 65`。
    - 本人の給与のみ（配偶者・年金なし）。
    - `incomeGrowthRate = 0`。
  - 期待結果:
    - 各年の `annualIncome` が同額。
    - 支出 0 の場合、`savings` が毎年一定額ずつ増加。
- TC-INCOME-002: 退職後に給与が停止し年金のみ
  - 条件:
    - `retirementAge = 60, pensionStartAge = 65`。
  - 期待結果:
    - 60〜64 歳は給与・年金とも 0。
    - 65 歳以降は年金のみが `annualIncome` として計上。

### 4.4 支出・ライフイベント

- TC-EXP-001: 簡易モード生活費
  - 条件:
    - `expenseMode = 'simple'`。
    - `livingCostSimpleAnnual` のみ設定（他の支出なし）。
  - 期待結果:
    - 退職前の各年に `totalExpense` が `livingCostSimpleAnnual` と一致。
- TC-EXP-002: 子ども教育費
  - 条件:
    - 子ども 1 人、`firstBornAge` と `educationPattern` を設定。
  - 期待結果:
    - 教育対象年齢に該当する年にのみ教育費が `totalExpense` に加算。
- TC-EXP-003: 結婚イベント
  - 条件:
    - `marriage.age = 32`。
    - `engagementJPY`, `weddingJPY`, `honeymoonJPY`, `movingJPY` を設定。
  - 期待結果:
    - 32 歳の年のみ合計額が `totalExpense` に一括計上。
- TC-EXP-004: 介護費
  - 条件:
    - `cares` に 1 件のみ設定し、親の現在年齢・介護開始年齢・介護期間をシミュレーション期間内に収まるように設定。
  - 期待結果:
    - 介護期間に該当する年にのみ、`monthly10kJPY` に基づく年間介護費が `totalExpense` に加算。
- TC-EXP-005: 家電買い替え
  - 条件:
    - `appliances` に 1 件のみ設定。
    - `firstAfterYears` と `cycleYears` を小さな値にして複数回買い替えが発生するように設定。
  - 期待結果:
    - 初回年齢および `cycleYears` ごとの年に、`cost10kJPY * 10_000` 相当が `totalExpense` に加算。
- TC-EXP-006: 自動車ローンと買い替え
  - 条件:
    - `car.currentLoan` に残り月数付きのローンを設定。
    - `car.priceJPY`, `firstAfterYears`, `frequencyYears`, `loan.use = true` を設定し、シミュレーション期間中に 1 回買い替えが起こるようにする。
  - 期待結果:
    - 残り月数がある間のみ `currentLoan.monthlyPaymentJPY` に応じた返済額が `totalExpense` に計上。
    - 買い替え年以降、ローン期間終了まで `calculateLoanPaymentShared` による年間返済額が `totalExpense` に計上。
- TC-EXP-007: 賃貸から持ち家購入への切り替え
  - 条件:
    - `housing.type = '賃貸'`, `rentMonthlyJPY` を設定。
    - `housing.purchasePlan` に購入年齢・物件価格・頭金・ローン年数・金利を設定。
  - 期待結果:
    - 購入前の年は家賃のみ `totalExpense` に計上。
    - 購入年には家賃に加えて頭金 `downPaymentJPY` が一括計上。
    - 購入年以降、ローン期間中は年間ローン返済額が `totalExpense` に計上。
- TC-EXP-008: リフォーム費用
  - 条件:
    - `housing.renovations` に 1 件以上設定し、シミュレーション期間内に複数回リフォームが発生するよう `age` と `cycleYears` を設定。
  - 期待結果:
    - 指定したリフォーム年および周期年にのみ `costJPY` が `totalExpense` に加算。
- TC-EXP-009: 老後生活費と年金差額
  - 条件:
    - `retirementAge`, `postRetirementLiving10kJPY`, 年金額（本人・配偶者）を設定。
  - 期待結果:
    - `currentAge >= retirementAge` の年について、老後生活費（丁単位換算額）から当年の年金合計を差し引いた不足分のみが `totalExpense` に計上。

### 4.5 投資・リターン・NISA / iDeCo

- TC-INV-001: 固定利回り・単一商品
  - 条件:
    - `interestScenario = '固定利回り'`。
    - 1 つの `products` に初期残高と毎年の積立額を設定。
    - 支出を抑え、毎年黒字になるように設定。
  - 期待結果:
    - `balance` が理論値（初期残高と拠出額に固定利回りを適用した値）に近い値で増加。
- TC-INV-002: ランダム変動・暴落確認（generateReturnSeries 単体）
  - 条件:
    - `generateReturnSeries(expectedReturn, volatility, years)` を、`Math.random` をモックした環境で呼び出す。
    - 正規乱数生成と暴落年決定に使う乱数系列を固定する（テストコード側で決め打ち）。
  - 期待結果:
    - 戻り値の配列長が `years` と一致する。
    - 少なくとも 1 回以上、30〜60% 程度のマイナスリターン（暴落）が含まれる。
    - 全期間の算術平均リターンが `expectedReturn` に近い値（許容誤差 ±2% 程度）に補正されている。
- TC-INV-003: NISA 生涯枠上限（ざっくり）
  - 条件:
    - NISA 口座に対して毎年大きな `recurringJPY` を設定し、長期シミュレーション。
    - 夫婦 NISA 利用パターン（`useSpouseNisa = true`）も別ケースで実施。
  - 期待結果:
    - 生涯積立額が各パターンの NISA 生涯枠上限を超えない。
- TC-INV-004: iDeCo 拠出上限年齢
  - 条件:
    - iDeCo 口座に拠出設定を行い、`IDECO_MAX_CONTRIBUTION_AGE` を跨ぐ期間をシミュレート。
    - 収入と生活費を調整して、毎年 iDeCo に一定額拠出されるようにする（黒字状態）。
  - 期待結果:
    - `age < IDECO_MAX_CONTRIBUTION_AGE` の年には iDeCo 元本 `ideco.principal` が増加している年が存在する。
    - `age >= IDECO_MAX_CONTRIBUTION_AGE` の年以降は、`ideco.principal` が新規拠出によって増加しない（差分 <= 0 である）。

### 4.5.1 ランダムシナリオ・モンテカルロ集計

- TC-RANDOM-001: runMonteCarloSimulation の破綻確率（bankruptcyRate）計算
  - 条件:
    - `runMonteCarloSimulation(params, N)` を呼び出すテストで、`runSimulation` をモックし、いくつかのシミュレーションで `totalAssets <= 0` となる YearlyData を含める。
  - 期待結果:
    - 戻り値 `summary.bankruptcyRate` が 0〜1 の範囲に収まり、NaN や Infinity にならない。
- TC-RANDOM-002: runMonteCarloSimulation の中央値シナリオ選択ロジック（基本検証）
  - 条件:
    - 実際の `runSimulation` を使って `runMonteCarloSimulation(params, N)` を実行し、`interestScenario = 'ランダム変動'` で複数パスを生成する。
  - 期待結果:
    - 戻り値 `yearlyData` が 1 本のシミュレーションパスとして妥当な長さを持ち、最終年の `totalAssets` と `savings` が有限数値（NaN/Infinity でない）になっている。

### 4.6 赤字補填・税制・NISA 枠再利用

- TC-DEFICIT-001: 赤字補填なし（常に黒字）
  - 条件:
    - 収入を十分に高く、支出と投資拠出を控えめに設定する。
  - 期待結果:
    - どの年も赤字補填ロジックが発動せず、投資残高が継続的に増加する。
- TC-DEFICIT-002: 課税口座売却のみで補填
  - 条件:
    - 課税口座にのみ投資残高を持たせる。
    - ある年に大きな支出イベントを発生させて赤字を作る。
  - 期待結果:
    - 課税口座のみが売却され、利益部分に税金が課される。
    - 売却後、`savings` が `emergencyFundJPY` に戻るか、それ以上の水準となる。
- TC-DEFICIT-003: NISA 枠再利用（NISA のみ保有）
  - 条件:
    - NISA 口座のみを利用し、ある年に大きな赤字を発生させて NISA 残高を売却する。
  - 期待結果:
    - 売却した元本相当額が翌年の NISA 拠出可能枠として復活し、その年の拠出に利用される。
- TC-DEFICIT-004: 課税＋NISA 混在・連続赤字補填
  - 条件:
    - 課税口座と NISA 口座の両方に十分な残高を持たせた初期状態とする。
    - 2〜3 年連続で大きな支出イベントを配置し、毎年赤字が発生するように設定する。
  - 期待結果:
    - 各年の赤字補填において、まず課税口座から売却され、課税口座残高が尽きた後に NISA 口座から売却される（年ごとに「課税 ⇒ NISA」の順で補填される）。
    - NISA 売却が発生した年の元本相当額が、翌年以降の NISA 拠出枠として復活し、実際に拠出で利用される。
- TC-DEFICIT-005: 課税口座の税額計算（単純ケースの厳密検証）
  - 条件:
    - 課税口座に 1 つだけ投資商品を持ち、`principal` と `balance` の差（含み益）が分かりやすい値になるように設定する。
    - `withdrawToCoverShortfall` を直接呼び出し、`shortfall` を小さめの値にして「口座全体を売り切らない」ケースを作る。
  - 期待結果:
    - 戻り値の `newSavings` が、元の `savings` に「売却額−税額」が加算された値と一致する。
    - 課税口座の商品ごとの `principal` と `balance` が、按分ロジックと `SPECIFIC_ACCOUNT_TAX_RATE` に基づく期待値（計算式通り）とほぼ一致する。
- TC-DEFICIT-006: NISA 元本売却と NISA 枠復活量の厳密検証
  - 条件:
    - NISA 口座に 1 つだけ投資商品を持ち、`principal === balance`（含み益なし）となるよう設定する。
    - `withdrawToCoverShortfall` を直接呼び出し、`shortfall` が NISA 残高の一部だけになるように設定する。
  - 期待結果:
    - 戻り値の `nisaRecycleAmount` が、売却された元本額と一致する。
    - 戻り値の `newProductBalances` における NISA 商品の `principal` の減少量が `nisaRecycleAmount` と一致する。

### 4.7 YearlyData 整合性

- TC-YEARLY-001: 配列長と年齢
  - 条件:
    - 任意の有効なパラメータ。
  - 期待結果:
    - `yearlyData.length` が年数と一致し、`age` と `year` が連続している。
- TC-YEARLY-002: 合計資産整合性
  - 条件:
    - 複数の投資商品を設定。
  - 期待結果:
    - 各年の `totalAssets` が現金と全投資口座残高の合計と一致。

### 4.7.1 API 総合テスト（ランダム変動＋ライフイベント）

- TC-YEARLY-API-001: ランダム変動＋結婚イベント年の yearlyData 厳密検証
  - 条件:
    - `interestScenario = 'ランダム変動'` とし、`generateReturnSeries` をテスト側でモックして全期間 5% のリターン系列を返す。
    - シミュレーション期間は 1 年（`initialAge = endAge = 35`）とし、その年を結婚イベント年とする（`marriage.age = 35`）。
    - 結婚に伴う生活費・住居費・結婚費を `marriage.newLivingCostAnnual`, `marriage.newHousingCostAnnual`, 各種 `marriage.*JPY` で設定する。
    - 投資商品として、課税口座に初期残高のみを持つ株式商品を 1 つ設定し、拠出額は 0（`recurringJPY = 0`, `spotJPY = 0`）とする。
    - 退職・年金・iDeCo・子ども・介護・家電など他のライフイベントは設定しない。
  - 期待結果:
    - `incomeDetail.self` が `computeNetAnnual(mainJobIncomeGross)` と yearFraction を掛けた値に近い（丸め後）値になっている。
    - `expenseDetail.living`, `expenseDetail.housing`, `expenseDetail.marriage` がそれぞれ `marriage.newLivingCostAnnual`, `marriage.newHousingCostAnnual`, 各種結婚費の合計（年次換算）に基づく値になっている。
    - `expenseDetail.children`, `expenseDetail.appliances`, `expenseDetail.care`, `expenseDetail.retirementGap` は 0。
    - `savings` が「初期貯蓄＋(income − expense)」に近い値（丸め後）になっている。
    - `nisa.balance` と `ideco.balance` が 0（当該ケースで非課税口座・iDeCo を使っていないため）。
    - `totalAssets` が `savings + taxable.balance + nisa.balance + ideco.balance` に一致し、`assetAllocation` の `cash`・`investment` がそれぞれ `savings`・`taxable.balance` と整合している。

---

## 4.8 境界条件テスト

### 4.8.1 退職年・年金開始年

- TC-BOUND-001: 退職年境界（退職前年・退職年・退職翌年）の給与停止
  - 条件:
    - `initialAge = 59`, `endAge = 61`, `retirementAge = 60`。
    - 本人の給与を一定額で設定し、年金は開始しない（`pensionStartAge` を十分大きく設定）。
  - 期待結果:
    - 59 歳までは `incomeDetail.self > 0`（給与収入あり）。
    - 60 歳以降は `incomeDetail.self === 0`（給与収入停止）。
- TC-BOUND-002: 年金開始年境界（開始前年・開始年・開始翌年）
  - 条件:
    - `initialAge = 64`, `endAge = 66`, `retirementAge = 60`。
    - `pensionStartAge = 65`, `pensionMonthly10kJPY` に正の値を設定。
  - 期待結果:
    - 64 歳までは `incomeDetail.publicPension === 0`。
    - 65 歳以降は `incomeDetail.publicPension > 0`。

### 4.8.2 NISA・iDeCo 境界

- TC-BOUND-003: NISA 生涯枠上限付近（principal の最大値検証）
  - 条件:
    - 非課税口座（NISA）に対し、大きな `recurringJPY` を設定し、長期間シミュレーション（`interestScenario = '固定利回り'`）。
  - 期待結果:
    - 各年の `nisa.principal` の最大値が `NISA_LIFETIME_CAP`（単身の場合）または `NISA_LIFETIME_CAP * NISA_COUPLE_MULTIPLIER`（夫婦利用の場合）の範囲内に収まる（ロジック上の終端年で生涯枠を超えない）。
- TC-BOUND-004: iDeCo 拠出可能年齢の上限付近
  - 条件:
    - `initialAge` を `IDECO_MAX_CONTRIBUTION_AGE - 5` 程度に設定し、`endAge` を `IDECO_MAX_CONTRIBUTION_AGE + 5` 程度に設定。
    - iDeCo 口座に対して毎年一定額を拠出できるよう、収入と生活費を調整し黒字状態を維持する。
  - 期待結果:
    - `age < IDECO_MAX_CONTRIBUTION_AGE` のいずれかの年で `ideco.principal` が増加している。
    - `age >= IDECO_MAX_CONTRIBUTION_AGE` の年以降は `ideco.principal` の増加が見られない（新規拠出が行われない）。

---

## 4.9 プロパティテスト的チェック

### 4.9.1 資産収支恒等式（近似）の検証

- TC-PROP-001: 「初期資産＋全収入−全支出≒最終資産＋取り崩し総額」の近似検証
  - 条件:
    - 複数のランダムシナリオについて `runSimulation` を呼び出すプロパティテスト風テストを実装する。
    - パラメータ生成:
      - `initialAge = 30`, `endAge = 60〜80` の範囲でランダムに設定。
      - 収入（給与・副業・年金）と生活費を乱数で設定しつつ、現実的な範囲（例: 0〜2,000 万円/年）に収める。
      - 投資商品（課税・NISA・iDeCo）も乱数で構成し、利回りは `expectedReturn` の範囲内で設定。
    - テスト側で `Math.random` をシード付き擬似乱数でモックし、テスト実行ごとにシミュレーションの乱数系列が再現可能になるようにする。
  - 期待結果:
    - 各シナリオについて以下の式が「おおむね」成り立つこと（丸め・内部ロジックの差異を考慮し、許容誤差を設ける）:
      - 初期資産: `initialAssets = currentSavingsJPY + Σ products.currentJPY`
      - 年次収入: `incomeTotalYear = yearly.income + yearly.incomeDetail.investment`
      - 年次支出: `expenseYear = yearly.expense`
      - 年次取り崩し: `withdrawYear = debug.savings_after_withdrawToCoverShortfall - debug.savings_before_withdrawToCoverShortfall`（赤字補填が発動した年のみ）
      - 左辺: `initialAssets + Σ incomeTotalYear − Σ expenseYear`
      - 右辺: `finalTotalAssets + Σ withdrawYear`（`finalTotalAssets = 最終年の yearlyData.totalAssets`）
    - 左辺と右辺の差分が、各シナリオで「総資産の数パーセント程度以下」の範囲に収まる（丸め・内部計算の影響を考慮した許容範囲内である）。

---

## 4.10 異常値・極端値テスト

### 4.10.1 超高所得・ほぼ無収入

- TC-EXTREME-001: 超高所得（極端に大きな収入）があってもクラッシュしない
  - 条件:
    - 本人・配偶者の年収を 1 億円以上に設定し、`initialAge = 30`, `endAge = 65` 程度の期間でシミュレーション。
    - ライフイベントや投資も適度に設定するが、極端な収入でも `Number` の範囲内に収まるよう調整。
  - 期待結果:
    - `runSimulation` が例外を投げずに完了し、`yearlyData` の各年について主要な数値フィールド（`income`, `expense`, `savings`, `totalAssets` など）が有限数値（NaN/Infinity ではない）になっている。
- TC-EXTREME-002: ほぼ無収入（極端に低い収入）でもクラッシュしない
  - 条件:
    - 本人・配偶者の年収を 0〜数十万円程度に設定し、生活費は一定額に設定（多くの年で赤字が発生する想定）。
    - 適度な初期資産・投資残高を設定し、赤字補填ロジックが頻繁に発動する状況を作る。
  - 期待結果:
    - `runSimulation` が例外を投げずに完了し、`yearlyData` において `totalAssets` が徐々に減少する一方で、NaN/Infinity が発生しない。

### 4.10.2 極端な利回り・超長寿

- TC-EXTREME-003: 極端な利回り（非常に高い expectedReturn）での挙動
  - 条件:
    - `interestScenario = 'ランダム変動'` を選択し、投資商品の `expectedReturn` に高い値（例: 50〜100%/年）を設定。
    - 複数の商品に分散投資し、30〜40 年程度の期間をシミュレート。
  - 期待結果:
    - 投資残高や `totalAssets` が大きく増減しても、`runSimulation` がクラッシュせず、`yearlyData` の数値が有限の範囲内に収まる。
- TC-EXTREME-004: 超長寿シナリオ（90 歳〜100 歳超までシミュレート）
  - 条件:
    - `initialAge = 20`, `endAge = 110` 程度の長期間でシミュレーション。
    - 収入・支出・投資は適度な値に設定し、現実的ではあるが長期にわたるシナリオを構成する。
  - 期待結果:
    - `yearlyData.length` が `endAge - initialAge + 1` に一致する（約 90 年分）。
    - 全期間で `yearlyData` の主要数値フィールドが有限数値であり、指数的に発散して Infinity になるような挙動がない。


---

## 5. 今後のテスト実装方針メモ

- 単体テスト
  - `generateReturnSeries` などの純粋関数は、乱数部分をモックすることで期待値を厳密に検証する。
  - NISA / iDeCo / 赤字補填など複雑なロジックは、パラメータを簡略化したユニットテストで境界条件を重点的に確認する。
- 統合テスト
  - `POST /api/simulate` を HTTP レベルで呼び出す統合テストを別途用意し、フロントエンドとの I/F 整合性を確認する。
- ランダム性への対応
  - 実装側で `Math.random` を差し替え可能なインターフェースに抽象化し、`stressTest.seed` を用いた再現性のあるテストを追加する。

---

## 6. ファイル作成・編集手順（シェルスクリプト例）

以下は、本テスト仕様書ファイル `blueprint/simulation_api_test_spec.md` を新規作成・更新する際の例示的な手順である（UTF-8（BOM なし）、LF 前提）。

```bash
#!/usr/bin/env bash
# テスト仕様書作成・更新用の例示スクリプト（コメントは日本語）
set -euo pipefail

cd "$(dirname "$0")/.."

# テスト仕様書ファイルをエディタで開く（必要に応じて編集）
${EDITOR:-code} "blueprint/simulation_api_test_spec.md"

# 文字コードと改行コードの簡易チェック
file -i "blueprint/simulation_api_test_spec.md"

# git ステータス確認
git status -sb
```
