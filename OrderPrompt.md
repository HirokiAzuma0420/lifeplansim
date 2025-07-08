以下の修正をFormPage.tsxに加えてください。目的はスマホ実機での「現在の収入」セクションにおけるフロートボックス（年間収入総額や推定手取りなど）が、スクロールやキーボード表示中でも画面上部に正しく固定表示されるようにすることです。

【修正内容】

1. ビューポート高さに応じてフロートボックスのtop位置を動的に設定するため、以下のstateとuseEffectをFormPageコンポーネント内に追加してください。

const [viewportOffset, setViewportOffset] = useState(0);

useEffect(() => {
  const updateOffset = () => {
    const vh = window.innerHeight * 0.01;
    setViewportOffset(vh * 5); // 例：5vh相当のオフセット
  };

  updateOffset();
  window.addEventListener('resize', updateOffset);
  return () => window.removeEventListener('resize', updateOffset);
}, []);

2. renderFloatingBox関数を以下のように書き換えてください。
追加引数でtopを受け取れるようにし、style属性で動的に設定します。

function renderFloatingBox(amount: number, shouldShow: boolean, label: string, topOverride?: number) {
  return (
    <div
      className={`fixed inset-x-0 z-40 transition-opacity duration-500 ${
        shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ top: topOverride ?? viewportOffset }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-md w-fit mx-auto px-4 py-2">
          <span className="text-yellow-800 text-sm md:text-xl font-semibold">
            {label}: {amount.toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  )
}

3. 既存のrenderFloatingBox呼び出しでtop位置が明示されていた場合（top-[5rem]など）は、それを第4引数（topOverride）で渡してください。明示がなければ省略してOKです。

例：
renderFloatingBox(displayTotalIncome, currentSectionIndex === sections.indexOf('現在の収入') && displayTotalIncome > 0, "年間収入総額")
→ 第4引数は省略（viewportOffsetが自動で適用）

renderFloatingBox(estimatedTotalLoanPayment, 条件, "総返済額", 80)
→ 80px相当のtop位置に表示（必要に応じて）

【目的】
スマホ実機でキーボード表示やアドレスバー変化があっても、フロートボックスがビューポート内の同じ位置に安定して表示されるようにする
