1. VisualViewport API を使って、スマートフォンでのソフトウェアキーボード出現を検知してください。`window.innerHeight` と `window.visualViewport.height` の差分を使って、キーボード高さを計算できます。

2. 次の2つの状態を useState で管理してください：
- isKeyboardOpen（boolean）: キーボードが開いているかどうか
- keyboardHeight（number）: キーボードの高さ（ピクセル）

3. useEffect 内で visualViewport の resize イベントを監視し、以下の条件で state を更新してください：
- innerHeight - visualViewport.height > 150 のとき isKeyboardOpen を true、keyboardHeight に差分をセット
- それ以外は isKeyboardOpen を false、keyboardHeight を 0 にリセット

4. フロート表示しているプログレスバーおよび総額ボックスについて、`position: fixed` を使っている場合、スマートフォンのキーボード表示時に描画が崩れる問題があるため、キーボード出現時は `absolute` に切り替えてください。以下のように動的に class を制御してください：

```tsx
<div className={`${isKeyboardOpen ? 'absolute' : 'fixed'} top-0 left-0 z-50 w-full`}>
  ...
</div>
```

5. 必要に応じて、この要素の親コンテナに `position: relative` を明示してください。

6. 現在画面に表示されている `"keyb"` という文字列は、デバッグ用に `isKeyboardOpen && "keyb"` のように書かれていると推測されます。これは画面に不要なので削除してください。状態確認が必要な場合は `console.log` に置き換えてください。
