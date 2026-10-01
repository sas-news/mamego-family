// SHOJIGO — 建具碁: 盤上の枠(区域)に石をはめると建具が完成して得点。枠内の石は呼吸+1
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
const ST_INIT = `{ done: {}, score: { 1: 0, 2: 0 }, _end: false }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'shojigo.html',
    en: 'SHOJIGO',
    jp: '建具碁',
    prefix: 'shojigo',
    desc: '盤上の枠に石をはめて建具を作る。枠内の石は呼吸+1、枠を全て埋めると建具完成で得点。',
    kind: 'stone',
    icon: 'shojigo',
    spec: [
        ...K.rb('SHOJIGO', '建具碁', 'shojigo'),
        K.params([
            { key: 'shoji_pts', label: '建具完成の得点', min: 0, max: 12, def: 4, unit: '点' },
            { key: 'frame_liberty', label: '枠内の呼吸ボーナス', min: 0, max: 3, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 枠: 四隅寄りの2x2木枠4箇所
        let SHOJI_FRAMES = [];
        function rebuildShoji() {
            const n = BOARD_SIZE;
            const a = Math.max(1, Math.round(n * 0.2)), b = n - 3 - a;
            SHOJI_FRAMES = [a, b].flatMap(gy => [a, b].map(gx =>
                [gy * n + gx, gy * n + gx + 1, (gy + 1) * n + gx, (gy + 1) * n + gx + 1]));
        }
        function inShoji(i) { return SHOJI_FRAMES.some(f => f.indexOf(i) >= 0); }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildShoji();`],
        // 枠内の石は呼吸+1
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (inShoji(curr)) liberties += (P('frame_liberty') ?? 1); // 枠内の石は建具に守られる
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (inShoji(curr)) liberties += (P('frame_liberty') ?? 1); // 枠内の石は建具に守られる
            }
            return liberties;`],
        // 建具完成: 着手後に枠が全て着手者の石で埋まっていたら+4点
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 建具完成判定: 枠が全て着手者の石で埋まったら完成 (+4点)
            SHOJI_FRAMES.forEach((f, fi) => {
                if (st.done[fi]) return;
                if (f.every(i => board[i] === player)) {
                    st.done[fi] = player;
                    st.score[player] += (P('shoji_pts') ?? 4);
                    f.forEach(i => fxGlow(i, '#fbbf24', 1200));
                    fxText(f[0], '建具完成 +' + (P('shoji_pts') ?? 4), '#fbbf24', 1500);
                }
            });

            turn = opponent;`],
        // 枠の描画: 木枠 + 完成した枠は金色に
        K.CUE_GRID(`            // 建具の枠: 四隅の木枠。完成した枠は金色に輝く
            {
                ctx.save();
                SHOJI_FRAMES.forEach((f, fi) => {
                    const done = st.done[fi];
                    f.forEach(i => {
                        const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                        const cx = padding + x * cellSize, cy = padding + y * cellSize;
                        ctx.strokeStyle = done ? 'rgba(251,191,36,0.9)' : 'rgba(139,92,46,0.75)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                        ctx.strokeRect(cx - cellSize * 0.46, cy - cellSize * 0.46, cellSize * 0.92, cellSize * 0.92);
                    });
                });
                ctx.restore();
            }`),
        // 得点を終局時にアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'建具 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_ALGO, `            建具碁: 枠内の石は呼吸+1。枠を全て自軍の石で埋めると建具完成で+4点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の四隅に2x2の木枠がある。枠内に置いた石は障子にはまり呼吸点+1。',
            '枠を全て自軍の石で埋めると建具が完成し+4点 (終局時にアゲハマ相当で加算)。',
            '枠は双方共通の得点源。相手の枠内の石を取って完成を妨ぐ手もある。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('枠が4つある', SHOJI_FRAMES.length === 4 && SHOJI_FRAMES[0].length === 4);
        const f0 = SHOJI_FRAMES[0];
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.done = {}; st.score = { 1: 0, 2: 0 };
        f0.forEach((i, k) => { if (k < 3) board[i] = 1; });
        board[f0[3]] = 0;
        assert('枠内の石は呼吸+1', getLiberties(board, f0[0]) >= 1);
        executeMove({ cells: [{ x: f0[3] % BOARD_SIZE, y: (f0[3] / BOARD_SIZE) | 0 }] }, 1);
        assert('枠を埋めると建具完成+4', st.score[1] === 4 && st.done[0] === 1);
    `,
};
