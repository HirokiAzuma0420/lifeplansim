import type { FormDataState } from '@/types/form-types';
import * as FC from '@/constants/financial_const';
import { n } from './financial';

type FormValue = FormDataState[keyof FormDataState];

type ValidationRule = {
  message: string;
  // value は string | number | boolean | null | undefined など、フォームデータの値の型
  // formData はフォーム全体のデータ
  isValid: (value: FormValue, formData: FormDataState) => boolean;
};

export type FieldValidationRules = { [key: string]: ValidationRule[] };

const isRequired = (value: unknown) => value !== '' && value !== null && value !== undefined && String(value).trim().length > 0;
const isPositiveNumber = (value: unknown) => isRequired(value) && !isNaN(n(value)) && n(value) > 0;
const isZeroOrGreater = (value: unknown) => isRequired(value) && !isNaN(n(value)) && n(value) >= 0;
const isAgeValid = (value: unknown) => isRequired(value) && !isNaN(n(value)) && n(value) >= FC.VALIDATION_MIN_AGE && n(value) <= FC.VALIDATION_MAX_AGE;
const isAgeOrFutureAgeValid = (value: unknown, personAge: unknown) => isRequired(value) && !isNaN(n(value)) && n(value) >= n(personAge) && n(value) <= FC.VALIDATION_MAX_AGE;

const areAllAppliancesValid = (appliances: FormDataState['appliances']) => appliances.every(a => isRequired(a.name) && isPositiveNumber(a.cycle) && isPositiveNumber(a.cost) && isRequired(a.firstReplacementAfterYears) && isZeroOrGreater(a.firstReplacementAfterYears));

// --- セクションごとのバリデーションルール定義 ---

// --- 家族構成 ---
const familyCompositionRules: FieldValidationRules = {
  familyComposition: [
    { message: '家族構成を選択してください。', isValid: isRequired },
  ],
};

