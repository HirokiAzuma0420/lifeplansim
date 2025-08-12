# 目的
api/simulate/index.ts の型/ESLintエラーを解消する。未定義識別子（isRandom, minReturn, maxReturn, sigma）を排除し、未使用変数（scenario, stEnabled）を有効活用する。差分は最小。自律質問は禁止。

# 背景
現行コードは「投資リターン」計算部で isRandom / minReturn / maxReturn / sigma を参照しているが未定義。一方で scenario / stEnabled を定義しているのに未使用。資産別乱数系列 assetReturns は生成済み。:contentReference[oaicite:0]{index=0}

# 作業手順（機械的に適用）

1) 「投資リターン」計算ブロックを置換
- 置換対象（コメント行を含めてブロックごと削除）:
  // ■ Investment logic
  // Fluctuating returns
  let currentReturn = mu;
  if (isRandom) {
    const randomValue = Math.random();
    currentReturn = Math.max(minReturn, Math.min(maxReturn, mu + sigma * (randomValue - 0.5) * 2.2)); // Simplified normal-like distribution
  }

- 置換後（assetReturns を用いた収束ランダム、scenario/stEnabled を活用）:
  // ■ Investment logic
  const isRandom = (scenario === 'ランダム変動' && stEnabled);
  let currentReturn = mu;
  if (isRandom) {
    const w = 1 / ASSETS.length;
    currentReturn = ASSETS.reduce((acc, k) => acc + w * assetReturns[k][i], 0);
  }

2) 以降の計算は既存のまま維持
- 下記はそのまま（順序は変更しない）:
  const investmentReturn = investedPrincipal * currentReturn;
  annualIncome += investmentReturn;
  const annualInvestment = yearlyRecurringInvestmentJPY + yearlySpotJPY;
  investedPrincipal += annualInvestment;
  const cashFlow = annualIncome - totalExpense - annualInvestment + (monthlySavingsJPY * 12);
  savings += cashFlow;

3) 不要参照の削除・確認
- isRandom の旧参照箇所（上記以外）・minReturn / maxReturn / sigma の定義/参照が残っていないことを確認し、残っていれば削除。
- scenario / stEnabled は 1) で使用されるため未使用警告は解消される。

# 受入基準
- TypeScript: TS2304（isRandom, minReturn, maxReturn, sigma）が0件。
- ESLint: @typescript-eslint/no-unused-vars（scenario, stEnabled）が0件。
- ランダム変動ON時、currentReturn は assetReturns の等加重平均（期間平均が μ に収束）。OFF時は currentReturn=μ。

# 注意
- assetReturns / ASSETS / mu / scenario / stEnabled / i は本ファイル内で既に定義済みであること（未定義なら本手順前の定義を維持）。:contentReference[oaicite:1]{index=1}
