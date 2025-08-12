# タスク
家電費用が「常に約2倍」で計上される現象を解消する。対象は api/simulate/index.ts（必要時のみ FormPage.tsx）。自律的な質問は禁止。最小差分で修正する。

# 現象の説明（検証事実）
- 2030年：掃除機 初回 2万円 → 出力 40,000（×2）
- 2033年：冷蔵15＋洗濯12＋エアコン10＋TV8＋レンジ3＝48万円 → 出力 960,000（×2）
- 2041年：同セットの2回目 15万円相当 → 出力 300,000（×2）
原因は、年次ループ内で家電配列を2回以上集計している、または未正規化の配列と正規化済み配列の両方を使って重複加算していること。

# 修正方針
1) 「受信直後の一回だけ」家電配列を正規化（無効行除外）し、以降はその単一配列のみを参照する。
2) 年次ループ内の家電加算ブロックは「1箇所だけ」に統一（初回＋周期）。他の家電関連の加算・forEach・map・reduce の重複を全削除。
3) totalExpense の合算は applianceExpense を「1回だけ」含める。
4) ログで年ごとの家電加算回数と合算値を確認できるように一時的な検証出力を入れる（開発時のみ）。

# 具体作業（機械的に適用）
A) 年次ループ外（正規化）に以下を1回だけ定義。以降、本配列 appliancesOnly を使用。body.appliances/raw の再参照は厳禁。
const appliancesOnly = Array.isArray(body.appliances)
  ? body.appliances.filter(a =>
      a && String(a.name ?? '').trim().length > 0 &&
      Number(a.cost10kJPY) > 0 &&
      Number(a.cycleYears) > 0
    )
  : [];

B) 年次ループ内の家電計上を次の1ブロックに統一。これ以外の家電加算コード（forEach / 2つ目のfor / 別名配列参照）は全削除。
let applianceExpense = 0;
for (const a of appliancesOnly) {
  const firstAge = initialAge + Number(a.firstAfterYears ?? 0);
  if (age >= firstAge) {
    const diff = age - firstAge;
    const cyc = Number(a.cycleYears ?? 0);
    if (diff === 0 || (cyc > 0 && diff % cyc === 0)) {
      applianceExpense += Number(a.cost10kJPY) * 10000;
    }
  }
}

C) 合計支出の算出は必ず1行で定義し、applianceExpense を1回だけ含める（二重合算を防止）。
const totalExpense =
  livingExpense +
  childExpense +
  careExpense +
  carExpense +
  housingExpense +
  marriageExpense +
  applianceExpense +
  retirementExpense;

D) 一時デバッグ（開発時のみ。完了後は削除）
const __applianceDebug = { year: baseYear + i, age, count: appliancesOnly.length, applianceExpense };
console.debug('appliance-check', __applianceDebug);

# 検索して削除すべき重複コードの目印
- /appliance/i を含む forEach / 2つ目以降の for-of / 追加の reduce
- body.appliances を年次ループ内で再参照・再フィルタしている箇所
- totalExpense を個別に再構築して applianceExpense を二度足ししている箇所

# 受入基準（必ず確認）
- 2030年 applianceExpense=20,000、2033年=480,000、2041年=150,000（各行 cost10kJPY×10000 の合算と一致）
- 家電未入力時は全年 applianceExpense=0
- totalExpense が applianceExpense を1回だけ含む（例：老後差額＋住宅＋家電＝totalExpense が一致）
- Lint・型エラーなし、計算の他科目（車・住宅・介護・子ども・老後・投資）は現状どおり（回 regress なし）


上記の修正は実行できましたか？確認して報告してください。
