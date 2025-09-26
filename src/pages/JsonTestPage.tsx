import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimulationInputParams, YearlyData } from '../types/simulation';

// Standalone tester page for posting raw JSON to /api/simulate.
// ASCII-only labels to avoid encoding issues.
export default function JsonTestPage() {
  const navigate = useNavigate();
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setJsonText(text);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleExecute = useCallback(async () => {
    setBusy(true);
    setError("");
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

      const isYes = (value: unknown): boolean => {
        const normalized = String(value ?? '').trim().toLowerCase();
        return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'はい';
      };

      const extractNavInputParams = (raw: unknown): SimulationInputParams | null => {
        if (!isRecord(raw)) return null;
        const record = raw as Record<string, unknown>;
        if (!('initialAge' in record) || !('retirementAge' in record)) {
          return null;
        }
        return {
          initialAge: toNum(record.initialAge),
          spouseInitialAge: 'spouseInitialAge' in record ? toNum(record.spouseInitialAge) : undefined,
          retirementAge: toNum(record.retirementAge),
          mainJobIncomeGross: toNum(record.mainJobIncomeGross),
          sideJobIncomeGross: toNum(record.sideJobIncomeGross),
          spouseMainJobIncomeGross: 'spouseMainJobIncomeGross' in record ? toNum(record.spouseMainJobIncomeGross) : undefined,
          spouseSideJobIncomeGross: 'spouseSideJobIncomeGross' in record ? toNum(record.spouseSideJobIncomeGross) : undefined,
          currentSavingsJPY: toNum(record.currentSavingsJPY),
          monthlySavingsJPY: toNum(record.monthlySavingsJPY),
          currentInvestmentsJPY: toNum(record.currentInvestmentsJPY),
          yearlyRecurringInvestmentJPY: toNum(record.yearlyRecurringInvestmentJPY),
          yearlySpotJPY: toNum(record.yearlySpotJPY),
          expectedReturn: Number(record.expectedReturn ?? 0),
          emergencyFundJPY: toNum(record.emergencyFundJPY),
        };
      };

      const buildFromForm = (f: Record<string, unknown>) => {
        const monthlyRecurringInvestment = Object.values((f.monthlyInvestmentAmounts as Record<string, unknown> | undefined) ?? {})
          .reduce<number>((acc, v) => acc + toNum(v), 0); // 蜀・譛・
        const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12; // 蜀・蟷ｴ
        const yearlySpotJPY = [
          f.investmentStocksAnnualSpot,
          f.investmentTrustAnnualSpot,
          f.investmentBondsAnnualSpot,
          f.investmentIdecoAnnualSpot,
          f.investmentCryptoAnnualSpot,
          f.investmentOtherAnnualSpot,
        ].reduce<number>((acc, v) => acc + toNum(v), 0) * 10000; // 荳・・竊貞・/蟷ｴ

        const stocksCurrentYen = toNum(f.investmentStocksCurrent) * 10000;
        const trustCurrentYen = toNum(f.investmentTrustCurrent) * 10000;
        const otherCurrentYen = (
          toNum(f.investmentBondsCurrent) +
          toNum(f.investmentIdecoCurrent) +
          toNum(f.investmentCryptoCurrent) +
          toNum(f.investmentOtherCurrent)
        ) * 10000;

        const monthlyStocksYen = toNum((f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentStocksMonthly);
        const monthlyTrustYen = toNum((f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentTrustMonthly);
        const monthlyOtherYen = [
          (f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentBondsMonthly,
          (f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentIdecoMonthly,
          (f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentCryptoMonthly,
          (f.monthlyInvestmentAmounts as Record<string, unknown> | undefined)?.investmentOtherMonthly,
        ].reduce<number>((acc, v) => acc + toNum(v), 0);
        const yearlyStocksRecurringYen = monthlyStocksYen * 12;
        const yearlyTrustRecurringYen = monthlyTrustYen * 12;
        const yearlyOtherRecurringYen = monthlyOtherYen * 12;

        const stocksSpotYen = toNum(f.investmentStocksAnnualSpot) * 10000;
        const trustSpotYen = toNum(f.investmentTrustAnnualSpot) * 10000;
        const otherSpotYen = (
          toNum(f.investmentBondsAnnualSpot) +
          toNum(f.investmentIdecoAnnualSpot) +
          toNum(f.investmentCryptoAnnualSpot) +
          toNum(f.investmentOtherAnnualSpot)
        ) * 10000;

        const stocksAccountTypeRaw = String(f.investmentStocksAccountType ?? 'taxable');
        const trustAccountTypeRaw = String(f.investmentTrustAccountType ?? 'taxable');
        const stocksAccountType = stocksAccountTypeRaw === 'nisa' ? 'nisa' : 'taxable';
        const trustAccountType = trustAccountTypeRaw === 'nisa' ? 'nisa' : 'taxable';

        const nisaCurrentHoldingsJPY = (stocksAccountType === 'nisa' ? stocksCurrentYen : 0) + (trustAccountType === 'nisa' ? trustCurrentYen : 0);
        const taxableCurrentHoldingsJPY = (stocksAccountType === 'taxable' ? stocksCurrentYen : 0) + (trustAccountType === 'taxable' ? trustCurrentYen : 0) + otherCurrentYen;

        const nisaRecurringAnnualJPY = (stocksAccountType === 'nisa' ? yearlyStocksRecurringYen : 0) + (trustAccountType === 'nisa' ? yearlyTrustRecurringYen : 0);
        const taxableRecurringAnnualJPY = (stocksAccountType === 'taxable' ? yearlyStocksRecurringYen : 0) + (trustAccountType === 'taxable' ? yearlyTrustRecurringYen : 0) + yearlyOtherRecurringYen;

        const nisaSpotAnnualJPY = (stocksAccountType === 'nisa' ? stocksSpotYen : 0) + (trustAccountType === 'nisa' ? trustSpotYen : 0);
        const taxableSpotAnnualJPY = (stocksAccountType === 'taxable' ? stocksSpotYen : 0) + (trustAccountType === 'taxable' ? trustSpotYen : 0) + otherSpotYen;

        // expectedReturn: 蜷・茜蝗槭ｊ縺ｮ蟷ｳ蝮・ｼ・竊貞ｰ乗焚・・
        const rates = [
          f.investmentStocksRate,
          f.investmentTrustRate,
          f.investmentBondsRate,
          f.investmentIdecoRate,
          f.investmentCryptoRate,
          f.investmentOtherRate,
        ].map(toNum).filter((x) => Number.isFinite(x));
        const expectedReturn = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100;

        // 霆・
        const carLoanUse = isYes(f.carLoanUsage);
        const car = {
          priceJPY: toNum(f.carPrice) * 10000, // 荳・・竊貞・
          firstAfterYears: toNum(f.carFirstReplacementAfterYears),
          frequencyYears: toNum(f.carReplacementFrequency),
          loan: {
            use: carLoanUse,
            years: carLoanUse ? toNum(f.carLoanYears) : undefined,
            // 譁・ｭ怜・縺ｯ縺昴・縺ｾ縺ｾ・・PI蛛ｴ縺ｧ豁｣隕丞喧・・
            type: carLoanUse ? (f.carLoanType as string | undefined) : undefined,
          },
          currentLoan: undefined as | { monthlyPaymentJPY: number; remainingYears: number } | undefined,
        };
        // 霆翫・迴ｾ蝨ｨ繝ｭ繝ｼ繝ｳ・亥・/譛茨ｼ・
        const carMonthly = toNum(f.carCurrentLoanMonthly);
        const carRemain = toNum(f.carCurrentLoanRemainingYears);
        const carInPay = isYes(f.carCurrentLoanInPayment);
        if (carInPay && carMonthly > 0 && carRemain > 0) {
          car.currentLoan = { monthlyPaymentJPY: carMonthly, remainingYears: carRemain };
        }

        // 菴上∪縺・
        const rentYen = toNum(f.currentRentLoanPayment); // 円/月
        const houseLoanMonthly = toNum(f.loanMonthlyPayment); // 円/月
        const houseLoanRemain = toNum(f.loanRemainingYears);
        const housingTypeRaw = String(f.housingType ?? '');
        const HOUSING_RENT = '賃貸';
        const HOUSING_LOAN = '持ち家（ローンあり）';
        const HOUSING_OWNED = '持ち家（完済）';

        let housingType = HOUSING_OWNED;
        if (housingTypeRaw.includes(HOUSING_RENT) || rentYen > 0) {
          housingType = HOUSING_RENT;
        } else if (housingTypeRaw.includes('ローン') || (houseLoanMonthly > 0 && houseLoanRemain > 0)) {
          housingType = HOUSING_LOAN;
        }
        const purchase = (f.housePurchasePlan as Record<string, unknown> | undefined);

        const renovationEntries = Array.isArray(f.houseRenovationPlans)
          ? f.houseRenovationPlans.filter(isRecord)
          : [];

        const housing = {
          type: housingType,
          rentMonthlyJPY: housingType === HOUSING_RENT && rentYen > 0 ? rentYen : undefined,
          currentLoan: housingType === HOUSING_LOAN && houseLoanMonthly > 0 && houseLoanRemain > 0
            ? { monthlyPaymentJPY: houseLoanMonthly, remainingYears: houseLoanRemain }
            : undefined,
          purchasePlan: purchase ? {
            age: toNum(purchase.age),
            priceJPY: toNum(purchase.price) * 10000, // 荳・・竊貞・
            downPaymentJPY: toNum(purchase.downPayment) * 10000, // 荳・・竊貞・
            years: toNum(purchase.loanYears),
            rate: toNum(purchase.interestRate), // % 蜑肴署
          } : undefined,
          renovations: renovationEntries.map((r) => {
            const cycleYearsRaw = 'cycleYears' in r ? r.cycleYears : undefined;
            return {
              age: toNum(r.age),
              costJPY: toNum(r.cost) * 10000, // 荳・・竊貞・
              cycleYears: cycleYearsRaw == null ? undefined : toNum(cycleYearsRaw),
            };
          }),
        };

        // 螳ｶ髮ｻ・・0k蜀・腰菴阪・縺ｾ縺ｾ・・
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
            cost10kJPY: toNum(a.cost), // 荳・・ = 10k蜀・桶縺・・縺溘ａ縺薙・縺ｾ縺ｾ縺ｧ濶ｯ縺・
          });
          return acc;
        }, []);


        // 逕滓ｴｻ雋ｻ・育ｰ｡蜊・隧ｳ邏ｰ・峨・謗ｨ螳・
        const simpleMode = toNum(f.livingCostSimple) > 0;

        return {
          initialAge: toNum(f.personAge),
          endAge: toNum(f.simulationPeriodAge),
          retirementAge: toNum(f.retirementAge),
          pensionStartAge: toNum(f.pensionStartAge),

          mainJobIncomeGross: toNum(f.mainIncome) * 10000, // 荳・・竊貞・
          sideJobIncomeGross: toNum(f.sideJobIncome) * 10000, // 荳・・竊貞・
          spouseMainJobIncomeGross: toNum(f.spouseMainIncome) * 10000, // 荳・・竊貞・
          spouseSideJobIncomeGross: toNum(f.spouseSideJobIncome) * 10000, // 荳・・竊貞・
          incomeGrowthRate: 0, // 荳榊惠縺ｪ繧・縺ｧ
          spouseIncomeGrowthRate: 0,

          expenseMode: simpleMode ? 'simple' : 'detailed',
          livingCostSimpleAnnual: simpleMode ? toNum(f.livingCostSimple) * 12 : undefined, // 蜀・譛・竊・蜀・蟷ｴ

          car,
          housing,
          marriage: (String(f.planToMarry ?? '') === '縺吶ｋ') ? {
            age: toNum(f.marriageAge),
            engagementJPY: toNum(f.engagementCost) * 10000,
            weddingJPY: toNum(f.weddingCost) * 10000,
            honeymoonJPY: toNum(f.honeymoonCost) * 10000,
            movingJPY: toNum(f.newHomeMovingCost) * 10000,
          } : undefined,
          // children縺ｯ譁・ｭ怜喧縺代・縺溘ａ逵∫払・亥ｿ・ｦ√↑繧画焔蠖難ｼ・
          appliances,
          care: {
            assume: isYes(f.parentCareAssumption),
            parentCurrentAge: toNum(f.parentCurrentAge),
            parentCareStartAge: toNum(f.parentCareStartAge),
            years: toNum(f.parentCareYears),
            monthly10kJPY: toNum(f.parentCareMonthlyCost),
          },

          postRetirementLiving10kJPY: toNum(f.postRetirementLivingCost),
          pensionMonthly10kJPY: toNum(f.pensionAmount),

          currentSavingsJPY: toNum(f.currentSavings) * 10000, // 荳・・竊貞・
          monthlySavingsJPY: toNum(f.monthlySavings), // 蜀・譛・

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
          investmentTaxation: {
            nisa: {
              currentHoldingsJPY: nisaCurrentHoldingsJPY,
              annualRecurringContributionJPY: nisaRecurringAnnualJPY,
              annualSpotContributionJPY: nisaSpotAnnualJPY,
            },
            taxable: {
              currentHoldingsJPY: taxableCurrentHoldingsJPY,
              annualRecurringContributionJPY: taxableRecurringAnnualJPY,
              annualSpotContributionJPY: taxableSpotAnnualJPY,
            },
          },
          stressTest: {
            enabled: false,
            seed: toNum(f.stressTestSeed),
          },

          interestScenario: '蝗ｺ螳壼茜蝗槭ｊ',
          emergencyFundJPY: toNum(f.emergencyFund) * 10000,
        };
      };

      // Build payload
      let navCandidate: SimulationInputParams | null = null;
      let payload: { inputParams: Record<string, unknown> };
      if (isWrapped(parsed)) {
        const inputParamsRaw = parsed.inputParams as Record<string, unknown>;
        payload = { inputParams: inputParamsRaw };
        navCandidate = extractNavInputParams(inputParamsRaw);
      } else if (isInputParams(parsed)) {
        const inputParamsRaw = parsed as Record<string, unknown>;
        payload = { inputParams: inputParamsRaw };
        navCandidate = extractNavInputParams(inputParamsRaw);
      } else if (isFormLike(parsed)) {
        const built = buildFromForm(parsed as Record<string, unknown>);
        payload = { inputParams: built };
        navCandidate = extractNavInputParams(built);
      } else {
        throw new Error('Unsupported JSON format. Provide InputParams or { inputParams: {...} } or Form-like JSON.');
      }
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>))
          ? String((data as Record<string, unknown>).message)
          : 'API error';
        throw new Error(message);
      }

      const dataRecord = data as Record<string, unknown>;
      const yearlyRaw = dataRecord.yearlyData;
      const yearlyData = Array.isArray(yearlyRaw) ? (yearlyRaw as YearlyData[]) : [];
      if (yearlyData.length === 0) {
        throw new Error('Simulation API returned no yearlyData array.');
      }
      if (!navCandidate) {
        throw new Error('Unable to derive the minimal input parameters required for ResultPage navigation.');
      }

      navigate('/result', { state: { yearlyData, inputParams: navCandidate } });
      return;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    } finally {
      setBusy(false);
    }
  }, [jsonText, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">JSON Test Input (/json-test)</h1>
        <p className="text-sm text-gray-600 mb-4">
          Upload or paste simulation JSON, send it to /api/simulate, and jump straight to the dashboard view rendered by ResultPage.
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
            {busy ? 'Running...' : 'Run & View Result'}
          </button>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

      </div>
    </div>
  );
}
