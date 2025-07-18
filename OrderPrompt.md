## 🎯 修正依頼内容：スクリーンキーボード表示中でもプログレスバーおよびフロートボックスをスクロール追従表示に保つ

### ✅ 背景と目的

現行の FormPage.tsx では、プログレスバーおよび renderFloatingBox によるフロートボックスが position: fixed により画面上部に常時表示される設計となっている。  
しかし、モバイル環境（特に Android 実機）でスクリーンキーボード表示中にスクロールすると、これらの要素がビューポート外に押し出され、見えなくなってしまう問題が発生している。  
原因は、仮想キーボードによって viewport の高さが縮んだ状態でも fixed がそのまま適用されるため、ビューポート外に描画されることによる。

---

### ✅ 修正方針（推奨）

1. position: fixed をやめて position: sticky に変更する
2. top の指定はそのまま維持し、z-index も高め（z-50など）に設定する
3. sticky を有効にするため、親要素の overflow に hidden を指定しないよう確認する

---

### 🔧 修正対象箇所

#### 1. プログレスバーの div を以下のように修正する

<div className="sticky top-0 z-50 w-full bg-gray-300 h-4 rounded-t-lg" />

元々 fixed top-0 z-10 だった要素に対して、fixed を sticky に置換し、z-50 に引き上げる

---

#### 2. renderFloatingBox で返す最上位 div のクラスを以下のように修正する

<div className={"sticky " + topClass + " inset-x-0 z-50 transition-opacity duration-500 " + 
  (shouldShow ? "opacity-100" : "opacity-0 pointer-events-none")}>

固定表示にしていた部分を sticky に変更し、topClass による top-xx の位置指定はそのまま活用する

---

### ✅ 期待する動作

- モバイル環境でスクリーンキーボードが表示されても、プログレスバーおよびフロートボックスが常時上部に表示されたままとなる
- キーボードによる viewport 縮小があっても表示が押し出されない
- スクロールしても該当要素は見失われず、ユーザー体験が安定する

---

### 💡 補足

既存のスタイルや Tailwind クラスに合わせて必要があれば z-index や padding、背景色などを微調整してもよい。  
親要素が overflow: hidden を持つと sticky が無効化されるため、overflow-visible または overflow-auto を保持すること。
