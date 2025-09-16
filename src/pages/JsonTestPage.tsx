import { useState } from 'react';

// Standalone tester page for posting raw JSON to /api/simulate.
// ASCII-only labels to avoid encoding issues.
export default function JsonTestPage() {
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      setJsonText(text);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleExecute = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const parsed = JSON.parse(jsonText) as unknown;

      // Convert Form-like JSON to API InputParams if needed
      const toNum = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
      const isInputParams = (obj: unknown): obj is Record<string, unknown> => {
        return !!obj && typeof obj === 'object' && ('initialAge' in (obj as Record<string, unknown>) || 'endAge' in (obj as Record<string, unknown>));
      };
      const isWrapped = (obj: unknown): obj is { inputParams: Record<string, unknown> } => {
        return !!obj && typeof obj === 'object' && 'inputParams' in (obj as Record<string, unknown>);
      };
      const isFormLike = (obj: unknown): obj is Record<string, unknown> => {
        return !!obj && typeof obj === 'object' && ('personAge' in (obj as Record<string, unknown>) || 'simulationPeriodAge' in (obj as Record<string, unknown>));
      };

      const buildFromForm = (f: Record<string, unknown>) => {
        const monthlyRecurringInvestment = Object.values((f.monthlyInvestmentAmounts as Record<string, unknown> | undefined) ?? {})
          .reduce<number>((acc, v) => acc + toNum(v), 0); // 円/月
        const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12; // 円/年
        const yearlySpotJPY = [
          f.investmentStocksAnnualSpot,
          f.investmentTrustAnnualSpot,
          f.investmentBondsAnnualSpot,
          f.investmentIdecoAnnualSpot,
          f.investmentCryptoAnnualSpot,
          f.investmentOtherAnnualSpot,
        ].reduce<number>((acc, v) => acc + toNum(v), 0) * 10000; // 万円→円/年

        // expectedReturn: 各利回りの平均（%→小数）
        const rates = [
          f.investmentStocksRate,
          f.investmentTrustRate,
          f.investmentBondsRate,
          f.investmentIdecoRate,
          f.investmentCryptoRate,
          f.investmentOtherRate,
        ].map(toNum).filter((x) => Number.isFinite(x));
        const expectedReturn = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100;

        // 車
        const carLoanUse = String(f.carLoanUsage ?? '').includes('はい');
        const car = {
          priceJPY: toNum(f.carPrice) * 10000, // 万円→円
          firstAfterYears: toNum(f.carFirstReplacementAfterYears),
          frequencyYears: toNum(f.carReplacementFrequency),
          loan: {
            use: carLoanUse,
            years: carLoanUse ? toNum(f.carLoanYears) : undefined,
            // 文字列はそのまま（API側で正規化）
            type: carLoanUse ? (f.carLoanType as string | undefined) : undefined,
          },
          currentLoan: undefined as | { monthlyPaymentJPY: number; remainingYears: number } | undefined,
        };
        // 車の現在ローン（円/月）
        const carMonthly = toNum(f.carCurrentLoanMonthly);
        const carRemain = toNum(f.carCurrentLoanRemainingYears);
        const carInPay = String(f.carCurrentLoanInPayment ?? '').includes('はい');
        if (carInPay && carMonthly > 0 && carRemain > 0) {
          car.currentLoan = { monthlyPaymentJPY: carMonthly, remainingYears: carRemain };
        }

        // 住まい
        const rentYen = toNum(f.currentRentLoanPayment); // 円/月
        const houseLoanMonthly = toNum(f.loanMonthlyPayment); // 円/月
        const houseLoanRemain = toNum(f.loanRemainingYears);
        const housingTypeRaw = String(f.housingType ?? '');
        let housingType: '賃貸' | '持ち家（ローン中）' | '持ち家（完済）' = '持ち家（完済）';
        if (housingTypeRaw.includes('賃') || rentYen > 0) housingType = '賃貸';
        else if (housingTypeRaw.includes('ローン') || (houseLoanMonthly > 0 && houseLoanRemain > 0)) housingType = '持ち家（ローン中）';
        const purchase = (f.housePurchasePlan as Record<string, unknown> | undefined);

        const renovationEntries = Array.isArray(f.houseRenovationPlans)
          ? f.houseRenovationPlans.filter(isRecord)
          : [];

        const housing = {
          type: housingType,
          rentMonthlyJPY: housingType === '賃貸' && rentYen > 0 ? rentYen : undefined,
          currentLoan: housingType === '持ち家（ローン中）' && houseLoanMonthly > 0 && houseLoanRemain > 0
            ? { monthlyPaymentJPY: houseLoanMonthly, remainingYears: houseLoanRemain }
            : undefined,
          purchasePlan: purchase ? {
            age: toNum(purchase.age),
            priceJPY: toNum(purchase.price) * 10000, // 万円→円
            downPaymentJPY: toNum(purchase.downPayment) * 10000, // 万円→円
            years: toNum(purchase.loanYears),
            rate: toNum(purchase.interestRate), // % 前提
          } : undefined,
          renovations: renovationEntries.map((r) => {
            const cycleYearsRaw = 'cycleYears' in r ? r.cycleYears : undefined;
            return {
              age: toNum(r.age),
              costJPY: toNum(r.cost) * 10000, // 万円→円
              cycleYears: cycleYearsRaw == null ? undefined : toNum(cycleYearsRaw),
            };
          }),
        };

        // 家電（10k円単位のまま）
        const applianceEntries = Array.isArray(f.appliances)
          ? f.appliances.filter(isRecord)
          : [];
        const appliances = applianceEntries.reduce<Array<{ name: string; cycleYears: number; firstAfterYears: number; cost10kJPY: number }>>((acc, a) => {
          const rawName = a.name;
          const name = typeof rawName === 'string'
            ? rawName.trim()
            : rawName != null
              ? String(rawName).trim()
              : '';
          if (!name) {
            return acc;
          }
          acc.push({
            name,
            cycleYears: toNum(a.cycle),
            firstAfterYears: toNum(a.firstReplacementAfterYears),
            cost10kJPY: toNum(a.cost), // 万円 = 10k円扱いのためこのままで良い
          });
          return acc;
        }, []);


        // 生活費（簡単/詳細）の推定
        const simpleMode = toNum(f.livingCostSimple) > 0;

        return {
          initialAge: toNum(f.personAge),
          endAge: toNum(f.simulationPeriodAge),
          retirementAge: toNum(f.retirementAge),
          pensionStartAge: toNum(f.pensionStartAge),

          mainJobIncomeGross: toNum(f.mainIncome) * 10000, // 万円→円
          sideJobIncomeGross: toNum(f.sideJobIncome) * 10000, // 万円→円
          spouseMainJobIncomeGross: toNum(f.spouseMainIncome) * 10000, // 万円→円
          spouseSideJobIncomeGross: toNum(f.spouseSideJobIncome) * 10000, // 万円→円
          incomeGrowthRate: 0, // 不在なら0で
          spouseIncomeGrowthRate: 0,

          expenseMode: simpleMode ? 'simple' : 'detailed',
          livingCostSimpleAnnual: simpleMode ? toNum(f.livingCostSimple) * 12 : undefined, // 円/月 → 円/年

          car,
          housing,
          marriage: (String(f.planToMarry ?? '') === 'する') ? {
            age: toNum(f.marriageAge),
            engagementJPY: toNum(f.engagementCost) * 10000,
            weddingJPY: toNum(f.weddingCost) * 10000,
            honeymoonJPY: toNum(f.honeymoonCost) * 10000,
            movingJPY: toNum(f.newHomeMovingCost) * 10000,
          } : undefined,
          // childrenは文字化けのため省略（必要なら手当）
          appliances,
          care: {
            assume: String(f.parentCareAssumption ?? '') === 'はい',
            parentCurrentAge: toNum(f.parentCurrentAge),
            parentCareStartAge: toNum(f.parentCareStartAge),
            years: toNum(f.parentCareYears),
            monthly10kJPY: toNum(f.parentCareMonthlyCost),
          },

          postRetirementLiving10kJPY: toNum(f.postRetirementLivingCost),
          pensionMonthly10kJPY: toNum(f.pensionAmount),

          currentSavingsJPY: toNum(f.currentSavings) * 10000, // 万円→円
          monthlySavingsJPY: toNum(f.monthlySavings), // 円/月

          currentInvestmentsJPY: (
            toNum(f.investmentStocksCurrent) +
            toNum(f.investmentTrustCurrent) +
            toNum(f.investmentBondsCurrent) +
            toNum(f.investmentIdecoCurrent) +
            toNum(f.investmentCryptoCurrent) +
            toNum(f.investmentOtherCurrent)
          ) * 10000,
          yearlyRecurringInvestmentJPY,
          yearlySpotJPY,
          expectedReturn,
          stressTest: {
            enabled: false,
            seed: toNum(f.stressTestSeed),
          },

          interestScenario: '固定利回り',
          emergencyFundJPY: toNum(f.emergencyFund) * 10000,
        };
      };

      // Build payload
      let payload: { inputParams: unknown } | Record<string, unknown>;
      if (isWrapped(parsed)) {
        payload = parsed;
      } else if (isInputParams(parsed)) {
        payload = { inputParams: parsed };
      } else if (isFormLike(parsed)) {
        payload = { inputParams: buildFromForm(parsed as Record<string, unknown>) };
      } else {
        throw new Error('Unsupported JSON format. Provide InputParams or { inputParams: {...} } or Form-like JSON.');
      }
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'API error');
      setResult(data as Record<string, unknown>);
      try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch (e) { void e; }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">JSON Test Input (/json-test)</h1>
        <p className="text-sm text-gray-600 mb-4">
          Post JSON to /api/simulate. Provide either the full body with inputParams, or the InputParams object (will be wrapped).
        </p>

        <div className="bg-white rounded border p-4 mb-4">
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Upload JSON file</label>
            <input type="file" accept="application/json" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }} />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Paste JSON</label>
            <textarea
              className="w-full h-48 border rounded p-2 font-mono text-xs"
              placeholder="Paste InputParams JSON or { inputParams: { ... } }"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            onClick={handleExecute}
            disabled={busy || !jsonText.trim()}
          >
            {busy ? 'Running...' : 'Run API'}
          </button>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {result !== null && (
          <div className="bg-white rounded border p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Response JSON</h2>
              <span className="text-xs text-gray-500">Also copied to clipboard</span>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded max-h-[70vh] overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
