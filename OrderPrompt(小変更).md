以下の作業を行え。自律的な質問は禁止。Tailwindのユーティリティのみ使用し、クラス設計は指示通りにする。

目的
「ライフイベント - 生活」の家電テーブルの見出しと入力列の崩れを解消し、列幅を固定して水平スクロール可能な表形式にする。

修正方針
1. 見出しと行で grid の列定義を完全一致させる（5列）。現在は見出しが4列、行が5列のため崩れている。  
2. 列幅を固定値で指定し、親に overflow-x-auto を付与してはみ出し時はスクロールさせる。  
3. 入力の高さ・余白を統一。削除ボタン列は min-content 幅で右寄せ。

置換手順（FormPage.tsx の「ライフイベント - 生活」ブロック内の家電テーブル部分だけを丸ごと差し替え）
- 置換対象: h3「家電買い替えサイクルと費用」直下の見出し grid と、applianceReplacements.map を含む行群、追加ボタンまでの塊。
- 置換後コード:

<div className="mt-4">
  <h3 className="text-lg font-semibold mb-2">家電買い替えサイクルと費用</h3>

  <div className="overflow-x-auto">
    <div className="min-w-[760px]">
      {/* ヘッダー：5列を固定幅で定義 */}
      <div className="grid grid-cols-[180px_160px_180px_200px_min-content] items-center gap-3 px-1 py-2 text-xs text-gray-600 font-semibold border-b">
        <div>家電名</div>
        <div>買い替えサイクル（年）</div>
        <div>初回買い替え（年後）</div>
        <div>1回あたりの費用（万円）</div>
        <div className="text-right pr-1">操作</div>
      </div>

      {/* 行：ヘッダーと同じ5列テンプレートを使用 */}
      {applianceReplacements.map((appliance, index) => (
        <div key={index} className="grid grid-cols-[180px_160px_180px_200px_min-content] items-center gap-3 px-1 py-2 border-b">
          <input
            type="text"
            placeholder="家電名"
            value={appliance.name}
            onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
            className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
          <input
            type="number"
            placeholder="買い替えサイクル（年）"
            value={appliance.cycle}
            min={0}
            onChange={(e) => handleApplianceChange(index, 'cycle', e.target.value)}
            className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
          <input
            type="number"
            placeholder="初回買い替え（年後）"
            value={appliance.firstReplacementAfterYears}
            min={0}
            onChange={(e) => handleApplianceChange(index, 'firstReplacementAfterYears', e.target.value)}
            className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
          <input
            type="number"
            placeholder="1回あたりの費用（万円）"
            value={appliance.cost}
            min={0}
            onChange={(e) => handleApplianceChange(index, 'cost', e.target.value)}
            className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
          />
          <button
            type="button"
            onClick={() => handleRemoveAppliance(index)}
            className="text-red-500 hover:text-red-700 justify-self-end pr-1"
            aria-label="この家電行を削除"
            title="削除"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}

      <div className="py-3">
        <button
          type="button"
          onClick={addAppliance}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          家電を追加する
        </button>
      </div>
    </div>
  </div>
</div>

検収基準
- 見出し4列・行5列の不一致が解消され、列ズレが発生しない。  
- 横幅が画面より広い場合でも横スクロールで全列が表示される。  
- 削除ボタンは各行の最右列で縦中央に揃う。  
- すべての入力の高さが h-10 に統一される。
