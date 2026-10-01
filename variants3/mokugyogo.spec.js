// MOKUGYOGO — 木魚碁: 自分の前の石に隣接して打ち続けると木魚のリズム。4拍ごとに読経が進み+2
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
const ST_INIT = `{ last: { 1: -1, 2: -1 }, beat: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'mokugyogo.html',
    en: 'MOKUGYOGO',
    jp: '木魚碁',
    prefix: 'mokugyogo',
    desc: '自分の前の石に隣接して打ち続けると木魚を叩くリズム。4拍ごとに読経が進み+2目。',
    kind: 'stone',
    icon: 'mokugyogo',
    spec: [
        ...K.rb('MOKUGYOGO', '木魚碁', 'mokugyogo'),
        K.params([
            { key: 'beat', label: '読経までの拍数', min: 2, max: 8, def: 4, unit: '拍' },
            { key: 'sutra', label: '読経の得点', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 木魚のリズム: 前の着手点に隣接なら拍が進む。4拍ごとに読経+2アゲハマ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 木魚ルール: 自分の前の石に隣接 → ビート。4拍ごとに読経が進み+2目
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const prev = st.last[player];
                if (prev >= 0 && getNeighbors(mi).includes(prev)) {
                    st.beat[player]++;
                    fxGlow(mi, '#fbbf24', 500);
                    if (st.beat[player] % Math.max(1, P('beat') || 4) === 0) {
                        captures[player] += (P('sutra') ?? 2);
                        fxText(mi, '読経 +' + (P('sutra') ?? 2), '#f59e0b', 1200);
                        fxShake(3, 240);
                    }
                } else {
                    st.beat[player] = 0;
                }
                st.last[player] = mi;
            }

            turn = opponent;`],
        // ビートの描画: 拍が進んでいる石の上にリング
        ...K.STONE_MARKS_SPEC(`            {
                const lb = st.last[turn];
                if (lb >= 0 && board[lb] === turn) {
                    const cx = padding + (lb % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(lb / BOARD_SIZE) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(251,191,36,0.7)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'拍 ' + (st.beat[turn] % Math.max(1, P('beat') || 4)) + '/' + Math.max(1, P('beat') || 4)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            木魚碁: 自分の前の石に隣接して打ち続けると木魚の拍。4拍ごとに読経+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の直前の着手点に隣接する点に打ち続けると、木魚を叩くように「拍」が進む。',
            '4拍ごとに読経が一段進み+2目のアゲハマ。拍は両者別々に数える対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.last = { 1: -1, 2: -1 }; st.beat = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('隣接で拍1', st.beat[1] === 1);
        executeMove({ cells: [{ x: 4, y: 6 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 7 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 8 }] }, 1);
        assert('4拍で読経+2', captures[1] === 2 && st.beat[1] === 4);
        executeMove({ cells: [{ x: 9, y: 0 }] }, 1);
        assert('離れると拍リセット', st.beat[1] === 0);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
