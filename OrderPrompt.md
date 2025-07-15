FormPage.tsx の UI をスマホでの実機使用に耐えるよう、以下のように全面的に再構成してください。

【目的】
スマホ実機（特に Android Chrome/iOS Safari）において、キーボードが表示された状態でフォームに入力している最中でも、画面上部に表示されている ProgressBar とフロートボックス（年間収入総額・手取り金額など）がスクロールで一切流れず、常に固定表示され続けるようにしてください。

【構成要件】

1. 上部の UI（ProgressBar + フロートボックス）は position: fixed top: 0 z-50 として、画面の上端に完全固定すること。

2. フォーム本体のスクロール領域はこれら固定 UI の下に配置し、次のように構成してください：

<div className="absolute top-[112px] bottom-0 left-0 right-0 overflow-y-auto">
  // 入力フォーム本体
</div>

※ top: 112px は上部に表示される固定UIの合計高さに合わせて調整してください（ProgressBar高さ + フロートボックスの高さ + マージン）。

3. PC（768px以上）では上下分離構成を解除し、従来通り全体スクロール構造に戻してください。
Tailwind の `md:` ブレークポイントを使って、以下のように条件分岐してください：

- スマホ：position: fixed / absolute + overflow-y-auto
- PC：position: static / relative + overflow-visible

4. fixed された要素には transform: translateY() や VisualViewport.offsetTop を使わないでください。スクロールバグや描画崩れの原因となるため禁止します。

5. iOS端末で正しい表示がされるよう、`public/index.html` の meta viewport タグに以下を必ず含めてください：

<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

6. 上部固定 UI が input focus によって押し出されないよう、input 要素に自動スクロール（scrollIntoView）を発生させないこと。可能であれば focus 対象に対して preventDefault() を使うなどで防止してください。

この構成により、スマホ実機でのキーボード入力中に ProgressBar や合計ボックスが一切消えず、常に視認可能となり、フォーム入力UXが大幅に改善されます。
