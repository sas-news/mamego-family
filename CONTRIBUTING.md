# 新しい変則碁を追加する

このリポジトリのゲームは、ベースとなる HTML (`docs/algo.html`) に **spec (差分レシピ) を当てて自動生成** されています。新しいゲームを追加するのに HTML を直接書く必要はありません — **`variants3/` に spec とアイコンの2ファイルを置くだけ** です。

## 手順

1. このリポジトリを fork して clone し、Node.js (18+) を用意する
2. `guides/new-game.spec.js` を `variants3/<あなたのゲーム>.spec.js` にコピーして編集
   - `file` `en` `jp` `prefix` `desc` `icon` を決める (`file` は `英小文字+go.html` で他と被らない一意名)
   - `spec` 配列でベースからのルール差分を書く (アンカー一覧は `guides/wave3-guide.md` と `gen_kit.js`)
3. `guides/new-game.icon.js` を `variants3/icons/<icon名>.icon.js` にコピーして編集
4. ローカルで生成して動作確認:

   ```
   node gen_wave3.js        # "ALL OK" なら成功。"MISSING" はアンカー不一致
   node gen_wave3_index.js  # index.html にカードとアイコンを挿入
   node test-wave3.js      # spec の test: が実行される
   ```

   ブラウザで `docs/<name>.html` を開き、実際に対局できるか確認する
5. PR を出す。**PR に含めるのは `variants3/` の2ファイルだけでOK** — 生成物 (`<name>.html` / index.html / games.json / OGP画像など) はマージ後に GitHub Actions (`regen-assets`) が自動で作り直します。
   - 生成物を含めたい場合は `npm run gen` の全出力をコミットしてください (部分コミットは不可)

## ルール

- **囲碁の骨格は残す**: 交互着手・呼吸点・石の取り・コウ禁止・2連続パス終局
- **タッチで全操作可能**: キーボード必須の操作はNG (回転/ホールドはボタンが標準装備)
- **バランス**: 先手必勝・終わらない構造はNG。`node tools/sim-game.js --plies 200 docs/<name>.html` で `ended=gameOver` を確認
- **生成 HTML / index.html を直接編集しない**: 必ず spec を編集して再生成
- **アイコン必須**: ないと一覧で汎用アイコンになります
- **spec は Node 標準モジュールのみ**使用可 (外部パッケージは使わない)
- 編集は**自分の追加ファイルのみ**。既存バリアントの spec や `gen_*.js` / `docs/algo.html` には触れない

## PR 後の流れ

`pr-check` workflow が gen・一意性チェック・全テストを回します。緑になったらメンテナがレビュー → マージ → `regen-assets` がサイトを自動更新します。

詳しい技術情報は `guides/wave3-guide.md` (wave3 spec 固有) と `guides/wave2-guide.md` (spec の仕組み全般) を参照してください。
