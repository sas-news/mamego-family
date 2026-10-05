// GOSHUINGO — 集印碁: 御朱印(星の点)を巡って集める。自分の石で囲んだ朱印点は自分の印になる
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
const ST_INIT = `{ got: { 1: [], 2: [] } }`;
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
    file: 'goshuingo.html',
    en: 'GOSHUINGO',
    jp: '集印碁',
    prefix: 'goshuingo',
    desc: '御朱印(星の点)を巡る。着手または囲みで朱印を集め、5つ集めると即勝。',
    kind: 'stone',
    icon: 'goshuingo',
    spec: [
        ...K.rb('GOSHUINGO', '集印碁', 'goshuingo'),
        K.params([
            { key: 'need_stamps', label: '満願成就に必要な朱印数', min: 2, max: 9, def: 5, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 集印: 星の点への着手で朱印を押す。朱印が5つ集まると即勝
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            {
                const stars = getStarPoints(BOARD_SIZE).map(p => p.y * BOARD_SIZE + p.x);
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (stars.includes(pi) && !st.got[player].includes(pi)) {
                    st.got[player].push(pi);
                    fxGlow(pi, '#dc2626', 1200);
                    if (st.got[player].length >= (P('need_stamps') || 5)) {
                        gameOver = true;
                        fxText(pi, '満願成就!', '#dc2626', 1600);
                        endGameByScore();
                        return;
                    }
                }
            }
            turn = opponent;`],
        // 押した朱印を朱色の印影で示す
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                st.got[w].forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + ((i / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(220,38,38,0.85)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    const r = cellSize * 0.26;
                    ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
                    ctx.fillStyle = 'rgba(220,38,38,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.08, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            })`),
        ...K.EVENT_CHIP_SPEC(`'御朱印 ' + st.got[turn].length + '/' + (P('need_stamps') || 5)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            集印碁: 星の点に着手すると御朱印を押す。5つ集めると満願成就で即勝<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '星の点 (朱印点) に着手すると、その点に自分の御朱印が押される (朱色の印)。',
            '5つの御朱印を集めた側は満願成就で即勝利。',
            '朱印を巡るか地を取るか — 双方対称の参拝合戦。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.got = { 1: [], 2: [] };
        const B = BOARD_SIZE;
        const stars = getStarPoints(B).map(p => p.y * B + p.x);
        assert('朱印点が定義される', stars.length >= 5);
        const s0 = stars[0];
        executeMove({ cells: [{ x: s0 % B, y: (s0 / B) | 0 }] }, 1);
        assert('朱印を押す', st.got[1].includes(s0));
        const s1 = stars[1];
        executeMove({ cells: [{ x: s1 % B, y: (s1 / B) | 0 }] }, 2);
        assert('白も朱印を押せる', st.got[2].includes(s1));
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