// --- 現在の収入 ---
const currentIncomeRules: FieldValidationRules = {
  personAge: [
    { message: `年齢は${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`, isValid: isAgeValid },
  ],
  spouseAge: [
    { message: `配偶者の年齢は${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`, isValid: (v, fd) => fd.familyComposition !== '既婚' || isAgeValid(v) },
  ],
  mainIncome: [
    { message: '本業年間収入（額面）を入力してください。', isValid: isPositiveNumber },
  ],
  spouseMainIncome: [
    { message: '配偶者の本業年間収入（額面）を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isPositiveNumber(v) },
  ],
};

// --- 現在の支出 ---
const currentExpensesRules: FieldValidationRules = {
  expenseMethod: [
    { message: '支出の入力方法を選択してください。', isValid: isRequired },
  ],
  livingCostSimple: [
    { message: '月々の生活費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '簡単' || isPositiveNumber(v) },
  ],
  utilitiesCost: [
    { message: '水道・光熱費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  communicationCost: [
    { message: '通信費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  insuranceCost: [
    { message: '保険料を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  educationCost: [
    { message: '教養・教育費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  foodCost: [
    { message: '食費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  dailyNecessitiesCost: [
    { message: '日用品費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
  transportationCost: [
    { message: '交通費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '詳細' || isPositiveNumber(v) },
  ],
};

// --- ライフイベント - 結婚 ---
const marriageRules: FieldValidationRules = {
  planToMarry: [
    { message: '結婚の予定を選択してください。', isValid: (v, fd) => fd.familyComposition !== '独身' || isRequired(v) },
  ],
  marriageAge: [
    { message: '結婚する年齢を入力してください。', isValid: (v, fd) => fd.planToMarry !== 'する' || isRequired(v) },
  ],
  spouseAgeAtMarriage: [
    { message: '結婚相手の年齢を入力してください。', isValid: (v, fd) => fd.planToMarry !== 'する' || isRequired(v) },
  ],
  spouseIncomePattern: [
    { message: '結婚相手の収入を選択してください。', isValid: (v, fd) => fd.planToMarry !== 'する' || isRequired(v) },
  ],
  spouseCustomIncome: [
    { message: '結婚相手の収入を入力してください。', isValid: (v, fd) => fd.spouseIncomePattern !== 'カスタム' || isPositiveNumber(v) },
  ],
  livingCostAfterMarriage: [
    { message: '結婚後の生活費を入力してください。', isValid: (v, fd) => fd.planToMarry !== 'する' || isPositiveNumber(v) },
  ],
  housingCostAfterMarriage: [
    { message: '結婚後の住居費を入力してください。', isValid: (v, fd) => fd.planToMarry !== 'する' || isPositiveNumber(v) },
  ],
};

// --- ライフイベント - 子ども ---
const childrenRules: FieldValidationRules = {
  hasChildren: [
    { message: 'お子さまの有無を選択してください。', isValid: isRequired },
  ],
  numberOfChildren: [
    { message: 'お子さまの人数を入力してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || (isPositiveNumber(v) && n(v) > 0) },
  ],
  firstBornAge: [
    { message: '第一子の年齢を入力してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || (isRequired(v) && n(v) >= 0) },
  ],
  educationPattern: [
    { message: '教育方針を選択してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || isRequired(v) },
  ],
};

// --- ライフイベント - 住宅 ---
const housingRules: FieldValidationRules = {
  housingType: [
    { message: '現在の住居タイプを選択してください。', isValid: isRequired },
  ],
  currentRentLoanPayment: [
    { message: '現在の家賃を入力してください。', isValid: (v, fd) => fd.housingType !== '賃貸' || isPositiveNumber(v) },
  ],
  loanRemainingYears: [
    { message: '住宅ローンの残年数を入力してください。', isValid: (v, fd) => fd.housingType !== '持ち家（ローン中）' || isPositiveNumber(v) },
  ],
  loanMonthlyPayment: [
    { message: '月額返済額を入力してください。', isValid: (v, fd) => fd.housingType !== '持ち家（ローン中）' || isPositiveNumber(v) },
  ],
  housePurchaseIntent: [
    { message: '住宅購入の意向を選択してください。', isValid: (v, fd) => fd.housingType !== '賃貸' || isRequired(v) },
  ],
  'housePurchasePlan.age': [
    { message: '購入予定年齢を入力してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isAgeOrFutureAgeValid(v, fd.personAge) },
    { message: '購入予定年齢は現在の年齢以上に設定してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isAgeOrFutureAgeValid(v, fd.personAge) },
  ],
  'housePurchasePlan.price': [
    { message: '予定価格を入力してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isPositiveNumber(v) },
  ],
  'housePurchasePlan.downPayment': [
    { message: '頭金を入力してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isZeroOrGreater(v) },
  ],
  'housePurchasePlan.loanYears': [
    { message: 'ローン年数を入力してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isPositiveNumber(v) },
  ],
  'housePurchasePlan.interestRate': [
    { message: '想定金利を入力してください。', isValid: (v, fd) => fd.housePurchaseIntent !== 'yes' || isZeroOrGreater(v) },
  ],
  'houseRenovationPlans.0.age': [
    { message: 'リフォームの実施予定年齢を入力してください。', isValid: (v, fd) => fd.houseRenovationPlans.length === 0 || isAgeOrFutureAgeValid(v, fd.personAge) },
    { message: '実施予定年齢は現在の年齢以上に設定してください。', isValid: (v, fd) => fd.houseRenovationPlans.length === 0 || isAgeOrFutureAgeValid(v, fd.personAge) },
  ],
  'houseRenovationPlans.0.cost': [
    { message: 'リフォーム費用を入力してください。', isValid: (v, fd) => fd.houseRenovationPlans.length === 0 || isPositiveNumber(v) },
  ],
};

// --- ライフイベント - 車 ---
const carRules: FieldValidationRules = {
  carCurrentLoanInPayment: [
    { message: '現在のローン返済状況を選択してください。', isValid: isRequired },
  ],
  carCurrentLoanMonthly: [
    { message: '月々の返済額を入力してください。', isValid: (v, fd) => fd.carCurrentLoanInPayment !== 'yes' || isPositiveNumber(v) },
  ],
  carCurrentLoanRemainingMonths: [
    { message: '残り支払い回数を入力してください。', isValid: (v, fd) => fd.carCurrentLoanInPayment !== 'yes' || isPositiveNumber(v) },
  ],
  carPurchasePlan: [
    { message: '車の買い替え・購入予定を選択してください。', isValid: isRequired },
  ],
  carPrice: [
    { message: '購入予定の車の価格を入力してください。', isValid: (v, fd) => fd.carPurchasePlan !== 'yes' || isPositiveNumber(v) },
  ],
  carFirstReplacementAfterYears: [
    { message: '最初の購入・買い替え時期を入力してください。', isValid: (v, fd) => fd.carPurchasePlan !== 'yes' || isRequired(v) },
  ],
  carReplacementFrequency: [
    { message: '買い替え頻度を入力してください。', isValid: (v, fd) => fd.carPurchasePlan !== 'yes' || isPositiveNumber(v) },
  ],
  carLoanUsage: [
    { message: '自動車ローンの利用を選択してください。', isValid: (v, fd) => fd.carPurchasePlan !== 'yes' || isRequired(v) },
  ],
  carLoanYears: [
    { message: 'ローン年数を入力してください。', isValid: (v, fd) => fd.carLoanUsage !== 'はい' || isPositiveNumber(v) },
  ],
};

// --- ライフイベント - 介護 ---
const careRules: FieldValidationRules = {
  parentCareAssumption: [
    { message: '親の介護費用の想定を選択してください。', isValid: isRequired },
  ],
};

// --- 老後の計画・退職 ---
const retirementPlanRules: FieldValidationRules = {
  retirementAge: [
    { message: '退職年齢を入力してください。', isValid: isRequired },
  ],
  spouseRetirementAge: [
    { message: '配偶者の退職年齢を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isRequired(v) },
  ],
  postRetirementLivingCost: [
    { message: '老後の生活費（月々）を入力してください。', isValid: isPositiveNumber },
  ],
  pensionStartAge: [
    { message: '年金受給開始年齢を入力してください。', isValid: isRequired },
  ],
  pensionAmount: [
    { message: '年金受給額（月々）を入力してください。', isValid: isPositiveNumber },
  ],
  spousePensionStartAge: [
    { message: '配偶者の年金受給開始年齢を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isRequired(v) },
  ],
  spousePensionAmount: [
    { message: '配偶者の年金受給額（月々）を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isPositiveNumber(v) },
  ],
  reemploymentReductionRate: [
    { message: '定年再雇用時の減給率を入力してください。', isValid: (v, fd) => !fd.assumeReemployment || isRequired(v) },
  ],
  spouseReemploymentReductionRate: [
    { message: '配偶者の定年再雇用時の減給率を入力してください。', isValid: (v, fd) => !fd.spouseAssumeReemployment || isRequired(v) },
  ],
};

// --- 退職・年金（本人） ---
const retirementIncomeRules: FieldValidationRules = {
  'retirementIncome.amount': [
    { message: '退職金の受取額を入力してください。', isValid: (v, fd) => !fd.retirementIncome || isPositiveNumber(v) },
  ],
  'retirementIncome.age': [
    { message: '退職金の受取年齢を入力してください。', isValid: (v, fd) => !fd.retirementIncome || isAgeOrFutureAgeValid(v, fd.personAge) },
  ],
  'retirementIncome.yearsOfService': [
    { message: '退職金計算の勤続年数を入力してください。', isValid: (v, fd) => !fd.retirementIncome || isPositiveNumber(v) },
  ],
  'personalPensionPlans.*.amount': [
    { message: '個人年金の金額を入力してください。', isValid: (v) => isPositiveNumber(v) },
  ],
  'personalPensionPlans.*.startAge': [
    { message: '個人年金の受給開始年齢を入力してください。', isValid: (v, fd) => isAgeOrFutureAgeValid(v, fd.personAge) },
  ],
  'personalPensionPlans.*.duration': [
    { message: '個人年金の受給期間を入力してください。', isValid: (v, fd) => { const plan = fd.personalPensionPlans.find(p => p.duration === v); return !plan || plan.type !== 'fixedTerm' || isPositiveNumber(v); } },
  ],
  'otherLumpSums.*.name': [
    { message: 'その他一時金の名称を入力してください。', isValid: (v) => isRequired(v) },
  ],
  'otherLumpSums.*.amount': [
    { message: 'その他一時金の金額を入力してください。', isValid: (v) => isPositiveNumber(v) },
  ],
  'otherLumpSums.*.age': [
    { message: 'その他一時金の受取年齢を入力してください。', isValid: (v, fd) => isAgeOrFutureAgeValid(v, fd.personAge) },
  ],
};

// --- 退職・年金（配偶者） ---
const spouseRetirementIncomeRules: FieldValidationRules = {
  'spouseRetirementIncome.amount': [
    { message: '配偶者の退職金の受取額を入力してください。', isValid: (v, fd) => !fd.spouseRetirementIncome || isPositiveNumber(v) },
  ],
  'spouseRetirementIncome.age': [
    { message: '配偶者の退職金の受取年齢を入力してください。', isValid: (v, fd) => !fd.spouseRetirementIncome || isAgeOrFutureAgeValid(v, fd.spouseAge) },
  ],
  'spouseRetirementIncome.yearsOfService': [
    { message: '配偶者の退職金計算の勤続年数を入力してください。', isValid: (v, fd) => !fd.spouseRetirementIncome || isPositiveNumber(v) },
  ],
  'spousePersonalPensionPlans.*.amount': [
    { message: '配偶者の個人年金の金額を入力してください。', isValid: (v) => isPositiveNumber(v) },
  ],
  'spousePersonalPensionPlans.*.startAge': [
    { message: '配偶者の個人年金の受給開始年齢を入力してください。', isValid: (v, fd) => isAgeOrFutureAgeValid(v, fd.spouseAge) },
  ],
  'spousePersonalPensionPlans.*.duration': [
    { message: '配偶者の個人年金の受給期間を入力してください。', isValid: (v, fd) => { const plan = fd.spousePersonalPensionPlans.find(p => p.duration === v); return !plan || plan.type !== 'fixedTerm' || isPositiveNumber(v); } },
  ],
  'spouseOtherLumpSums.*.name': [
    { message: '配偶者のその他一時金の名称を入力してください。', isValid: (v) => isRequired(v) },
  ],
  'spouseOtherLumpSums.*.amount': [
    { message: '配偶者のその他一時金の金額を入力してください。', isValid: (v) => isPositiveNumber(v) },
  ],
  'spouseOtherLumpSums.*.age': [
    { message: '配偶者のその他一時金の受取年齢を入力してください。', isValid: (v, fd) => isAgeOrFutureAgeValid(v, fd.spouseAge) },
  ],
};

// --- 現在の資産 ---
const currentAssetsRules: FieldValidationRules = {
  currentSavings: [
    { message: '現在の預貯金額を入力してください。', isValid: isZeroOrGreater },
  ],
  emergencyFund: [
    { message: '生活防衛資金を入力してください。', isValid: isZeroOrGreater },
  ],
};

// --- シミュレーション設定 ---
const otherRules: FieldValidationRules = {
  simulationPeriodAge: [
    { message: 'シミュレーション終了年齢を入力してください。', isValid: (v, fd) => n(v) > n(fd.personAge) },
  ],
  interestRateScenario: [
    { message: '利回りのシナリオを選択してください。', isValid: isRequired },
  ],
  appliances: [
    {
      message: '追加した家電には、名称・周期・初回買替・価格をすべて入力してください。',
      isValid: (v) => (v as FormDataState['appliances']).length === 0 || areAllAppliancesValid(v as FormDataState['appliances']),
    },
  ],
  fixedInterestRate: [
    { message: '固定利回りを入力してください。', isValid: (v, fd) => fd.interestRateScenario !== '固定利回り' || isRequired(v) },
  ],
};

export const validationRules: FieldValidationRules = {
  ...familyCompositionRules,
  ...currentIncomeRules,
  ...currentExpensesRules,
  ...marriageRules,
  ...childrenRules,
  ...housingRules,
  ...carRules,
  ...careRules,
  ...retirementPlanRules,
  ...retirementIncomeRules,
  ...spouseRetirementIncomeRules,
  ...currentAssetsRules,
  ...otherRules,
};

// --- バリデーション実行関数 ---

export const validate = (formData: FormDataState, fields: (keyof FormDataState | string)[]): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  for (const field of fields) {
    // ワイルドカードキー（例: 'personalPensionPlans.*.amount'）にマッチさせる
    const ruleKey = Object.keys(validationRules).find(key => {
      if (key.includes('*')) {
        return new RegExp(key.replace(/\*/g, '\\d+')).test(field);
      }
      return key === field;
    });
    const rules = ruleKey ? validationRules[ruleKey] : undefined;
    if (rules) {
      // ネストされたプロパティの値を取得 (例: 'housePurchasePlan.age')
      const value = field.includes('.')
        ? field.split('.').reduce((obj: unknown, key: string) => {
            if (typeof obj === 'object' && obj !== null && key in obj) {
              return (obj as Record<string, unknown>)[key];
            }
            return undefined;
          }, formData)
        : formData[field as keyof FormDataState];

      for (const rule of rules) {
        if (!rule.isValid(value as FormValue, formData)) {
          errors[field] = rule.message;
          break; // 最初のバリデーションエラーでループを抜ける
        }
      }
    }
  }
  return errors;
};