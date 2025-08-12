あなたは既存の React(FormPage.tsx) + Vercel Functions(index.ts) 構成の家計シミュレーターを拡張する実装エージェントである。自律的な質問は禁止。以下の仕様と手順に厳密に従い、コードを修正せよ。

目的
- フロントの入力（本人/配偶者・車・住まい・結婚・子・生活家電・親介護・老後・貯蓄・投資・シミュ設定）を正規化し、index.ts で年間テーブル(yearlyData)へ反映する。
- 下記「計算仕様」の各項目が満たされること。

I/O 契約（必須）
1) フロント送信：POST /api/simulate
   body = { inputParams: NormalizedParams }
2) サーバ応答：200 { yearlyData: YearlyRow[] }
3) 型（抜粋・追加可）
type NormalizedParams = {
  // 年齢・期間
  initialAge: number;                 // 本人
  spouseInitialAge?: number;          // 配偶者
  endAge: number;                     // 対象期間の終了年齢（本人ベース）
  retirementAge: number;
  pensionStartAge: number;

  // 現在の収入（すべて 円/年 に正規化）
  mainJobIncomeNet: number;           // 本人手取り（本業）
  sideJobIncomeNet: number;           // 本人手取り（副業）
  spouseMainJobIncomeNet?: number;    // 配偶者手取り（本業）
  spouseSideJobIncomeNet?: number;    // 配偶者手取り（副業）
  incomeGrowthRate: number;           // 本人 昇給率(小数)
  spouseIncomeGrowthRate?: number;    // 配偶者 昇給率(小数)

  // 現在の支出（円/年）
  expenseMode: 'simple'|'detailed';
  livingCostSimpleAnnual?: number;    // 簡単モード時のみ使用
  detailedFixedAnnual?: number;       // 住宅/光熱/通信/車/保険/教育/その他 固定費 合計
  detailedVariableAnnual?: number;    // 食費/日用品/交通/衣類美容/交際/娯楽/その他 変動費 合計

  // 車（万円や%はフロントで正規化済みで渡す）
  car: {
    priceJPY: number;                 // 乗換価格（円）
    firstAfterYears: number;          // 初回買替までの年数
    frequencyYears: number;           // 以後の買替サイクル
    loan: { use: boolean; years?: number; type?: '銀行ローン'|'ディーラーローン' } // 金利はサーバ側テーブルで決定
  };

  // 住まい
  housing: {
    type: '賃貸'|'持ち家（ローン中）'|'持ち家（完済）';
    currentLoan?: { monthlyPaymentJPY?: number; remainingYears?: number }; // 簡単モード補足
    purchasePlan?: { age: number; priceJPY: number; downPaymentJPY: number; years: number; rate: number }; // rateは小数
    renovations: Array<{ age: number; costJPY: number; cycleYears?: number }>;
  };

  // 結婚（『する』時のみ）
  marriage?: { age: number; engagementJPY: number; weddingJPY: number; honeymoonJPY: number; movingJPY: number };

  // 子ども
  children?: { count: number; firstBornAge: number; educationPattern: '公立中心'|'公私混合'|'私立中心' };

  // 生活（家電）
  appliances: Array<{ name: string; cycleYears: number; firstAfterYears: number; cost10kJPY: number }>;

  // 親介護
  care?: { assume: boolean; parentCurrentAge: number; parentCareStartAge: number; years: number; monthly10kJPY: number };

  // 老後
  postRetirementLiving10kJPY: number; // 万円/月
  pensionMonthly10kJPY: number;       // 万円/月

  // 貯蓄
  currentSavingsJPY: number;          // 初期現金
  monthlySavingsJPY: number;          // 毎月の貯蓄（円/月）

  // 投資
  currentInvestmentsJPY: number;      // 現在の投資資産合計（円）
  yearlyRecurringInvestmentJPY: number; // 年間積立（円/年）
  yearlySpotJPY: number;              // 年間スポット（円/年）
  expectedReturn: number;             // 小数(例0.05)
  stressTest?: { enabled: boolean; volatility?: number; seed?: number };

  // シミュレーション設定
  interestScenario: '固定利回り'|'ランダム変動';
  emergencyFundJPY: number;           // 生活防衛資金（下回らないキャッシュ）
};

