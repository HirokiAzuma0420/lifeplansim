FormPage.tsx に次の変更を加えてください。

1. useEffect で window.visualViewport.offsetTop を監視し、viewportOffsetY に保存してください。

const [viewportOffsetY, setViewportOffsetY] = useState(0);

useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => setViewportOffsetY(vv.offsetTop);
  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();
  return () => {
    vv.removeEventListener("resize", update);
    vv.removeEventListener("scroll", update);
  };
}, []);

2. renderFloatingBox で position: fixed をやめ、position: absolute を使ってください。

<div
  className="absolute left-0 right-0 z-50"
  style={{ top: `${viewportOffsetY + 8}px` }}
>

3. renderFloatingBox を配置している親要素（最大ラッパー）に position: relative を明示してください。

<div className="relative max-w-md mx-auto bg-white shadow-lg rounded-lg md:max-w-5xl overflow-visible">

これにより、フロートボックスとプログレスバーがスマホ実機（Android Chrome）でも常に画面上部に追従し、スクロールやソフトキーボードによって消える問題を回避できます。
