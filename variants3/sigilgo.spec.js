// SIGILGO — 印章碁: 自分の石で3x3の印章を刻むとその区域が封印され得点化する
const K = require('../gen_kit.js');
module.exports = {
    file: 'sigilgo.html',
    en: 'SIGILGO',
    jp: '印章碁',
    prefix: 'sigilgo',
    desc: '自分の石で3x3マスの印章を刻むと、その区域は二度と取られず+9点になる。',
    kind: 'stone',
    icon: 'sigilgo',
    spec: [
        ...K.rb('SIGILGO', '印章碁', 'sigilgo'),
        K.params([
            { key: 'sigil_pts', label: '刻印の得点', min: 0, max: 27, def: 9, unit: '点' },
            { key: 'move_cap', label: '打ち切り手数', min: 60, max: 280, def: 140, step: 10, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { inv: [], sigils: [] }; // 無敵セルidx / 刻印済み3x3の起点idx`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { inv: [], sigils: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { inv: [...st.inv], sigils: [...st.sigils] },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? { inv: [...(snap.st.inv || [])], sigils: [...(snap.st.sigils || [])] } : { inv: [], sigils: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? { inv: [...(s.st.inv || [])], sigils: [...(s.st.sigils || [])] } : { inv: [], sigils: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? { inv: [...(data.st.inv || [])], sigils: [...(data.st.sigils || [])] } : { inv: [], sigils: [] };`],
        // 印章の石は取り判定から除外
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && st.inv.indexOf(i) < 0) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && st.inv.indexOf(n) < 0) {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 印章ルール: 着手石を含む3x3が全て自分色なら刻印 (+9点・無敵化)
            {
                const px = move.cells[0].x, py = move.cells[0].y;
                for (let ty = py - 2; ty <= py; ty++) {
                    for (let tx = px - 2; tx <= px; tx++) {
                        if (tx < 0 || ty < 0 || tx + 2 >= BOARD_SIZE || ty + 2 >= BOARD_SIZE) continue;
                        const anchor = ty * BOARD_SIZE + tx;
                        if (st.sigils.indexOf(anchor) >= 0) continue;
                        let full = true;
                        for (let dy = 0; dy < 3 && full; dy++) {
                            for (let dx = 0; dx < 3 && full; dx++) {
                                if (board[(ty + dy) * BOARD_SIZE + tx + dx] !== player) full = false;
                            }
                        }
                        if (!full) continue;
                        st.sigils.push(anchor);
                        for (let dy = 0; dy < 3; dy++) {
                            for (let dx = 0; dx < 3; dx++) {
                                const si = (ty + dy) * BOARD_SIZE + tx + dx;
                                if (st.inv.indexOf(si) < 0) st.inv.push(si);
                            }
                        }
                        captures[player] += (P('sigil_pts') ?? 9);
                        fxGlow(anchor + BOARD_SIZE + 1, '#f59e0b', 1100);
                        fxText(anchor + BOARD_SIZE + 1, '刻印! +' + (P('sigil_pts') ?? 9), '#d97706', 1500);
                        fxShake(5, 360);
                    }
                }
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('move_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 刻印済み区域に朱色の印影を描画
        ...K.STONE_MARKS_SPEC(`            (st.sigils || []).forEach(anchor => {
                const ax = anchor % BOARD_SIZE, ay = Math.floor(anchor / BOARD_SIZE);
                const cx = padding + (ax + 1) * cellSize, cy = padding + (ay + 1) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(220,38,38,0.75)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.strokeRect(cx - cellSize * 1.32, cy - cellSize * 1.32, cellSize * 2.64, cellSize * 2.64);
                ctx.fillStyle = 'rgba(220,38,38,0.8)';
                ctx.font = 'bold ' + Math.floor(cellSize * 0.5) + 'px serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('印', cx, cy);
                ctx.restore();
            });`),
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で3x3マスを完全に埋めると「刻印」: その区域は無敵になり+9点。',
            '同じ区域への重複刻印はできない。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { inv: [], sigils: [] }; captures = { 1: 0, 2: 0 };
        [[4, 4], [5, 4], [6, 4], [4, 5], [5, 5], [6, 5], [4, 6], [5, 6]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 1));
        assert('8点では刻印なし', st.sigils.length === 0);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 3x3完成
        assert('3x3完成で刻印', st.sigils.length === 1 && st.inv.length === 9);
        assert('刻印で+9点', captures[1] === 9);
        assert('刻印の石は無敵', getCapturedStones(board, 1).length === 0);
    `,
};
