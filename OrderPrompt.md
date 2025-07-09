以下の修正を FormPage.tsx に適用してください。

1. useState と useEffect を使って、スマートフォンでソフトウェアキーボードが表示されているかどうかを検出し、その高さを取得できるようにしてください。
2. 既存のプログレスバーや renderFloatingBox で表示している fixed 要素が、キーボード表示時に見切れないように、isKeyboardOpen の状態をもとに非表示制御を行ってください。

修正内容:

1. 以下の state を冒頭に追加する。

const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
const [keyboardHeight, setKeyboardHeight] = useState(0)

2. VisualViewport を使ってキーボード検知する useEffect を追加する。

useEffect(() => {
  const handleResize = () => {
    if (window.visualViewport) {
      const visualHeight = window.visualViewport.height
      const layoutHeight = window.innerHeight
      const delta = layoutHeight - visualHeight

      if (delta > 150) {
        setIsKeyboardOpen(true)
        setKeyboardHeight(delta)
      } else {
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }
    }
  }

  window.visualViewport?.addEventListener('resize', handleResize)
  handleResize()

  return () => {
    window.visualViewport?.removeEventListener('resize', handleResize)
  }
}, [])

3. プログレスバー部分の表示条件に isKeyboardOpen を追加して非表示制御を行う。

{!isKeyboardOpen && (
  <div className="w-full bg-gray-300 h-4 fixed top-0 left-0 right-0 z-10 rounded-t-lg">
    <div
      className="bg-blue-500 h-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
    ></div>
    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
      {Math.round(progress)}%
    </div>
  </div>
)}

4. renderFloatingBox の呼び出しもすべて !isKeyboardOpen でラップする。

{!isKeyboardOpen && renderFloatingBox(...)}

この修正により、スマホでキーボードが表示されている間、固定要素が画面に重ならず非表示になります。
