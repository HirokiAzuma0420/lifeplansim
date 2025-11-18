# FormPage.tsx / useFormState UI/UX テスト報告書

前提: 本ドキュメントは UTF-8（BOM なし）、改行コードは LF を前提とする。  
本報告書は、`FormPage.tsx` および `useFormState.ts` を起点とした UI/UX 挙動のテストとして、
入力値が正常に受け付けられ、`createApiParams` によって `SimulationInputParams` へ正しく変換されているか、
また `useFormState` のバリデーションロジック・合計値計算・確認画面表示が仕様どおり動作しているかを  
Vitest によって確認した結果をまとめたものである。

- テスト計画書:
  - `blueprint/form_page_uiux_test_plan.md`
- API 側のテスト報告書:
  - `blueprint/simulation-api/03_test_report.md`

---

## 1. 実行したテスト

### 1.1 TC-FORM-100: 入力値の正常受付と API パラメータ変換

- 対象テストファイル:
  - `src/test/uiux/form_input_to_params.test.tsx`

- テスト概要:
  - `useFormState` をテスト用コンポーネントから呼び出し、正常系フォーム入力（独身・年齢・年収・生活費・貯蓄・生活防衛資金・昇給率）を再現する。
  - その `formData` を `createApiParams` に渡し、生成された `SimulationInputParams` の主要フィールド（年収・生活費・貯蓄など）が単位変換（万円→円）も含めて正しいことを確認する。

### 1.2 TC-FORM-101: 詳細生活費モードと annual の整合

- 対象テストファイル:
  - `src/test/uiux/form_input_to_params.test.tsx`

- テスト概要:
  - `expenseMethod = '詳細'` として、詳細固定費・詳細変動費・車コストを月額（円）で入力する。
  - `useFormState` が計算する `totalExpenses`（詳細固定費＋詳細変動費の月額合計）と、
    `createApiParams` が計算する `detailedFixedAnnual` / `detailedVariableAnnual` の関係を検証する。

### 1.3 TC-FORM-110: 結婚・住宅・介護ライフイベントの変換

- 対象テストファイル:
  - `src/test/uiux/form_input_to_params.test.tsx`

- テスト概要:
  - 結婚・住宅購入・子ども・親の介護といったライフイベントをフォームから入力し、
    `createApiParams` が `SimulationInputParams` に対して正しい構造と金額でマッピングしているかを確認する。

### 1.4 TC-FORM-002: セクション別バリデーションロジック

- 対象テストファイル:
  - `src/test/hooks/useFormState.validation.test.tsx`

- テスト概要:
  - `useFormState` を `MemoryRouter` でラップし、`renderHook` から呼び出す。
  - `effectiveSections` と `validateSection` を用いて、各セクションごとに
    「必須入力不足で `false`」「最低限の入力を満たすと `true`」になることを確認する。
  - 対象セクション:
    - FAMILY / INCOME / EXPENSE / CAR / HOUSING / MARRIAGE / CHILDREN /
      LIVING / PARENT_CARE / RETIREMENT_PLAN / RETIREMENT_INCOME /
      SAVINGS / INVESTMENT / SIMULATION_SETTINGS

### 1.5 TC-FORM-020: 詳細生活費入力と合計額の表示

- 対象テストファイル:
  - `src/test/hooks/useFormState.expenseTotal.test.tsx`
  - `src/test/components/FormPage.expenseFloatingBox.test.tsx`

- テスト概要:
  - フック側:
    - `expenseMethod = '詳細'` の状態で詳細固定費・詳細変動費に金額を入力し、
      `totalExpenses` が「詳細固定費の合計＋詳細変動費の合計」と一致することを検証する。
  - コンポーネント側:
    - `useFormState` をモックし、`totalExpenses = 123456` を返すようにして `FormPage` をレンダリングし、
      フローティングボックス「生活費総額」に `123,456円` が表示されていることを確認する。

### 1.6 TC-FORM-022: 確認画面のイベントタイムライン・イベントカード表示

- 対象テストファイル:
  - `src/test/components/FormPage.confirmationEvents.test.tsx`

- テスト概要:
  - `useFormState` をモックし、`createDefaultFormData` をベースに結婚・車・住宅のライフイベントを上書きした `formData` を返す。
  - 入力ステップの最後のボタン（確認ボタン）を押して `isCompleted=true` にし、確認画面を表示させたうえで、
    結婚・自動車・住宅購入のイベント年齢・費用カードが期待どおりに表示されているかを検証する。

