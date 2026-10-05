<!-- 新しいゲームを追加する PR ならこちらを使う。それ以外は下の「その他」を消さず書き換える -->

## 新規ゲーム追加の場合

- ゲーム名 (en): <!-- MYGO -->
- 追加したファイル:
  - [ ] `variants/<name>.spec.js`
  - [ ] `variants/icons/<name>.icon.js`
- チェック:
  - [ ] `npm run check` が通る (gen ALL OK・衝突なし・spec の test: が全て PASS)
  - [ ] ブラウザで実際に最後まで遊んだ (2パス終局・採点が動く)
  - [ ] `node tools/sim-game.js --plies 200 docs/<name>.html` がエラーなく走り切る
- ルール概要: <!-- 1〜2行で -->

## その他の変更の場合

変更内容:
