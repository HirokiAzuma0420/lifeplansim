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

export type FieldValidationRules = {
  [key in keyof FormDataState]?: ValidationRule[];
};

const isRequired = (value: unknown) => value !== '' && value !== null && value !== undefined && String(value).trim().length > 0;
const isPositiveNumber = (value: unknown) => isRequired(value) && n(value) > 0;
const isZeroOrGreater = (value: unknown) => isRequired(value) && n(value) >= 0;
const isAgeValid = (value: unknown) => isRequired(value) && n(value) >= FC.VALIDATION_MIN_AGE && n(value) <= FC.VALIDATION_MAX_AGE;

export const validationRules: FieldValidationRules = {
  // --- 必須項目 ---
  familyComposition: [
    { message: '家族構成を選択してください。', isValid: isRequired },
  ],
  personAge: [
    { message: `年齢は${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`, isValid: isAgeValid },
  ],
  mainIncome: [
    { message: '本業年間収入（額面）を入力してください。', isValid: isPositiveNumber },
  ],
  expenseMethod: [
    { message: '支出の入力方法を選択してください。', isValid: isRequired },
  ],
  livingCostSimple: [
    { message: '月々の生活費を入力してください。', isValid: (v, fd) => fd.expenseMethod !== '簡単' || isPositiveNumber(v) },
  ],
  retirementAge: [
    { message: '退職年齢を入力してください。', isValid: isRequired },
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
  currentSavings: [
    { message: '現在の預貯金額を入力してください。', isValid: isZeroOrGreater },
  ],
  emergencyFund: [
    { message: '生活防衛資金を入力してください。', isValid: isZeroOrGreater },
  ],
  simulationPeriodAge: [
    { message: 'シミュレーション終了年齢を入力してください。', isValid: (v, fd) => n(v) > n(fd.personAge) },
  ],

  // --- 条件付き必須項目 ---
  spouseAge: [
    { message: `配偶者の年齢は${FC.VALIDATION_MIN_AGE}歳から${FC.VALIDATION_MAX_AGE}歳の間で入力してください。`, isValid: (v, fd) => fd.familyComposition !== '既婚' || isAgeValid(v) },
  ],
  spouseMainIncome: [
    { message: '配偶者の本業年間収入（額面）を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isPositiveNumber(v) },
  ],
  spouseRetirementAge: [
    { message: '配偶者の退職年齢を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isRequired(v) },
  ],
  spousePensionStartAge: [
    { message: '配偶者の年金受給開始年齢を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isRequired(v) },
  ],
  spousePensionAmount: [
    { message: '配偶者の年金受給額（月々）を入力してください。', isValid: (v, fd) => fd.familyComposition !== '既婚' || isPositiveNumber(v) },
  ],
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
  hasChildren: [
    { message: 'お子さまの有無を選択してください。', isValid: isRequired },
  ],
  numberOfChildren: [
    { message: 'お子さまの人数を入力してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || isPositiveNumber(v) },
  ],
  firstBornAge: [
    { message: '第一子の年齢を入力してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || isRequired(v) },
  ],
  educationPattern: [
    { message: '教育方針を選択してください。', isValid: (v, fd) => fd.hasChildren !== 'はい' || isRequired(v) },
  ],
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
  parentCareAssumption: [
    { message: '親の介護費用の想定を選択してください。', isValid: isRequired },
  ],
  interestRateScenario: [
    { message: '利回りのシナリオを選択してください。', isValid: isRequired },
  ],
  fixedInterestRate: [
    { message: '固定利回りを入力してください。', isValid: (v, fd) => fd.interestRateScenario !== '固定利回り' || isRequired(v) },
  ],

  // --- 任意項目（バリデーション不要なもの） ---
  // sideJobIncome, spouseSideJobIncome, investment関連, appliances, retirementIncomeなど
};