export function computeNetAnnual(grossAnnualIncome: number): number {
    // 簡略化された税・社会保障費計算
    // 課税所得 = 額面収入 - 給与所得控除 - 社会保険料控除 - 基礎控除
    // 所得税 = 課税所得 * 所得税率 - 控除額
    // 住民税 = 課税所得 * 住民税率 - 控除額
    // 社会保険料 = 額面収入 * 社会保険料率

    const n = (v: unknown): number => {
        const num = Number(v);
        return isFinite(num) ? num : 0;
    };

    const income = n(grossAnnualIncome);

    // 給与所得控除 (令和2年以降)
    let salaryIncomeDeduction: number;
    if (income <= 1625000) {
        salaryIncomeDeduction = 550000;
    } else if (income <= 1800000) {
        salaryIncomeDeduction = income * 0.4 - 100000;
    } else if (income <= 3600000) {
        salaryIncomeDeduction = income * 0.3 + 80000;
    } else if (income <= 6600000) {
        salaryIncomeDeduction = income * 0.2 + 440000;
    } else if (income <= 8500000) {
        salaryIncomeDeduction = income * 0.1 + 1100000;
    } else {
        salaryIncomeDeduction = 1950000;
    }

    // 社会保険料 (健康保険、厚生年金、雇用保険) - 簡略化のため一律15%とする
    const socialInsurancePremium = income * 0.15;

    // 基礎控除 (令和2年以降)
    const basicDeduction = 480000;

    // 課税所得
    const taxableIncome = Math.max(0, income - salaryIncomeDeduction - socialInsurancePremium - basicDeduction);

    // 所得税
    let incomeTax: number;
    if (taxableIncome <= 1950000) { incomeTax = taxableIncome * 0.05; }
    else if (taxableIncome <= 3300000) { incomeTax = taxableIncome * 0.1 - 97500; }
    else if (taxableIncome <= 6950000) { incomeTax = taxableIncome * 0.2 - 427500; }
    else if (taxableIncome <= 9000000) { incomeTax = taxableIncome * 0.23 - 636000; }
    else if (taxableIncome <= 18000000) { incomeTax = taxableIncome * 0.33 - 1536000; }
    else if (taxableIncome <= 40000000) { incomeTax = taxableIncome * 0.4 - 2796000; }
    else { incomeTax = taxableIncome * 0.45 - 4796000; }

    // 住民税 (均等割5,000円 + 所得割10%) - 簡略化
    const residentTax = taxableIncome * 0.1 + 5000;

    // 手取り収入 = 額面収入 - 社会保険料 - 所得税 - 住民税
    const netAnnualIncome = income - socialInsurancePremium - incomeTax - residentTax;

    return Math.max(0, netAnnualIncome);
}