---

## 2. テスト結果と検証観点

### 2.1 収入関連フィールドの変換（TC-FORM-100）

- 検証ポイント:
  - 本人・配偶者の年収が「万円」単位の文字列から「円」単位の数値に正しく変換されていること。
  - 昇給率（パーセント表記）が 0〜1 の実数として解釈されていること。

- 具体的な確認:
  - `mainJobIncomeGross = 600 * YEN_PER_MAN` であること。
  - `sideJobIncomeGross = 50 * YEN_PER_MAN` であること。
  - 独身シナリオのため、`spouseMainJobIncomeGross` と `spouseSideJobIncomeGross` が 0 であること。
  - `annualRaiseRate = '1.5'` から算出される `incomeGrowthRate` が `0.015` であること。

### 2.2 生活費関連フィールドの変換（TC-FORM-100）

- 検証ポイント:
  - 簡単モードで入力した生活費（`livingCostSimple`）が、月額（円）から年額（円）に正しく変換されていること。

- 具体的な確認:
  - `livingCostSimple = '250000'` のとき、`livingCostSimpleAnnual = 250000 * MONTHS_PER_YEAR` であること。

### 2.3 貯蓄・生活防衛資金の変換（TC-FORM-100）

- 検証ポイント:
  - 現在の貯蓄と生活防衛資金が「万円」単位の文字列から「円」単位の数値に正しく変換されていること。

- 具体的な確認:
  - `currentSavings = '800'` のとき、`currentSavingsJPY = 800 * YEN_PER_MAN` であること。
  - `emergencyFund = '300'` のとき、`emergencyFundJPY = 300 * YEN_PER_MAN` であること。

### 2.4 詳細生活費モードと annual の整合（TC-FORM-101）

- 検証ポイント:
  - `totalExpenses` と `detailedFixedAnnual` / `detailedVariableAnnual` の関係が設計どおりか。

- 具体的な確認:
  - `totalExpenses` は「詳細固定費＋詳細変動費」の月額合計であり、車コストは含まれないこと。
  - `detailedFixedAnnual + detailedVariableAnnual` が  
    `totalExpenses * MONTHS_PER_YEAR + 車コスト（月換算） * MONTHS_PER_YEAR`  
    になっていることを確認した。

### 2.5 結婚・住宅・介護ライフイベントの変換（TC-FORM-110）

- 検証ポイント:
  - ライフイベント入力が `SimulationInputParams` の各フィールドに正しくマッピングされているか。

- 具体的な確認:
  - 結婚:
    - `marriage.age`・`marriage.spouse.ageAtMarriage` がフォーム入力と一致していること。
    - `marriage.spouse.incomeGross` と `marriage.spouse.customIncomeJPY` が「カスタム収入（万円）× YEN_PER_MAN」であること。
    - `marriage.newLivingCostAnnual`・`marriage.newHousingCostAnnual` が結婚後の月額入力 × `MONTHS_PER_YEAR` であること。
  - 住宅購入プラン:
    - `housing.purchasePlan` が定義され、`age`・`priceJPY`・`downPaymentJPY`・`years`・`rate` がフォーム入力から正しく変換されていること。
  - 子ども:
    - `children.count`・`children.firstBornAge`・`children.educationPattern` がフォーム入力と一致していること。
  - 親の介護:
    - `cares` 配列に 1 件のプランがあり、`parentCurrentAge`・`parentCareStartAge`・`years`・`monthly10kJPY` がフォーム入力と一致していること。

### 2.6 セクション別バリデーションロジック（TC-FORM-002）

- 検証ポイント:
  - 各セクションに対し、必須入力が不足しているときに `validateSection` が `false` を返し、
    最低限の入力を満たしたときに `true` を返すこと。
  - 条件付きフィールドを持つセクションで、制御フラグの ON/OFF に応じて
    `validateSection` の対象フィールドと結果が切り替わること。

