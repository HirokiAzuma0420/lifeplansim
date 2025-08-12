以下は「/api/simulate/index.ts」を修正・実装するための厳密な指示である。自律的な質問は禁止。指示の通りに実装し、完了後に自己検証を行え。

目的
TypeScriptのVercel Serverlessエンドポイントとして、家計シミュレーションAPIを正しく実装する。入力検証、単位正規化、年次計算、出力整形を一貫仕様で実装する。

前提
1. 受信形式は JSON。フロントからは body.inputParams または body 直下で送られる場合があるため両対応する。
2. エンドポイントは POST のみ許可。その他は 405 を返す。
3. 追加の外部ライブラリは使用しない。Node と TypeScript組み込みで完結。
4. ファイルは /api/simulate/index.ts として TypeScript で書く。

型定義
次の型を index.ts に定義して用いる。

interface InputParams {
  initialAge: number;
  retirementAge: number;
  monthlyLivingCost: number;           // 円
  initialSavings: number;              // 円
  yearlyIncome: number;                // 円（賞与除く）
  yearlyBonus: number;                 // 円
  yearlyInvestment: number;            // 円
  investmentYield: number;             // %（例: 5）
  numberOfChildren?: number;
  firstBornAge?: number;               // 親の年齢ベース
  educationPattern?: '公立中心' | '公私混合' | '私立中心';
  parentCareAssumption?: 'はい' | 'いいえ';
  parentCurrentAge?: number;           // 親の現在年齢
  parentCareStartAge?: number;         // 親の介護開始年齢
  parentCareYears?: number;            // 介護年数
  parentCareMonthlyCost?: number;      // 万円
  postRetirementLivingCost?: number;   // 万円（月）
  pensionStartAge?: number;            // 年金開始年齢
  pensionAmount?: number;              // 万円（月）
}

interface YearlyData {
  year: number;            // 実年
  age: number;             // 本人年齢
  totalAssets: number;     // 総資産（円）
  savings: number;         // 現預金（円）
  investment: number;      // 積立元本累計（円）
  income: number;          // 年収＋運用益（円）
  expense: number;         // 生活費＋子ども費＋介護費＋退職差額（円）
  balance: number;         // 当年収支（円）
  childExpense: number;    // 子ども費用（円）
  careExpense: number;     // 介護費用（円）
  retirementExpense: number; // 退職以降の差額費（円）
  totalExpense: number;    // expenseと同義（将来の拡張用に保持）
}

入力正規化とバリデーション
1. 受信 body は const body = (req.body?.inputParams ?? req.body) as Partial<InputParams>;
2. 数値正規化ヘルパ n(v, def=0): v を Number 変換し、有限なら返却、そうでなければ def を返す。
3. 下記の正規化を行い、下限を 0 に丸める。
   initialAge, retirementAge, monthlyLivingCost, initialSavings, yearlyIncome, yearlyBonus, yearlyInvestment
   investmentYield は 100 で割って小数化（例: 5 → 0.05）。負値は 0 に矯正。
   numberOfChildren, firstBornAge は 0 以上に矯正。educationPattern の既定は 公立中心。
   介護関連 parentCareAssumption の既定は いいえ。
   parentCareMonthlyCost, postRetirementLivingCost, pensionAmount は 万円入力のため ×10000 して円化。
4. retirementAge は initialAge 未満にならないよう max(initialAge, retirementAge) とする。
5. 予測年数の上限は maxYears = min(100 - initialAge, 80) とする。負値になり得る場合は 0 とみなす。

費用ロジック
1. 年ループ i=0..maxYears
   age = initialAge + i
   isRetired = age >= retirementAge
   baseIncome = isRetired ? 0 : (yearlyIncome + yearlyBonus)
   investmentReturn = totalAssets * investmentYield  単純年次複利。ここで totalAssets は前年末の総資産。
   income = baseIncome + investmentReturn

2. 生活費
   livingExpense = monthlyLivingCost * 12  常時発生

3. 子ども費
   教育パターン別総額（1人分）
     公立中心: 10000000
     公私混合: 16000000
     私立中心: 20000000
   年額は 子ども総額 × 人数 ÷ 22
   発生条件は 年齢 age が firstBornAge 以上かつ firstBornAge + 22 未満。
   仕様解釈: 親が firstBornAge 歳となる年に第一子 0 歳。よって条件は age in [firstBornAge, firstBornAge+21] の22年間。

4. 介護費
   careStartAtMyAge = initialAge + (parentCareStartAge - parentCurrentAge) を満たす場合のみ計算。
   有効条件
     parentCareAssumption が はい
     parentCurrentAge > 0
     parentCareStartAge >= parentCurrentAge
     parentCareYears > 0
     parentCareMonthlyCostJPY > 0
   発生期間は 本人年齢が careStartAtMyAge 以上かつ careStartAtMyAge + parentCareYears 未満。
   年額は parentCareMonthlyCostJPY * 12

5. 退職後差額費
   年金開始年齢以降にのみ発生
   retirementExpense = max(0, postRetirementLivingCostJPY * 12 - pensionAmountJPY * 12)

6. 合計費用
   totalExpense = livingExpense + childExpense + careExpense + retirementExpense

7. 積立と収支
   balance = income - totalExpense - yearlyInvestment
   savings += balance
   investedPrincipal += yearlyInvestment
   totalAssets = savings + investedPrincipal

8. 年データ push。year は今年を起点に i を加算。

出力
status 200 で { yearlyData: YearlyData[] } を返す。

エラーハンドリング
1. メソッド違反は 405 と Allow: POST を返す。
2. 例外は 500 と { message: 'Internal Server Error' } を返す。console.error でログ。

実装スタイル
1. 変数の二重定義を禁止。分割代入と再定義は行わない。
2. すべてのオプショナル数値に対し Number 変換と 0 以上の矯正を実施。
3. 単位変換は受信直後に一度だけ行う。以降はすべて円基準で計算する。
4. コメントで各ブロックの意図を明記する。

自己検証チェックリスト（必ずローカルで配列の先頭3年程度を console.log して確認せよ）
1. すべて 0 入力でも NaN が生じない。
2. investmentYield=5 のとき、単年の investmentReturn は 前年 totalAssets × 0.05 となる。
3. 子ども費用は firstBornAge の年から 22 年間のみオンになり、その前後で 0 になる。
4. 介護費用は careStartAtMyAge から parentCareYears 年間のみオン。
5. 退職後差額費は pensionStartAge 以上のみで、マイナスにならない。
6. retirementAge を initialAge 未満にしても計算が破綻しない（強制補正される）。

最小検証用入力例（このデータで yearlyData[0..3] を目視確認せよ）
{
  inputParams: {
    initialAge: 35,
    retirementAge: 65,
    monthlyLivingCost: 250000,
    initialSavings: 8000000,
    yearlyIncome: 7000000,
    yearlyBonus: 1000000,
    yearlyInvestment: 1200000,
    investmentYield: 5,
    numberOfChildren: 2,
    firstBornAge: 36,
    educationPattern: '公立中心',
    parentCareAssumption: 'はい',
    parentCurrentAge: 70,
    parentCareStartAge: 75,
    parentCareYears: 4,
    parentCareMonthlyCost: 12,      // 万円
    postRetirementLivingCost: 22,   // 万円
    pensionStartAge: 65,
    pensionAmount: 17               // 万円
  }
}

完了条件
1. ビルドエラーなし、型エラーなし。
2. 上記チェックリストをすべて満たす。
3. 返却 JSON の数値はすべて整数または有限小数で、NaN と Infinity を含まない。
