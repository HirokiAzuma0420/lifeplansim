## 🎯 修正依頼内容：モバイルでのスクリーンキーボード表示時も fixed 要素（フロートボックス等）を常時表示に保つ

### ✅ 背景と目的

現在の FormPage.tsx では、スクリーンキーボード（ソフトウェアキーボード）表示中に renderFloatingBox() がスクロールで画面外に消える不具合がある。  
原因は visualViewport.offsetTop を用いた transform: translateY(...) による位置補正であり、これは Android/iOS 双方のブラウザで不安定な挙動を引き起こす。

---

### ✅ 修正方針（重要）

1. transform: translateY(-viewportOffsetY) を完全に削除する（ロジック含め不要）  
2. renderFloatingBox は fixed + top で描画位置を直接指定する形に修正  
3. z-index は z-50 として前面固定（任意に調整可）  
4. position: relative の親要素がある場合、fixed の干渉を受けないよう注意  
5. resize イベントで強制 reflow を実行し、キーボード開閉時の再描画を補助  

---

### 🔧 修正対象箇所

#### 1. renderFloatingBox の JSX を以下のように修正する

function renderFloatingBox(amount: number, shouldShow: boolean, label: string, topClass: string = 'top-[1.5rem]') {
  return (
    <div
      className={"fixed " + topClass + " inset-x-0 z-50 transition-opacity duration-500 " +
        (shouldShow ? "opacity-100" : "opacity-0 pointer-events-none")}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-md w-fit mx-auto px-4 py-2">
          <span className="text-yellow-800 text-sm md:text-xl font-semibold">
            {label}: {amount.toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  );
}

---

#### 2. useEffect に以下の強制 reflow 処理を追加する

useEffect(() => {
  const handleResize = () => {
    const dummy = document.createElement("div");
    dummy.style.cssText = "height:0;overflow:hidden;";
    document.body.appendChild(dummy);
    setTimeout(() => document.body.removeChild(dummy), 0);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

---

#### 3. viewportOffsetY 関連の useState / visualViewport 使用部分をすべて削除

const [viewportOffsetY, setViewportOffsetY] = useState(0);
// および visualViewport 使用の useEffect も削除

---

### ✅ 期待する動作

- Android/iOS の仮想キーボード表示中でも、フロートボックスがスクロールに追従し常時表示され続けること  
- ビューポートのリサイズ・キーボード開閉による再描画漏れが起こらないこと  

---

### 💡 補足

この修正は Tailwind CSS を前提とした構成です。クラス名やレイアウト階層は現行コードと整合するよう適宜調整してください。
