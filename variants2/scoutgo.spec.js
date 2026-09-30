// SCOUTGO — 斥候碁: 各側4手目の石は斥候。以後2手の間、敵の全石の呼吸数が見える
const K = require('../gen_kit.js');
module.exports = {
    file: 'scoutgo.html',
    en: 'SCOUTGO',
    jp: '斥候碁',
    prefix: 'scoutgo',
    desc: '4手目の石は斥候。2手の間、敵の全石の呼吸数が暴かれる。',
    kind: 'scout',
    spec: [
        ...K.rb('SCOUTGO', '斥候碁', 'scoutgo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 }, until: { 1: 0, 2: 0 } }; // 斥候碁: 着手数と斥候の視界期限`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 }, until: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 }, until: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 }, until: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 }, until: { 1: 0, 2: 0 } };`],
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 斥候碁: 斥候の視界が有効なら敵石の呼吸数が見える
        function isScoutView(pl) { return history.length < (st.until[pl] || 0); }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                scout: st.pcnt[player] === 4
            });`],
        // 斥候石が置かれたら、その側の視界を2手分だけ確保する
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 斥候碁: 斥候石 (各側4手目) が盤を照らし、2手の間その側に敵の全呼吸数を見せる
            if (pieces.length && pieces[pieces.length - 1].scout && pieces[pieces.length - 1].player === player) {
                st.until[player] = history.length + 2;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 斥候石の双眼マーク + 視界中は敵石に呼吸数と照準環
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!pc.scout) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
                        ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                        ctx.beginPath();
                        ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.18);
                        ctx.lineTo(cx + cellSize * 0.18, cy + cellSize * 0.18);
                        ctx.moveTo(cx + cellSize * 0.18, cy - cellSize * 0.18);
                        ctx.lineTo(cx - cellSize * 0.18, cy + cellSize * 0.18);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }
            {
                const viewers = [1, 2].filter(pl => isScoutView(pl));
                if (viewers.length) {
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold ' + Math.max(9, cellSize * 0.38) + 'px sans-serif';
                    viewers.forEach(pl => {
                        const foe = pl === 1 ? 2 : 1;
                        board.forEach((v, i) => {
                            if (v !== foe) return;
                            const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                            const cx = padding + x * cellSize, cy = padding + y * cellSize;
                            ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
                            ctx.lineWidth = Math.max(1.2, cellSize * 0.04);
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.fillStyle = '#16a34a';
                            ctx.fillText(String(getLiberties(board, i)), cx, cy);
                        });
                    });
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`isScoutView(turn) ? '斥候の視界 残り' + (st.until[turn] - history.length) + '手' : '斥候まで ' + Math.max(0, 4 - (st.pcnt[turn] || 0)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            斥候碁: 各側4手目の石は斥候。以後2手の間、敵の全石の呼吸数が暴かれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '各プレイヤーの4手目の着手は「斥候」になる (緑のX印)。',
            '斥候が出ると以後2手の間、自分から見た敵の全石に呼吸点数が表示される。',
            '呼吸1・2の敵連を見逃すな — 斥候の短い視界で仕留め切れるかが勝負。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.pcnt = { 1: 0, 2: 0 }; st.until = { 1: 0, 2: 0 };
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 0 }] }, i % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 黒の4手目 → 斥候
        const s = pieces[pieces.length - 1];
        assert('黒の4手目は斥候', s.scout === true);
        assert('黒に視界が開く', isScoutView(1) === true && st.until[1] === history.length + 2);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1);
        assert('2手後に視界が閉じる', isScoutView(1) === false);
    `,
};
