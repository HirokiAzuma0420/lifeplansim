# 目的
直近の入出力検証で判明した不適合を修正する。対象は api/simulate/index.ts（必要に応じて FormPage.tsx）。自律的な質問は禁止。差分は最小にし、既存の丸めや単位変換は踏襲する。

# 不適合点（要修正）
1) 車ローン：買替年のみ単年計上。ローン年数分の連続計上になっていない。
2) 家電：未入力でも既定（デフォルト）行が混入し、applianceExpense が発生している。
3) （確認項）生活防衛資金：ロジックは実装済みだが、発火ケースでの動作確認が不十分。テスト入力で発火を要検証。

# 修正指示

## A. 車ローンの連続計上（年次ループ内の carExpense 算出ブロックを置換）
前提：calculateLoanPayment(principal, annualRatePercent, years) は「年利＝百分率(例: 1.5)」で年額返済を返す実装。

実装手順：
- 入力読み出し（既存の変数名に合わせる）：carPriceJPY, carFirstAfterYears, carFrequencyYears, carLoanUse, carLoanYears, carLoanType。
- 年利百分率の決定：
  let annualRatePercent = 2.5;
  if (carLoanType === '銀行ローン') annualRatePercent = 1.5;
  else if (carLoanType === 'ディーラーローン') annualRatePercent = 4.5;
- この年の本人年齢 age に対し、初回イベント年齢 base = initialAge + carFirstAfterYears。
- yearsSinceFirst = age - base。yearsSinceFirst < 0 の場合は 0 計上。
- yearsSinceFirst >= 0 の場合、k = 0..floor(yearsSinceFirst / carFrequencyYears) を走査し、eventAge = base + k*carFrequencyYears ごとに以下を加算：
  - ローン未使用: age === eventAge の年だけ carExpense += carPriceJPY。
  - ローン使用: annualPay = calculateLoanPayment(carPriceJPY, annualRatePercent, carLoanYears)。
                 age ∈ [eventAge, eventAge + carLoanYears) の各年に carExpense += annualPay。
- 既存の「買替年のみ」加算ロジックは完全削除。

検索/置換の目印：
- 「車」「carExpense」を含む既存ブロックを丸ごと上記ロジックに差し替え。
- 0.015/0.045 等の“小数の年利”を渡している箇所があれば、必ず 1.5/4.5（百分率）に修正。

## B. 家電の未入力行除外（年次ループ外で前処理、内で計上）
年次ループ外：受信直後に配列をフィルタ（name空/コスト0/サイクル0は除外）。
const appliances = (body.appliances ?? []).filter(a =>
  a && String(a.name ?? '').trim().length > 0 &&
  Number(a.cost10kJPY) > 0 &&
  Number(a.cycleYears) > 0
);

年次ループ内：applianceExpense の算出は「初回＋周期」のみ。
let applianceExpense = 0;
for (const a of appliances) {
  const firstAge = initialAge + Number(a.firstAfterYears ?? 0);
  if (age >= firstAge) {
    const diff = age - firstAge;
    if (diff === 0 || (Number(a.cycleYears) > 0 && diff % Number(a.cycleYears) === 0)) {
      applianceExpense += Number(a.cost10kJPY) * 10000;
    }
  }
}

（任意・推奨：FormPage.tsx 側でも送信前に「name 空 or cost=0 or cycle=0」の行は送らないようにする。）

## C. 生活防衛資金の発火確認（コード変更不要、テスト必須）
- 既存の年末補填ロジック：
  if (emergencyFundJPY > 0 && savings < emergencyFundJPY) {
    const shortfall = emergencyFundJPY - savings;
    const draw = Math.min(shortfall, investedPrincipal);
    investedPrincipal -= draw;
    savings += draw;
  }
- 検証用に初期貯蓄を小さく/一時支出を大きくしたテスト入力を用意し、少なくとも1年で savings < emergencyFundJPY を発生させ、補填後に savings ≥ emergencyFundJPY かつ investedPrincipal が減っていることを確認。

# 受入基準（テスト観点）
- 車：初回 N 年後・ローン L 年の場合、初回年から L 年連続で carExpense が同額計上される。次の買替が到来すれば並行して合算される。ローン未使用時はイベント年のみ一括。
- 家電：入力が空/無効のみなら全年度 applianceExpense=0。入力が有効な場合、初回年とサイクル年にのみ計上。
- 生活防衛資金：発火ケースで savings が閾値まで補填され、負値にならない。investedPrincipal が取り崩される。

# 注意
- 単位：万円→円は ×10000、月額→年額は ×12。重複・欠落がないこと。
- 丸め：返却直前の各科目・合計に Math.round を適用（既存方針に合わせる）。
- 他の仕様（額面→手取り換算、子ども22年、介護、老後差額、住宅購入ローン・頭金、投資計上、防衛資金ロジック）は変更しない。
