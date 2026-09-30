// TRAPGO — 罠碁: 各側6手ごとの石は空点に見える罠。敵石が隣接すると発動して道連れにする
const K = require('../gen_kit.js');
module.exports = {
    file: 'trapgo.html',
    en: 'TRAPGO',
    jp: '罠碁',
    prefix: 'trapgo',
    desc: '6手ごとの石は空点風の罠。隣に来た敵石を道連れに起動する。',
    kind: 'trap',
    spec: [
        ...K.rb('TRAPGO', '罠碁', 'trapgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 } }; // 罠碁: 各側の着手数 (6手ごとに罠)`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 } };`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                trap: st.pcnt[player] % 6 === 0
            });`],
        // 罠は敵石が直交隣に置かれた瞬間に発動: その敵石1個を道連れにして姿を現す
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 罠碁: 未発動の罠の隣に敵石があると起動し、隣の敵石1個を道連れにする
            {
                let sprung = false;
                pieces.forEach(pc => {
                    if (!pc.trap || pc.sprung) return;
                    const i0 = pc.cells[0].y * BOARD_SIZE + pc.cells[0].x;
                    if (board[i0] === 0) { pc.sprung = true; return; }
                    const foe = pc.player === 1 ? 2 : 1;
                    const prey = getNeighbors(i0).find(n => board[n] === foe);
                    if (prey === undefined) return;
                    pc.sprung = true;
                    board[prey] = 0;
                    captures[pc.player]++;
                    sprung = true;
                });
                if (sprung) cleanUpPieces();
            }

            turn = opponent;`],
        // 未発動の罠は石を描かない (空点に見える) — かすかなキラリだけ
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : ((pc.trap && !pc.sprung) ? 0 : 1));`],
        ...K.STONE_MARKS_SPEC(`            // 未発動の罠にかすかな光点、発動済みの罠に赤い環
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.trap) return;
                    pc.cells.forEach(p => {
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        if (pc.sprung) {
                            if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
                            ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                            ctx.stroke();
                        } else {
                            ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
                            ctx.beginPath();
                            ctx.arc(cx + cellSize * 0.22, cy - cellSize * 0.22, cellSize * 0.07, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'次の罠 ' + (6 - st.pcnt[turn] % 6) + '手後'`),
        [K.ONE, K.INFO_ALGO, `            罠碁: 各側6手ごとの石は空点のように見える罠。敵石が隣に来ると発動する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの6・12・18…手目の着手は「罠石」— 盤上には置かれるが空点に見える。',
            '罠の直交隣に敵石が置かれると発動し、その敵石1個を道連れにして本来の石に戻る。',
            '罠を跨いだ取り・囲みも通常通り — 見えない石が盤を歪める。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.pcnt = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        for (let i = 0; i < 10; i++) executeMove({ cells: [{ x: i, y: 0 }] }, i % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒の6手目 → 罠
        const t = pieces[pieces.length - 1];
        assert('黒の6手目は罠', t.trap === true && !t.sprung);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 罠の隣に敵石 → 発動
        assert('罠が発動した', t.sprung === true);
        assert('隣の敵石は道連れ', board[4 * BOARD_SIZE + 4] === 1 && board[5 * BOARD_SIZE + 4] === 0);
        assert('道連れはアゲハマに', captures[1] === 1);
    `,
};
