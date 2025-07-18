## 🎯 修正依頼内容：フォームページにおいて2回連続の戻る操作でページ離脱が発生する問題を修正し、常に FormPage 内のセクション遷移にとどめる

---

### ✅ 問題の原因（現コードのレビュー結果）

現状の実装では `pushState` をセクションごとに積み、`popstate` で `section` を復元しているが、初回ロード時に `replaceState` した履歴が 1件しか存在しないため、以下の問題が起きる：

- ブラウザ戻る操作①：現在のセクションをひとつ戻す（意図通り）  
- ブラウザ戻る操作②：初期 `replaceState` に戻る  
- それ以降：ブラウザ履歴が残っていないため、**FormPage を離脱**

これは初回の `replaceState` によって **履歴の“スタック数”が増えない**ため。

---

### ✅ 修正方針

- マウント時に `replaceState` ではなく、**強制的に「ダミー履歴」を1件追加（pushState）**しておく  
- 初回 push によって履歴が最低2件積まれるようにすることで、戻る操作の対象を常に制御下に置く  
- `popstate` にて `state.section` が存在しない場合は、必ず `section 0` に戻す（＝フォーム離脱をブロック）

---

### 🔧 修正内容

#### 1. 初期化タイミングの useEffect を以下のように変更する（replace → push に変更）

useEffect(() => {
  if (!window.history.state?.formInitialized) {
    window.history.pushState({ formInitialized: true, section: 0 }, "", "");
    setCurrentSectionIndex(0);
  }
}, []);

---

#### 2. セクション遷移時の履歴積み上げは現状のままでよい

useEffect(() => {
  const state = { formInitialized: true, section: currentSectionIndex };
  window.history.pushState(state, "", "");
}, [currentSectionIndex]);

---

#### 3. popstate ハンドラは「履歴離脱を完全にブロック」するよう厳格に制御する

useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state;
    if (state?.formInitialized && typeof state.section === "number") {
      setCurrentSectionIndex(state.section);
    } else {
      // 不正な履歴（外部履歴）に戻ろうとした場合、強制的に初期セクションに戻す
      window.history.pushState({ formInitialized: true, section: 0 }, "", "");
      setCurrentSectionIndex(0);
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);

---

### ✅ 期待される動作

- どのセクションにいても、戻るキー操作は必ず「前セクション」に戻るのみとなる  
- セクション index = 0 のときに戻るキーを押しても、離脱せずセクション0にとどまり続ける  
- ユーザーが「完了」ボタンを押すまでブラウザ履歴でページ遷移が発生しない

---

### 💡 補足

- `formInitialized` のようなフラグを `state` に埋め込むことで、他ページからの履歴との区別が明確にできる  
- フォーム以外のページでは `formInitialized` が存在しないため、この判定で分岐可能  
- より正確に制御したい場合、history.length の増加をトラッキングしてもよい（任意）
