以下の点について修正・確認してください。

## 1. 未使用変数 keyboardHeight に関するエラー対応

現在、次のエラーが出ています：

- ESLint: 'keyboardHeight' is assigned a value but never used.
- TypeScript: 'keyboardHeight' が宣言されていますが、その値が読み取られることはありません。

対応方針：

keyboardHeight は現状 UI 表示や判定に使用されていないため、以下いずれかを行ってください：

- 将来的に使う予定がなければ、keyboardHeight を useState から削除する。
- あるいは、UI 調整やマージン制御などで使用する場合は、それを明示して適切に活用してください（例：ダミー div で下部に余白を確保する等）。

一時的に未使用であっても保持したい場合は、コメントを添えて ESLint 無視設定を追加してください：

// eslint-disable-next-line @typescript-eslint/no-unused-vars

## 2. useMemo の依存配列に関する警告対応

次の警告が出ています：

- React Hook useMemo has unnecessary dependencies: 'formData.loanInterestRate' and 'formData.loanOriginalAmount'.

これは、依存配列に不要な変数が含まれているためです。現在の useMemo の return 関数内部でこれらの変数が使用されていないか確認し、実際に未使用であれば依存配列から削除してください。

```ts
useMemo(() => {
  // 処理内容
}, [必要な依存のみ記載])
```

formData.loanInterestRate や loanOriginalAmount を使用していない場合は削除。使用している場合はそのままで構いません。

## 3. キーボード表示時の UI 制御の反映確認

以下の変更が確実に反映されているか確認してください：

- isKeyboardOpen が true のときにプログレスバーや renderFloatingBox を表示しないようにしているか。
- 特定の fixed 要素がスクリーンキーボードに隠れないよう、必要であれば下部に keyboardHeight 分の余白を追加する処理が設けられているか。

必要に応じて、keyboardHeight を UI マージンや padding 調整に使用してください。
