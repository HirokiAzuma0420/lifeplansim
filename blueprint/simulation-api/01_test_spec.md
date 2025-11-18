# /api/simulate 年次シミュレーション API テスト仕様書

前提: 文字コード UTF-8（BOM なし）、改行コード LF。

本ドキュメントは、`api/simulate/index.ts` が `blueprint` 配下の仕様（`requirements_specification.md`, `form_based_simulation_conditions.md`, `simulation_logic_from_form.md`, `simulation_logic_fixes.md` など）を満たしているかを確認するためのテスト観点と代表テストケースを整理したものである。

テストコードは原則として `src/test/api/simulate/` 配下に配置する。

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
3. レスポンス形式  
   - 正常時 200 で `{ yearlyData: YearlyData[] }` が返ること。
   - `yearlyData.length === endAge - initialAge + 1` であること。

### 3.2 期間・年齢とループ制御

1. ループ範囲  
   - `initialAge` から `endAge` まで、両端を含めて 1 歳刻みでループしていること。
2. 年次と暦年  
   - `year` が `baseYear` から 1 ずつ増加していること。
3. 初年度の月数補正  
   - 初年度のみ、残り月数に応じた `yearFraction` が生活費・ローン返済などに反映されること。

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
   - 退職金やその他一時金がある場合は該当年にのみ計上されること。

### 3.4 支出計算（ライフイベント含む）

1. 生活費  
   - `expenseMode = 'simple'` の場合、`livingCostSimpleAnnual` が生活費として反映されること。  
   - `expenseMode = 'detailed'` の場合、`detailedFixedAnnual + detailedVariableAnnual` が生活費として反映されること。
2. 老後生活費  
   - `currentAge >= retirementAge` の期間では、`postRetirementLiving10kJPY` を基準とした老後生活費が反映されること。
3. 子ども関連支出  
   - 子どもの年齢と教育パターンに応じて `getAnnualChildCost` の結果が反映されること。
4. 介護費用  
   - `CarePlan` に基づき、介護対象者の年齢が介護開始年齢〜終了年齢の間にある期間のみ介護費用が計上されること。
5. 結婚イベント  
   - 結婚年に婚約・挙式・新婚旅行・引っ越し費用が一時支出として計上されること。  
   - 結婚後の生活費・住居費が設定されている場合、それに切り替わること。
6. 自動車・家電・住居・リフォーム  
   - 自動車: 初回購入年・買い替え周期に応じて購入費用・ローン返済が計上されること。  
   - 家電: サイクル年数に応じた再購入が計上されること。  
   - 住宅: 賃貸・持ち家・住宅ローン・リフォーム費用が仕様どおり反映されること。

### 3.5 投資・リターン・NISA / iDeCo

1. 初期残高  
   - 各 `products.currentJPY` が、`principal` と `balance` の初期値として反映されること。
2. 黒字時の投資拠出  
   - 生活防衛資金を超える現金がある場合にのみ、積立・スポット投資が行われること。
3. NISA / iDeCo 枠  
   - NISA: 年間枠・生涯枠・夫婦合算枠（`useSpouseNisa`）が反映されること。  
   - iDeCo: 拠出上限年齢まで拠出・控除が行われ、受け取り年齢で一括受取が現金化されること。
4. リターン反映  
   - 固定利回り: `expectedReturn` に基づき年次リターンが計算されること。  
   - ランダム変動: `generateReturnSeries` により前もって生成された系列が適用されること。

### 3.6 赤字補填・税制・NISA 枠再利用

1. キャッシュフロー計算  
   - `手取り収入＋年金＋一時収入−総支出` が正しく計算されていること。
2. 生活防衛資金の維持  
   - キャッシュフロー反映後に `savings < emergencyFundJPY` となる場合にのみ、赤字補填ロジックが実行されること。
3. 売却順序  
   - 課税口座 → NISA 口座の順で取り崩しが行われること。
4. 課税  
   - 課税口座の売却利益に対して `SPECIFIC_ACCOUNT_TAX_RATE` が適用されること。  
   - 退職金一時金に対して退職所得控除・税率が仕様どおり適用されること。
5. NISA 枠再利用  
   - NISA 売却時に売却元本分が「翌年復活する NISA 枠」としてカウントされること。

### 3.7 YearlyData 整合性

1. 配列長と年齢  
   - `yearlyData.length === endAge - initialAge + 1` であり、`age` が `initialAge` から 1 ずつ増加していること。
2. 収入・支出合計  
   - `income` が `incomeDetail` の合計と近似的に一致していること。  
   - `expense` が `expenseDetail` の合計と一致していること。
3. 資産合計  
   - `totalAssets = savings + taxable.balance + nisa.balance + ideco.balance` が成立していること。
4. 資産配分  
   - `assetAllocation` が `savings`・各口座残高に整合していること。

### 3.8 プロパティテスト（資産保存則）

プロパティテストの詳細は、別途 `blueprint/simulation-api/02_conservation_plan.md` に記載し、
テストコードとしては `src/test/api/simulate/property_random.test.ts` に実装する。

- TC-PROP-001: 簡略収支恒等式の安全性チェック。  
- TC-PROP-002: 固定利回り・単純ケースでの保存則検証。  
- TC-PROP-003: ランダム変動＋赤字補填ありでの保存則検証。

---

## 4. 代表テストケース一覧

