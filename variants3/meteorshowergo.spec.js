// METEORSHOWERGO — 隕群碁: 10手ごとに流星群が降り、着弾点の石を蒸発させる
const K = require('../gen_kit.js');
module.exports = {
    file: 'meteorshowergo.html',
    en: 'METEORSHOWERGO',
    jp: '隕群碁',
    prefix: 'meteorshowergo',
    desc: '10手ごとに流星群が盤面に着弾。十字に石を蒸発させる (両者共通)。',
    kind: 'stone',
    icon: 'meteorshowergo',
    spec: [
        ...K.rb('METEORSHOWERGO', '隕群碁', 'meteorshowergo'),
        K.params([
            { key: 'interval', label: '流星群の間隔', min: 4, max: 30, def: 10, unit: '手' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.8, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { strikes: [] }; // 着弾点の履歴 [{x,y}]
        // 着弾点: 手数から決定論的に導出 (両者に公平なランダム)
        function meteorTarget(ply) {
            return (ply * 37 + 11) % (BOARD_SIZE * BOARD_SIZE);
        }
        // 流星着弾: 十字 (自身+4近傍) の石を蒸発させる
        function meteorStrike() {
            const ti = meteorTarget(history.length);
            const x = ti % BOARD_SIZE, y = Math.floor(ti / BOARD_SIZE);
            fxGlow(ti, '#fb923c', 800);
            fxShake(7, 350);
            fxText(ti, '隕石!', '#fb923c', 1100);
            [ti, ...getNeighbors(ti)].forEach(i => {
                if (board[i] === 1 || board[i] === 2) {
                    fxBurst(i, '#f97316', 10, 1.7);
                    fxBurst(i, '#fbbf24', 5, 1.1);
                    board[i] = 0; // 蒸発 (アゲハマにならない)
                }
            });
            st.strikes.push({ x, y });
            if (st.strikes.length > 30) st.strikes.shift();
            cleanUpPieces();
        }`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { strikes: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { strikes: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { strikes: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { strikes: [] };`],
        // 10手ごとに流星着弾 (両者共通の周期)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 流星群: N手ごとに着弾 (間隔は設定で調整)
            if (history.length > 0 && history.length % Math.max(1, P('interval') || 10) === 0) {
                meteorStrike();
            }

            // 打ち切り: 長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        // 着弾跡のクレーター描画
        ...K.STONE_MARKS_SPEC(`            // 隕石クレーター
            {
                ctx.save();
                (st.strikes || []).forEach(s => {
                    const cx = padding + s.x * cellSize, cy = padding + s.y * cellSize;
                    ctx.strokeStyle = 'rgba(41,37,36,0.45)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(41,37,36,0.18)';
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'隕石まで ' + (Math.max(1, P('interval') || 10) - history.length % Math.max(1, P('interval') || 10)) + '手'`),
        [K.ONE, K.INFO_ALGO, `            隕群碁: 10手ごとに流星群が着弾し、十字の石を蒸発させる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '10手ごとに流星群が盤面に着弾。着弾点とその4近傍の石は蒸発する (アゲハマにならない)。',
            '着弾位置は手数で決まるため両者に公平。次の着弾はヘッダのチップで確認できる。',
        ])],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        history.length = 9;
        const ti = meteorTarget(10);
        const tx = ti % BOARD_SIZE, ty = Math.floor(ti / BOARD_SIZE);
        board[ti] = 2; // 着弾点に白石
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 10手目 → 着弾
        assert('着弾点の石は蒸発', board[ti] === 0);
        assert('クレーター記録', st.strikes.some(s => s.x === tx && s.y === ty));
        // 蒸発はアゲハマにならない
        assert('蒸発はアゲハマにならない', captures[1] === 0 && captures[2] === 0);
        assert('起動して着手可', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
