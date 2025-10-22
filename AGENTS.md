# AGENTS.md

資産シミュレーター開発におけるAIエージェント利用ルール（codex-cli想定）。本ドキュメントは**必ず順守**する運用契約（Agent Contract）と、**自動検証**のための設定・フックスクリプトを含む。

---

## 1. Agent Contract（必須要件）

1. **応答言語の固定**
   - すべての応答は**日本語**。
   - 英語の混入は引用・識別子・既存外部API仕様の固有名を除き不可。

2. **コードコメントの言語**
   - すべての**コメントは日本語**（`//`, `/* */`, `#`, `<!-- -->` など）。
   - 自動生成のコメントも日本語。英語コメントは禁止（固有名・定数名の説明を除く）。

3. **文字コードの統一**
   - すべてのテキスト（コード・設定・ドキュメント・テンプレート）は**UTF-8（BOMなし）**。
   - 改行は **LF** 固定。

4. **優先出力形式**
   - コードブロックは言語指定付き（例：```ts、```tsx、```json、```bash）。
   - 例示コード内の**コメントは日本語**で要点を簡潔に説明。

---

## 2. codex-cli 用プロンプト（雛形）

### 2.1 System（固定メッセージ）
```
あなたは日本語のみで回答するアシスタントです。出力は常に日本語。
コード内のコメント、説明文、要約、手順も日本語で記述してください。
文字コードは UTF-8（BOMなし）、改行は LF を前提にしてください。
英語の使用は外部仕様の固有名（API 名、型名、識別子）に限ります。
```

### 2.2 Developer（ガードレール）
```
- 応答本文・コードコメントに英語文を使わないこと（固有名除く）。
- 例示コードは UTF-8（BOMなし）前提、HTML は <meta charset="UTF-8"> を含める。
- TypeScript/React を想定した出力を優先。
- ファイル作成・編集手順は、実行順のシェルスクリプト例を添付すること。
```

### 2.3 User（要求テンプレート）
```
目的：
前提：
成果物：（ファイル名と役割を列挙）
制約：日本語出力／コメント日本語／UTF-8 LF／外部仕様の固有名のみ英語可
```

---

## 3. リポジトリ標準設定

### 3.1 `.editorconfig`
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
```

### 3.2 `.gitattributes`
```gitattributes
* text=auto eol=lf
*.{js,jsx,ts,tsx,json,css,scss,md,html,yml,yaml} text working-tree-encoding=UTF-8
```

### 3.3 HTML テンプレート（抜粋）
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>資産シミュレーター</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 4. 自動検証（プリコミット & CI）

### 4.1 依存ツール
- `node` / `pnpm`（または `npm`）
- `iconv`, `file`, `rg`(ripgrep)
- `bash`

### 4.2 `package.json` スクリプト
```json
{
  "scripts": {
    "lint:encoding": "bash scripts/check-encoding.sh",
    "lint:comments": "bash scripts/check-japanese-comments.sh",
    "lint": "pnpm lint:encoding && pnpm lint:comments"
  }
}
```

### 4.3 `scripts/check-encoding.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

TARGETS=$(git ls-files | grep -E '\.(js|jsx|ts|tsx|json|md|css|scss|html|yml|yaml|txt)$')

fail=0
while IFS= read -r f; do
  if ! iconv -f UTF-8 -t UTF-8 "$f" >/dev/null 2>&1; then
    echo "文字コード不正: $f"
    fail=1
  fi
  if head -c3 "$f" | od -An -t x1 | grep -qi 'ef bb bf'; then
    echo "BOM 禁止: $f"
    fail=1
  fi
  if grep -U -Il $'\r' "$f" >/dev/null 2>&1; then
    :
  else
    if grep -U -n $'\r' "$f" >/dev/null 2>&1; then
      echo "CRLF 禁止（LF に統一）: $f"
      fail=1
    fi
  fi
done <<< "$TARGETS"

exit $fail
```

### 4.4 `scripts/check-japanese-comments.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

TARGETS=$(git ls-files | grep -E '\.(ts|tsx|js|jsx)$')

fail=0
while IFS= read -r f; do
  COMMENTS=$(rg -n --pcre2 "(?://.*|/\\*.*?\\*/)" "$f" --no-heading || true)
  if [[ -n "$COMMENTS" ]]; then
    NON_JP=$(echo "$COMMENTS" | rg -n --pcre2 '^[^:]+:\d+:(?:(?![ぁ-んァ-ヶ一-龥]).)*$' || true)
    if [[ -n "$NON_JP" ]]; then
      echo "英語のみのコメント検出: $f"
      echo "$NON_JP" | head -n 20
      fail=1
    fi
  fi
done <<< "$TARGETS"

exit $fail
```

### 4.5 `.git/hooks/pre-commit`
```bash
#!/usr/bin/env bash
set -euo pipefail
pnpm lint
```

---

## 5. 生成物の品質基準

- **日本語のみ**で説明・要約・手順を記述。
- コードブロックの**コメントは日本語**。
- 文字コード前提・環境前提を毎回明記（UTF-8（BOMなし）、LF）。
- 型定義・公開 API 仕様の固有名に限り英語表記を許容。

---

## 6. 運用
- 初回セットアップ時に Section 4 のスクリプトを配置し、pre-commit を有効化。
- PR 作成時は CI の lint が必須成功条件。
- 誤検知は PR でルール更新。
