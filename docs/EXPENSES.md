# 支出計算ロジックまとめ（セクション別 + API 連携）

このドキュメントは、フォームで入力した支出項目がどのように年次支出へ計算され、最終的に `/api/simulate` でどのように扱われるかをセクション別に整理したものです。UI 側の月額→年額変換や単位（万円/円）変換、API 側での合算・年次イベント化の双方を記載します。

- 参考: 一覧的な数式は `docs/FORMULAS.md` も参照


**前提（用語・単位）**
- 月額入力は UI 側で原則「年額（円/年）」に変換して API へ渡す。
- `10,000円単位（万円）`入力は UI 側で`×10,000`して円にし、必要に応じて`×12`で年額化。
- API は毎年のループ内で、各費目を合算して `totalExpense`（年間総支出）を算出する。


**入力→API の主な単位変換（UI 側）**
- 簡易生活費（`livingCostSimple`）: 月→年（`×12`）として `livingCostSimpleAnnual` に設定
  - `src/pages/FormPage.tsx:324`, `src/pages/FormPage.tsx:430`
- 詳細・固定費: 光熱/通信/保険/教育/その他（いずれも月）+ 車（月・万円→円）を合算し、年額化
  - `detailedFixedAnnual = (monthlyFixedExpense + monthlyCarExpense) * 12`（`monthlyCarExpense = carCost[万円] × 10000`）
  - `src/pages/FormPage.tsx:235`
- 詳細・変動費（月合計）を年額化
  - `detailedVariableAnnual = monthlyVariableExpense * 12`
  - `src/pages/FormPage.tsx:245`
- 車の既存ローン（月額・残月）をそのまま API へ
  - `currentLoan: { monthlyPaymentJPY, remainingMonths }`
  - `src/pages/FormPage.tsx:337`
- 住宅の賃貸・現ローン・購入計画・リフォーム計画
  - `rentMonthlyJPY` は円/月、現ローンは `monthlyPaymentJPY` 円/月と `remainingYears` 年、購入は価格・頭金（いずれも万円→円）、金利（%）・年数
  - リフォームは `costJPY` を万円→円
  - 変換例は JSON テスタでも同様（`src/pages/JsonTestPage.tsx` 内の変換参照）


**セクション別の年次支出の計算（API 側）**

- 生活費（簡易/詳細）
  - 簡単モード: `livingExpense = livingCostSimpleAnnual`
    - `api/simulate/index.ts:432`
  - 詳細モード: `livingExpense = detailedFixedAnnual + detailedVariableAnnual`
    - `api/simulate/index.ts:434`
  - 退職年齢以降は生活費を `0` にし、老後生活費の不足分を別枠で計上（後述）
    - `api/simulate/index.ts:439`（retirement 分岐の開始）

- 子育て（教育費）
  - 第1子の誕生年齢 = `firstBornAge`、以降は3歳刻みで `count` 人分を想定
  - 子年齢が 0〜21 歳の期間、教育パターン別の年間費を加算（合算）
    - 公立ベース: `10,000,000 / 22` 円/年
    - 私立混合:   `16,000,000 / 22` 円/年
    - 私立ベース: `20,000,000 / 22` 円/年
    - 加算行: `api/simulate/index.ts:459`

- 介護
  - 条件を満たす期間のみ、`monthly10kJPY × 10000 × 12` を年額で計上
    - `api/simulate/index.ts:468`

- 結婚
  - 該当年のみ、`engagement + wedding + honeymoon + moving` を一括計上
    - `api/simulate/index.ts:474`

- 家電
  - 各家電について「初回からの経過年が 0 または 周期年数の倍数」の年に `cost10kJPY × 10000` を一括計上
    - `api/simulate/index.ts:485`

- 車
  - 既存ローン: 残月が尽きるまで、当年分の `monthly × min(12, 残月)` を年額の「継続費」に加算
  - 買い替えイベント: 初回年齢 = `initialAge + firstAfterYears`、以降 `frequencyYears` ごと
    - ローン利用あり: 金利タイプに応じた年利を用い、`calculateLoanPayment` で「年額返済」を算出し、ローン年数の期間だけ「継続費」に加算
    - ローン利用なし: イベント該当年に「一時費」として車両価格を一括計上
  - API 出力では `carExpense = carRecurring + carOneOff` としてまとめて返却
    - 出力: `api/simulate/index.ts:679`

