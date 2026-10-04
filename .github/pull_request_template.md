<!-- 新しいゲームを追加する PR ならこちらを使う。それ以外は下の「その他」を消さず書き換える -->

## 新規ゲーム追加の場合

- ゲーム名 (en): <!-- MYGO -->
- 追加したファイル:
  - [ ] `variants3/<name>.spec.js`
  - [ ] `variants3/icons/<name>.icon.js`
- チェック:
  - [ ] `node gen_wave3.js` が `ALL OK` (MISSING がない)
  - [ ] `node test-wave3.js` が通る (spec の test: が全て PASS)
  - [ ] ブラウザで実際に最後まで遊んだ (2パス終局・採点が動く)
  - [ ] `node tools/sim-game.js --plies 200 <name>.html` が `ended=gameOver` になる
- ルール概要: <!-- 1〜2行で -->

## その他の変更の場合

変更内容:
