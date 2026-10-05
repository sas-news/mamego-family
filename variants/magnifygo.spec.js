// MAGNIFYGO — 拡大碁: 盤の一部だけが拡大される虫眼鏡の盤。拡大部の石は大きく鮮明に描かれる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ lens: -1, ply: 0 }`;
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
module.exports = {
    file: 'magnifygo.html',
    en: 'MAGNIFYGO',
    jp: '拡大碁',
    prefix: 'magnifygo',
    desc: '虫眼鏡が盤を巡る。拡大区域内での着手は1アゲハマの報酬、全体が見えにくい盤。',
    kind: 'stone',
    icon: 'magnifygo',
    spec: [
        ...K.rb('MAGNIFYGO', '拡大碁', 'magnifygo'),
        K.params([
            { key: 'lens_reward', label: '拡大読みの報酬', min: 0, max: 4, def: 1, hint: '拡大区域への着手で得るアゲハマ' },
            { key: 'lens_range', label: '拡大区域の半径', min: 1, max: 3, def: 1, hint: '虫眼鏡の届く範囲 (チェビシェフ距離)' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 虫眼鏡: 星の点を順に巡る拡大区域。その内部への着手で1アゲハマ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            st.ply++;
            const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            // 拡大読み: 現在表示の虫眼鏡区域内への着手で1アゲハマ
            const LR = Math.max(1, P('lens_range') || 1);
            if (st.lens >= 0
                && Math.abs((pi % BOARD_SIZE) - (st.lens % BOARD_SIZE)) <= LR
                && Math.abs(((pi / BOARD_SIZE) | 0) - ((st.lens / BOARD_SIZE) | 0)) <= LR) {
                captures[player] += (P('lens_reward') ?? 1);
                fxText(pi, '拡大読み!', '#38bdf8', 1200);
            }
            {
                const stars = getStarPoints(BOARD_SIZE).map(p => p.y * BOARD_SIZE + p.x);
                st.lens = stars[st.ply % stars.length];
            }
            turn = opponent;`],
        // 拡大区域を虫眼鏡の輪で囲む
        ...K.STONE_MARKS_SPEC(`            if (st.lens >= 0) {
                const cx = padding + (st.lens % BOARD_SIZE) * cellSize;
                const cy = padding + ((st.lens / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.75)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * (Math.max(1, P('lens_range') || 1) + 0.55), 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + cellSize * 1.1, cy + cellSize * 1.1);
                ctx.lineTo(cx + cellSize * 1.8, cy + cellSize * 1.8);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'虫眼鏡は ' + ((st.lens % BOARD_SIZE) + 1) + ',' + (((st.lens / BOARD_SIZE) | 0) + 1) + ' へ'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            拡大碁: 虫眼鏡が盤上の星を順に巡る。拡大区域内への着手で1アゲハマの報酬<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '一手ごとに虫眼鏡が盤上の星の点を順に巡り、その周囲3x3が拡大区域になる。',
            '拡大区域内に着手した側は細部を読み切った報酬として1アゲハマを得る。',
            '虫眼鏡の巡りは双方に同じ順で訪れる — 巡る焦点を追う碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.lens = -1; st.ply = 0;
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 虫眼鏡が最初の星へ
        assert('虫眼鏡が巡る', st.lens >= 0);
        const lx = st.lens % B, ly = (st.lens / B) | 0;
        executeMove({ cells: [{ x: lx, y: ly }] }, 2); // 白が表示中の拡大区域へ
        assert('拡大読みで1アゲハマ', captures[2] === 1);
        assert('虫眼鏡が次の星へ進む', st.lens === getStarPoints(B).map(p => p.y * B + p.x)[2 % getStarPoints(B).length]);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true || board[0] !== 0);
    `,
};
