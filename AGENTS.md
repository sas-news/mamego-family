# AGENTS.md — AIエージェント向け作業ガイド

このリポジトリの作業はこのファイルだけ読めば完結する。詳細仕様は [guides/spec-guide.md](guides/spec-guide.md)。

## リポジトリ構造

| 場所 | 中身 |
|---|---|
| `tools/base.html` | 全ゲーム共通の中立テンプレート (碁盤・エンジン・UI) |
| `variants/*.spec.js` | 1ゲーム1ファイルの差分レシピ (~1000件) |
| `variants/icons/*.icon.js` | 一覧カード用アイコン (~690件) |
| `docs/` | 公開サイトの生成物 (HTML/JSON/OGP)。**直接編集禁止** |
| `gen_specs.js` | spec → HTML ジェネレータ |
| `gen_index.js` | spec+icon → index.html カタログ行・icon-draw.js case 挿入 |
| `gen_kit.js` | アンカー定数 (K.*) とヘルパーの定義本体 |
| `tools/build-manifest.js` / `tools/inject-site.js` | games.json/sitemap 生成・全HTMLへの共通部品注入 |
| `test-specs.js` | spec の `test:` を生成HTMLで実行 |
| `tools/sim-game.js` | ランダム対局シミュレーション |
| `tools/check-unique.js` | 名前/file/prefix/icon の衝突検査 |

## 生成モデル

各ゲーム = `tools/base.html` に spec の `[mode, oldString, newString]` 置換リストを順次適用したもの。
`oldString` は base.html 内の**完全一致文字列** (typoやベース変更で見つからないと gen が `MISSING` で失敗する)。
アンカー定数は `gen_kit.js` の `module.exports` に全一覧がある。

## 新規ゲームの作り方 (やることはこの通り)

```sh
npm run new-game -- <prefix> <EN> <JP>   # variants/<prefix>.spec.js + variants/icons/<prefix>.icon.js を生成
#   prefix: 英小文字+数字で 'go' で終わる (例: mygo → docs/mygo.html が生成される)
# 2ファイルを編集する (spec 配列にルール差分、アイコン描画、test に assert 3つ以上)

npm run check                            # gen + 衝突検査 + 全テスト。通るまで修正を繰り返す
node tools/sim-game.js --plies 200 docs/<file>   # 例外エラーが出ないこと。
                                               #   no-end フラグは通常碁系では想定内だが、
                                               #   終局を早めるルールを持つゲームでは gameOver 到達を確認
```

ブラウザで `docs/<file>` を開き、実際に対局して最後まで遊べることを確認する。

## 絶対ルール

- `docs/` 配下 (生成物)・`tools/base.html`・`gen_*.js`・他人の spec は編集しない
- spec は `...K.rb(EN, JP, prefix)` を先頭、`...K.STONE_SPEC` を末尾に置く (雛形がその形で生成される)
- 新規 spec は `icon:` 必須 (`variants/icons/<icon>.icon.js` が無いと `check-unique` が NG)
- `catalog: false` はレガシー専用。新規ゲームに付けない (一覧に出なくなる)
- spec のルールは「囲碁の骨格」(交互着手・呼吸・取り・コウ・2パス終局) を残す。キーボード必須操作は禁止 (タッチUIで代替)
- spec は Node 標準モジュールのみ使用可

## PR

- PR に含めるのは `variants/` の spec+icon 2ファイルのみ。生成物は `regen-assets` workflow がマージ後に自動生成する
- 生成物を含めたい場合は `npm run gen` の出力を**すべて**コミット (部分コミットは他の生成物と不整合になるので禁止)
- CI (`pr-check`) が gen・衝突検査・全テストを実行する。ローカルの `npm run check` と同じ

## エラー対処

| エラー | 意味と対処 |
|---|---|
| `MISSING` (gen) | アンカーが base.html に無い。`tools/base.html` から対象文字列をコピペし直す |
| `icon がありません` | spec に `icon:` を追加し `variants/icons/<icon>.icon.js` を作成 |
| `file/prefix が衝突` | 別名にする (`node tools/check-unique.js` で再検査可) |
| sim-game で `errors` や早期 `ended` | 実行時例外 or 初手から合法手なし。spec のロジックを見直す |
