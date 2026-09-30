// DUNEGO — 砂丘碁: 砂丘(区域)は手数で形が変わる流砂地帯。7手ごとに砂丘が東へ流れる
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
const ST_INIT = `{ ply: 0 }`;
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
    file: 'dunego.html',
    en: 'DUNEGO',
    jp: '砂丘碁',
    prefix: 'dunego',
    desc: '流砂の砂丘地帯。7手ごとに砂丘が東へ流れ、乗った石は砂に呑まれる。',
    kind: 'stone',
    icon: 'dunego',
    spec: [
        ...K.rb('DUNEGO', '砂丘碁', 'dunego'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 砂丘: 2条の斜めリッジ (board=3 の移動壁)。7手ごとに +1x で流れる
        let DUNE = new Set();
        function rebuildDune() {
            DUNE = new Set();
            for (let k = 0; k < 7; k++) {
                const x = 2 + Math.round(k * 0.9), y = 2 + k;
                if (x < BOARD_SIZE && y < BOARD_SIZE) DUNE.add(y * BOARD_SIZE + x);
            }
            for (let k = 0; k < 6; k++) {
                const x = BOARD_SIZE - 3 - Math.round(k * 0.8), y = 1 + k;
                if (x >= 0 && y < BOARD_SIZE) DUNE.add(y * BOARD_SIZE + x);
            }
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            rebuildDune();
            DUNE.forEach(i => { board[i] = 3; });`],
        // 砂丘の移動: 7手ごとに +1x (右端は左端へ回り込む)。乗った石は砂に呑まれる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 砂丘の流動
            st.ply++;
            if (st.ply % 7 === 0) {
                DUNE.forEach(i => { if (board[i] === 3) board[i] = 0; });
                const next = new Set();
                DUNE.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    next.add(y * BOARD_SIZE + ((x + 1) % BOARD_SIZE));
                });
                DUNE = next;
                let swallowed = 0;
                DUNE.forEach(i => {
                    const v = board[i];
                    if (v === 1 || v === 2) {
                        captures[v === 1 ? 2 : 1]++;
                        board[i] = 0;
                        swallowed++;
                        fxSplash(i, '#e7c56a', 8);
                    }
                    board[i] = 3;
                });
                if (swallowed > 0) {
                    const pi0 = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(pi0, swallowed + '石が砂に呑まれた!', '#eab308', 1400);
                }
                pieces = pieces.filter(pc => pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player));
                fxShake(3, 260);
            }

            turn = opponent;`],
        // 砂丘の描画 (砂の質感)
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(`                    // 砂丘: 黄金の砂面 + 風紋
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#d9b25c'); g.addColorStop(1, '#a67c2e');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    const ph = Math.sin(now / 800 + x * 0.9 - y * 0.4);
                    ctx.strokeStyle = 'rgba(255,240,190,' + (0.35 + ph * 0.15) + ')';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx - hh * 0.7, cy - cellSize * 0.1 + ph * cellSize * 0.06);
                    ctx.quadraticCurveTo(cx, cy + cellSize * 0.08, cx + hh * 0.7, cy - cellSize * 0.1 - ph * cellSize * 0.06);
                    ctx.stroke();`)],
        ...K.WALL_GUARD_SPEC,
        ...K.EVENT_CHIP_SPEC(`'砂丘移動まで ' + (7 - (st.ply % 7)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            砂丘碁: 砂丘の斜めリッジは移動する壁。7手ごとに東へ1歩流れ、乗った石は砂に呑まれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上の砂丘 (金色) は着手不可の流砂壁。7手ごとに全体的に東へ1マス流れる。',
            '砂丘が乗った石は色に関わらず砂に呑まれ、相手のアゲハマになる。',
            '逃げ場のない脇に置くと呑まれる。チップで次の移動までの手数を確認。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('砂丘がある', DUNE.size > 6);
        assert('砂丘は壁', [...DUNE].every(i => board[i] === 3));
        const d0 = [...DUNE].find(i => (i % BOARD_SIZE) < BOARD_SIZE - 1);
        const tx = (d0 % BOARD_SIZE) + 1, ty = (d0 / BOARD_SIZE) | 0;
        assert('砂丘には打てない', isValidPlacement([{ x: d0 % BOARD_SIZE, y: ty }], 1) === false);
        pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ply = 6;
        executeMove({ cells: [{ x: tx, y: ty }] }, 2);
        assert('砂丘が流れた', DUNE.has(I(tx, ty)) && board[I(tx, ty)] === 3);
        assert('乗った石は呑まれた', captures[1] === 1);
    `,
};
