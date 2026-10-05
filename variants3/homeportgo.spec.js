// HOMEPORTGO — 帰港碁: 自分の陣営側の辺に石が帰港すると+2アゲハマ。5回の帰港で即勝
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
const ST_INIT = `{ port: { 1: 0, 2: 0 } }`;
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
    file: 'homeportgo.html',
    en: 'HOMEPORTGO',
    jp: '帰港碁',
    prefix: 'homeportgo',
    desc: '自分の母港(黒は下辺・白は上辺)に石を帰すと+2アゲハマ。5回の帰港で即勝。',
    kind: 'stone',
    icon: 'homeportgo',
    spec: [
        ...K.rb('HOMEPORTGO', '帰港碁', 'homeportgo'),
        K.params([
            { key: 'port_bonus', label: '帰港1回のアゲハマ', min: 0, max: 8, def: 2, unit: '目' },
            { key: 'port_win', label: '即勝ちに必要な帰港数', min: 2, max: 10, def: 5, unit: '回' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 帰港: 黒は下辺・白は上辺への着手で+2アゲハマ。5回の帰港で即勝
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            {
                const y = move.cells[0].y;
                const home = player === 1 ? BOARD_SIZE - 1 : 0;
                if (y === home) {
                    st.port[player]++;
                    captures[player] += (P('port_bonus') ?? 2);
                    const pi = y * BOARD_SIZE + move.cells[0].x;
                    fxText(pi, '帰港!', '#0ea5e9', 1300);
                    fxGlow(pi, '#0ea5e9', 900);
                    if (st.port[player] >= Math.max(1, P('port_win') || 5)) {
                        gameOver = true;
                        endGameByScore();
                        return;
                    }
                }
            }
            turn = opponent;`],
        // 母港の辺を港の色で示す
        K.CUE_GRID(`            // 母港: 下辺 (黒) と上辺 (白) を青い港として描く
            {
                const w = (BOARD_SIZE - 1) * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(14,165,233,0.10)';
                ctx.fillRect(padding, padding, w, cellSize * 0.5);
                ctx.fillRect(padding, padding + w - cellSize * 0.5, w, cellSize * 0.5);
                ctx.strokeStyle = 'rgba(14,165,233,0.35)';
                ctx.setLineDash([cellSize * 0.2, cellSize * 0.15]);
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath(); ctx.moveTo(padding, padding); ctx.lineTo(padding + w, padding); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(padding, padding + w); ctx.lineTo(padding + w, padding + w); ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'帰港 ' + st.port[turn] + '/' + Math.max(1, P('port_win') || 5)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            帰港碁: 黒は下辺・白は上辺が母港。母港に着手すると+2アゲハマ、5回の帰港で即勝<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '黒は下辺、白は上辺が母港 (青く示される)。母港に石を帰すたび+2アゲハマ。',
            '5回の帰港を果たした側は即勝利。',
            '母港を巡るか中央の地を争うか — 双方対称の港への回航合戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.port = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        executeMove({ cells: [{ x: 4, y: B - 1 }] }, 1); // 黒が下辺へ帰港
        assert('帰港で+2アゲハマ', captures[1] === 2);
        assert('帰港数が記録される', st.port[1] === 1);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 2); // 白が上辺へ帰港
        assert('白の帰港も+2', captures[2] === 2 && st.port[2] === 1);
        executeMove({ cells: [{ x: 5, y: 0 }] }, 1); // 黒が白の母港(上辺)へ → 帰港にならない
        assert('敵の母港では帰港にならない', st.port[1] === 1 && captures[1] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true || board[5 * B + 5] !== 0);
    `,
};
