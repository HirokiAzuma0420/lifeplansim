FormPage.tsx のレイアウトに関して以下の修正を行ってください。

1. 最上位コンテナのクラスを `min-h-screen` から `h-screen` に変更し、スマホ実機でも高さが確保されるようにしてください。

<div className="flex justify-center w-full h-screen bg-gray-100">

2. 内部のラッパー（max-w-md）に `relative h-screen overflow-hidden` を付与し、absoluteで配置されたフォームエリアが正しく高さを持つようにしてください。

<div className="max-w-md mx-auto bg-white shadow-lg rounded-lg md:max-w-5xl relative h-screen md:h-auto overflow-hidden">

3. フォームスクロール領域の div（absolute top-[112px] bottom-0 ...）はこの親に対して正しく張り付くようになります。

この修正により、スマホ実機でフォームエリアが消えるバグが解消され、上部の ProgressBar やフロートボックスを固定したまま、フォームをスクロール可能になります。