- 具体的な確認（例）:
  - INCOME:
    - 独身: `personAge` と `mainIncome` のみで通過し、配偶者フィールドは未入力でもよい。
    - 既婚: `spouseAge`・`spouseMainIncome` が未入力のままでは `validateSection` が `false`。
  - EXPENSE:
    - `expenseMethod` 未選択は `false`。
    - `expenseMethod = '簡単'` かつ `livingCostSimple > 0` で `true`。
    - `expenseMethod = '詳細'` で一部の詳細費目（例: `utilitiesCost`・`communicationCost`）が空のままだと `false`。
  - CAR:
    - `carCurrentLoanInPayment = 'no'`・`carPurchasePlan = 'no'` で `true`。
    - `carPurchasePlan = 'yes'` かつ `carPrice`・`carLoanUsage`・`carLoanYears` が不足していると `false`。
  - HOUSING:
    - `housePurchaseIntent = 'no'` で `true`。
    - `housePurchaseIntent = 'yes'` で `housePurchasePlan.age` が空だと `false`、妥当な値を入れると `true`。
  - CHILDREN / PARENT_CARE:
    - 有無が「はい」の場合にのみ、人数・年齢・教育パターンや介護プランが必須になり、
      未入力だと `false` になることを確認。
  - SIMULATION_SETTINGS:
    - デフォルト（ランダム変動）では `true`。
    - `interestRateScenario = '固定利回り'` かつ `fixedInterestRate` が空の場合は `false`。

### 2.7 詳細生活費入力と合計額の表示（TC-FORM-020）

- 検証ポイント:
  - `expenseMethod = '詳細'` の場合に、詳細固定費・詳細変動費・車コストの月額入力が `totalExpenses` に正しく集計されていること。
  - `FormPage.tsx` のフローティングボックス「生活費総額」に表示される金額が `totalExpenses` の値と一致していること。

- 具体的な確認:
  - `src/test/hooks/useFormState.expenseTotal.test.tsx` で、詳細モードの各費目（円単位の固定費・変動費）に値を入力し、`totalExpenses` が「詳細固定費の合計＋詳細変動費の合計」と一致することを確認した。
  - `src/test/components/FormPage.expenseFloatingBox.test.tsx` で `useFormState` をモックし、`totalExpenses = 123456` を返すようにして `FormPage` を描画し、画面上のフローティングボックスに「生活費総額: 123,456円」と表示されていることを確認した。これにより `FormPage` が `totalExpenses` の値をそのまま月額として表示していることを検証した。

### 2.8 確認画面のイベントタイムライン・イベントカード表示（TC-FORM-022）

- 検証ポイント:
  - 結婚・自動車・住宅購入など複数のライフイベントを設定したとき、確認画面のタイムラインに年齢順でイベントカードが表示されること。
  - 結婚イベントの費用や住居・車関連のイベントが、`FormPage.tsx` 内の集計ロジック（`totalMarriageCost` など）と整合した金額で表示されていること。

- 具体的な確認:
  - `src/test/components/FormPage.confirmationEvents.test.tsx` にて、`createDefaultFormData` をベースに代表的なライフイベント（結婚・車・住宅）を上書きした `formData` を返すように `useFormState` をモックした。
  - 入力ステップの最後のボタン（確認ボタン）をクリックして確認画面を表示し、次を確認した。
    - タイムライン上に `32歳`（結婚）、`35歳`（自動車の買い替え）、`45歳`（住宅購入）の各イベント年齢が表示されていること。
    - 結婚イベントの費用として `totalMarriageCost = 321000` をモックし、「321,000円」相当の金額が結婚関連のカード内に少なくとも 1 箇所表示されていること。

---

## 3. 実行結果のまとめ

- `src/test/uiux/form_input_to_params.test.tsx` に含まれる TC-FORM-100 / 101 / 110 は、
  直近の再実行で **1 ファイル / 3 テストすべて Vitest でパス** している。
- `src/test/hooks/useFormState.validation.test.tsx` による TC-FORM-002 では、
  全セクションに対して代表パターンで `validateSection` の挙動を確認し、Vitest 実行もパスしている。
- `src/test/hooks/useFormState.expenseTotal.test.tsx` および
  `src/test/components/FormPage.expenseFloatingBox.test.tsx` による TC-FORM-020 では、
  詳細生活費入力の合計値とフローティングボックス表示の整合性を検証し、想定どおりの結果が得られた。
- `src/test/components/FormPage.confirmationEvents.test.tsx` による TC-FORM-022 では、
  代表的なライフイベントが確認画面のタイムラインにカードとして表示され、金額も期待どおりであることを確認した。
- 既存の TypeScript エラーや文字化けは解消され、Vitest がテストを収集・実行できる状態になっている。

---
