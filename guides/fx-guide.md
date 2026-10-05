# FX演出ガイド (mamego-family)

tools/base.html に全バリアント共通の「FXエンジン」が組み込まれている。
各バリアントはこのAPIを呼ぶだけで、移動アニメ・爆発・発光・揺れ・常時オーバーレイ・壁テクスチャを実装できる。

## FX API (全バリアントのグローバルに存在)

| 関数 | 用途 |
|---|---|
| `fxSlide(fromIdx, toIdx, dur=340)` | 石が1交点から別交点へ滑るアニメ。回転・環流・風・重力・押し出しなど「石が動いた」ことを可視化。idx = `y * BOARD_SIZE + x`。`dur` はms、大きいほどゆっくり。 |
| `fxBurst(idx, color, n=14, speed=1.6)` | その交点で粒子が飛び散る。爆発・捕獲・消滅・雷着弾など。 |
| `fxSplash(idx, color, n=8)` | 上方向へ散る小粒 (水しぶき・腐食・毒の飛沫)。重力で落ちる。 |
| `fxGlow(idx, color, dur=600)` | 交点が一瞬光る拡大リング。出目・イベント発動・復活・選択・警告。 |
| `fxText(idx, str, color, dur=1100)` | 交点上に浮かぶ文字。'BOOM!' '+2目' など。 |
| `fxShake(mag=5, dur=260)` | 盤面全体を揺らす。爆発・地震・巨大イベント。 |
| `fxAmbient(fn)` | 常時オーバーレイ描画を登録。`fn(ctx2, now, padding, cellSize)`。雨・闇・泡・揺らめき・水流など。呼ばれるたび描画されるので `now` (ms) でアニメ化する。**ゲーム開始直後から毎フレーム呼ばれる**。board や状態を読んでよい。 |
| `obstaclePainter = fn` | 壁(3)・特殊マス(4)の描画を差し替え。`fn(val, cx, cy, cellSize, idx)` → 自分で描いたら `return true`。ただし `WALL_GUARD_SPEC` (FALLBACK_SKIP) 使用バリアントはフォールバックループで壁をスキップするため、obstaclePainter は呼ばれない。壁の見た目は「壁描画ブロック置換」の方を使うこと (後述)。 |
| `fxNow()` | `performance.now()` or `Date.now()`。時刻ベースのアニメ用。 |

## 自動演出 (すでに全バリアントに入っている)

- 着手点に緑の着地リング (lastMove検知)
- 盤面差分検知: 石消滅→小爆発、石の色反転→リング、壁出現/消滅→煙
- これらは render() 内で自動的に走るので、バリアント側で何もしなくても基本的な「何が変わったか」は見える。**バリアント固有の演出はこれらに「足す」もの**。

## 壁の専用テクスチャ (WALL_DRAW / voidDraw)

壁系バリアント (WALL_SPEC / WALL_GUARD_SPEC / voidDraw 使用) は、盤面を格子ごと暗い面で覆う「彫り込み」描画をしている (drawBoardElements 冒頭の `const covered` アンカーを置換)。

同じアンカー `            const covered = new Set(); // ピース描画でカバー済みのマス` を置き換えて、**wall セル (board[i]===3) を好きな質感で塗る専用ブロック**を書く。`fxNow()` を読めば脈動・揺らぎ・泡立ちのアニメ塗りになる。

例: LAVAGO (gen_variants.js) — 玄武岩グラデ + 脈動する灼熱亀裂 + 次に沈むリングの予告。パターン:

```js
[ONE, `            const covered = new Set(); // ピース描画でカバー済みのマス`,
`            const covered = new Set(); // ピース描画でカバー済みのマス

            // 水: 壁セルを深い青 + ゆらぐ波紋で塗る
            {
                const now = fxNow();
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== 3) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize, hh = cellSize * 0.5;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.8);
                    g.addColorStop(0, '#0e4a6e'); g.addColorStop(1, '#06263d');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 600 + x * 0.8 + y * 1.1);
                    ctx.strokeStyle = 'rgba(140,220,255,' + (0.25 + ph * 0.2) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.2 + ph * 0.08), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }`],
```

**重要**: 置換文字列の先頭に必ず `            const covered = new Set(); // ピース描画でカバー済みのマス` を含めること (その行を消すと描画全体が壊れる)。

## 着手効果発生時の演出 (TURN_FLIP / 効果関数)

盤面を書き換える処理 (回転・爆破・水没・凍結など) の中で、変化したセルに対して `fxSlide` / `fxBurst` / `fxGlow` / `fxShake` を呼ぶ。

例: ROTATEGO (variants2/rotatego.spec.js) — spin() で「どこからどこへ動いた」を記録してスライド:

```js
cs.forEach(([x, y], k) => {
    board[y * N + x] = vals[(k - dir + vals.length) % vals.length];
    const [sx, sy] = cs[(k - dir + vals.length) % vals.length];
    if (board[y * N + x] !== 0) fxSlide(sy * N + sx, y * N + x, 420);
});
```

例: BOMBGO (variants2/bombgo.spec.js) — 爆破の中心でリング+揺れ+文字+各セルで火花:

```js
fxGlow(ci, '#fbbf24', 700);
fxShake(8, 380);
fxText(ci, 'BOOM!', '#fb923c', 900);
for (...) { fxBurst(i0, '#f97316', 10, 1.8); fxBurst(i0, '#fbbf24', 5, 1.2); }
```

## 常時オーバーレイ (fxAmbient)

`let obstaclePainter = null;` の行をアンカーに初期化コードを足す (wave2 の gen_kit には `K.FX_BOOT` アンカー = `'        let obstaclePainter = null;'` がある — なければ同じ文字列を使う):

```js
[ONE, `        let obstaclePainter = null;`,
`        let obstaclePainter = null;
        // 闇: 常時薄暗いヴィネットとときどき走る稲光
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.fillStyle = 'rgba(0,0,20,0.28)';
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
```

常時描画は「そのルールの雰囲気」を出す主役。水なら波紋・泡、闇なら暗がり+発光、竜巻なら渦巻き、雪なら降雪など。

## 石・碁盤デザインの改造

- `drawPieceShape(cellsAbs, padding, cellSize, fill, stroke, alpha)` — 石の描画。丸い球の代わりに牌・カード・ダイヤ・星などにしたければ、この関数自体を [ONE] 置換するか、バリアント専用の描画を drawBoardElements 冒頭で行う。
- `drawObstacleCell(val, cx, cy, cellSize, idx)` — フォールバックの壁(3)/特殊(4)描画。これを書き換えてもよい (ただし WALL_GUARD_SPEC のバリアントではフォールバックに壁が来ない)。
- `currentTheme` (boardBg, lineColor, p1Fill 等) は設定で切替可。テーマ固定で盤色を変えるなら `THEMES` / 適用コードを置き換えてよい。
- 碁盤の形そのもの (円盤・六角・ハート型など) は render() 冒頭の格子線・外枠・背景を差し替えてよい。circlego の CIRCLE_DRAW が例。

## 確認

- `node gen_wave2.js` / `node gen_variants.js` で再生成 → `node test-wave2.js` / `node test-variants.js` 全パス。
- `node tools/sim-game.js --plies 120 <file>` で起動・進行エラーがないか。
- **ブラウザで実際に開いて目視** (file://)。描画が壊れてないか、演出が発火するか、見やすいか。変なら何度でも直す。
