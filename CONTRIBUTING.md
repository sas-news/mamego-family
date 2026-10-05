# 新しい変則碁を追加する

このリポジトリのゲームは、ベースとなる HTML (`tools/base.html`) に **spec (差分レシピ) を当てて自動生成** されています。新しいゲームを追加するのに HTML を直接書く必要はありません — **`variants/` に spec とアイコンの2ファイルを置くだけ** です。

**AIエージェントに作らせる場合**: このリポジトリをエージェントに渡して「AGENTS.md に従って新しいゲームを作って」と依頼するだけで完結するようにしてあります。[AGENTS.md](AGENTS.md) が単一のエントリポイントです。

## 手順

1. このリポジトリを fork して clone し、Node.js (18+) を用意する
2. 雛形を生成する:
   ```
   npm run new-game -- <名前> <英字名> <日本語名>   # 例: npm run new-game -- mygo MYGO マイ碁
   ```
   → `variants/<名前>.spec.js` と `variants/icons/<名前>.icon.js` が作られる
   (手動でやるなら `guides/new-game.spec.js` / `guides/new-game.icon.js` をコピーして名前を置き換える)
3. spec 配列でベースからのルール差分を書き、アイコンを描き、`test:` に最低3つ assert を書く
   (アンカー一覧・部品集は `guides/spec-guide.md` と `gen_kit.js`)
4. ローカルで検証:

   ```
   npm run check   # gen + 衝突検査 + 全テスト
   ```

   ブラウザで `docs/<name>.html` を開き、実際に対局できるか確認する
5. PR を出す。**PR に含めるのは `variants/` の2ファイルだけでOK** — 生成物 (`docs/<name>.html` / index.html / games.json / OGP画像など) はマージ後に GitHub Actions (`regen-assets`) が自動で作り直します。
   - 生成物を含めたい場合は `npm run gen` の全出力をコミットしてください (部分コミットは不可)

## ルール

- **囲碁の骨格は残す**: 交互着手・呼吸点・石の取り・コウ禁止・2連続パス終局
- **タッチで全操作可能**: キーボード必須の操作はNG (回転/ホールドはボタンが標準装備)
- **バランス**: 先手必勝・終わらない構造はNG。`node tools/sim-game.js --plies 200 docs/<name>.html` がエラーなく走り切ることを確認 (通常碁系では `no-end` フラグは想定内、終局を早めるルールのゲームでは `ended=gameOver` 到達を確認)
- **生成物を直接編集しない**: `docs/` 配下・index.html は必ず spec 編集 → 再生成
- **アイコン必須**: ないと一覧にカードが生成されません
- **spec は Node 標準モジュールのみ**使用可 (外部パッケージは使わない)
- 編集は**自分の追加ファイルのみ**。既存バリアントの spec や `gen_*.js` / `tools/base.html` には触れない

## PR 後の流れ

`pr-check` workflow が gen・一意性チェック・全テストを回します。緑になったらメンテナがレビュー → マージ → `regen-assets` がサイトを自動更新します。

詳しい技術情報は [guides/spec-guide.md](guides/spec-guide.md) (spec の書き方・アンカー一覧・バランス指針) を参照してください。
