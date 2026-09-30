// CIRCLE2GO — 環状碁: 自分の連で2点以上を完全に囲む「環」を作ると内部を得点化し環は無敵になる
const K = require('../gen_kit.js');
module.exports = {
    file: 'circle2go.html',
    en: 'CIRCLE2GO',
    jp: '環状碁',
    prefix: 'circle2go',
    desc: '自分の連で2点以上を囲む「環」を完成させると内部が得点になり、環の石は無敵になる。',
    kind: 'stone',
    icon: 'circle2go',
    spec: [
        ...K.rb('CIRCLE2GO', '環状碁', 'circle2go'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { inv: [], zone: [] }; // 無敵の環石idx / 封印された環内部idx`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { inv: [], zone: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: { inv: [...st.inv], zone: [...st.zone] },
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? { inv: [...(snap.st.inv || [])], zone: [...(snap.st.zone || [])] } : { inv: [], zone: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? { inv: [...(s.st.inv || [])], zone: [...(s.st.zone || [])] } : { inv: [], zone: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? { inv: [...(data.st.inv || [])], zone: [...(data.st.zone || [])] } : { inv: [], zone: [] };`],
        // 封印された環内部は着手不可
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (st.zone.indexOf(p.y * BOARD_SIZE + p.x) >= 0) return false;
            }`],
        // 無敵の環石は取り判定から除外 (起点も経由も不可)
        [K.ONE, `                if (boardState[i] === player && !visited[i]) {`,
`                if (boardState[i] === player && !visited[i] && st.inv.indexOf(i) < 0) {`],
        [K.ALL, `} else if (boardState[n] === player && !visited[n]) {`,
`} else if (boardState[n] === player && !visited[n] && st.inv.indexOf(n) < 0) {`],
        // 手番交代直前: 環判定 & 長期戦打ち切り
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 環状ルール: 着手で完成した「全壁が自分色の囲み(2点以上)」を封印
            {
                const gi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const floodDone = new Set();
                let sealedAny = false;
                getNeighbors(gi).forEach(n0 => {
                    if (board[n0] === player || floodDone.has(n0)) return;
                    // n0 から広がる「非自分色」領域を走査: 盤端に達しなければ全壁が自分色
                    const seen = new Set([n0]);
                    const region = [];
                    const q = [n0];
                    let touchesEdge = false;
                    while (q.length) {
                        const cur = q.shift();
                        region.push(cur);
                        const cx = cur % BOARD_SIZE, cy = Math.floor(cur / BOARD_SIZE);
                        if (cx === 0 || cy === 0 || cx === BOARD_SIZE - 1 || cy === BOARD_SIZE - 1) touchesEdge = true;
                        getNeighbors(cur).forEach(n => {
                            if (board[n] === player || seen.has(n)) return;
                            seen.add(n); q.push(n);
                        });
                    }
                    region.forEach(i => floodDone.add(i));
                    if (touchesEdge || region.length < 2) return;
                    sealedAny = true;
                    const wall = new Set();
                    region.forEach(i => getNeighbors(i).forEach(n => { if (board[n] === player) wall.add(n); }));
                    let bonus = 0;
                    region.forEach(i => {
                        if (board[i] === opponent) {
                            board[i] = 0; captures[player]++;
                            fxBurst(i, '#a78bfa', 8, 1.5);
                        } else if (board[i] === 0 && st.zone.indexOf(i) < 0) {
                            bonus++;
                        }
                        if (st.zone.indexOf(i) < 0) st.zone.push(i);
                    });
                    captures[player] += bonus;
                    wall.forEach(i => { if (st.inv.indexOf(i) < 0) st.inv.push(i); });
                    fxGlow(gi, '#c4b5fd', 900);
                    fxText(gi, '環完成! +' + bonus + '点', '#8b5cf6', 1400);
                });
                if (sealedAny) fxShake(4, 300);
                cleanUpPieces();
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= 140) { endGameByScore(); return; }

            turn = opponent;`],
        // 無敵の環石に金縁マーク
        ...K.STONE_MARKS_SPEC(`            (st.inv || []).forEach(i => {
                const dx = i % BOARD_SIZE, dy = Math.floor(i / BOARD_SIZE);
                const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(167,139,250,0.95)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });`),
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の連で2点以上の領域を完全に囲むと「環」完成: 内部の敵石は取られ、空点は得点になる。',
            '環の石は無敵 (二度と取られない)。封印された内部には誰も打てない。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st = { inv: [], zone: [] }; captures = { 1: 0, 2: 0 };
        [[3, 4], [3, 5], [5, 4], [5, 5], [4, 3]].forEach(([x, y]) =>
            executeMove({ cells: [{ x, y }] }, 1));
        assert('未閉環では封印なし', st.inv.length === 0);
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1); // (4,4)(4,5)を囲む環が完成
        assert('環完成で封印', st.inv.length === 6 && st.zone.length === 2);
        assert('環内の空点が得点', captures[1] === 2);
        assert('封印内部は着手不可', isValidPlacement([{ x: 4, y: 4 }], 2) === false);
        assert('環の石は無敵', getCapturedStones(board, 1).length === 0);
    `,
};
