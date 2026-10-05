// JOYAGO — 除夜碁: 各側9手ごとの鐘撞きで孤立した敵石(煩悩)が全て祓われる
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 } }`;
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
    file: 'joyago.html',
    en: 'JOYAGO',
    jp: '除夜碁',
    prefix: 'joyago',
    desc: '各側9手ごとに除夜の鐘が鳴り、孤立した敵石(煩悩)が全て祓われる。',
    kind: 'stone',
    icon: 'joyago',
    spec: [
        ...K.rb('JOYAGO', '除夜碁', 'joyago'),
        K.params([
            { key: 'bell_interval', label: '鐘の間隔', min: 3, max: 18, def: 9, unit: '手' },
        ]),
        ...ST(ST_INIT),
        // 鐘撞き: 自分の9手目ごとに孤立した敵石(1石の連)を全て取る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 除夜の鐘: 自分の9手ごとの着手で孤立した敵石(煩悩)を祓う
            {
                st.pcnt[player] = (st.pcnt[player] || 0) + 1;
                if (st.pcnt[player] % Math.max(1, P('bell_interval') || 9) === 0) {
                    const visited = new Set();
                    const singles = [];
                    for (let i = 0; i < board.length; i++) {
                        if (board[i] !== opponent || visited.has(i)) continue;
                        const g = []; const q = [i]; visited.add(i);
                        while (q.length) {
                            const c = q.pop(); g.push(c);
                            getNeighbors(c).forEach(n => {
                                if (board[n] === opponent && !visited.has(n)) { visited.add(n); q.push(n); }
                            });
                        }
                        if (g.length === 1) singles.push(i);
                    }
                    if (singles.length > 0) {
                        singles.forEach(i => {
                            board[i] = 0;
                            captures[player]++;
                            fxBurst(i, '#fbbf24', 10, 1.5);
                        });
                        fxShake(5, 400);
                        fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, 'ゴーン', '#fbbf24', 1200);
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // 鐘を盤面に描く
        K.CUE_STARS(`            // 除夜の鐘: 左上の小さな梵鐘
            {
                const bx = padding, by = padding;
                const left = Math.max(1, P('bell_interval') || 9) - (st.pcnt[turn] % Math.max(1, P('bell_interval') || 9));
                ctx.save();
                ctx.strokeStyle = 'rgba(180,140,60,0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(bx, by, cellSize * 0.20, Math.PI * 1.0, Math.PI * 2.0);
                ctx.stroke();
                if (left === 1) {
                    ctx.strokeStyle = 'rgba(251,191,36,0.8)';
                    ctx.beginPath();
                    ctx.arc(bx, by, cellSize * 0.34, Math.PI * 1.0, Math.PI * 2.0);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鐘まで ' + (Math.max(1, P('bell_interval') || 9) - (st.pcnt[turn] % Math.max(1, P('bell_interval') || 9))) + '手'`),
        [K.ONE, K.INFO_BASE, `            除夜碁: 各プレイヤーの9手ごとの着手で除夜の鐘が鳴り、孤立した敵石(連が1石だけ)が全て祓われる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の9手ごとの着手は除夜の鐘。盤上で孤立している敵石 (1石だけの連) が全て祓われてアゲハマになる。',
            '鐘のタイミングは手数で決まるため両者に同じ回数巡る。煩悩(孤立石)を残さないよう連を保て。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.pcnt = { 1: 0, 2: 0 };
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[0 * B + 5] = 2; board[9 * B + 9] = 2; // 孤立した白石2個 (煩悩)
        board[2 * B + 6] = 2; board[2 * B + 7] = 2; // 連なった白石 (煩悩でない)
        st.pcnt[1] = 8; // 次の着手で9手目
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('孤立した敵石は祓われる', board[0 * B + 5] === 0 && board[9 * B + 9] === 0);
        assert('連なった敵石は残る', board[2 * B + 6] === 2 && board[2 * B + 7] === 2);
        assert('祓われた石はアゲハマ', captures[1] === 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('鐘は9手ごとに1回', board[2 * B + 6] === 2);
    `,
};
