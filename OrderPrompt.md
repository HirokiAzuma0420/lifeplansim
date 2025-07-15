FormPage.tsx に以下の変更を加えてください。

1. useState と useEffect で visualViewport.offsetTop を監視し、viewportOffsetY というステートに保存してください。

const [viewportOffsetY, setViewportOffsetY] = useState(0);

useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => setViewportOffsetY(vv.offsetTop);
  vv.addEventListener("scroll", update);
  vv.addEventListener("resize", update);
  update();
  return () => {
    vv.removeEventListener("scroll", update);
    vv.removeEventListener("resize", update);
  };
}, []);

2. displayEstimatedNetIncome のフロートボックスに transform: translateY(-viewportOffsetY) を適用してください。

<div
  className="fixed top-0 inset-x-0 z-50 transition-opacity duration-500"
  style={{
    transform: `translateY(-${viewportOffsetY}px)`,
    opacity: currentSectionIndex === sections.indexOf('現在の収入') ? 1 : 0,
    pointerEvents: currentSectionIndex === sections.indexOf('現在の収入') ? 'auto' : 'none',
  }}
>
  // 手取りボックス内容
</div>

3. その他のフロートボックス（生活費総額や年間収入総額など）にも同様の transform を適用して統一してください。

この対応により、スマホ実機でキーボード表示中にスクロールしても、各種フロートボックスが画面上部に正しく固定表示されます。
