import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SimulationInputParams, YearlyData } from '../types/simulation';

// JSON Test page: upload/paste JSON and POST to /api/simulate
export default function JsonTestPage() {
  const navigate = useNavigate();
  const [jsonText, setJsonText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setJsonText(text);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleExecute = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const parsed = JSON.parse(jsonText) as unknown;

      // helpers
      const toNum = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
      const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
      const isInputParams = (v: unknown): v is Record<string, unknown> => isRecord(v) && ('initialAge' in v || 'endAge' in v);
      const isWrapped = (v: unknown): v is { inputParams: Record<string, unknown> } => isRecord(v) && 'inputParams' in v;
      const isFormLike = (v: unknown): v is Record<string, unknown> => isRecord(v) && ('personAge' in v || 'simulationPeriodAge' in v);
      const isYes = (value: unknown): boolean => {
        const s = String(value ?? '').trim().toLowerCase();
        return s === 'yes' || s === 'true' || s === '1' || s === 'する';
      };

      const buildFromForm = (f: Record<string, unknown>) => {
        // Current amounts (10k JPY inputs -> JPY)
        const stocksCurrent = toNum(f.investmentStocksCurrent) * 10000;
        const trustCurrent = toNum(f.investmentTrustCurrent) * 10000;
        const idecoCurrent = toNum(f.investmentIdecoCurrent) * 10000;
        const bondsCurrent = toNum(f.investmentBondsCurrent) * 10000;
        const cryptoCurrent = toNum(f.investmentCryptoCurrent) * 10000;
        const otherCurrent = toNum(f.investmentOtherCurrent) * 10000;

        // Monthly
        const monthly = (f.monthlyInvestmentAmounts as Record<string, unknown> | undefined) ?? {};
        const m = (k: string) => toNum((monthly as Record<string, unknown>)[k]);
        const mStocks = m('investmentStocksMonthly');
        const mTrust  = m('investmentTrustMonthly');
        const mIdeco  = m('investmentIdecoMonthly');
        const mBonds  = m('investmentBondsMonthly');
        const mCrypto = m('investmentCryptoMonthly');
        const mOther  = m('investmentOtherMonthly');

        // Annual spots (already JPY/year)
        const sStocks = toNum(f.investmentStocksAnnualSpot);
        const sTrust  = toNum(f.investmentTrustAnnualSpot);
        const sIdeco  = toNum(f.investmentIdecoAnnualSpot);
        const sBonds  = toNum(f.investmentBondsAnnualSpot);
        const sCrypto = toNum(f.investmentCryptoAnnualSpot);
        const sOther  = toNum(f.investmentOtherAnnualSpot);

        // Account types (NISA or taxable)
        const stocksIsNisa = String(f.investmentStocksAccountType ?? 'taxable') === 'nisa';
        const trustIsNisa  = String(f.investmentTrustAccountType ?? 'taxable') === 'nisa';

        // Build products. Use ASCII accounts except iDeCo; API recognizes iDeCo by account OR key.
        const products: Array<{ key: 'stocks'|'trust'|'bonds'|'crypto'|'other'|'ideco'; account: 'NISA'|'iDeCo'|'taxable'; currentJPY: number; recurringJPY: number; spotJPY: number; expectedReturn: number }> = [];
        const push = (key: 'stocks'|'trust'|'bonds'|'crypto'|'other'|'ideco', account: 'NISA'|'iDeCo'|'taxable', cur: number, monthlyJPY: number, spot: number, ratePct: number) => {
          const recurringJPY = Math.max(0, monthlyJPY) * 12;
          const currentJPY = Math.max(0, cur);
          const spotJPY = Math.max(0, spot);
          const expectedReturn = (Number.isFinite(ratePct) ? ratePct : 0) / 100;
          if (currentJPY > 0 || recurringJPY > 0 || spotJPY > 0) {
            products.push({ key, account, currentJPY, recurringJPY, spotJPY, expectedReturn });
          }
        };
        push('stocks', stocksIsNisa ? 'NISA' : 'taxable', stocksCurrent, mStocks, sStocks, toNum(f.investmentStocksRate));
        push('trust',  trustIsNisa  ? 'NISA' : 'taxable', trustCurrent,  mTrust,  sTrust,  toNum(f.investmentTrustRate));
        push('ideco',  'iDeCo', idecoCurrent, mIdeco, sIdeco, toNum(f.investmentIdecoRate));
        push('bonds',  'taxable', bondsCurrent,  mBonds,  sBonds,  toNum(f.investmentBondsRate));
        push('crypto', 'taxable', cryptoCurrent, mCrypto, sCrypto, toNum(f.investmentCryptoRate));
        push('other',  'taxable', otherCurrent,  mOther,  sOther,  toNum(f.investmentOtherRate));

        // NISA/taxable taxation breakdown retains caps logic on API side
        const nisaCurrentHoldingsJPY = (stocksIsNisa ? stocksCurrent : 0) + (trustIsNisa ? trustCurrent : 0);
        const taxableCurrentHoldingsJPY = (!stocksIsNisa ? stocksCurrent : 0) + (!trustIsNisa ? trustCurrent : 0) + bondsCurrent + cryptoCurrent + otherCurrent;
        const nisaRecurringAnnualJPY = (stocksIsNisa ? mStocks * 12 : 0) + (trustIsNisa ? mTrust * 12 : 0);
        const taxableRecurringAnnualJPY = (!stocksIsNisa ? mStocks * 12 : 0) + (!trustIsNisa ? mTrust * 12 : 0) + (mBonds + mCrypto + mOther) * 12;
        const nisaSpotAnnualJPY = (stocksIsNisa ? sStocks : 0) + (trustIsNisa ? sTrust : 0);
        const taxableSpotAnnualJPY = (!stocksIsNisa ? sStocks : 0) + (!trustIsNisa ? sTrust : 0) + sBonds + sCrypto + sOther;

        const expectedReturn = [f.investmentStocksRate, f.investmentTrustRate, f.investmentBondsRate, f.investmentIdecoRate, f.investmentCryptoRate, f.investmentOtherRate]
          .map(toNum).filter(Number.isFinite).reduce((a,b)=>a+b,0) / 100 / 6 || 0.04;

        // Car (minimal)
        const car = {
          priceJPY: toNum(f.carPrice) * 10000,
          firstAfterYears: toNum(f.carFirstReplacementAfterYears),
          frequencyYears: toNum(f.carReplacementFrequency),
          loan: { use: isYes(f.carLoanUsage), years: isYes(f.carLoanUsage) ? toNum(f.carLoanYears) : undefined, type: isYes(f.carLoanUsage) ? (f.carLoanType as string | undefined) : undefined },
          currentLoan: undefined as | { monthlyPaymentJPY: number; remainingMonths: number } | undefined,
        };
        const carMonthly = toNum(f.carCurrentLoanMonthly);
        const carRemain = toNum(f.carCurrentLoanRemainingMonths);
        if (isYes(f.carCurrentLoanInPayment) && carMonthly > 0 && carRemain > 0) car.currentLoan = { monthlyPaymentJPY: carMonthly, remainingMonths: carRemain };

        // Housing (minimal)
        const rentYen = toNum(f.currentRentLoanPayment);
        const houseLoanMonthly = toNum(f.loanMonthlyPayment);
        const houseLoanRemain = toNum(f.loanRemainingYears);
        const housingTypeRaw = String(f.housingType ?? '').toLowerCase();
        let housingType: '賃貸'|'持ち家（ローン中）'|'持ち家（完済）' = '持ち家（完済）';
        if (housingTypeRaw.includes('賃') || rentYen > 0) housingType = '賃貸';
        else if (housingTypeRaw.includes('ローン') || (houseLoanMonthly > 0 && houseLoanRemain > 0)) housingType = '持ち家（ローン中）';
        const housing = {
          type: housingType,
          rentMonthlyJPY: housingType === '賃貸' && rentYen > 0 ? rentYen : undefined,
          currentLoan: housingType === '持ち家（ローン中）' && houseLoanMonthly > 0 && houseLoanRemain > 0 ? { monthlyPaymentJPY: houseLoanMonthly, remainingYears: houseLoanRemain } : undefined,
        };

        // Appliances
        const appliances = Array.isArray(f.appliances)
          ? (f.appliances as Array<Record<string, unknown>>)
              .map(a => ({ name: String(a.name ?? '').trim(), cycleYears: toNum(a.cycle), firstAfterYears: toNum(a.firstReplacementAfterYears), cost10kJPY: toNum(a.cost) }))
              .filter(a => a.name && a.cycleYears > 0 && a.cost10kJPY > 0)
          : [];

        return {
          initialAge: toNum(f.personAge),
          endAge: toNum(f.simulationPeriodAge),
          retirementAge: toNum(f.retirementAge),
          pensionStartAge: toNum(f.pensionStartAge),
          mainJobIncomeGross: toNum(f.mainIncome) * 10000,
          sideJobIncomeGross: toNum(f.sideJobIncome) * 10000,
          spouseMainJobIncomeGross: toNum(f.spouseMainIncome) * 10000,
          spouseSideJobIncomeGross: toNum(f.spouseSideJobIncome) * 10000,
          incomeGrowthRate: 0,
          spouseIncomeGrowthRate: 0,
          expenseMode: toNum(f.livingCostSimple) > 0 ? 'simple' : 'detailed',
          livingCostSimpleAnnual: toNum(f.livingCostSimple) > 0 ? toNum(f.livingCostSimple) * 12 : undefined,
          car,
          housing,
          appliances,
          care: { assume: isYes(f.parentCareAssumption), parentCurrentAge: toNum(f.parentCurrentAge), parentCareStartAge: toNum(f.parentCareStartAge), years: toNum(f.parentCareYears), monthly10kJPY: toNum(f.parentCareMonthlyCost) },
          postRetirementLiving10kJPY: toNum(f.postRetirementLivingCost),
          pensionMonthly10kJPY: toNum(f.pensionAmount),
          currentSavingsJPY: toNum(f.currentSavings) * 10000,
          monthlySavingsJPY: toNum(f.monthlySavings),
          currentInvestmentsJPY: stocksCurrent + trustCurrent + idecoCurrent + bondsCurrent + cryptoCurrent + otherCurrent,
          yearlyRecurringInvestmentJPY: (mStocks + mTrust + mIdeco + mBonds + mCrypto + mOther) * 12,
          yearlySpotJPY: sStocks + sTrust + sIdeco + sBonds + sCrypto + sOther,
          expectedReturn,
          products,
          investmentTaxation: { nisa: { currentHoldingsJPY: nisaCurrentHoldingsJPY, annualRecurringContributionJPY: nisaRecurringAnnualJPY, annualSpotContributionJPY: nisaSpotAnnualJPY }, taxable: { currentHoldingsJPY: taxableCurrentHoldingsJPY, annualRecurringContributionJPY: taxableRecurringAnnualJPY, annualSpotContributionJPY: taxableSpotAnnualJPY } },
          stressTest: { enabled: false, seed: toNum(f.stressTestSeed) },
          interestScenario: '固定利回り',
          emergencyFundJPY: toNum(f.emergencyFund) * 10000,
        };
      };

      // Build payload and minimal navigation state
      let payload: { inputParams: Record<string, unknown> };
      let navCandidate: SimulationInputParams | null = null;
      if (isWrapped(parsed)) {
        const raw = parsed.inputParams as Record<string, unknown>;
        payload = { inputParams: raw };
        if ('initialAge' in raw && 'retirementAge' in raw) {
          navCandidate = {
            initialAge: toNum(raw.initialAge),
            spouseInitialAge: 'spouseInitialAge' in raw ? toNum(raw.spouseInitialAge) : undefined,
            retirementAge: toNum(raw.retirementAge),
            mainJobIncomeGross: toNum(raw.mainJobIncomeGross),
            sideJobIncomeGross: toNum(raw.sideJobIncomeGross),
            spouseMainJobIncomeGross: 'spouseMainJobIncomeGross' in raw ? toNum(raw.spouseMainJobIncomeGross) : undefined,
            spouseSideJobIncomeGross: 'spouseSideJobIncomeGross' in raw ? toNum(raw.spouseSideJobIncomeGross) : undefined,
            currentSavingsJPY: toNum(raw.currentSavingsJPY),
            monthlySavingsJPY: toNum(raw.monthlySavingsJPY),
            currentInvestmentsJPY: toNum(raw.currentInvestmentsJPY),
            yearlyRecurringInvestmentJPY: toNum(raw.yearlyRecurringInvestmentJPY),
            yearlySpotJPY: toNum(raw.yearlySpotJPY),
            expectedReturn: Number(raw.expectedReturn ?? 0),
            emergencyFundJPY: toNum(raw.emergencyFundJPY),
          };
        }
      } else if (isInputParams(parsed)) {
        const raw = parsed as Record<string, unknown>;
        payload = { inputParams: raw };
        if ('initialAge' in raw && 'retirementAge' in raw) {
          navCandidate = {
            initialAge: toNum(raw.initialAge),
            spouseInitialAge: 'spouseInitialAge' in raw ? toNum(raw.spouseInitialAge) : undefined,
            retirementAge: toNum(raw.retirementAge),
            mainJobIncomeGross: toNum(raw.mainJobIncomeGross),
            sideJobIncomeGross: toNum(raw.sideJobIncomeGross),
            spouseMainJobIncomeGross: 'spouseMainJobIncomeGross' in raw ? toNum(raw.spouseMainJobIncomeGross) : undefined,
            spouseSideJobIncomeGross: 'spouseSideJobIncomeGross' in raw ? toNum(raw.spouseSideJobIncomeGross) : undefined,
            currentSavingsJPY: toNum(raw.currentSavingsJPY),
            monthlySavingsJPY: toNum(raw.monthlySavingsJPY),
            currentInvestmentsJPY: toNum(raw.currentInvestmentsJPY),
            yearlyRecurringInvestmentJPY: toNum(raw.yearlyRecurringInvestmentJPY),
            yearlySpotJPY: toNum(raw.yearlySpotJPY),
            expectedReturn: Number(raw.expectedReturn ?? 0),
            emergencyFundJPY: toNum(raw.emergencyFundJPY),
          };
        }
      } else if (isFormLike(parsed)) {
        const built = buildFromForm(parsed as Record<string, unknown>);
        payload = { inputParams: built };
        navCandidate = {
          initialAge: built.initialAge,
          spouseInitialAge: ("spouseInitialAge" in (built as unknown as Record<string, unknown>) ? (built as unknown as Record<string, unknown>).spouseInitialAge as number : undefined),
          retirementAge: built.retirementAge,
          mainJobIncomeGross: built.mainJobIncomeGross,
          sideJobIncomeGross: built.sideJobIncomeGross,
          spouseMainJobIncomeGross: built.spouseMainJobIncomeGross,
          spouseSideJobIncomeGross: built.spouseSideJobIncomeGross,
          currentSavingsJPY: built.currentSavingsJPY,
          monthlySavingsJPY: built.monthlySavingsJPY,
          currentInvestmentsJPY: built.currentInvestmentsJPY,
          yearlyRecurringInvestmentJPY: built.yearlyRecurringInvestmentJPY,
          yearlySpotJPY: built.yearlySpotJPY,
          expectedReturn: built.expectedReturn,
          emergencyFundJPY: built.emergencyFundJPY,
        };
      } else {
        throw new Error('Unsupported JSON format. Provide InputParams or { inputParams: {...} } or form-like JSON.');
      }

      const res = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error((data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) ? String((data as Record<string, unknown>).message) : 'API error');

      const yearlyRaw = (data as Record<string, unknown>).yearlyData;
      const yearlyData = Array.isArray(yearlyRaw) ? (yearlyRaw as YearlyData[]) : [];
      if (yearlyData.length === 0) throw new Error('Simulation API returned no yearlyData array.');
      if (!navCandidate) throw new Error('Unable to derive minimal navigation params.');
      navigate('/result', { state: { yearlyData, inputParams: navCandidate } });
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
        <p className="text-sm text-gray-600 mb-4">Upload or paste simulation JSON, send it to /api/simulate, and view the dashboard.</p>
        <div className="bg-white rounded border p-4 mb-4">
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Upload JSON file</label>
            <input type="file" accept="application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">Paste JSON</label>
            <textarea className="w-full h-48 border rounded p-2 font-mono text-xs" placeholder="Paste InputParams or form-like JSON" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" onClick={handleExecute} disabled={busy || !jsonText.trim()}>
            {busy ? 'Running...' : 'Run & View Result'}
          </button>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}

