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
const isPositiveNumber = (value: unknown) => isRequired(value) && n(value) > 0;
const isZeroOrGreater = (value: unknown) => isRequired(value) && n(value) >= 0;
const isAgeValid = (value: unknown) => isRequired(value) && n(value) >= FC.VALIDATION_MIN_AGE && n(value) <= FC.VALIDATION_MAX_AGE;
const isAgeOrFutureAgeValid = (value: unknown, personAge: unknown) => isRequired(value) && n(value) >= n(personAge) && n(value) <= FC.VALIDATION_MAX_AGE;

const areAllAppliancesValid = (appliances: FormDataState['appliances']) => appliances.every(a => isRequired(a.name) && isPositiveNumber(a.cycle) && isPositiveNumber(a.cost));

export const validationRules: FieldValidationRules = {
  // --- 家族構成 ---
  familyComposition: [
    { message: '家族構成を選択してください。', isValid: isRequired },
  ],

  // --- 現在の収入 ---
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

  // --- 現在の支出 ---
  expenseMethod: [
    { message: '支出の入力方法を選択してください。', isValid: isRequired },
  ],
  livingCostSimple: [
    { message: '月々の生活費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '簡単' || isPositiveNumber(v) },
  ],
  // (詳細支出)
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

  // --- ライフイベント - 結婚 ---
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

  // --- ライフイベント - 子ども ---
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

  // --- ライフイベント - 住宅 ---
  housingType: [
    { message: '現在の住居タイプを選択してください。', isValid: isRequired },
  ],
  currentRentLoanPayment: [
    { message: '現在の家賃またはローン月額を入力してください。', isValid: (v, fd) => fd.housingType === '持ち家（完済）' || isPositiveNumber(v) },
  ],
  loanRemainingYears: [
    { message: '住宅ローンの残年数を入力してください。', isValid: (v, fd) => fd.housingType !== '持ち家（ローン中）' || isPositiveNumber(v) },
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


  // --- ライフイベント - 車 ---
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

  // --- ライフイベント - 介護 ---
  parentCareAssumption: [
    { message: '親の介護費用の想定を選択してください。', isValid: isRequired },
  ],

  // --- 老後の計画 ---
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

  // --- 退職・年金 ---
  reemploymentReductionRate: [
    { message: '定年再雇用時の減給率を入力してください。', isValid: (v, fd) => !fd.assumeReemployment || isRequired(v) },
  ],
  spouseReemploymentReductionRate: [
    { message: '配偶者の定年再雇用時の減給率を入力してください。', isValid: (v, fd) => !fd.spouseAssumeReemployment || isRequired(v) },
  ],

  // --- 現在の資産 ---
  currentSavings: [
    { message: '現在の預貯金額を入力してください。', isValid: isZeroOrGreater },
  ],
  emergencyFund: [
    { message: '生活防衛資金を入力してください。', isValid: isZeroOrGreater },
  ],

  // --- その他 ---
  simulationPeriodAge: [
    { message: 'シミュレーション終了年齢を入力してください。', isValid: (v, fd) => n(v) > n(fd.personAge) },
  ],
  interestRateScenario: [
    { message: '利回りのシナリオを選択してください。', isValid: isRequired },
  ],
  appliances: [
    {
      message: '追加した家電には、名称・周期・価格をすべて入力してください。',
      isValid: (v) => (v as FormDataState['appliances']).length === 0 || areAllAppliancesValid(v as FormDataState['appliances']),
    },
  ],
  fixedInterestRate: [
    { message: '固定利回りを入力してください。', isValid: (v, fd) => fd.interestRateScenario !== '固定利回り' || isRequired(v) },
  ],

  // --- 任意項目（バリデーション不要なもの） ---
  // sideJobIncome, spouseSideJobIncome, investment関連, appliances, retirementIncomeなど
};

export const validate = (formData: FormDataState, fields: (keyof FormDataState | string)[]): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  for (const field of fields) {
    const rules = validationRules[field];
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