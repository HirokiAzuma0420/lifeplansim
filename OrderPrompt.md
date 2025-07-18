## 🎯 修正依頼内容：Androidなどの戻るキーで FormPage を離脱させず、フォーム内の前ページにだけ戻るように制御する

---

### ✅ 背景

現在の実装では、useEffect によって `pushState` / `popstate` を使ってセクション遷移を履歴として積んでいるが、フォーム最初のセクション（index = 0）で戻るキーを押すと、ブラウザ履歴上の1つ前、つまり `TopPage.tsx` や他ページに遷移してしまう。  
これを防ぎ、**フォームページ内でのみ「戻る」キーが機能する**ようにする。

---

### ✅ 修正方針

1. 初回マウント時に history.replaceState で履歴の初期ダミーを置く  
2. セクション遷移時は pushState で履歴を積み、popstate は index を 1つ戻す  
3. index が 0 のときに popstate が発生した場合は history.pushState で履歴を復元し、「ページ離脱をブロック」

---

### 🔧 修正内容

#### 1. 初期履歴状態を1件ダミー登録（mount 時に一度だけ）

useEffect(() => {
  if (!window.history.state?.formInitialized) {
    window.history.replaceState({ formInitialized: true, section: 0 }, "", "");
  }
}, []);

#### 2. セクション切り替え時に履歴を積む処理（現状と同様）

useEffect(() => {
  const state = { formInitialized: true, section: currentSectionIndex };
  window.history.pushState(state, "", "");
}, [currentSectionIndex]);

#### 3. 戻るキーで section を戻す popstate ハンドラを強化

useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state;
    if (state?.formInitialized && typeof state.section === "number") {
      setCurrentSectionIndex(state.section);
    } else {
      // フォーム外への離脱を防止：履歴を再注入
      window.history.pushState({ formInitialized: true, section: 0 }, "", "");
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);

---

### ✅ 期待する動作

- 「戻る」キーはフォーム内のセクション index を1つずつ戻すように働く  
- 最初のセクションで戻るキーを押しても、ページ離脱は発生せず、履歴が復元されるだけで実質的な変化はない  
- TopPage.tsx など別ページへのナビゲーションは、意図的なボタン操作でのみ行われる

---

### 💡 補足

- 他の画面遷移（Link や navigate 等）と競合しないよう、FormPage 固有の状態識別子として state.formInitialized を導入  
- 他ページと履歴を共通に扱っている場合は、リセット処理（popstate の再 push）に十分注意する