type YearlyRow = {
  year: number; age: number; spouseAge?: number;
  income: number; incomeDetail: { self: number; spouse: number; investment: number };
  expense: number; expenseDetail: {
    living: number; car: number; housing: number; marriage: number; children: number; appliances: number; care: number; retirementGap: number;
  };
  savings: number; investmentPrincipal: number; totalAssets: number; balance: number;
};

フロント(FormPage.tsx)での正規化（必須）
- 既存の送信処理を置換。各入力の単位を「円/年」または指定フィールドに**統一**して NormalizedParams を構築して送ること。
- 例（抜粋）:
  - 手取り年収（本人/配偶者）= 本業[万円/年]と副業[万円/年]をそれぞれ 10000倍→合算。さらに「現在の収入(テキスト)」に示された式のとおり、表示用途は /12 だが送信は 年額で渡すこと。
  - 支出：expenseMode='簡単'なら livingCostSimpleAnnual = Number(livingCostSimple)×12、'詳細'なら detailedFixedAnnual と detailedVariableAnnual を合算してセット。
  - 車: price は 10000倍して円。初回年数/サイクル/ローン有無・年数・種類をそのまま。
  - 住宅: purchasePlan と renovations の 万円→円 変換を行う。簡単モードでの現ローン補足があれば currentLoan を埋める。
  - 結婚: 各費用 万円→円。
  - 家電: cost10kJPY は 万円数値（サーバ側で×10000して計上する）。
  - 介護: monthly10kJPY は 万円（サーバ側で×10000）。
  - 老後: postRetirementLiving10kJPY と pensionMonthly10kJPY は万単位。
  - 貯蓄/投資: 円に統一。月額は×12して年間へ畳み込み可。
- POST 後は返却 yearlyData をそのまま画面・コピー用に利用。

計算仕様（index.ts の拡張）
A) 現在の収入
- 年額: person(self)=mainJobIncomeNet + sideJobIncomeNet、spouse=spouseMainJobIncomeNet + spouseSideJobIncomeNet。
- 年次成長: 当年の selfBaseIncome = selfPrev * (1 + incomeGrowthRate)、spouse も同様。
- 投資収入は下記「投資」に従う。
- 表示用途の「月額」は year 行の incomeDetail.self/spouse を /12 で算出可能だが、yearlyData には年額を保持する。

B) 現在の支出
- expenseMode='簡単': living = livingCostSimpleAnnual。
- expenseMode='詳細': living = detailedFixedAnnual + detailedVariableAnnual。
- 「車/教育/住宅」は**ライフイベント側で別途計上**し、ここには含めない（ダブりを避ける）。

C) 車
- 買替年: initialAge + firstAfterYears、以後 frequencyYears ごと。
- 都度の支出は:
  - ローン未使用: その年に priceJPY を一時支出(car)。
  - ローン使用: 指定年数で**元利均等**。年利は type により固定値を使用（銀行=1.5%、ディーラー=4.5%）。年次支出(car) = 年間返済額（priceJPY, rate, years から算出）。返済は開始年から年数分だけ続く。
- 途中で次の買替が到来した場合は並行返済を許容（同時に複数ローンの年額を合算）。

D) 住まい
- 現在持ち家の場合、houseRenovationPlans を参照。各 plan: 初回 age 到達年に costJPY、cycleYears があればその周期で繰返し。expenseDetail.housing に加算。
- 賃貸→購入の purchasePlan があれば、購入年齢で頭金を一時支出、残額を元利均等（金利は plan.rate、小数）で年額返済。返済年数分を expenseDetail.housing に計上。

