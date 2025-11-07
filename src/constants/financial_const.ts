/**
 * アプリケーション全体で使用される財務関連の定数を定義します。
 * このファイルは、以下のカテゴリに分類されています。
 * 1. アプリケーション設定 (Application Settings)
 * 2. 基本単位 (Basic Units)
 * 3. 制度・税制 (System & Tax Rules)
 * 4. シミュレーション・エンジン設定 (Simulation Engine Settings)
 * 5. フォーム初期値 (Form Default Values)
 * 6. UI定数 (UI Constants)
 * 6. 計算ロジック定数 (Calculation Logic Constants)
 */

// =================================================================================
// 1. アプリケーション設定 (Application Settings)
// =================================================================================

/** フォーム入力内容のブラウザキャッシュ有効期限 (30日) */
export const FORM_CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

/** フォーム入力バリデーションの最小年齢 */
export const VALIDATION_MIN_AGE = 18;
/** フォーム入力バリデーションの最大年齢 */
export const VALIDATION_MAX_AGE = 99;

// =================================================================================
// 2. 基本単位 (Basic Units)
// =================================================================================

export const YEN_PER_MAN = 10000;
export const MONTHS_PER_YEAR = 12;

// =================================================================================
// 3. 制度・税制 (System & Tax Rules)
// =================================================================================

/**
 * 課税口座における金融商品の売却益などに対する税率（所得税・復興特別所得税・住民税の合計）。
 */
export const SPECIFIC_ACCOUNT_TAX_RATE = 0.20315;

/**
 * 新NISAの生涯非課税保有限度額。
 */
export const NISA_LIFETIME_CAP = 18_000_000;

/**
 * NISA夫婦合算枠を適用する場合の乗数
 */
export const NISA_COUPLE_MULTIPLIER = 2;

/**
 * 新NISAの年間投資枠の合計。
 */
export const NISA_ANNUAL_CAP = 3_600_000;

/**
 * iDeCoの加入上限年齢。
 */
export const IDECO_MAX_CONTRIBUTION_AGE = 60;

/**
 * iDeCoの受給開始可能年齢の上限。
 */
export const IDECO_MAX_CASHOUT_AGE = 75;

// =================================================================================
// 4. シミュレーション・エンジン設定 (Simulation Engine Settings)
// =================================================================================

export const MONTE_CARLO_SIMULATION_COUNT = 100;

/**
 * 各種ローン金利のデフォルト値（年利）。シミュレーション内部で使用。
 */
export const DEFAULT_LOAN_RATES = {
  CAR_GENERAL: 0.025,
  CAR_BANK: 0.015,
  CAR_DEALER: 0.045,
  HOUSING_GENERAL: 0.015,
};

/**
 * 投資商品のボラティリティ（標準偏差）。
 */
export const VOLATILITY_MAP = {
  stocks: 0.20, trust: 0.18, bonds: 0.05, crypto: 0.80, ideco: 0.18, other: 0.10,
};

/** ランダム変動における暴落イベントの設定 */
export const CRASH_EVENT_CONFIG = {
  FIRST_CRASH_YEAR_MIN: 3,
  FIRST_CRASH_YEAR_MAX: 5,
  SUBSEQUENT_CRASH_YEAR_MIN: 8,
  SUBSEQUENT_CRASH_YEAR_MAX: 10,
  MAGNITUDE_MIN: -0.60, // -60%
  MAGNITUDE_MAX: -0.30, // -30%
};

// =================================================================================
// 5. フォーム初期値 (Form Default Values)
// =================================================================================

// --- 基本情報 ---
export const DEFAULT_PERSON_AGE = 30;
export const DEFAULT_SIMULATION_END_AGE = 90;
export const DEFAULT_ANNUAL_RAISE_RATE_PERCENT = 1.5;

// --- 老後 ---
export const DEFAULT_RETIREMENT_AGE = 65;
export const DEFAULT_PENSION_START_AGE = 65;
export const DEFAULT_PENSION_MONTHLY_MAN_YEN = 15;
export const DEFAULT_SPOUSE_PENSION_MONTHLY_MAN_YEN = 10;
export const DEFAULT_POST_RETIREMENT_LIVING_COST_MAN_YEN = 25;

// --- 貯蓄・投資 ---
export const DEFAULT_EMERGENCY_FUND_MAN_YEN = 300;
export const DEFAULT_FIXED_INTEREST_RATE_PERCENT = 5.0;
export const DEFAULT_INVESTMENT_RATE = {
  STOCKS: 6.0,
  TRUST: 4.0,
  BONDS: 1.0,
  IDECO: 4.0,
  CRYPTO: 8.0,
  OTHER: 0.5,
};

// --- ライフイベント: 結婚 ---
export const DEFAULT_ENGAGEMENT_COST_MAN_YEN = 200;
export const DEFAULT_WEDDING_COST_MAN_YEN = 330;
export const DEFAULT_HONEYMOON_COST_MAN_YEN = 35;
export const DEFAULT_NEW_HOME_MOVING_COST_MAN_YEN = 50;