ここでは、上記観点をカバーする代表的なテストケースを列挙する。
実際のテストコードではここに挙げたケースを最小セットとしつつ、必要に応じて境界値テストを追加する。

### 4.1 HTTP / I/F 周り

- **TC-HTTP-001: `POST /api/simulate` 正常系**
  - 条件:
    - 有効な `SimulationInputParams` を持つリクエストボディ。
  - 期待結果:
    - ステータス 200。
    - `yearlyData` が年齢範囲分の長さで返る。

- **TC-HTTP-002: メソッド不正（GET など）**
  - 条件:
    - `GET /api/simulate`。
  - 期待結果:
    - ステータス 405。

### 4.2 期間・年齢

- **TC-PERIOD-001: 単年シミュレーション**
  - 条件:
    - `initialAge === endAge`。
  - 期待結果:
    - `yearlyData.length === 1`。

- **TC-PERIOD-002: 退職年・年金開始年境界**
  - 条件:
    - 退職年と年金開始年が接しているケース（例: 60 歳退職・65 歳年金開始）。
  - 期待結果:
    - 退職前年までは給与収入が入り、退職後年金開始前は老後生活費のみが出る。

### 4.3 収入・退職・年金

- **TC-INCOME-001: 定常給与のみ**
  - 条件:
    - 本人のみ給与収入あり、配偶者なし。
  - 期待結果:
    - 退職年まで毎年同じ水準の手取り収入が計上される。

- **TC-INCOME-002: 本人＋配偶者の給与＋年金**
  - 条件:
    - 結婚イベント後に配偶者収入が追加され、両者とも年金開始年に年金が加わる。
  - 期待結果:
    - 年金開始年に `incomeDetail.publicPension` が増加する。

### 4.4 支出・ライフイベント

- **TC-EXP-001: 簡易モード生活費**
  - 条件:
    - `expenseMode = 'simple'`、他のイベントなし。
  - 期待結果:
    - 毎年の `expenseDetail.living` が `livingCostSimpleAnnual` に相当する値になる。

- **TC-EXP-002〜: 各ライフイベント別の詳細検証**
  - 条件:
    - 車、住居、結婚、子ども、家電、介護など、それぞれ 1 つのイベントにフォーカスしたシナリオ。
  - 期待結果:
    - 「発生年」「発生頻度」「金額」が仕様通り `expenseDetail` に反映される。

### 4.5 投資・リターン・NISA / iDeCo

- **TC-INV-001: 固定利回り・単一商品**
  - 条件:
    - 単一の課税口座商品、固定利回り。
  - 期待結果:
    - 元本と評価額が幾何級数的に増加し、`investmentPrincipal` と `totalAssets` が整合する。

- **TC-INV-002: NISA / iDeCo の拠出と枠制御**
  - 条件:
    - NISA・iDeCo を組み合わせたケース。
  - 期待結果:
    - 年間枠・生涯枠・拠出上限年齢が仕様通りに適用される。

### 4.5.1 ランダムシナリオ・モンテカルロ関連

- **TC-RANDOM-001: runMonteCarloSimulation の破綻確率計算**
  - 条件:
    - `runMonteCarloSimulation(params, N)` を呼び出し、一部シナリオで `totalAssets <= 0` となるようにする。
  - 期待結果:
    - `summary.bankruptcyRate` が 0 より大きい値として返る。

### 4.6 赤字補填・税制・NISA 枠再利用

- **TC-DEFICIT-001: 赤字補填なし（常に黒字）**
  - 条件:
    - 十分な収入と低い支出。
  - 期待結果:
    - `debug.replenishmentTriggered` が常に `false`。

- **TC-DEFICIT-002〜005: 課税口座売却・NISA 売却・税額計算**
  - 条件:
    - 課税口座のみ、NISA のみ、混在など。
  - 期待結果:
    - 課税→NISA の順で補填され、税額・NISA 枠再利用が期待通りになる。

### 4.7 YearlyData 整合性

- **TC-YEARLY-001: 配列長と年齢**
  - 条件:
    - 任意の正常シナリオ。
  - 期待結果:
    - `yearlyData.length` と `age` の増加が仕様通り。

- **TC-YEARLY-API-001: ランダム変動＋結婚イベント年の YearlyData 厳密検証**
  - 条件:
    - ランダム利回り＋結婚イベントを含むケース。
  - 期待結果:
    - 結婚年の `incomeDetail` / `expenseDetail` / `totalAssets` が手計算の期待値と一致する。

---

## 5. プロパティテスト（TC-PROP 系）の位置づけ

- 詳細設計: `blueprint/simulation-api/02_conservation_plan.md`
- 実装: `src/test/api/simulate/property_random.test.ts`

- **TC-PROP-001**  
  - 役割: 簡略版の収支恒等式に対する安全性チェック（NaN / Infinity 検知）。
- **TC-PROP-002**  
  - 役割: 固定利回り・単純ケースでの資産保存則検証（誤差 2% 程度以内）。
- **TC-PROP-003**  
  - 役割: ランダム変動＋赤字補填ありケースでの資産保存則検証（誤差 5% 程度以内）。

---

## 6. 関連ドキュメント

- 資産保存則検証の詳細設計:  
  - `blueprint/simulation-api/02_conservation_plan.md`
- テスト実行結果・代表シナリオ要約:  
  - `blueprint/simulation-api/03_test_report.md`
