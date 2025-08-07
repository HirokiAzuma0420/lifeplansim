# ローカルLLMへの厳密プロンプト：FormPage.tsx・index.tsの改修指示

---

## 【目的】
- FormPage.tsxの「現在の収入」セクションで「本人年齢」「（家族構成が既婚なら）配偶者年齢」を入力できるようにする。
- 入力された本人年齢をAPIリクエストのinputParams.initialAgeにセット、シミュレーション期間終了年齢（simulationPeriodAge）をinputParams.endAgeにセットする。
- index.tsでは、それぞれinputParams.initialAge、inputParams.endAgeを元にループを開始・終了する。
- 既婚の場合のみ配偶者年齢もFormPage.tsxで入力欄を表示。必要なら将来のロジック拡張で使用できるよう、配偶者年齢もinputParams.spouseInitialAgeでAPIに送信。

---

## 【FormPage.tsx改修指示】

1. 「現在の収入」セクションの適切な場所（本人本業収入入力の上など）に、下記の本人年齢入力欄を追加すること。
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="personAge">
        本人の現在年齢[歳]
      </label>
      <input
        type="number"
        id="personAge"
        name="personAge"
        value={formData.personAge || ''}
        onChange={handleInputChange}
        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

2. familyCompositionが"既婚"のときのみ「配偶者年齢」の入力欄も追加すること（display条件式を用いる）。
    {formData.familyComposition === '既婚' && (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="spouseAge">
          配偶者の現在年齢[歳]
        </label>
        <input
          type="number"
          id="spouseAge"
          name="spouseAge"
          value={formData.spouseAge || ''}
          onChange={handleInputChange}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
    )}

3. formDataの初期値オブジェクトに「personAge: ''」「spouseAge: ''」を追加すること。
   例:
   const [formData, setFormData] = useState({
     ...
     personAge: '',
     spouseAge: '',
     ...
   });

4. シミュレーション実行時（handleSimulate）、inputParamsとして送信するformDataのうち
   - initialAgeにpersonAgeをセット
   - spouseInitialAge（将来拡張用）にspouseAgeをセット
   - endAgeにsimulationPeriodAgeをセット
   となるよう、handleSimulateの送信body内で
     body: JSON.stringify({
       inputParams: {
         ...formData,
         initialAge: Number(formData.personAge),
         spouseInitialAge: formData.spouseAge ? Number(formData.spouseAge) : undefined,
         endAge: Number(formData.simulationPeriodAge),
       }
     })

5. 既存の「simulationPeriodAge」欄には手を加えなくてよいが、API送信時には必ずendAgeとして明示的にセットする。

---

## 【index.ts改修指示】

1. APIのhandler関数でinputParams.initialAge、inputParams.endAgeを受け取るようにする。
   const initialAge = inputParams.initialAge ?? 25;
   const endAge = inputParams.endAge ?? 90;

2. ループはfor (let age = initialAge; age <= endAge; age++)の形で初期年齢〜終了年齢をカバーする。

3. 必要ならinputParams.spouseInitialAgeも取得して、今後のロジック拡張に備えて定義しておく。

4. それ以外のロジックは今まで通り、年齢ループ・資産計算等に活用すればよい。

---

## 【注意】

- フロントで未入力時は空文字列になるが、API送信時にはNumber変換で正しい数値となるようにする。
- spouseAgeは既婚の時のみ必須で、未婚なら不要。
- すべての改修後、本人・配偶者年齢および終了年齢がAPIで正しく受け取れることを疎通テストで確認すること。

---

上記内容を厳密な実装指示としてローカルLLMに渡し、FormPage.tsxとindex.tsそれぞれ改修せよ。
