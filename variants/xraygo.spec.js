// XRAYGO — 透視碁: 敵石は不可視。各側2手目にX線でその時点の敵石が全て記録される
const K = require('../gen_kit.js');
module.exports = {
    file: 'xraygo.html',
    en: 'XRAYGO',
    jp: '透視碁',
    prefix: 'xraygo',
    desc: '敵石は不可視。2手目のX線でその時点の敵石だけ永久に見える。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'xray',
    spec: [
        ...K.rb('XRAYGO', '透視碁', 'xraygo'),
        K.params([
            { key: 'xray_at', label: 'X線の手番', min: 1, max: 10, def: 2, unit: '手目' },
            { key: 'cap_rows', label: '打ち切りの余裕', min: 0, max: 9, def: 2, hint: '交点数+N行分の着手で終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 }, seen: { 1: [], 2: [] } }; // 透視碁: 着手数とX線で記録済みの敵石`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 }, seen: { 1: [], 2: [] } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 }, seen: { 1: [], 2: [] } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 }, seen: { 1: [], 2: [] } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 }, seen: { 1: [], 2: [] } };`],
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 透視碁: 2手目のX線で記録済みの敵石だけが見える
        function isSeen(idx, viewer) { return (st.seen[viewer] || []).includes(idx); }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length
            });`],
        // 各側2手目の着手時にX線照射: その時点の敵石を全て記録
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る


            // 透視碁: 各側N手目の着手でX線 — その時点の全敵石の位置を記録
            if (st.pcnt[player] === (P('xray_at') || 2)) {
                board.forEach((v, i) => {
                    if (v === opponent && !st.seen[player].includes(i)) st.seen[player].push(i);
                });
                // X線発射: 記録した敵石を照準で発光 + 走査線の一瞬表示 + 「X線」表示
                st.seen[player].forEach(i => fxGlow(i, '#22d3ee', 900));
                st.xrayAt = fxNow();
                const mc = move.cells[0];
                if (mc) fxText(mc.y * BOARD_SIZE + mc.x, 'X線', '#67e8f9', 1100);
                fxShake(2, 180);
            }


            // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + (P('cap_rows') ?? 2))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const xrIdx = alive.length ? alive[0].y * BOARD_SIZE + alive[0].x : -1;
                const xrA = (pc.player !== turn && (xrIdx < 0 || !isSeen(xrIdx, turn))) ? 0.10 : 1;
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : xrA);`],
        ...K.STONE_MARKS_SPEC(`            // 記録済みの敵石にX線の照準
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                (st.seen[turn] || []).forEach(i => {
                    if (board[i] === 0 || board[i] === turn) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    const h = cellSize * 0.30;
                    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
                        ctx.beginPath();
                        ctx.moveTo(cx + sx * h, cy + sy * (h - cellSize * 0.12));
                        ctx.lineTo(cx + sx * h, cy + sy * h);
                        ctx.lineTo(cx + sx * (h - cellSize * 0.12), cy + sy * h);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.pcnt[turn] < (P('xray_at') || 2) ? '透視まで あと' + ((P('xray_at') || 2) - st.pcnt[turn]) + '手' : '記録済敵石 ' + (st.seen[turn] || []).length + '個'`),
        [K.ONE, K.INFO_BASE, `            透視碁: 敵石は不可視。各側2手目のX線でその時点の敵石だけ永久に見える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '相手の石は不可視。各プレイヤーの2手目の着手でX線が走り、',
            'その時点の敵石全てがあなたにだけ「記録」されて以後ずっと見える。',
            'X線後に置かれた敵石は再び闇の中 — 一度きりの透視をどこで使うか。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // X線発射時の走査線 — 上から下へ掃く緑がかった光の帯
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 透視碁: X線発射から1.2秒、上から下へ走査線が走る
        fxAmbient((ctx2, now, pad, cs) => {
            if (!st.xrayAt) return;
            const t = (now - st.xrayAt) / 1200;
            if (t >= 1) return;
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            const ly = t * w;
            ctx2.save();
            const g = ctx2.createLinearGradient(0, ly - cs * 1.5, 0, ly + cs * 0.4);
            g.addColorStop(0, 'rgba(34,211,238,0)');
            g.addColorStop(1, 'rgba(34,211,238,0.45)');
            ctx2.fillStyle = g;
            ctx2.fillRect(0, ly - cs * 1.5, w, cs * 1.9);
            ctx2.globalAlpha = (1 - t) * 0.8;
            ctx2.strokeStyle = '#22d3ee';
            ctx2.lineWidth = Math.max(1.5, cs * 0.08);
            ctx2.beginPath();
            ctx2.moveTo(0, ly + cs * 0.4);
            ctx2.lineTo(w, ly + cs * 0.4);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.pcnt = { 1: 0, 2: 0 }; st.seen = { 1: [], 2: [] };
        board[3 * BOARD_SIZE + 3] = 2; // 敵石を直接配置
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('1手目では未記録', isSeen(3 * BOARD_SIZE + 3, 1) === false);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // 黒の2手目 → X線
        assert('2手目で敵石を記録', isSeen(3 * BOARD_SIZE + 3, 1) === true);
        board[6 * BOARD_SIZE + 6] = 2;
        assert('X線後の敵石は見えない', isSeen(6 * BOARD_SIZE + 6, 1) === false);
    `,
};
