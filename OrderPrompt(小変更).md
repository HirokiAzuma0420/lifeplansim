# 目的
ESLint の @typescript-eslint/no-unused-vars を解消しつつ、「生活防衛資金（emergencyFundJPY）」を年末更新で適用する。現行の「現金がマイナスなら投資元本から補填」処理を、生活防衛資金の閾値を用いた取り崩し処理に置換する。

# 対象
api/simulate/index.ts

# 手順（自律質問禁止。以下の編集を機械的に実施する）

1) emergencyFundJPY の定義を非負に矯正
- 既存の定義行がある場合は置換、無ければ定義直後ブロックに追加。
置換前: const emergencyFundJPY = n(body.emergencyFundJPY);
置換後: const emergencyFundJPY = Math.max(0, n(body.emergencyFundJPY));

2) 年次ループ内の「年末更新」直後に生活防衛資金ロジックを実装
- 直前に以下のような更新が存在する前提:
  savings += monthlySavingsJPY * 12;
  savings += balance;
  investedPrincipal += yearlyRecurringInvestmentJPY + yearlySpotJPY;

- 次のブロックを挿入する（既存の「貯蓄がマイナスなら…補填」ブロックは完全削除してから追加すること）。

挿入コード:
  // 生活防衛資金: 現金が閾値を下回る場合は投資元本から取り崩し
  if (emergencyFundJPY > 0 && savings < emergencyFundJPY) {
    const shortfall = emergencyFundJPY - savings;
    const draw = Math.min(shortfall, investedPrincipal);
    investedPrincipal -= draw;
    savings += draw;
  }
  // 最終ガード
  if (savings < 0) savings = 0;
  if (investedPrincipal < 0) investedPrincipal = 0;

3) 旧ロジックの削除
- 次のようなブロックが残っていれば必ず削除（重複禁止）。
  if (savings < 0) {
    investedPrincipal += savings;
    savings = 0;
    if (investedPrincipal < 0) {
      investedPrincipal = 0;
    }
  }

# 受入条件
- emergencyFundJPY がコード内で実際に使用され、ESLint の "is assigned a value but never used" が消えること。
- savings が emergencyFundJPY 未満の場合、investedPrincipal から不足分を取り崩し、savings は最低でも emergencyFundJPY になること（investedPrincipal が不足する場合は取り崩し可能な範囲で補填）。
- savings, investedPrincipal が最終的に負値にならないこと。
- ビルド・lint が通ること（型エラー、未使用変数エラーがないこと）。

# 変更箇所の目安（検索キーワード）
- "emergencyFundJPY" の定義行
- "savings += monthlySavingsJPY * 12" を含む年次更新付近
- "資産がマイナスになった場合の処理" コメント付近

# 注意
- インデント・区切りコメントのスタイルは既存ファイルに合わせる。
- 他のロジック（収入・支出・利回り計算等）には一切変更を加えない。
