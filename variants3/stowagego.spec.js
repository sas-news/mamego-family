// STOWAGEGO — 積荷碁: 自石を盤の左右にバランス良く積む (差1以内・4個以上) と船が安定して+2目
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
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
const ST_INIT = `{ bal: { 1: false, 2: false } }`;
module.exports = {
    file: 'stowagego.html',
    en: 'STOWAGEGO',
    jp: '積荷碁',
    prefix: 'stowagego',
    desc: '自石が左右半分にほぼ均等 (差1以内・4個以上) に積まれると+2目。崩れると再挑戦。',
    kind: 'stone',
    icon: 'stowagego',
    spec: [
        ...K.rb('STOWAGEGO', '積荷碁', 'stowagego'),
        K.params([
            { key: 'bal_min', label: '均衡に必要な石数', min: 2, max: 10, def: 4, unit: '石' },
            { key: 'bal_diff', label: '許容する左右差', min: 0, max: 4, def: 1, unit: '石' },
            { key: 'bal_pts', label: '均衡ボーナス', min: 0, max: 6, def: 2, unit: '点' },
        ]),
        ...ST(ST_INIT),

        // 積荷: 左右の自石差が1以内 (4個以上) で+2目。崩れたら再度狙える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 積荷碁: 自石が左右に均衡して積まれると+2目
            {
                const c = Math.floor(BOARD_SIZE / 2);
                let L = 0, R = 0;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== player) continue;
                    const x = i % BOARD_SIZE;
                    if (x < c) L++; else if (x > c) R++;
                }
                const diff = Math.abs(L - R);
                if (L + R >= (P('bal_min') || 4) && diff <= (P('bal_diff') ?? 1) && !st.bal[player]) {
                    st.bal[player] = true;
                    captures[player] += (P('bal_pts') ?? 2);
                    const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                    fxText(pi, '積荷均衡 +2', '#38bdf8', 1200);
                    fxGlow(pi, '#38bdf8', 800);
                } else if (diff > (P('bal_diff') ?? 1) + 1) {
                    st.bal[player] = false; // バランス崩れ → 再挑戦可
                }
            }

            turn = opponent;`],
        // 船の喫水線: 中央線と左右の水面
        K.CUE_GRID(`            // 積荷の喫水線: 中央の竜骨線
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const cx = padding + c * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,150,220,0.5)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.3, cellSize * 0.18]);
                ctx.beginPath();
                ctx.moveTo(cx, padding - cellSize * 0.4);
                ctx.lineTo(cx, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.4);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.bal[turn] ? '均衡済' : '均衡狙い'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            積荷碁: 自石を左右半分にバランス良く積む (差1以内・4個以上) と+2目。崩れれば再挑戦可<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央が船の竜骨。自分の石が左右にほぼ均等 (差1以内) かつ4個以上積まれた瞬間、船が安定して+2目。',
            '得点後にバランスが崩れる (差3以上) と、また均衡を目指せる。',
            '片舷に寄せた攻めは転覆の危険。積み付けの良さがそのまま点になる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.bal = { 1: false, 2: false };
        const c = Math.floor(BOARD_SIZE / 2);
        board[4 * BOARD_SIZE + 1] = 1; board[4 * BOARD_SIZE + (BOARD_SIZE - 2)] = 1; // 左右1ずつ
        board[8 * BOARD_SIZE + 2] = 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 3, y: 8 }] }, 1); // 右へもう1個 → 2-2均衡
        assert('均衡積荷で+2目', captures[1] === 2 && st.bal[1] === true);
        st.bal[1] = true; board.fill(0);
        board[1] = 1; board[2] = 1; board[3] = 1;
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1); // 全部左舷 → 大崩れ
        assert('崩れると再挑戦可', st.bal[1] === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 5, y: 5 }], 2) === true);
    `,
};
