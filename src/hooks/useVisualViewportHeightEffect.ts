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
        `${vv.height}px`
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