以下の内容で FormPage.tsx を修正してください。

### 1. isKeyboardOpen の判定条件を厳格化

delta（window.innerHeight - visualViewport.height）の閾値を 150 から 300 に変更し、誤判定を抑制してください。

また、変化量が数フレーム連続で継続した場合のみ `setIsKeyboardOpen(true)` を実行するなど、**デバウンスまたは連続判定フィルタ**を検討してください（例: setTimeout で200ms継続した場合など）。

```ts
const threshold = 300
const delta = layoutHeight - visualHeight

if (delta > threshold) {
  setIsKeyboardOpen(true)
} else {
  setIsKeyboardOpen(false)
}
```

### 2. フォールバックとしてボタンタップ時に isKeyboardOpen = false を明示的に設定する（任意）

戻る・次へボタンを押した際、強制的に `isKeyboardOpen = false` をセットしておくと UI が復元されやすくなります。

### 3. デバッグ用にキーボード開閉状態を画面に表示（開発中のみ）

以下のような表示を追加し、意図しない `isKeyboardOpen = true` が常時出ていないか確認してください。

```tsx
<div className="fixed top-20 left-2 bg-black text-white text-xs px-2 py-1 rounded">
  keyboard: {isKeyboardOpen ? 'OPEN' : 'CLOSED'}
</div>
```

---

修正後も改善されない場合は、keyboardHeight の値や viewport サイズのログ出力を入れて、具体的な高さ変動を観察してください。
