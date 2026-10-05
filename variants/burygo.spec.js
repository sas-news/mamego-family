// BURYGO — 埋蔵碁: 各側4手ごとの石は土に埋められ、4手の間は古墳にしか見えない
const K = require('../gen_kit.js');
module.exports = {
    file: 'burygo.html',
    en: 'BURYGO',
    jp: '埋蔵碁',
    prefix: 'burygo',
    desc: '4手ごとの石は埋められる。4手の間は誰の石か分からない。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'bury',
    spec: [
        ...K.rb('BURYGO', '埋蔵碁', 'burygo'),
        K.params([
            { key: 'bury_interval', label: '埋蔵の間隔', min: 2, max: 8, def: 4, unit: '手' },
            { key: 'bury_duration', label: '埋蔵期間', min: 2, max: 8, def: 4, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 } }; // 埋蔵碁: 各側の着手数 (4手ごとに埋蔵)`],
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
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 埋蔵碁: 埋蔵石は配置から4手の間「伏せ」状態
        function isBuried(pc) { return !!pc.buried && (history.length - (pc.at || 0)) < (P('bury_duration') || 4); }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                buried: st.pcnt[player] % (P('bury_interval') || 4) === 0
            });
            // 埋蔵: 土が盛り上がる演出
            if (st.pcnt[player] % (P('bury_interval') || 4) === 0) {
                move.cells.forEach(p => {
                    const bi = p.y * BOARD_SIZE + p.x;
                    fxBurst(bi, '#8d6e63', 9, 1.0);
                    fxBurst(bi, '#d7ccc8', 4, 0.7);
                    fxText(bi, '埋蔵', '#a1887f', 900);
                });
            }`],
        // 埋蔵中は石を描かず土饅頭にする
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : (isBuried(pc) ? 0.05 : 1));`],
        ...K.STONE_MARKS_SPEC(`            // 埋蔵石を茶色い土饅頭で覆う (色は誰の石か分からない)
            {
                ctx.save();
                pieces.forEach(pc => {
                    if (!isBuried(pc)) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        const r = cellSize * 0.40;
                        ctx.fillStyle = '#8d6e63';
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * 0.06, r, Math.PI, 0);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#6d4c41';
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * 0.06, r * 0.55, Math.PI, 0);
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(62, 39, 35, 0.8)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy + cellSize * 0.06, r, Math.PI, 0);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const b = pieces.filter(pc => isBuried(pc)).length; const iv = P('bury_interval') || 4; return b > 0 ? '埋蔵 ' + b + '石' : '次の埋蔵 ' + (iv - st.pcnt[turn] % iv) + '手後'; })()`),
        [K.ONE, K.INFO_BASE, `            埋蔵碁: 各側4手ごとの石は土に埋められ、4手の間は土饅頭にしか見えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーの4・8・12…手目の着手は「埋蔵石」— 色の分からない土饅頭として現れる。',
            '埋蔵は4手で掘り起こされ本来の色に戻る。伏せられた石も呼吸・取り・地には普通に働く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.pcnt = { 1: 0, 2: 0 };
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: i, y: 0 }] }, i % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 黒の4手目 → 埋蔵
        const b = pieces[pieces.length - 1];
        assert('黒の4手目は埋蔵石', b.buried === true && isBuried(b) === true);
        assert('盤上値は実際の色', board[5 * BOARD_SIZE + 5] === 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 7 }] }, 1);
        assert('4手後に掘り起こされる', isBuried(b) === false);
    `,
};
