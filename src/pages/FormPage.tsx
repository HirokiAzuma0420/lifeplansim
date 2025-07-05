import React, { useState, useMemo, useEffect } from 'react';

const sections = [
  '家族構成',
  '現在の収入',
  '現在の支出',
  'ライフイベント - 車',
  'ライフイベント - 家',
  'ライフイベント - 結婚',
  'ライフイベント - 子供',
  'ライフイベント - 生活',
  'ライフイベント - 親の介護',
  'ライフイベント - 老後',
  '貯蓄',
  '投資',
  'シミュレーション設定',
];

export default function FormPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState({
    familyComposition: '', // 独身／既婚
    mainIncome: '',
    spouseMainIncome: '',
    sideJobIncome: '0',
    spouseSideJobIncome: '0',
    expenseMethod: '', // 簡単／詳細
    livingCostSimple: '',
    housingCost: '',
    utilitiesCost: '',
    communicationCost: '',
    carCost: '',
    insuranceCost: '',
    educationCost: '',
    otherFixedCost: '0',
    foodCost: '',
    dailyNecessitiesCost: '',
    transportationCost: '',
    clothingBeautyCost: '',
    socializingCost: '',
    hobbyEntertainmentCost: '',
    otherVariableCost: '0',
    carPrice: '',
    carReplacementFrequency: '',
    housePurchaseAge: '',
    housingLoanYears: '',
    housingLoanInterestRateType: '', // 一般的な想定／指定
    housingLoanInterestRate: '',
    planToMarry: '', // する／しない
    marriageAge: '',
    engagementCost: '200',
    weddingCost: '330',
    honeymoonCost: '35',
    newHomeMovingCost: '50',
    hasChildren: '', // はい／いいえ
    numberOfChildren: '',
    firstBornAge: '',
    educationPattern: '', // 公立中心／公私混合／私立中心
    currentRentLoanPayment: '',
    otherLargeExpenses: '',
    parentCareAssumption: '', // はい／いいえ／まだ分からない
    parentCareMonthlyCost: '10',
    parentCareYears: '5',
    retirementAge: '65',
    postRetirementLivingCost: '25',
    pensionStartAge: '65',
    pensionAmount: '15',
    currentSavings: '',
    monthlySavings: '',
    hasInvestment: '', // はい／いいえ
    totalInvestmentValue: '',
    monthlyInvestmentAmount: '',
    investmentStocks: '',
    investmentTrust: '',
    investmentBonds: '',
    investmentIdeco: '',
    investmentCrypto: '',
    investmentOther: '',
    simulationPeriodAge: '90',
    interestRateScenario: '', // 固定利回り／ランダム変動
    emergencyFund: '300',
    riskTolerance: '', // 保守的／中庸／積極的
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? value : '', // Store value if checked, empty if unchecked
    }));
  };

  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const totalExpenses = useMemo(() => {
    if (formData.expenseMethod !== '詳細') return 0;
    const fixed = [
      formData.housingCost,
      formData.utilitiesCost,
      formData.communicationCost,
      formData.carCost,
      formData.insuranceCost,
      formData.educationCost,
      formData.otherFixedCost,
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);

    const variable = [
      formData.foodCost,
      formData.dailyNecessitiesCost,
      formData.transportationCost,
      formData.clothingBeautyCost,
      formData.socializingCost,
      formData.hobbyEntertainmentCost,
      formData.otherVariableCost,
    ].reduce((sum, val) => sum + (Number(val) || 0), 0);

    return fixed + variable;
  }, [formData]);

  const totalIncome = useMemo(() => {
    return (
      (Number(formData.mainIncome) || 0) +
      (Number(formData.spouseMainIncome) || 0) +
      (Number(formData.sideJobIncome) || 0) +
      (Number(formData.spouseSideJobIncome) || 0)
    );
  }, [formData.mainIncome, formData.spouseMainIncome, formData.sideJobIncome, formData.spouseSideJobIncome]);

  const totalMarriageCost = useMemo(() => {
    if (formData.planToMarry !== 'する') return 0;
    return (
      (Number(formData.engagementCost) || 0) +
      (Number(formData.weddingCost) || 0) +
      (Number(formData.honeymoonCost) || 0) +
      (Number(formData.newHomeMovingCost) || 0)
    );
  }, [formData.planToMarry, formData.engagementCost, formData.weddingCost, formData.honeymoonCost, formData.newHomeMovingCost]);

  const totalCareCost = useMemo(() => {
    if (formData.parentCareAssumption !== 'はい') return 0;
    return (
      (Number(formData.parentCareMonthlyCost) || 0) *
      (Number(formData.parentCareYears) || 0) *
      12
    );
  }, [formData.parentCareAssumption, formData.parentCareMonthlyCost, formData.parentCareYears]);

  const totalRetirementMonthly = useMemo(() => {
    return (
        (Number(formData.postRetirementLivingCost) || 0) - (Number(formData.pensionAmount) || 0)
    );
  }, [formData.postRetirementLivingCost, formData.pensionAmount]);

  const totalSavings = useMemo(() => {
    return (
        (Number(formData.currentSavings) || 0) +
        (Number(formData.monthlySavings) || 0) / 10000
    );
  }, [formData.currentSavings, formData.monthlySavings]);

  const totalInvestment = useMemo(() => {
    return (
        (Number(formData.totalInvestmentValue) || 0) +
        (Number(formData.monthlyInvestmentAmount) || 0) / 10000
    );
  }, [formData.totalInvestmentValue, formData.monthlyInvestmentAmount]);

  const displayTotalExpense = useMemo(() => {
    if (formData.expenseMethod === '簡単') {
      return Number(formData.livingCostSimple) || 0;
    }
    if (formData.expenseMethod === '詳細') {
      return totalExpenses;
    }
    return 0;
  }, [formData.expenseMethod, formData.livingCostSimple, totalExpenses]);

  useEffect(() => {
    if (formData.expenseMethod === '詳細') {
      const element = document.getElementById('detailed-expense');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [formData.expenseMethod]);

  const renderSection = () => {
    switch (sections[currentSectionIndex]) {
      case '家族構成':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q1.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                現在の家族構成は？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="familyComposition"
                    value="独身"
                    checked={formData.familyComposition === '独身'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">独身</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="familyComposition"
                    value="既婚"
                    checked={formData.familyComposition === '既婚'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">既婚</span>
                </label>
              </div>
            </div>
          </div>
        );
      case '現在の収入':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q2.png"></img>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">年間収入総額: {totalIncome.toLocaleString()}万円</h3>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mainIncome">
                本業年間収入[万円]
              </label>
              <input
                type="number"
                id="mainIncome"
                name="mainIncome"
                value={formData.mainIncome}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseMainIncome">
                  配偶者の本業年間収入[万円]
                </label>
                <input
                  type="number"
                  id="spouseMainIncome"
                  name="spouseMainIncome"
                  value={formData.spouseMainIncome}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sideJobIncome">
                副業年間収入[万円]
              </label>
              <input
                type="number"
                id="sideJobIncome"
                name="sideJobIncome"
                value={formData.sideJobIncome}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                defaultValue={0}
              />
            </div>
            <div className={`mb-4 accordion-content ${formData.familyComposition === '既婚' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseSideJobIncome">
                  配偶者の副業年間収入[万円]
                </label>
                <input
                  type="number"
                  id="spouseSideJobIncome"
                  name="spouseSideJobIncome"
                  value={formData.spouseSideJobIncome}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  defaultValue={0}
                />
              </div>
          </div>
        );
      case '現在の支出':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q3.png"></img>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">生活費総額: {displayTotalExpense.toLocaleString()}円</h3>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                支出の入力方法を選んでください。
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="expenseMethod"
                    value="簡単"
                    checked={formData.expenseMethod === '簡単'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">簡単</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="expenseMethod"
                    value="詳細"
                    checked={formData.expenseMethod === '詳細'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">詳細</span>
                </label>
              </div>
            </div>

            <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <div className={`mb-4 accordion-content ${formData.expenseMethod === '簡単' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="livingCostSimple">
                  生活費（住居費含む、貯蓄・投資除く）[円]
                </label>
                <input
                  type="number"
                  id="livingCostSimple"
                  name="livingCostSimple"
                  value={formData.livingCostSimple}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              </div>

            <div id="detailed-expense" className={`accordion-content ${formData.expenseMethod === '詳細' ? 'open' : ''}`}>
                <h3 className="text-lg font-semibold mb-2">固定費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housingCost">
                    住宅[円]
                  </label>
                  <input type="number" id="housingCost" name="housingCost" value={formData.housingCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="utilitiesCost">
                    水道・光熱費[円]
                  </label>
                  <input type="number" id="utilitiesCost" name="utilitiesCost" value={formData.utilitiesCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="communicationCost">
                    通信費[円]
                  </label>
                  <input type="number" id="communicationCost" name="communicationCost" value={formData.communicationCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carCost">
                    自動車（ローン含む）[円]
                  </label>
                  <input type="number" id="carCost" name="carCost" value={formData.carCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceCost">
                    保険[円]
                  </label>
                  <input type="number" id="insuranceCost" name="insuranceCost" value={formData.insuranceCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationCost">
                    教養・教育[円]
                  </label>
                  <input type="number" id="educationCost" name="educationCost" value={formData.educationCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherFixedCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherFixedCost" name="otherFixedCost" value={formData.otherFixedCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={0} />
                </div>

                <h3 className="text-lg font-semibold mb-2">変動費</h3>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foodCost">
                    食費[円]
                  </label>
                  <input type="number" id="foodCost" name="foodCost" value={formData.foodCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dailyNecessitiesCost">
                    日用品[円]
                  </label>
                  <input type="number" id="dailyNecessitiesCost" name="dailyNecessitiesCost" value={formData.dailyNecessitiesCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transportationCost">
                    交通費[円]
                  </label>
                  <input type="number" id="transportationCost" name="transportationCost" value={formData.transportationCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clothingBeautyCost">
                    衣類・美容[円]
                  </label>
                  <input type="number" id="clothingBeautyCost" name="clothingBeautyCost" value={formData.clothingBeautyCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="socializingCost">
                    交際費[円]
                  </label>
                  <input type="number" id="socializingCost" name="socializingCost" value={formData.socializingCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hobbyEntertainmentCost">
                    趣味・娯楽[円]
                  </label>
                  <input type="number" id="hobbyEntertainmentCost" name="hobbyEntertainmentCost" value={formData.hobbyEntertainmentCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherVariableCost">
                    その他[円]
                  </label>
                  <input type="number" id="otherVariableCost" name="otherVariableCost" value={formData.otherVariableCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={0} />
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 車':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-car.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carPrice">
                今後買い替える車の価格帯は？[万円]
              </label>
              <input type="number" id="carPrice" name="carPrice" value={formData.carPrice} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carReplacementFrequency">
                車を乗り換える頻度は？[年]
              </label>
              <input type="number" id="carReplacementFrequency" name="carReplacementFrequency" value={formData.carReplacementFrequency} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
          </div>
        );
      case 'ライフイベント - 家':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-home.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housePurchaseAge">
                住宅購入予定は何歳のとき？[歳]
              </label>
              <input type="number" id="housePurchaseAge" name="housePurchaseAge" value={formData.housePurchaseAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housingLoanYears">
                住宅ローン年数は？[年]
              </label>
              <input type="number" id="housingLoanYears" name="housingLoanYears" value={formData.housingLoanYears} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                住宅ローンの想定利率は？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="housingLoanInterestRateType"
                    value="一般的な想定"
                    checked={formData.housingLoanInterestRateType === '一般的な想定'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">一般的な想定</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="housingLoanInterestRateType"
                    value="指定"
                    checked={formData.housingLoanInterestRateType === '指定'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">指定</span>
                </label>
              </div>
            </div>
            <div className={`accordion-content ${formData.housingLoanInterestRateType === '指定' ? 'open' : ''}`}>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="housingLoanInterestRate">
                  想定利率[%]
                </label>
                <input type="number" id="housingLoanInterestRate" name="housingLoanInterestRate" value={formData.housingLoanInterestRate} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
              </div>
          </div>
        );
      case 'ライフイベント - 結婚':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-marriage.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                結婚を予定していますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="planToMarry"
                    value="する"
                    checked={formData.planToMarry === 'する'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">する</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="planToMarry"
                    value="しない"
                    checked={formData.planToMarry === 'しない'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">しない</span>
                </label>
              </div>
            </div>
            <div className={`accordion-content ${formData.planToMarry === 'する' ? 'open' : ''}`}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">結婚関連費用総額: {totalMarriageCost.toLocaleString()}万円</h3>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="marriageAge">
                    結婚予定年齢は？[歳]
                  </label>
                  <input type="number" id="marriageAge" name="marriageAge" value={formData.marriageAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="engagementCost">
                    婚約関連費用（指輪・結納金など）[万円]
                  </label>
                  <input type="number" id="engagementCost" name="engagementCost" value={formData.engagementCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={200} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="weddingCost">
                    結婚式費用[万円]
                  </label>
                  <input type="number" id="weddingCost" name="weddingCost" value={formData.weddingCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={330} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="honeymoonCost">
                    新婚旅行費用[万円]
                  </label>
                  <input type="number" id="honeymoonCost" name="honeymoonCost" value={formData.honeymoonCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={35} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHomeMovingCost">
                    新居への引っ越し費用[万円]
                  </label>
                  <input type="number" id="newHomeMovingCost" name="newHomeMovingCost" value={formData.newHomeMovingCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={50} />
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 子供':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-children.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                子供はいますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasChildren"
                    value="はい"
                    checked={formData.hasChildren === 'はい'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasChildren"
                    value="いいえ"
                    checked={formData.hasChildren === 'いいえ'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">いいえ</span>
                </label>
              </div>
            </div>
            <div className={`accordion-content ${formData.hasChildren === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numberOfChildren">
                    子供の人数は？[人]
                  </label>
                  <input type="number" id="numberOfChildren" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstBornAge">
                    最初の子が生まれる予定年齢は？[歳]
                  </label>
                  <input type="number" id="firstBornAge" name="firstBornAge" value={formData.firstBornAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="educationPattern">
                    教育費の想定パターンは？
                  </label>
                  <select
                    id="educationPattern"
                    name="educationPattern"
                    value={formData.educationPattern}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="公立中心">公立中心（〜1,000万円/人）</option>
                    <option value="公私混合">公私混合（〜1,600万円/人）</option>
                    <option value="私立中心">私立中心（〜2,000万円/人）</option>
                  </select>
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 生活':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-appliances.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentRentLoanPayment">
                現在の家賃または住宅ローンの毎月支払額は？[万円]
              </label>
              <input type="number" id="currentRentLoanPayment" name="currentRentLoanPayment" value={formData.currentRentLoanPayment} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otherLargeExpenses">
                その他、将来想定される大きな支出はありますか？
              </label>
              <textarea
                id="otherLargeExpenses"
                name="otherLargeExpenses"
                value={formData.otherLargeExpenses}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={4}
                placeholder="例：海外移住、転職・独立資金、留学、事業資金 など"
              ></textarea>
            </div>
          </div>
        );
      case 'ライフイベント - 親の介護':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-parenthelp.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                親の介護が将来発生すると想定しますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="はい"
                    checked={formData.parentCareAssumption === 'はい'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="いいえ"
                    checked={formData.parentCareAssumption === 'いいえ'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">いいえ</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="parentCareAssumption"
                    value="まだ分からない"
                    checked={formData.parentCareAssumption === 'まだ分からない'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">まだ分からない</span>
                </label>
              </div>
            </div>
            <div className={`accordion-content ${formData.parentCareAssumption === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">介護費用総額: {totalCareCost.toLocaleString()}万円</h3>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCareMonthlyCost">
                    介護費用の想定（月額）[万円]
                  </label>
                  <input type="number" id="parentCareMonthlyCost" name="parentCareMonthlyCost" value={formData.parentCareMonthlyCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={10} />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="parentCareYears">
                    介護期間の想定[年]
                  </label>
                  <input type="number" id="parentCareYears" name="parentCareYears" value={formData.parentCareYears} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={5} />
                </div>
              </div>
          </div>
        );
      case 'ライフイベント - 老後':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-retirement.png"></img>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">老後の月間不足額: {totalRetirementMonthly.toLocaleString()}万円</h3>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="retirementAge">
                退職予定年齢は？[歳]
              </label>
              <input type="number" id="retirementAge" name="retirementAge" value={formData.retirementAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={65} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postRetirementLivingCost">
                老後の生活費（月額）[万円]
              </label>
              <input type="number" id="postRetirementLivingCost" name="postRetirementLivingCost" value={formData.postRetirementLivingCost} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={25} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionStartAge">
                年金の想定受給開始年齢は？[歳]
              </label>
              <input type="number" id="pensionStartAge" name="pensionStartAge" value={formData.pensionStartAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={65} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pensionAmount">
                年金受給額（月額）[万円]
              </label>
              <input type="number" id="pensionAmount" name="pensionAmount" value={formData.pensionAmount} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={15} />
            </div>
          </div>
        );
      case '貯蓄':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-savings.png"></img>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">貯蓄総額: {totalSavings.toLocaleString()}万円</h3>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentSavings">
                現在の預貯金総額は？[万円]
              </label>
              <input type="number" id="currentSavings" name="currentSavings" value={formData.currentSavings} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlySavings">
                毎月の貯蓄額は？[円]
              </label>
              <input type="number" id="monthlySavings" name="monthlySavings" value={formData.monthlySavings} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            </div>
          </div>
        );
      case '投資':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q4-investment.png"></img>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">投資総額: {totalInvestment.toLocaleString()}万円</h3>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                投資をしていますか？
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasInvestment"
                    value="はい"
                    checked={formData.hasInvestment === 'はい'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">はい</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="hasInvestment"
                    value="いいえ"
                    checked={formData.hasInvestment === 'いいえ'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">いいえ</span>
                </label>
              </div>
            </div>
            <div className={`accordion-content ${formData.hasInvestment === 'はい' ? 'open' : ''}`}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalInvestmentValue">
                    現在の投資額合計（時価評価額）[万円]
                  </label>
                  <input type="number" id="totalInvestmentValue" name="totalInvestmentValue" value={formData.totalInvestmentValue} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlyInvestmentAmount">
                    毎月の積立投資額[円]
                  </label>
                  <input type="number" id="monthlyInvestmentAmount" name="monthlyInvestmentAmount" value={formData.monthlyInvestmentAmount} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    主な投資先
                  </label>
                  <div className="mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input type="checkbox" className="form-checkbox" name="investmentStocks" value="株式" checked={!!formData.investmentStocks} onChange={handleCheckboxChange} />
                      <span className="ml-2">株式</span>
                    </label>
                    <label className="inline-flex items-center mr-4">
                      <input type="checkbox" className="form-checkbox" name="investmentTrust" value="投資信託" checked={!!formData.investmentTrust} onChange={handleCheckboxChange} />
                      <span className="ml-2">投資信託（NISAなど）</span>
                    </label>
                    <label className="inline-flex items-center mr-4">
                      <input type="checkbox" className="form-checkbox" name="investmentBonds" value="債券" checked={!!formData.investmentBonds} onChange={handleCheckboxChange} />
                      <span className="ml-2">債券</span>
                    </label>
                    <label className="inline-flex items-center mr-4">
                      <input type="checkbox" className="form-checkbox" name="investmentIdeco" value="iDeCo" checked={!!formData.investmentIdeco} onChange={handleCheckboxChange} />
                      <span className="ml-2">iDeCo</span>
                    </label>
                    <label className="inline-flex items-center mr-4">
                      <input type="checkbox" className="form-checkbox" name="investmentCrypto" value="仮想通貨" checked={!!formData.investmentCrypto} onChange={handleCheckboxChange} />
                      <span className="ml-2">仮想通貨</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="form-checkbox" name="investmentOther" value="その他" checked={!!formData.investmentOther} onChange={handleCheckboxChange} />
                      <span className="ml-2">その他</span>
                    </label>
                  </div>
                </div>
              </div>
          </div>
        );
      case 'シミュレーション設定':
        return (
          <div className="p-4">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-white mb-8 flex items-center justify-center text-gray-500 md:w-[1000px] md:h-[600px] mx-auto">
              <img src="/form/Q5-settings.png"></img>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="simulationPeriodAge">
                シミュレーションの対象期間（現在から何歳まで）[歳]
              </label>
              <input type="number" id="simulationPeriodAge" name="simulationPeriodAge" value={formData.simulationPeriodAge} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={90} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                利回りシナリオの選択
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="interestRateScenario"
                    value="固定利回り"
                    checked={formData.interestRateScenario === '固定利回り'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">固定利回り（例：年3%）</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="custom-radio"
                    name="interestRateScenario"
                    value="ランダム変動"
                    checked={formData.interestRateScenario === 'ランダム変動'}
                    onChange={handleRadioChange}
                    required
                  />
                  <span className="ml-2">ランダム変動（ストレステストあり）</span>
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyFund">
                生活防衛資金（常に確保したい現金額）[万円]
              </label>
              <input type="number" id="emergencyFund" name="emergencyFund" value={formData.emergencyFund} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" defaultValue={300} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="riskTolerance">
                運用リスク許容度
              </label>
              <select
                id="riskTolerance"
                name="riskTolerance"
                value={formData.riskTolerance}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">選択してください</option>
                <option value="保守的">保守的（元本重視）</option>
                <option value="中庸">中庸（バランス型）</option>
                <option value="積極的">積極的（リスク許容）</option>
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg md:max-w-5xl">
        {/* Progress Bar */}
        <div className="w-full bg-gray-300 h-4 fixed top-0 left-0 right-0 z-10 rounded-t-lg">
          <div
            className="bg-blue-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="md:flex">
          <div className="w-full p-4">
            {renderSection()}
            <div className="flex justify-center space-x-4 mt-6">
              {currentSectionIndex > 0 && (
                <button
                  onClick={goToPreviousSection}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  戻る
                </button>
              )}
              {currentSectionIndex < sections.length - 1 ? (
                <button
                  onClick={goToNextSection}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  次へ
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  完了
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}