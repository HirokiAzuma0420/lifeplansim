以下の変更を行え。自律的な質問は禁止。FormPage.tsx の「ライフイベント - 生活」内、家電セクションのみを対象とする。目的は横スクロールを廃止し、見出しと入力列の幅を一致させて親幅内に収めること。

作業方針
1) 既存の overflow-x-auto / min-w[...] / grid を撤去し、table + colgroup で列幅を百分率指定する。
2) 列は5列（家電名, サイクル, 初回, 費用, 操作）。操作列は 40px 固定。
3) 各 input は w-full h-10 とし、セル幅に追従させる。
4) ヘッダと行で列構成を完全一致させる。

置換対象
「家電買い替えサイクルと費用」の h3 直下から「家電を追加する」ボタンまでのブロックを、次のコードで丸ごと置換。

<div className="mt-4">
  <h3 className="text-lg font-semibold mb-2">家電買い替えサイクルと費用</h3>

  <table className="table-fixed w-full border-separate border-spacing-y-2">
    <colgroup>
      <col className="w-[30%]" />
      <col className="w-[17%]" />
      <col className="w-[17%]" />
      <col className="w-[31%]" />
      <col className="w-[40px]" />
    </colgroup>
    <thead>
      <tr className="text-xs text-gray-600">
        <th className="text-left px-1">家電名</th>
        <th className="text-left px-1">買い替えサイクル（年）</th>
        <th className="text-left px-1">初回買い替え（年後）</th>
        <th className="text-left px-1">1回あたりの費用（万円）</th>
        <th className="px-1 text-right">操作</th>
      </tr>
    </thead>
    <tbody>
      {applianceReplacements.map((appliance, index) => (
        <tr key={index} className="align-middle">
          <td className="px-1">
            <input
              type="text"
              placeholder="家電名"
              value={appliance.name}
              onChange={(e) => handleApplianceChange(index, 'name', e.target.value)}
              className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </td>
          <td className="px-1">
            <input
              type="number"
              placeholder="年数"
              value={appliance.cycle}
              min={0}
              onChange={(e) => handleApplianceChange(index, 'cycle', e.target.value)}
              className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </td>
          <td className="px-1">
            <input
              type="number"
              placeholder="年後"
              value={appliance.firstReplacementAfterYears}
              min={0}
              onChange={(e) => handleApplianceChange(index, 'firstReplacementAfterYears', e.target.value)}
              className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </td>
          <td className="px-1">
            <input
              type="number"
              placeholder="費用（万円）"
              value={appliance.cost}
              min={0}
              onChange={(e) => handleApplianceChange(index, 'cost', e.target.value)}
              className="shadow border rounded w-full h-10 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            />
          </td>
          <td className="px-1 text-right">
            <button
              type="button"
              onClick={() => handleRemoveAppliance(index)}
              className="text-red-500 hover:text-red-700"
              aria-label="この家電行を削除"
              title="削除"
            >
              <Trash2 size={20} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="pt-3">
    <button
      type="button"
      onClick={addAppliance}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      家電を追加する
    </button>
  </div>
</div>

検収基準
- 画面幅内に収まり、横スクロールが出ない。
- 見出しと入力列の幅が一致する。
- 極端に小さい画面でテキストが折り返されても表全体が w-full に収まる。
