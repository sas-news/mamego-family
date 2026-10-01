// CAVEGO — 洞窟碁: 岩壁が区画を分ける洞窟盤。石のそばだけが見える
const K = require('../gen_kit.js');
module.exports = {
    file: 'cavego.html',
    en: 'CAVEGO',
    jp: '洞窟碁',
    prefix: 'cavego',
    desc: '岩壁が区画を分ける洞窟盤。石の周りだけ灯りが届く探検フィールド。',
    kind: 'stone',
    spec: [
        ...K.rb('CAVEGO', '洞窟碁', 'cavego'),
        K.params([
            { key: 'wall_density', label: '岩壁の密度', min: 1, max: 8, def: 2, hint: '大きいほど岩壁が増える' },
            { key: 'light_radius', label: '灯りの届く範囲', min: 1, max: 6, def: 3 },
        ]),
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            // 洞窟碁: 内側に岩壁を点在させて区画を分ける
            for (let i = 0; i < board.length; i++) {
                const wx = i % BOARD_SIZE, wy = Math.floor(i / BOARD_SIZE);
                if (wx === 0 || wy === 0 || wx === BOARD_SIZE - 1 || wy === BOARD_SIZE - 1) continue;
                if ((wx * 7 + wy * 13) % 17 < (P('wall_density') || 2)) board[i] = 3;
            }`],
        // 岩壁は暗い洞窟の岩肌 + 結晶の瞬き
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_CAVE)],
        ...K.WALL_GUARD_SPEC,
        // 洞窟の暗がり: 石から遠いマスを薄暗く覆う
        ...K.STONE_MARKS_SPEC(`            ctx.save();
            ctx.fillStyle = 'rgba(8,10,24,0.30)';
            for (let i = 0; i < board.length; i++) {
                const fx = i % BOARD_SIZE, fy = Math.floor(i / BOARD_SIZE);
                let lit = false;
                for (let j = 0; j < board.length && !lit; j++) {
                    if (board[j] !== 1 && board[j] !== 2) continue;
                    const jx = j % BOARD_SIZE, jy = Math.floor(j / BOARD_SIZE);
                    if (Math.max(Math.abs(jx - fx), Math.abs(jy - fy)) <= (P('light_radius') || 3)) lit = true;
                }
                if (!lit) {
                    ctx.fillRect(padding + (fx - 0.5) * cellSize, padding + (fy - 0.5) * cellSize, cellSize, cellSize);
                }
            }
            ctx.restore();`),
        [K.ONE, K.INFO_ALGO, `            洞窟碁: 岩壁が区画を分ける。石のそばだけ灯りが届く洞窟盤<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の内側に岩壁 (■) が点在し、区画を分ける洞窟になっている。岩壁は置けず取れない。',
            '石の周囲3マスだけ灯りが届き、遠くは薄暗い — 探検するように盤を明かしていこう。',
            '区画の分断を活かして地を作るか、洞窟奥深くへ敵を誘い込むか。',
        ])],
        // 洞窟の薄暗さ: ヴィネットがゆっくり呼吸する
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        fxAmbient((ctx2, now, pad, cs) => {
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.save();
            const vg = ctx2.createRadialGradient(w / 2, w / 2, w * 0.3, w / 2, w / 2, w * 0.75);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(2,4,12,' + (0.16 + 0.05 * Math.sin(now / 800)) + ')');
            ctx2.fillStyle = vg;
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        assert('洞窟の岩壁がある', board.filter(v => v === 3).length > 5);
        assert('縁は壁なし', board.slice(0, BOARD_SIZE).every(v => v === 0));
        board.fill(0); pieces = [];
        assert('通常着手は可能', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[4] = 3;
        assert('岩壁には置けない', isValidPlacement([{ x: 4, y: 0 }], 1) === false);
    `,
};
