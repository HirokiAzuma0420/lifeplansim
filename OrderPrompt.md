以下の修正をFormPage.tsxに加えてください。目的は、スマホ実機での入力中・キーボード表示中でも「年間収入総額」などのフロートボックスが正しく上部に表示され続けるように、position fixed ではなく position sticky による安定表示を実現することです。

【修正内容】

1. FormPage全体をスクロールコンテナでラップする  
return の最上位を div className="h-screen overflow-y-scroll bg-gray-100" で囲んでください。これが sticky 要素の親となるスクロール基準です。

2. renderFloatingBox関数の position fixed を position sticky に変更  
renderFloatingBox関数の戻り値の div に以下のように変更を加えてください。

- className に sticky z-40 transition-opacity duration-500 を設定
- style に top: topOverride ?? 0 を渡す（topOverrideがある場合はその値、なければ0）

これによりスクロールコンテナ基準で上部に張り付くようになります。

1. プログレスバーも position sticky に変更
トップの進捗バーが fixed のままだと不安定なため、同様に sticky top-0 z-50 に変更してください。

【目的】

- スマホでのキーボード表示やアドレスバー展開に影響されず、サマリ情報が安定して上部表示されること
- SafariやChromeなどの主要ブラウザで再現性を持って動作すること

この修正で、input中にスクロールしてもフロートボックスが消えないようになります。
