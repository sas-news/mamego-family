// CLOAKGO — 隠密碁: 各側の最初の3個の石はクロークされ幽霊表示
const K = require('../gen_kit.js');
module.exports = {
    file: 'cloakgo.html',
    en: 'CLOAKGO',
    jp: '隠密碁',
    prefix: 'cloakgo',
    desc: '各側の最初の3石は不可視の隠密石。布石が読めない序盤戦。',
    kind: 'cloak',
    spec: [
        ...K.rb('CLOAKGO', '隠密碁', 'cloakgo'),
        K.params([
            { key: 'cloak_count', label: '隠密石の数', min: 1, max: 10, def: 3, unit: '個', hint: '各側の最初の何着手がクロークされるか' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { left: { 1: P('cloak_count') || 3, 2: P('cloak_count') || 3 } }; // 隠密碁: 各側の隠し石の残り枠`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { left: { 1: P('cloak_count') || 3, 2: P('cloak_count') || 3 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { left: { 1: P('cloak_count') || 3, 2: P('cloak_count') || 3 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { left: { 1: P('cloak_count') || 3, 2: P('cloak_count') || 3 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { left: { 1: P('cloak_count') || 3, 2: P('cloak_count') || 3 } };`],
        // 配置時: 隠密枠が残っていればその石はクロークされる
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                cloak: st.left[player] > 0 ? (st.left[player]--, true) : false
            });`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : (pc.cloak ? 0.10 : 1));`],
        ...K.STONE_MARKS_SPEC(`            // 隠密石にかすかな輪郭 (持ち主にも場所の手掛かり)
            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
            ctx.setLineDash([cellSize * 0.12, cellSize * 0.10]);
            ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
            pieces.forEach(pc => {
                if (!pc.cloak) return;
                pc.cells.forEach(p => {
                    if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                    ctx.beginPath();
                    ctx.arc(padding + p.x * cellSize, padding + p.y * cellSize, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                });
            });
            ctx.restore();`),
        ...K.EVENT_CHIP_SPEC(`'隠密枠 黒:' + st.left[1] + ' 白:' + st.left[2]`),
        [K.ONE, K.INFO_BASE, `            隠密碁: 各側の最初の3石は自動でクロークされ、幽霊のようにかすかにしか見えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーの最初の3個の着手は「隠密石」になり、点線の輪郭だけが残る不可視の石。',
            '隠密石も盤上では普通の石として呼吸・取り・地に関与する — 序盤の布石が読めない。',
        ])],
        // 隠密石が置かれた瞬間に煙が立つ + 隠密石の上を薄煙が漂う
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 隠密碁: クローク発動時に煙を上げて「隠密」と表示
            {
                const np = pieces[pieces.length - 1];
                if (np && np.player === player && np.cloak) {
                    const ci = np.cells[0].y * BOARD_SIZE + np.cells[0].x;
                    fxBurst(ci, 'rgba(148,163,184,0.8)', 8, 1.0);
                    fxText(ci, '隠密', '#cbd5e1', 1000);
                }
            }

            turn = opponent;`],
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 隠密碁: 隠密石の上を薄い煙がゆらめく常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            pieces.forEach(pc => {
                if (!pc.cloak) return;
                pc.cells.forEach(p => {
                    if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                    const cx = pad + p.x * cs;
                    for (let k = 0; k < 3; k++) {
                        const ph = (now / 2400 + k * 0.33) % 1;
                        const cy = pad + p.y * cs - ph * cs * 0.8;
                        ctx2.globalAlpha = 0.16 * (1 - ph);
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.beginPath();
                        ctx2.arc(cx + Math.sin(now / 500 + k * 2.1) * cs * 0.12, cy, cs * (0.10 + ph * 0.10), 0, Math.PI * 2);
                        ctx2.fill();
                    }
                });
            });
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.left = { 1: 3, 2: 3 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('1個目は隠密石', pieces[0].cloak === true);
        assert('残り枠は2', st.left[1] === 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1);
        assert('4個目以降は通常石', pieces[pieces.length - 1].cloak === false);
        assert('枠は使い切り', st.left[1] === 0);
    `,
};