// --- ライフイベント: 介護 ---
export const DEFAULT_PARENT_AGE = 70;
export const DEFAULT_PARENT_CARE_START_AGE = 80;
export const DEFAULT_PARENT_CARE_MONTHLY_COST_MAN_YEN = 10;
export const DEFAULT_PARENT_CARE_YEARS = 5;

// --- ライフイベント: 生活 ---
export const DEFAULT_APPLIANCES = [
  { name: '冷蔵庫', cycle: 10, cost: 15, firstReplacementAfterYears: '' as number | '' },
  { name: '洗濯機', cycle: 8, cost: 12, firstReplacementAfterYears: '' as number | '' },
  { name: 'エアコン', cycle: 10, cost: 10, firstReplacementAfterYears: '' as number | '' },
  { name: 'テレビ', cycle: 10, cost: 8, firstReplacementAfterYears: '' as number | '' },
  { name: '電子レンジ', cycle: 8, cost: 3, firstReplacementAfterYears: '' as number | '' },
  { name: '掃除機', cycle: 6, cost: 2, firstReplacementAfterYears: '' as number | '' },
];

// =================================================================================
// 6. UI定数 (UI Constants)
// =================================================================================

/** フォームのセクション名マスターリスト */
export const MASTER_SECTIONS = [
  '家族構成',
  '現在の収入',
  '現在の支出',
  'ライフイベント - 車',
  'ライフイベント - 家',
  'ライフイベント - 結婚',
  'ライフイベント - 子供',
  'ライフイベント - 生活',
  'ライフイベント - 親の介護',
  '退職・年金',
  'ライフイベント - 老後',
  '貯蓄',
  '投資',
  'シミュレーション設定',
];

// =================================================================================
// 6. 計算ロジック定数 (Calculation Logic Constants)
// =================================================================================

/**
 * 教育費用の年齢別年間コスト（万円）。
 */
export const EDUCATION_COST_TABLE = {
  '公立中心': { '0-6': 22, '7-12': 33, '13-15': 44, '16-18': 55, '19-22': 88 },
  '公私混合': { '0-6': 35, '7-12': 53, '13-15': 70, '16-18': 88, '19-22': 141 },
  '私立中心': { '0-6': 44, '7-12': 66, '13-15': 88, '16-18': 110, '19-22': 176 },
};

/** 教育費パターンの総額目安（万円）。UI表示用。 */
export const EDUCATION_COST_SUMMARY = {
  '公立中心': 1000,
  '公私混合': 1600,
  '私立中心': 2000,
};

// --- 税金・社会保険料計算 ---

/**
 * 社会保険料率の目安。
 */
export const SOCIAL_INSURANCE_RATE = 0.15;

/**
 * 基礎控除額。
 */
export const BASIC_DEDUCTION = 480000;

/**
 * 住民税の所得割率。
 */
export const RESIDENT_TAX_RATE = 0.1;

/**
 * 住民税の均等割額。
 */
export const RESIDENT_TAX_FLAT_AMOUNT = 5000;

/**
 * 給与所得控除の計算テーブル。
 * [上限金額, 料率, 控除額]
 */
export const SALARY_INCOME_DEDUCTION_BRACKETS: [number, number, number][] = [
  [1_900_000, 0, 650_000],
  [3_600_000, 0.3, 80_000],
  [6_600_000, 0.2, 440_000],
  [8_500_000, 0.1, 1_100_000],
];
export const SALARY_INCOME_DEDUCTION_MAX = 1_950_000;

/**
 * 所得税の税率テーブル。
 * [課税所得上限, 税率, 控除額]
 */
export const INCOME_TAX_BRACKETS: [number, number, number][] = [
  [1_950_000, 0.05, 0],
  [3_300_000, 0.10, 97_500],
  [6_950_000, 0.20, 427_500],
  [9_000_000, 0.23, 636_000],
  [18_000_000, 0.33, 1_536_000],
  [40_000_000, 0.40, 2_796_000],
  [Infinity, 0.45, 4_796_000],
];

/**
 * 配偶者の収入パターンの定義（円/年）。UIでの表示とシミュレーションで使用。
 */
export const SPOUSE_INCOME_PATTERNS = {
  PART_TIME: 1_060_000,
  FULL_TIME: 3_000_000,
};

/**
 * 結婚後の生活費・住居費の推奨増加率。UIでの自動計算に使用。
 */
export const POST_MARRIAGE_COST_INCREASE_RATE = {
  LIVING: 1.5,
  HOUSING: 1.3,
};

/**
 * 定年再雇用の減給率
 */
export const DEFAULT_REEMPLOYMENT_REDUCTION_RATE_PERCENT = 30; // 30%減給