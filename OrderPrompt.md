# エラー事象・原因・修正指示プロンプト

## 事象
Vercelでデプロイを行った際、以下のエラーが発生した。

Error: The package `vercel-node` is not published on the npm registry

## 原因
- vercel.jsonのfunctions設定で "runtime": "vercel-node@4.0.0" のような記述があったため。
- しかし vercel-node というパッケージはnpmに存在せず、Vercel公式でも提供されていない。
- VercelのNode.js Serverless Functionsは、apiディレクトリに.tsまたは.jsファイルを配置するだけで自動で認識されるため、runtimeの明示指定やvercel-nodeパッケージの導入は不要。

## 指示（必ず順守せよ）
1. プロジェクトルートのvercel.jsonファイルを開き、functionsの"runtime": "vercel-node@..."という記述があれば**該当部分を必ず削除**すること。
   - 例: 
     {
       "functions": {
         "api/**/*.ts": {
           "runtime": "vercel-node@4.0.0"
         }
       }
     }
   → functionsプロパティごと削除、またはruntime記述のみ消す。
2. package.jsonに@vercel/nodeやvercel-nodeが依存関係に記載されていれば**アンインストール/削除**すること。
   - npm uninstall @vercel/node
   - vercel-nodeは元々存在しないので気にしなくてよい
3. apiディレクトリ配下の.ts（または.js）ファイルはそのまま維持すること。
4. 修正後、必ず再度GitHubへコミット・プッシュしてVercelでデプロイが正常に完了することを確認すること。
5. この事象が再発した場合、vercel.jsonやpackage.jsonの当該部分を必ず全文出力し、差分を示してからサポート担当者に連絡すること。

## 注意
- runtimeの指定はVercelのNode.js Functionsでは不要。自動認識に任せること。
- @vercel/nodeはTypeScript型やローカル開発用としてのみ利用されるケースもあるが、本番のVercel Functionsとしては不要。
- 追加でnpmパッケージを導入しないこと。
- 他のエラーが出た場合は、エラーメッセージ全文と関連する設定ファイルをすぐに出力せよ。

---

以上を厳密に実施せよ。
