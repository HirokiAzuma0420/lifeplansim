FormPage.tsx におけるすべてのフロートボックスおよびプログレスバーに以下の修正を加えてください。

1. renderFloatingBox の div は position: fixed に変更し、top 指定をやめて transform で補正してください：

<div
  className="fixed left-0 right-0 z-50 transition-opacity duration-300 ..."
  style={{
    transform: `translateY(${offset - viewportOffsetY}px)`,
  }}
>

2. プログレスバー（年間進捗）は同様に fixed に変更し、transform: translateY(-viewportOffsetY) を適用してください。

<div
  className="fixed top-0 left-0 right-0 z-40 bg-gray-300 h-4 rounded-t-lg"
  style={{ transform: `translateY(${-viewportOffsetY}px)` }}
>

3. すべてのフロートボックスが fixed + transform で画面上部に常に追従するように統一してください。

この修正により、スマホ実機でキーボード表示やスクロール時に、すべてのボックスが一貫して上部に固定表示されるようになります。
