// SCALEGO — 音階碁: 石は音階 (列=階名)。1段ずつ上行し続けると旋律が完成して得点
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
const ST_INIT = `{ last: { 1: -1, 2: -1 }, run: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'scalego.html',
    en: 'SCALEGO',
    jp: '音階碁',
    prefix: 'scalego',
    desc: '列は7つの音階 (ドレミファソラシ)。1段ずつ上行する旋律を5音つなぐと+3目。',
    kind: 'stone',
    icon: 'scalego',
    spec: [
        ...K.rb('SCALEGO', '音階碁', 'scalego'),
        ...ST(ST_INIT),
        // 音階ルール: 列を7音階に見立て、1段ずつ上行する連続で旋律が完成 (+3目)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 音階: 列xを7音階 (x%7) に見立て、直前より1段上なら旋律が続く。5音で完成
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const pitch = move.cells[0].x % 7;
                if (st.last[player] >= 0 && pitch === (st.last[player] + 1) % 7) {
                    st.run[player]++;
                    fxGlow(mi, '#38bdf8', 500);
                } else {
                    st.run[player] = 1;
                }
                st.last[player] = pitch;
                if (st.run[player] >= 5) {
                    captures[player] += 3;
                    st.run[player] = 0;
                    st.last[player] = -1;
                    fxText(mi, '旋律完成 +3', '#38bdf8', 1400);
                    fxShake(3, 260);
                }
            }

            turn = opponent;`],
        // 音階ガイド: 7列周期の薄い帯 (音域の縞)
        ...K.CUE_GRID(`            // 音階ガイド: 7列周期ごとに薄い縞
            {
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (x % 7 !== 0) continue;
                    ctx.fillStyle = 'rgba(56,189,248,0.10)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding - cellSize * 0.5, cellSize, BOARD_SIZE * cellSize);
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'旋律 ' + st.run[turn] + '/5音'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            音階碁: 列はドレミファソラシ (x%7)。直前より1段上の列に打ち続けると旋律。5音で+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の列を7音階 (列番号÷7の余り) に見立てる。直前の自分の着手より1段上の列に打ち続けると旋律が伸びる。',
            '5音連続で旋律が完成し+3目。上がり切ったらドに戻って続けられる。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.last = { 1: -1, 2: -1 }; st.run = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1);
        assert('5音上行で旋律完成+3', captures[1] === 3 && st.run[1] === 0);
        executeMove({ cells: [{ x: 10, y: 10 }] }, 1); // pitch 3 → 1段上でない (last=-1)
        assert('完成後は音階リセット', st.run[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 2) === true);
    `,
};
