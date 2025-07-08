FormPage.tsx に以下の修正を加えてください：

1. フロートボックスおよびプログレスバーを含むヘッダー領域を以下のように修正：

<div
  className="fixed inset-x-0 top-0 z-50 bg-gray-100"
  style={{
    top: 'env(safe-area-inset-top)',
    height: 'fit-content',
  }}
>

2. フロートボックスの表示切替は `&&` ではなく、常にDOMを出力し、visibilityで制御してください：

<div className="px-4 py-2" style={{ visibility: shouldShowFloatBox ? 'visible' : 'hidden' }}>
  <div className="...">年間収入総額: ...</div>
</div>

3. スクロール領域（フォーム本体）は height指定を避け、flex-1とmin-h-screenを使って柔軟に対応してください：

<div className="flex-1 overflow-y-auto px-4 pb-32">

4. フロートボックスの高さ確保用に、固定領域の下に `h-[XXpx]` のスペーサーを入れてください（例：`h-16`）。

5. 必要に応じて `env(safe-area-inset-top)` を `top` に使って iOS端末でも安定表示になるようにしてください。
