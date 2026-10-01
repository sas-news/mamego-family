// TRICKGO — 悪戯碁: 8手ごとに着手の隣に「悪戯インク」が仕掛けられ、次の1手だけ相手はその点に打てない
const K = require('../gen_kit.js');
module.exports = {
    file: 'trickgo.html',
    en: 'TRICKGO',
    jp: '悪戯碁',
    prefix: 'trickgo',
    desc: '8手ごとに着手の隣へ悪戯インク。仕掛けた相手の次の1手だけその点は打てない。',
    kind: 'stone',
    icon: 'trickgo',
    spec: [
        ...K.rb('TRICKGO', '悪戯碁', 'trickgo'),
        K.params([
            { key: 'ink_interval', label: 'インクの間隔', min: 2, max: 16, def: 8, unit: '手' },
            { key: 'ink_span', label: 'インクの効果持続', min: 1, max: 4, def: 1, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { trap: -1, trapUntil: -1, trapFor: 0 }; // 悪戯インク`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { trap: -1, trapUntil: -1, trapFor: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { trap: -1, trapUntil: -1, trapFor: 0 };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { trap: -1, trapUntil: -1, trapFor: 0 };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { trap: -1, trapUntil: -1, trapFor: 0 };`],
        // 悪戯インクは相手の次の1手だけその点を塞ぐ
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 悪戯ルール: 有効期限内のインク点には対象プレイヤーが打てない
            if (st.trap >= 0 && history.length < st.trapUntil && st.trapFor === player) {
                if (cells.some(p => p.y * BOARD_SIZE + p.x === st.trap)) return false;
            }`],
        // 8手ごとに着手の隣の空点に悪戯インクを仕掛ける
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 悪戯ルール: 8手ごとに、打った点の隣の空点へ相手の次の1手だけ効く悪戯インク
            st.trap = -1;
            if (history.length % Math.max(1, P('ink_interval') || 8) === 0) {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const emp = getNeighbors(pi).filter(q => board[q] === 0);
                if (emp.length > 0) {
                    st.trap = emp[0];
                    st.trapFor = opponent;
                    st.trapUntil = history.length + Math.max(1, P('ink_span') || 1); // 対象側の次のN手だけ有効
                    fxText(emp[0], '悪戯インク!', '#f472b6', 1200);
                    fxGlow(emp[0], '#f472b6', 700);
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 悪戯インクをピンクのスプラッタで描く
        ...K.STONE_MARKS_SPEC(`            if (st.trap >= 0 && history.length < st.trapUntil && board[st.trap] === 0) {
                const cx = padding + (st.trap % BOARD_SIZE) * cellSize;
                const cy = padding + Math.floor(st.trap / BOARD_SIZE) * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ec4899';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = Math.round(cellSize * 0.4) + 'px sans-serif';
                ctx.fillText('!', cx, cy);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.trap >= 0 && history.length < st.trapUntil ? '悪戯中 (' + (st.trap % BOARD_SIZE) + ',' + Math.floor(st.trap / BOARD_SIZE) + ')' : '-'`),
        [K.ONE, K.INFO_ALGO, `            悪戯碁: 8手ごとに悪戯インク。仕掛けた相手は次の1手だけその点に打てない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '8手ごとに、打った点の隣の空点へ「悪戯インク」を仕掛ける。',
            '仕掛けられた側は次の1手だけその点に打てない。両者に同じ周期で巡る。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.trap = -1;
        assert('起動', typeof isValidPlacement === 'function');
        history.length = 7;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 8手目 → インク
        assert('インクが仕掛けられた', st.trap >= 0);
        const tx = st.trap % BOARD_SIZE, ty = Math.floor(st.trap / BOARD_SIZE);
        assert('相手はその点に打てない', isValidPlacement([{ x: tx, y: ty }], 2) === false);
        assert('本人は打てる', isValidPlacement([{ x: tx, y: ty }], 1) === true);
        st.trapUntil = history.length; // 期限切れ
        assert('期限切れなら打てる', isValidPlacement([{ x: tx, y: ty }], 2) === true);
    `,
};
