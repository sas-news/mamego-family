# バリアント (spec) 作成ガイド

変則碁は `variants/*.spec.js` に1ファイル1バリアントで定義する。
`node gen_specs.js` が全 spec を `tools/base.html` (中立ベース) に差分適用して `docs/<file>` を生成する。
**生成された HTML を直接編集しない** — 必ず spec を編集して再生成する。
index.html も編集禁止 — `node gen_index.js` が spec の {file,en,jp,desc,kind,icon} と
icon.js からカタログ行 + drawIcon case を自動挿入する。

最短手順: `npm run new-game -- <名前> <英字名> <日本語名>` → 編集 → `npm run check`。

## spec ファイルの形

```js
const K = require('../gen_kit.js');
module.exports = {
    file: 'namego.html',      // 出力ファイル名 (英小文字+go.html、既存と被らない一意名)
    en: 'NAMEGO',             // 英字表示名 (大文字)
    jp: '日本語名',           // ○○碁
    prefix: 'namego',         // ルームID/保存キーの接頭辞 = fileの拡張子なし
    desc: 'index.htmlカードの1行説明',
    kind: 'stone',            // アイコン種別。新規は 'stone' (通常碁石) がほぼ全て
    icon: 'namego',           // variants/icons/namego.icon.js の icon 値 (専用アイコン必須)
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
- `catalog: false` を付けると index.html の自動カタログ行を生成しない
  (レガシーの手書きカード掲載ゲーム用。新規ゲームでは使わない)。

## 主要アンカー (tools/base.html 内の正確な文字列。K.<名前> で参照)

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
| INFO_BASE | ルール説明ボックスのHTML (rbでは変わらないので別途差替) |
| RV_BASE / RC_BASE | ルール文・操作説明 → `K.rv([...])` / `K.rc([...])` で生成 |
| SIZE_BTNS / STARS_BASE | 盤サイズボタン / 星点 (STONE_SPECが9/13/19に変える) |

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

## アイコン spec (variants/icons/<prefix>.icon.js)

```js
module.exports = {
    icon: 'namego',        // spec の icon 値 (= icon-draw.js drawIcon の case 名)
    body: `               // case 本体 (c=ctx, W=描画幅, cell=6目格子1マス幅 px が使える)
        // 使える部品: dot(gx,gy,fill,stroke,r,alpha) 石
        //             blk(gx,gy,fill,stroke)         矩形ブロック
        //             bond(x1,y1,x2,y2,w)           結合線
        //             mol([[x,y]...],fill,stroke)    分子
        //             ring(gx,gy,r,stroke,w) seg(x1,y1,x2,y2,stroke,w)
        //             txt(s,gx,gy,fill,h) tri(gx,gy,r,fill,stroke)
        // 色: P1(黒石) P1S(黒縁) P2(白石) P2S(白縁)。6x6格子座標で指定
        dot(2, 2, P1, P1S); dot(3, 3, P2, P2S);
        tri(4, 1.5, cell * 0.5, '#f59e0b', '#b45309');
    `,
};
```

テーマを象徴する2-5要素の描画で十分。icon-draw.js 既存の `case` 群が実例300+。

## テスト (test フィールド)

`node test-specs.js` が各HTMLを vm サンドボックスで起動し、`test` 文字列を実行する。
中で `assert(name, cond)` が使える。参照できるグローバル例:
`board`(配列), `BOARD_SIZE`, `isValidPlacement(cells,player)`, `executeMove({cells:[{x,y}]},player)`,
`getNeighbors(idx)`, `getCapturedStones(boardState,player)`, `turn`, `captures`, `pieces`,
`history`, `gameOver`, `gameResultData`, `resetGame()`, `endGameByScore()`, `calculateTerritory()`。
盤は `board.fill(0)` でリセット可能。最低3アサート: 起動・特殊ルール・境界ケース。

## 対局バランスの考え方

- 「先手だけが利益を得る」機構 (先手のみイベント発動等) は NG — 両者に同じ周期で効くようにするか、後手にも同等の機会を
- 「取った側が一方的に強い」も偏りやすい — コストや副次効果で対称性を
- 終局不能を防ぐため、強制終局 (手数・区域・カウント) を持つルールはシミュレーションで gameOver 到達を確認する
- **キーボード必須操作は禁止**: 特殊操作を作るならボタン等のタッチUIを必ず追加すること (r/h/c キー相当は既存ボタンにマッピング済み)
- 囲碁の骨格 (交互着手・呼吸・取り・コウ・パス終局) は残す。想定外の面白さOK

## VPARAMS — バリアント固有設定 (パラメータUI)

spec 配列に `K.params([...])` を1つ挿入すると、設定モーダルに「このゲームの設定」UIが自動生成される。ゲームコードは `P('key')` で現在値を読む。値は `localStorage['vpar:<file>']` に保存されリロード後も残る。`def` は必ず元のリテラルと同じ値にすること (デフォルト挙動を変えない)。

```js
K.params([
    { key: 'interval', label: 'イベント間隔', min: 1, max: 10, def: 4, unit: '手' },
    { key: 'radius',   label: '効果範囲',     min: 1, max: 5,  def: 2 },
    { key: 'bonus',    label: 'ボーナス',     min: 0, max: 10, def: 2, step: 0.5 },
    { key: 'mode',     label: '挙動', options: [{v:'a',l:'穏やか'},{v:'b',l:'激しい'}], def: 'a' },
]),
```

- 調整対象: イベント間隔・区域半径/範囲・個数・確率・得点係数・閾値・打ち切り手数 などバランスに効く定数すべて。
- `P('key')` は使用箇所で直接呼ぶ (トップレベルのconstに代入しても動くが、設定変更が即時反映されない)。`P('x') || <元の値>` でフォールバックする癖を付ける。
- ロード時に構築される構造 (区域Set等) を使う場合: `let` + rebuild関数化し、`function onVariantParam(p){ ... }` を同スコープに宣言すると変更時に即時再構築される (参照: variants/yeastgo.spec.js)。
- label は日本語。min/max/def は静的な数値のみ (BOARD_SIZE依存の初期値は hint で説明するか適当な固定値に丸める)。
- 対象外: 盤面サイズ・対戦モード・コミ (共通設定が担当)。

## 作業手順

1. `npm run new-game -- <名前> <英字名> <日本語名>` (雛形が variants/ に生成される)
2. spec と icon を編集 → `npm run gen` → ALL OK まで繰り返す (MISSING は置換失敗 = アンカー不一致)
3. `npm test` → PASS まで繰り返す (`npm run check` で2+3+一意性検査をまとめて実行)
4. `node tools/sim-game.js --plies 200 docs/<file>` で `ended=gameOver` を確認
5. ブラウザで `docs/<file>` を開いて実際に最後まで遊ぶ
6. `git add variants/<自分の*.spec.js> variants/icons/<自分の*.icon.js>` だけ add
   (生成物の HTML/index/games.json 等はマージ後に regen-assets workflow が作るので PR に不要。
    含めたい場合は `npm run gen` の全出力をコミットする — 部分コミットは不可)

**禁止**: docs/index.html・docs/icon-draw.js・tools/base.html・gen_*.js・他者のspecの編集。
