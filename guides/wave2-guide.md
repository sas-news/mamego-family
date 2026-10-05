# wave2 バリアント作成ガイド

変則碁を `variants2/*.spec.js` に1ファイル1バリアントで追加する。
`node gen_wave2.js` が全 spec を `algo.html` に差分適用して `<file>` を生成する。
**生成された *.html を直接編集しない** — 必ず spec を編集して再生成する。

## spec ファイルの形

```js
const K = require('../gen_kit.js');
module.exports = {
    file: 'namego.html',      // 出力ファイル名 (既存110種と被らない一意名)
    en: 'NAMEGO',             // 英字表示名 (大文字)
    jp: '日本語名',
    prefix: 'namego',         // ルームID/保存キーの接頭辞 = fileの拡張子なし
    desc: 'index.htmlカードの1行説明',
    kind: 'stone',            // アイコン種別。既存kindを流用可、新規名でもOK(汎用アイコンになる)
    spec: [                   // [mode, oldString, newString] の置換リスト
        ...K.rb('NAMEGO', '日本語名', 'namego'),   // タイトル/H1/キー置換 (必須・先頭)
        // ... ここにルール置換 ...
        ...K.STONE_SPEC,       // 必ず最後に (碁カン→碁石1マス化・盤9/13/19・トレイ非表示)
    ],
    test: `...`,              // サンドボックス内で実行されるテスト文字列
};
```

- `K.ONE` = 最初の1箇所だけ置換、`K.ALL` = 全箇所置換。
- `spec` の代わりに `build(baseSrc, K)` 関数を export してもよい (自由生成)。
- 文字列内のバッククォート・`${}` 注入に注意。置換 newString 側は自由記述。

## 主要アンカー (algo.html 内の正確な文字列。K.<名前> で参照)

| 名前 | 内容 |
|---|---|
| NBRS_GRID | `getNeighbors` 全体 → 書き換えると連結・呼吸・地・窒息が全部変わる |
| VALID_BOUNDS | `isValidPlacement` 冒頭の bounds/empty チェック → ここに制約追加 |
| CAPTURE_BLOCK | executeMove 内の捕獲ブロック → 取りの変種 |
| TURN_FLIP | `consecutivePasses=0; holdUsed=false; turn=opponent;` → 手番直前の処理挿入 |
| PASS_INC | `handlePass` 冒頭 → パス挙動変更 |
| RESET_BOARD | `board = Array(...fill(0)` → 初期配置 (壁=3等) |
| RESET_HELD | resetGame 内の他状態リセット |
| SNAP_PUSH / SNAP_POP | 履歴スナップショット → 新しい状態変数はここにも登録 (undo対応) |
| SAVE_TAIL / ONLINE_SEND / ONLINE_RECV / LOAD_HOLD | セーブ・オンライン同期 → 新状態はここにも |
| BOARD_DECL | `let board = ...` 宣言 → グローバル状態変数の追加先 |
| TURN_LINE | 手番表示行 → 表示テキスト変更 |
| AI_EVAL | AI評価関数 |
| GRID_RENDER | render() 内の格子線描画位置 |
| INFO_ALGO | ルール説明ボックスのHTML (rbでは変わらないので別途差替) |
| RV_ALGO / RC_ALGO | ルール文・操作説明 → `K.rv([...])` / `K.rc([...])` で生成 |
| SIZE_BTNS / STARS_ALGO | 盤サイズボタン / 星点 (STONE_SPECが9/13/19に変える) |

全リストは gen_kit.js の `module.exports` を見ること。

## よく使う部品

- `K.rv(['文1','文2'])` → RULES_VARIANT 文字列生成 (シングルクォートは `\'` でエスケープ)
- `K.WIN_BY_RULE_FN` → `winByRule(player,'〇〇勝ち','詳細HTML')` を定義に追加:
  `[K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + '\n        function endGameByScore() {']`
- `K.CUE_STARS(code)` / `K.CUE_GRID(code)` → render() 内に装飾コード挿入 (変数: padding, cellSize, ctx, BOARD_SIZE)
- `K.LEGAL_DOTS_SPEC` → 着手可能点のドット表示
- `K.EVENT_CHIP_SPEC(expr)` → ヘッダにイベント予告チップ
- `K.WALL_SPEC` / `K.WALL_DRAW` / `K.WALL_GUARD_SPEC` → 壁(値3)関連の定石
- `K.voidDraw(expr)` / `K.wrapMarks(calls)` / `K.STONE_MARKS_SPEC(body)` → 描画系
- 終局変更: `endGameByScore` / `calculateTerritory` 関数を丸ごと差替。

## テスト (test フィールド)

`node test-wave2.js` が各HTMLを vm サンドボックスで起動し、`test` 文字列を実行する。
中で `assert(name, cond)` が使える。参照できるグローバル例:
`board`(配列), `BOARD_SIZE`, `isValidPlacement(cells,player)`, `executeMove({cells:[{x,y}]},player)`,
`getNeighbors(idx)`, `getCapturedStones(boardState,player)`, `turn`, `captures`, `pieces`,
`history`, `gameOver`, `gameResultData`, `resetGame()`, `endGameByScore()`, `calculateTerritory()`。
盤は `board.fill(0)` でリセット可能。最低3アサート: 起動・特殊ルール・境界ケース。

## 作業手順

1. `variants2/<name>.spec.js` を作成
2. `node gen_wave2.js` → ALL OK まで繰り返す (MISSING は置換失敗 = アンカー不一致)
3. `node test-wave2.js` → PASS まで繰り返す
4. `git add variants2/<自分の*.spec.js> <自分の*.html>` だけ add (他バッチの生成物は add しない)
5. `git commit` → `git pull --rebase origin devin/wave2` → `git push origin devin/wave2`
   (競合時: `git checkout --ours` せず spec だけ再確認して再 push)

**禁止**: index.html / gen_kit.js / gen_wave2.js / test-wave2.js / algo.html / 既存wave1ファイルの編集。
**注意**: 囲碁の骨格 (交互着手・呼吸・取り・コウ・パス終局) は残す。想定外の面白さOK。
