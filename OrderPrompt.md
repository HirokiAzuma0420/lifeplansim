FormPage.tsx のすべてのフロートボックスおよびプログレスバーの transform: translateY(...) を完全に削除してください。

1. transform スタイルは一切使用せず、position: fixed と top: 0（または env(safe-area-inset-top)）のみで表示位置を制御してください。

2. viewportOffsetY ステートや、それに関連する useEffect（visualViewport.offsetTop 監視）はすべて削除してください。

3. フロートボックスの位置調整（24px, 80px など）は top: XXpx を直接 style で指定することで制御してください。

例：
<div className="fixed left-0 right-0 z-50" style={{ top: '80px' }}>...</div>

4. ProgressBar も同様に transform を使わず、position: fixed と top: 0 に置き直してください。

5. 追加で、public/index.html に以下の meta タグを入れてください：

<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

これにより、合成レイヤーによる描画バグを回避し、スマホ実機でもスクロールに完全追従する固定表示が安定します。
