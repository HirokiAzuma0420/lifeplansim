# シミュレーションDBスキーマ設計（2025/08最新版）

## 1. simulations（シミュレーション本体）
| カラム名       | 型         | 説明                         |
|---------------|------------|------------------------------|
| id            | int        | PK                           |
| user_id       | int        | ユーザーID                   |
| created_at    | datetime   | 作成日時                     |
| base_year     | int        | シミュレーション開始年（西暦）|
| base_age      | int        | 開始年齢                     |
| params_json   | json       | その他入力パラメータ(json)   |

---

## 2. years（年次シミュレーション結果／年齢軸）
| カラム名          | 型       | 説明                           |
|------------------|----------|--------------------------------|
| id               | int      | PK                             |
| simulation_id    | int      | シミュID（FK）                 |
| year_no          | int      | 0:初年度, 1:翌年...            |
| year             | int      | 西暦年                         |
| age              | int      | 年齢                           |
| total_income     | int      | その年の収入合計               |
| total_expense    | int      | その年の支出合計               |
| total_investment | int      | その年の投資額                 |
| investment_yield | float    | 投資利回り(％)                 |
| net_assets_start | int      | 年初資産                       |
| net_assets_end   | int      | 年末資産                       |

---

## 3. income_sources（収入パラメータ・昇給含む）
| カラム名      | 型        | 説明                             |
|--------------|-----------|----------------------------------|
| id           | int       | PK                               |
| simulation_id| int       | シミュID（FK）                   |
| name         | varchar   | 収入名（本人本業/副業/配偶者本業/副業/年金等） |
| person_type  | varchar   | 本人/配偶者/その他               |
| income_type  | varchar   | 本業/副業/年金/その他            |
| base_amount  | int       | 初年度金額（万円または円単位）   |
| start_year   | int       | 開始年（years.year_no）          |
| end_year     | int       | 終了年                           |
| annual_rate  | float     | 年次増加率(％/昇給率)             |
| is_taxable   | bool      | 課税対象か                       |

---

## 4. expense_items（支出パラメータ・固定/変動/期間/頭金等）
| カラム名      | 型        | 説明                                |
|--------------|-----------|-------------------------------------|
| id           | int       | PK                                  |
| simulation_id| int       | シミュID（FK）                      |
| name         | varchar   | 支出名（生活費/住宅/自動車/教育/家電等） |
| expense_type | varchar   | 固定費/変動費/一時費用              |
| base_amount  | int       | 初年度金額                          |
| start_year   | int       | 開始年（years.year_no）             |
| end_year     | int       | 終了年                              |
| annual_rate  | float     | 年次増加率(％)                       |
| params_json  | json      | 頭金・ローン情報等のパラメータ      |

---

## 5. investment_accounts（投資資産・商品パラメータ）
| カラム名        | 型        | 説明                               |
|----------------|-----------|------------------------------------|
| id             | int       | PK                                 |
| simulation_id  | int       | シミュID（FK）                     |
| asset_type     | varchar   | 種類（株式/投資信託/債権/iDeCo/仮想通貨/その他）|
| base_amount    | int       | 初期投資額                         |
| monthly_amount | int       | 月積立額                           |
| annual_spot    | int       | 年間スポット額                     |
| annual_yield   | float     | 想定利回り（％）                   |
| start_year     | int       | 開始年                             |
| end_year       | int       | 終了年                             |
| stress_test    | bool      | ストレステスト対象                 |
| yield_scenario_json | json  | 利回りシナリオ詳細(分散,変動幅等)  |

---

## 6. life_events（一時的ライフイベント）
| カラム名        | 型        | 説明                                 |
|----------------|-----------|--------------------------------------|
| id             | int       | PK                                   |
| simulation_id  | int       | シミュID（FK）                       |
| event_type     | varchar   | 結婚/住宅購入/出産/介護等            |
| name           | varchar   | イベント名                           |
| amount         | int       | 金額（＋収入/−支出）                 |
| target_year    | int       | 発生年（years.year_no）              |
| params_json    | json      | 追加パラメータ（例:出産人数,家電名等）|

---

## 7. appliance_replacements（家電買替履歴・サイクル管理）
| カラム名           | 型       | 説明                           |
|-------------------|----------|--------------------------------|
| id                | int      | PK                             |
| simulation_id     | int      | シミュID（FK）                 |
| name              | varchar  | 家電名                         |
| cycle_years       | int      | 買替サイクル(年)               |
| cost_per          | int      | 1回あたりの費用                |
| start_year        | int      | 開始年                         |
| end_year          | int      | 終了年                         |

---

## 8. loan_details（住宅/車などのローン詳細パラメータ）
| カラム名        | 型        | 説明                                |
|----------------|-----------|-------------------------------------|
| id             | int       | PK                                  |
| simulation_id  | int       | シミュID（FK）                      |
| loan_type      | varchar   | 住宅/自動車/その他                  |
| principal      | int       | 元本                                |
| down_payment   | int       | 頭金                                |
| years          | int       | 返済年数                            |
| interest_rate  | float     | 金利                                |
| start_year     | int       | 開始年                              |
| end_year       | int       | 終了年                              |
| params_json    | json      | その他（ローン種類,残存年数等）     |

---

## 9. children（子供情報・養育費等の支出パターン管理）
| カラム名        | 型        | 説明                                 |
|----------------|-----------|--------------------------------------|
| id             | int       | PK                                   |
| simulation_id  | int       | シミュID（FK）                       |
| birth_year     | int       | 誕生年（years.year_no）              |
| education_pattern | varchar| 公立中心/公私混合/私立中心           |
| params_json    | json      | 個別パラメータ（養育費,進学費用等）  |

