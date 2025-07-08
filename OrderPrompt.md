以下の対応をFormPage.tsxに加えてください。目的は、スマホ実機（特にiOS SafariやAndroid Chrome）でソフトキーボードが表示された際にも、上部に表示するUI（年間収入総額などのフロートボックス）が正しく表示され続けるようにすることです。

この対応ではVisualViewport APIを利用し、キーボード表示によるビューポートの高さ変化を検知して、CSSカスタムプロパティ --visual-viewport-height に反映させ、レイアウト内で利用可能にします。

【修正内容】

1. hooks/useVisualViewportHeightEffect.ts を新規作成してください。以下のカスタムフックを定義します。

import { useEffect } from "react"

export function useVisualViewportHeightEffect(): void {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || typeof vv.height !== "number") {
      document.documentElement.style.removeProperty("--visual-viewport-height")
      return
    }

    const update = () =>
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        vv.height + "px"
      )

    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    update()

    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])
}

2. FormPage.tsx でこのカスタムフックを呼び出してください。

import { useVisualViewportHeightEffect } from "../hooks/useVisualViewportHeightEffect"

export default function FormPage() {
  useVisualViewportHeightEffect()
  // ...続き

3. renderFloatingBox の sticky 対応に合わせて、style に top: calc(var(--visual-viewport-height, 100vh) * 0.05) のような指定を加えてください。

以下は renderFloatingBox の一部修正例です。

function renderFloatingBox(amount: number, shouldShow: boolean, label: string) {
  return (
    <div
      className={"sticky z-40 transition-opacity duration-500 " + (shouldShow ? "opacity-100" : "opacity-0 pointer-events-none")}
      style={{
        top: "calc(var(--visual-viewport-height, 100vh) * 0.05)"
      }}
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

4. フロートボックスが含まれる位置（return内部）に overflow-y-scroll を付けて、stickyが効くようにしてください。

return (
  <div className="h-screen overflow-y-scroll bg-gray-100">
    // 既存のレイアウトをここにネスト
  </div>
)

5. エラー耐性について：

- visualViewport が undefined の環境でも例外を投げないよう、nullチェックをカスタムフック内で確実に行ってください。
- スクロールイベントも併せて監視することで、一部環境での resize 非検知を補完しています。

【目的】

この修正により、スマホでキーボードが開いてもフロートボックスが画面外に消えたり、位置がずれたりする問題を回避できます。より一貫性のあるUXを実現するための標準的な対応手法です。