- 住宅
  - 現ローン（`currentLoan`）: 残年数のあいだ `monthlyPaymentJPY × 12` を年額計上
    - `api/simulate/index.ts:529`, `api/simulate/index.ts:535`
  - 購入計画（`purchasePlan`）: 開始年に頭金を一括、以降は `calculateLoanPayment(価格-頭金, 金利%, 返済年数)` を年額で計上
    - 頭金: `api/simulate/index.ts:540`
    - 年額返済: `api/simulate/index.ts:543`
  - リフォーム（`renovations`）: 指定年齢かつ周期年数の倍数の年に `costJPY` を一括計上
  - 賃貸（`rentMonthlyJPY`）: 「購入期間中でなく、現ローンもない年」に限り `×12` を年額計上（重複防止）
    - `api/simulate/index.ts:563`

- 老後生活費の不足分（退職以降）
  - 退職年齢以降、生活費は `0` にし、`retirementExpense = max(0, 老後生活費年額 - 年金年額)` を別枠で計上
    - `api/simulate/index.ts:443`


**年間総支出（合算）と API 出力**
- 年間総支出 `totalExpense` は以下の合計
  - `livingExpense + childExpense + careExpense + (carRecurring + carOneOff) + housingExpense + marriageExpense + applianceExpense + retirementExpense`
  - 合算行: `api/simulate/index.ts:585`
- 年次レコードとして返却される主な費目
  - `livingExpense, housingExpense, carExpense, applianceExpense, childExpense, marriageExpense, careExpense, retirementExpense, totalExpense` など
  - `api/simulate/index.ts:671` 以降の `yearlyData.push({...})` ブロック参照


**注意点（ダブルカウント防止・モード間の整合）**
- 詳細モードの固定費に車の「月次維持費」を含める一方、API 側では車の「買い替え/ローン返済」を別枠で加算します。
  - そのため「維持費（ガソリン/駐車場/税/保険など）」は詳細固定費として、買い替えやローン返済は車セクション側で計上され、`carExpense` として返ります。
- 賃貸は「現ローン/購入期間」の年には加算しないことで、住宅費の二重計上を避けています（`api/simulate/index.ts:563`）。
- 退職以降は `livingExpense=0` とし、老後の不足分を `retirementExpense` に切り出して合算しています。


**関連ファイル（主要な参照）**
- 入力→API 変換（単位/年額化）
  - `src/pages/FormPage.tsx:235`（詳細・固定費の年額化）
  - `src/pages/FormPage.tsx:245`（詳細・変動費の年額化）
  - `src/pages/FormPage.tsx:324`, `src/pages/FormPage.tsx:430`（簡単モードの年額化）
  - `src/pages/FormPage.tsx:337`（車の既存ローン入力）
- 年次ロジックと出力
  - `api/simulate/index.ts:432`（生活費の分岐）
  - `api/simulate/index.ts:443`（老後不足費の算出）
  - `api/simulate/index.ts:459`（子育て費の加算）
  - `api/simulate/index.ts:468`（介護費の加算）
  - `api/simulate/index.ts:474`（結婚費の一括計上）
  - `api/simulate/index.ts:485`（家電費の一括計上）
  - `api/simulate/index.ts:529`, `api/simulate/index.ts:535`（現住宅ローン年額化）
  - `api/simulate/index.ts:540`, `api/simulate/index.ts:543`（頭金・購入ローン年額）
  - `api/simulate/index.ts:563`（賃貸の年額化：重複防止）
  - `api/simulate/index.ts:585`（年間総支出の合算）
  - `api/simulate/index.ts:679`（`carExpense` の出力）


以上。これに沿って入力→API→年次出力の流れをたどると、各セクションの支出がどのように年次計上され、`totalExpense` に合算されるかを確認できます。
