import type { VercelRequest, VercelResponse } from "@vercel/node";

// --- 型定義 ---
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  // --- メソッド検証 ---
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // --- 入力正規化とバリデーション ---
    const body = (req.body?.inputParams ?? req.body) as Partial<InputParams>;

    const n = (v: unknown, def = 0): number => {
      const num = Number(v);
      return Number.isFinite(num) ? num : def;
    };

    const initialAge = Math.max(0, n(body.initialAge));
    let retirementAge = Math.max(0, n(body.retirementAge));
    const monthlyLivingCost = Math.max(0, n(body.monthlyLivingCost));
    const initialSavings = Math.max(0, n(body.initialSavings));
    const yearlyIncome = Math.max(0, n(body.yearlyIncome));
    const yearlyBonus = Math.max(0, n(body.yearlyBonus));
    const yearlyInvestment = Math.max(0, n(body.yearlyInvestment));
    const investmentYield = Math.max(0, n(body.investmentYield) / 100);

    const numberOfChildren = Math.max(0, n(body.numberOfChildren));
    const firstBornAge = Math.max(0, n(body.firstBornAge));
    const educationPattern = body.educationPattern || '公立中心';

    const parentCareAssumption = body.parentCareAssumption || 'いいえ';
    const parentCurrentAge = Math.max(0, n(body.parentCurrentAge));
    const parentCareStartAge = Math.max(0, n(body.parentCareStartAge));
    const parentCareYears = Math.max(0, n(body.parentCareYears));
    const parentCareMonthlyCostJPY = Math.max(0, n(body.parentCareMonthlyCost) * 10000);

    const postRetirementLivingCostJPY = Math.max(0, n(body.postRetirementLivingCost) * 10000);
    const pensionStartAge = Math.max(0, n(body.pensionStartAge));
    const pensionAmountJPY = Math.max(0, n(body.pensionAmount) * 10000);

    // retirementAgeはinitialAge未満にならないように矯正
    retirementAge = Math.max(initialAge, retirementAge);

    // 予測年数の上限
    const maxYears = Math.max(0, Math.min(100 - initialAge, 80));

    // --- シミュレーション準備 ---
    const yearlyData: YearlyData[] = [];
    let savings = initialSavings;
    let investedPrincipal = 0;
    let totalAssets = savings + investedPrincipal;

    // 教育費の年額を計算
    let educationCostPerChild = 0;
    switch (educationPattern) {
      case '公私混合': educationCostPerChild = 16000000; break;
      case '私立中心': educationCostPerChild = 20000000; break;
      default: educationCostPerChild = 10000000; break; // 公立中心
    }
    const annualChildExpense = (numberOfChildren > 0 && educationCostPerChild > 0)
      ? (educationCostPerChild * numberOfChildren) / 22
      : 0;

    // 介護開始年齢（本人）を計算
    const careStartAtMyAge = (parentCareStartAge >= parentCurrentAge)
      ? initialAge + (parentCareStartAge - parentCurrentAge)
      : -1; // 開始不能な場合は-1

    // --- 年次ループ ---
    for (let i = 0; i <= maxYears; i++) {
      const age = initialAge + i;
      const isRetired = age >= retirementAge;
      
      // 1. 収入計算
      const investmentReturn = totalAssets * investmentYield;
      const baseIncome = isRetired ? 0 : (yearlyIncome + yearlyBonus);
      const income = baseIncome + investmentReturn;

      // 2. 支出計算
      // 2a. 生活費
      const livingExpense = monthlyLivingCost * 12;

      // 2b. 子ども費
      let childExpense = 0;
      if (numberOfChildren > 0 && firstBornAge > 0 && age >= firstBornAge && age < firstBornAge + 22) {
        childExpense = annualChildExpense;
      }

      // 2c. 介護費
      let careExpense = 0;
      const isCarePeriod = parentCareAssumption === 'はい' &&
                           parentCurrentAge > 0 &&
                           parentCareStartAge >= parentCurrentAge &&
                           parentCareYears > 0 &&
                           parentCareMonthlyCostJPY > 0 &&
                           careStartAtMyAge !== -1 &&
                           age >= careStartAtMyAge &&
                           age < careStartAtMyAge + parentCareYears;
      if (isCarePeriod) {
        careExpense = parentCareMonthlyCostJPY * 12;
      }

      // 2d. 退職後差額費
      let retirementExpense = 0;
      if (age >= pensionStartAge) {
        const annualRetirementCost = postRetirementLivingCostJPY * 12;
        const annualPension = pensionAmountJPY * 12;
        retirementExpense = Math.max(0, annualRetirementCost - annualPension);
      }

      // 2e. 合計費用
      const totalExpense = livingExpense + childExpense + careExpense + retirementExpense;

      // 3. 収支と資産更新
      const balance = income - totalExpense - yearlyInvestment;
      savings += balance;
      investedPrincipal += yearlyInvestment;
      
      // 資産がマイナスになった場合の処理
      if (savings < 0) {
        investedPrincipal += savings; // 貯蓄のマイナス分を投資元本から補填
        savings = 0;
        if (investedPrincipal < 0) {
            investedPrincipal = 0; // 投資元本もマイナスになったら0に
        }
      }
      
      totalAssets = savings + investedPrincipal;

      // --- 年次データ作成 ---
      const currentYearData: YearlyData = {
        year: new Date().getFullYear() + i,
        age: age,
        totalAssets: Math.round(totalAssets),
        savings: Math.round(savings),
        investment: Math.round(investedPrincipal),
        income: Math.round(income),
        expense: Math.round(totalExpense),
        balance: Math.round(balance),
        childExpense: Math.round(childExpense),
        careExpense: Math.round(careExpense),
        retirementExpense: Math.round(retirementExpense),
        totalExpense: Math.round(totalExpense),
      };
      yearlyData.push(currentYearData);

      // --- 自己検証用ログ ---
      if (i < 3) {
        console.log(`--- Year ${i+1} (Age: ${age}) ---`);
        console.log(currentYearData);
      }
    }

    // --- 出力 ---
    res.status(200).json({ yearlyData });

  } catch (error) {
    // --- エラーハンドリング ---
    console.error('Simulation failed:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}