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
        return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === '�͂�';
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
          .reduce<number>((acc, v) => acc + toNum(v), 0); // 冁E朁E
        const yearlyRecurringInvestmentJPY = monthlyRecurringInvestment * 12; // 冁E年
        const yearlySpotJPY = [
          f.investmentStocksAnnualSpot,
          f.investmentTrustAnnualSpot,
          f.investmentBondsAnnualSpot,
          f.investmentIdecoAnnualSpot,
          f.investmentCryptoAnnualSpot,
          f.investmentOtherAnnualSpot,
        ].reduce<number>((acc, v) => acc + toNum(v), 0) * 10000; // 丁E�E→�E/年

        const stocksCurrentYen = toNum(f.investmentStocksCurrent) * 10000;
        const trustCurrentYen = toNum(f.investmentTrustCurrent) * 10000;
        const otherCurrentYen = (
          toNum(f.investmentBondsCurrent) +
          toNum(f.investmentIdecoCurrent) +
          toNum(f.investmentCryptoCurrent) +
          toNum(f.investmentOtherCurrent)
        ) ;

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

        // expectedReturn: 吁E��回りの平坁E��E→小数�E�E
        const rates = [
          f.investmentStocksRate,
          f.investmentTrustRate,
          f.investmentBondsRate,
          f.investmentIdecoRate,
          f.investmentCryptoRate,
          f.investmentOtherRate,
        ].map(toNum).filter((x) => Number.isFinite(x));
        const expectedReturn = (rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 4) / 100;

        // 軁E
        const carLoanUse = isYes(f.carLoanUsage);
        const car = {
          priceJPY: toNum(f.carPrice) * 10000, // 丁E�E→�E
          firstAfterYears: toNum(f.carFirstReplacementAfterYears),
          frequencyYears: toNum(f.carReplacementFrequency),
          loan: {
            use: carLoanUse,
            years: carLoanUse ? toNum(f.carLoanYears) : undefined,
            // 斁E���Eはそ�Eまま�E�EPI側で正規化�E�E
            type: carLoanUse ? (f.carLoanType as string | undefined) : undefined,
          },
          currentLoan: undefined as | { monthlyPaymentJPY: number; remainingYears: number } | undefined,
        };
        // 車�E現在ローン�E��E/月！E
        const carMonthly = toNum(f.carCurrentLoanMonthly);
        const carRemain = toNum(f.carCurrentLoanRemainingYears);
        const carInPay = isYes(f.carCurrentLoanInPayment);
        if (carInPay && carMonthly > 0 && carRemain > 0) {
          car.currentLoan = { monthlyPaymentJPY: carMonthly, remainingYears: carRemain };
        }

        // 住まぁE
        const rentYen = toNum(f.currentRentLoanPayment); // �~/��
        const houseLoanMonthly = toNum(f.loanMonthlyPayment); // �~/��
        const houseLoanRemain = toNum(f.loanRemainingYears);
        const housingTypeRaw = String(f.housingType ?? '');
        const HOUSING_RENT = '����';
        const HOUSING_LOAN = '�����Ɓi���[������j';
        const HOUSING_OWNED = '�����Ɓi���ρj';

        let housingType = HOUSING_OWNED;
        if (housingTypeRaw.includes(HOUSING_RENT) || rentYen > 0) {
          housingType = HOUSING_RENT;
        } else if (housingTypeRaw.includes('���[��') || (houseLoanMonthly > 0 && houseLoanRemain > 0)) {
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
            priceJPY: toNum(purchase.price) * 10000, // 丁E�E→�E
            downPaymentJPY: toNum(purchase.downPayment) * 10000, // 丁E�E→�E
            years: toNum(purchase.loanYears),
            rate: toNum(purchase.interestRate), // % 前提
          } : undefined,
          renovations: renovationEntries.map((r) => {
            const cycleYearsRaw = 'cycleYears' in r ? r.cycleYears : undefined;
            return {
              age: toNum(r.age),
              costJPY: toNum(r.cost) * 10000, // 丁E�E→�E
              cycleYears: cycleYearsRaw == null ? undefined : toNum(cycleYearsRaw),
            };
          }),
        };

        // 家電�E�E0k冁E��位�Eまま�E�E
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
            cost10kJPY: toNum(a.cost), // 丁E�E = 10k冁E��ぁE�Eためこ�Eままで良ぁE
          });
          return acc;
        }, []);


        // 生活費�E�簡十E詳細�E��E推宁E
        const simpleMode = toNum(f.livingCostSimple) > 0;

        return {
          initialAge: toNum(f.personAge),
          endAge: toNum(f.simulationPeriodAge),
          retirementAge: toNum(f.retirementAge),
          pensionStartAge: toNum(f.pensionStartAge),

          mainJobIncomeGross: toNum(f.mainIncome) * 10000, // 丁E�E→�E
          sideJobIncomeGross: toNum(f.sideJobIncome) * 10000, // 丁E�E→�E
          spouseMainJobIncomeGross: toNum(f.spouseMainIncome) * 10000, // 丁E�E→�E
          spouseSideJobIncomeGross: toNum(f.spouseSideJobIncome) * 10000, // 丁E�E→�E
          incomeGrowthRate: 0, // 不在なめEで
          spouseIncomeGrowthRate: 0,

          expenseMode: simpleMode ? 'simple' : 'detailed',
          livingCostSimpleAnnual: simpleMode ? toNum(f.livingCostSimple) * 12 : undefined, // 冁E朁EↁE冁E年

          car,
          housing,
          marriage: (String(f.planToMarry ?? '') === 'する') ? {
            age: toNum(f.marriageAge),
            engagementJPY: toNum(f.engagementCost) * 10000,
            weddingJPY: toNum(f.weddingCost) * 10000,
            honeymoonJPY: toNum(f.honeymoonCost) * 10000,
            movingJPY: toNum(f.newHomeMovingCost) * 10000,
          } : undefined,
          // childrenは斁E��化け�Eため省略�E�忁E��なら手当！E
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

          currentSavingsJPY: toNum(f.currentSavings) * 10000, // 丁E�E→�E
          monthlySavingsJPY: toNum(f.monthlySavings), // 冁E朁E

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

          interestScenario: '固定利回り',
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
