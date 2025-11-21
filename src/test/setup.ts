// vitest-dom/extend-expect をインポートして、
// expect に `toBeInTheDocument` などの jest-dom マッチャーを追加します。
// 参考: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// JSDOM には ResizeObserver が実装されていないため、recharts のテストでエラーになる。
// グローバルにクラスとしてモックを定義する。
class ResizeObserver {
    observe() {
        // do nothing
    }
    unobserve() {
        // do nothing
    }
    disconnect() {
        // do nothing
    }
}

global.ResizeObserver = ResizeObserver;
window.ResizeObserver = ResizeObserver;
