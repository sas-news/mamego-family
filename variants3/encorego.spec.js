// ENCOREGO — 完奏碁: 盤の音符(点)をドから順に自石で埋める。8音を完奏した側が勝ち
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
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
const ST_INIT = `{ pos: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'encorego.html',
    en: 'ENCOREGO',
    jp: '完奏碁',
    prefix: 'encorego',
    desc: '盤の8個の音符点を順番に自石で埋める。先に一曲完奏した側が勝ち (各+1目)。',
    kind: 'stone',
    icon: 'encorego',
    spec: [
        ...K.rb('ENCOREGO', '完奏碁', 'encorego'),
        K.params([
            { key: 'note_pts', label: '1音ごとの得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'win_notes', label: '完奏に必要な音数', options: [{ v: 4, l: '4音' }, { v: 6, l: '6音' }, { v: 8, l: '8音 (全曲)' }], def: 8 },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        // 楽譜: 盤に描かれた8音 (ドレミのメロディ)
const MELODY = [
    [2, 6], [4, 5], [6, 4], [8, 5], [10, 6], [8, 7], [6, 8], [4, 7],
];
const melodyIdx = (k) => MELODY[k][1] * BOARD_SIZE + MELODY[k][0];

        function executeMove(move, player) {`],

        // 完奏勝利ルール
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        // 音符の描画
        K.CUE_STARS(`            // 楽譜: 音符点とその番号
            {
                ctx.save();
                for (let k = 0; k < MELODY.length; k++) {
                    const i = melodyIdx(k);
                    if (board[i] !== 0) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(190,120,220,0.25)';
                    ctx.beginPath();
                    ctx.ellipse(cx, cy + cellSize * 0.08, cellSize * 0.2, cellSize * 0.14, -0.4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(150,80,190,0.6)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.moveTo(cx + cellSize * 0.18, cy + cellSize * 0.05);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.3);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(120,60,150,0.75)';
                    ctx.font = 'bold ' + Math.max(8, cellSize * 0.28) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(k + 1), cx, cy + cellSize * 0.38);
                }
                ctx.restore();
            }`),
        // 進行: 自分の次の音符に自石がある限り進む (1音+1目)、完奏で勝ち
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 完奏碁: 自分の次の音符点に自石がある限り演奏が進む
            while (st.pos[player] < MELODY.length && board[melodyIdx(st.pos[player])] === player) {
                const ni = melodyIdx(st.pos[player]);
                captures[player] += (P('note_pts') || 1);
                st.pos[player]++;
                fxText(ni, '♪', '#e879f9', 1000);
                fxGlow(ni, '#e879f9', 700);
            }
            if (st.pos[player] >= Math.min(MELODY.length, Math.max(1, P('win_notes') || 8))) {
                fxShake(6, 360);
                winByRule(player, '完奏勝ち', 'メロディを一曲演奏し切りました');
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'次の音符 ' + ((st.pos[turn] || 0) + 1) + '/' + Math.min(8, Math.max(1, P('win_notes') || 8))`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            完奏碁: 盤の音符点を1番から順に自石で埋める。8音を完奏した側が即勝ち (1音ごと+1目)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤に8個の音符点 (1〜8) が描かれている。自分の「次の音符」に自石がある限り演奏が進み、1音ごと+1目。',
            '8音全てを先に埋めた側が「完奏」で即勝ち。',
            '音符点は両者共通 — 相手の次の音を塞ぐ (取る・占める) 立ち回りが効く。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pos = { 1: 0, 2: 0 };
        board[melodyIdx(0)] = 1; board[melodyIdx(1)] = 1;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 2音進む
        assert('音符が進む', st.pos[1] === 2 && captures[1] === 2);
        board[melodyIdx(2)] = 2; // 3番目は白が塞ぐ
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('敵の音符は進まない', st.pos[2] === 0);
        st.pos[1] = MELODY.length - 1; board[melodyIdx(MELODY.length - 1)] = 1;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1); // 完奏
        assert('完奏で終局', gameOver === true);
    `,
};