E) 結婚
- marriage が存在する場合、marriage.age の年に engagement+wedding+honeymoon+moving を一時支出(expenseDetail.marriage)。

F) 子ども
- children が存在する場合、人数 count と firstBornAge を使用。
- 複数子: 「最初の子から3年おき」で 2人目以降を生む前提。各子の教育費は educationPattern を {公立1000万, 公私1600万, 私立2000万} とし、22年均等割りの年額を「各子の firstBornAge 〜 firstBornAge+21」の22年間に計上。expenseDetail.children に合算。

G) 生活（家電）
- appliances の各行について、初回: firstAfterYears 後の年に cost10kJPY×10000 を支出、以後 cycleYears ごとに同額を支出。expenseDetail.appliances に加算。

H) 親の介護
- care.assume=true のとき、本人年齢での開始年齢は myCareStartAge = initialAge + (parentCareStartAge - parentCurrentAge)。
- 期間 years の各年に monthly10kJPY×10000×12 を expenseDetail.care として計上。

I) 老後
- 退職以降は living を「現在の支出」から**老後生活費**へ切替：retExpense = max(0, postRetirementLiving10kJPY×10000×12 − pensionMonthly10kJPY×10000×12(本人+配偶者)) を expenseDetail.retirementGap に計上（年金は本人/配偶者で二人分を合算）。

J) 貯蓄
- 年間貯蓄: monthlySavingsJPY×12 を現金へ加算（income ではなく資産移動として扱う場合は、当年末に savings に加える）。

K) 投資
- 初期投資資産: currentInvestmentsJPY。
- 年間積立: yearlyRecurringInvestmentJPY、スポット: yearlySpotJPY。これらは投資元本(investmentPrincipal)へ計上。
- リターン:
  - 固定利回り: (savings + investmentPrincipal)×expectedReturn を investment 収入として incomeDetail.investment に加算。
  - ランダム変動: stressTest.enabled=true なら、正規近似または任意の乱数により平均 expectedReturn、分散=volatility を用いて年次リターンを生成（再現性のため seed 使用可）。
- 「生活防衛資金」: 年末の savings が emergencyFundJPY を下回る場合、必要額を investmentPrincipal から取り崩して savings を emergencyFundJPY まで補填（下回るときのみ）。

L) 集計・年次更新
- income = incomeDetail.self + incomeDetail.spouse + incomeDetail.investment。
- expense = sum(expenseDetail.[各科目])。
- balance = income - expense。
- savings = max(0, savings + balance + monthlySavingsJPY*12)。 // 取り崩しは上記防衛資金ロジックで調整
- investmentPrincipal += yearlyRecurringInvestmentJPY + yearlySpotJPY（取り崩しがあれば減算）。
- totalAssets = savings + investmentPrincipal。
- year は基準年 + 経過年数、age は initialAge + 経過年数、spouseAge も同様。
- ループは age が endAge に到達するまで。

実装手順
1) FormPage.tsx: 送信前に NormalizedParams を構築（現在の実装の 10000 倍/12 倍等の単位変換はこの仕様に合わせて見直す）。余分なキーは送らない。
2) index.ts: 既存ロジックを simulate(params: NormalizedParams): YearlyRow[] にリファクタリングして上記仕様を実装。元利均等の計算は共通関数 amortize(principal, annualRate, years) を作成（年額を返す）。複数ローン並行時は当該年に有効なローン年額を合算。
3) 返却: { yearlyData } 形式で YearlyRow[] を返す。各金額は整数に丸める（Math.round）。
4) テスト: 代表入力で境界年（初回買替年、結婚年、出生年、介護開始年、退職/年金開始年）に各 expenseDetail がオンになることを console.log とユニットテストで確認。生活防衛資金下回り時に投資元本が減少し savings が下限まで復元されることを確認。
