// FLOATISLEGO — 浮島碁: 盤は4つの浮き島。中央の海峡は潮の満ち干で開閉する
const K = require('../gen_kit.js');
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const ST_INIT = `{ tide: 0 }`; // 0:干潮(海峡開通) 1:満潮(海峡水没)
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'floatislego.html',
    en: 'FLOATISLEGO',
    jp: '浮島碁',
    prefix: 'floatislego',
    desc: '4つの浮き島。中央の海峡は9手ごとの潮の満ち干で開いたり沈んだりする。',
    kind: 'stone',
    icon: 'floatislego',
    spec: [
        ...K.rb('FLOATISLEGO', '浮島碁', 'floatislego'),
        K.params([
            { key: 'tide_interval', label: '潮汐の周期', min: 3, max: 30, def: 9, unit: '手' },
            { key: 'isle_radius', label: '浮島の半径', min: 0.08, max: 0.4, step: 0.01, def: 0.19 },
            { key: 'strait_width', label: '海峡の幅', min: 1, max: 3, def: 1, unit: '列' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 浮島: 4つの島 (四隅) と中央の海峡
        const ISLE_F = [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]];
        function isIsle(x, y) {
            const r = BOARD_SIZE * (P('isle_radius') || 0.19);
            return ISLE_F.some(([fx, fy]) =>
                Math.hypot(x - fx * (BOARD_SIZE - 1), y - fy * (BOARD_SIZE - 1)) <= r);
        }
        let STRAIT_SET = new Set();
        function rebuildStraitSet() {
            STRAIT_SET = new Set();
            const sw = P('strait_width') || 1;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const m = (BOARD_SIZE - 1) / 2;
                if (isIsle(x, y)) continue;
                if (Math.abs(x - m) <= sw || Math.abs(y - m) <= sw) STRAIT_SET.add(y * BOARD_SIZE + x);
            }
        }
        rebuildStraitSet();
        // 設定変更で海峡を再構成
        function onVariantParam(p) {
            if (p.key === 'isle_radius' || p.key === 'strait_width') rebuildStraitSet();
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (!isIsle(x, y) && !STRAIT_SET.has(y * BOARD_SIZE + x)) board[y * BOARD_SIZE + x] = 3;
            }`],
        // 潮の満ち干: 9手ごとに海峡が開閉する (両者に同じ周期)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 浮島の潮: 9手ごとに満ち引きが入れ替わる
            if (history.length % Math.max(1, P('tide_interval') || 9) === 0) {
                st.tide = 1 - st.tide;
                if (st.tide === 1) {
                    // 満潮: 海峡の石は流されて近くの陸に打ち上げられる。行き場がなければアゲハマ
                    let drowned = 0;
                    STRAIT_SET.forEach(i => {
                        const v = board[i];
                        if (v !== 1 && v !== 2) return;
                        let dst = -1;
                        const q = [i], seen = new Set([i]);
                        while (q.length && dst < 0) {
                            const c = q.shift();
                            for (const n of getNeighbors(c)) {
                                if (seen.has(n)) continue;
                                seen.add(n);
                                if (STRAIT_SET.has(n)) { q.push(n); continue; }
                                if (board[n] === 0) { dst = n; break; }
                            }
                        }
                        board[i] = 0;
                        if (dst >= 0) {
                            board[dst] = v;
                            pieces.push({ id: Date.now() + Math.random(), player: v, type: move.type, rot: move.rot, cells: [{ x: dst % BOARD_SIZE, y: Math.floor(dst / BOARD_SIZE) }] });
                            fxSlide(i, dst, 460);
                        } else {
                            captures[v === 1 ? 2 : 1]++;
                            drowned++;
                            fxBurst(i, '#38bdf8', 8);
                        }
                    });
                    STRAIT_SET.forEach(i => { board[i] = 3; });
                    // 打ち上げで呼吸点を失った連も掃く
                    [1, 2].forEach(cp => {
                        const dead = getCapturedStones(board, cp);
                        if (dead.length) {
                            dead.forEach(i => { board[i] = 0; });
                            captures[cp === 1 ? 2 : 1] += dead.length;
                        }
                    });
                    if (drowned) fxShake(5, 360);
                    cleanUpPieces();
                    fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '満潮!', '#38bdf8', 1100);
                } else {
                    // 干潮: 海峡が砂州として現れる
                    STRAIT_SET.forEach(i => { if (board[i] === 3) board[i] = 0; });
                    fxText((BOARD_SIZE * BOARD_SIZE / 2) | 0, '干潮!', '#fbbf24', 1100);
                }
            }

            turn = opponent;`],
        // 海は水面、海峡は干潮時に砂州
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(K.PAINT_WATER('#1a5d8f', '#0b3450'))],
        ...K.WALL_GUARD_SPEC,
        [K.ONE, K.FX_BOOT, K.FX_BOOT + K.AMBIENT_WATER],
        K.CUE_GRID(`            // 干潮の海峡: 砂州を薄く照らす
            if (st.tide === 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(224, 196, 141, 0.28)';
                STRAIT_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding + (y - 0.5) * cellSize, cellSize, cellSize);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.tide === 1 ? '満潮' : '満潮まで ' + ((P('tide_interval') || 9) - (history.length % (P('tide_interval') || 9))) + ' 手'`),
        [K.ONE, K.INFO_ALGO, `            浮島碁: 4つの浮き島。中央の海峡は9手ごとの潮の満ち干で開閉<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は4つの浮き島と、それを結ぶ中央の十字の海峡。島の外は海 (壁)。',
            '9手ごとに潮が満ち引きする: 満潮で海峡は海に沈み、残った石は相手のアゲハマに。',
            '干潮で海峡は砂州として復活する。島間の移動は潮見を読んで。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('海峡セルが存在する', STRAIT_SET.size > 4);
        assert('海峡の外は海', board[I(0, 0)] === 3);
        assert('干潮開始で海峡は開いている', [...STRAIT_SET].every(i => board[i] === 0));
        assert('海峡にも着手できる', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
        // 陸を全て黒で埋めて逃げ場をなくす → 海峡の白石は満潮で溺れる
        for (let i = 0; i < board.length; i++) if (board[i] === 0 && !STRAIT_SET.has(i)) board[i] = 1;
        const si = [...STRAIT_SET][0];
        board[si] = 2;
        history.push({}, {}, {}, {}, {}, {}, {}, {}); // 手数を満潮直前に
        const tgt = [...STRAIT_SET].find(i => board[i] === 0);
        executeMove({ cells: [{ x: tgt % BOARD_SIZE, y: Math.floor(tgt / BOARD_SIZE) }] }, 1);
        assert('満潮で海峡は海に戻る', board[si] === 3);
        assert('逃げ場のない石はアゲハマ', captures[1] >= 1);
    `,
};
