// FROSTPILLARGO — 霜柱碁: 24手ごとの早朝に霜柱が立ち、全ての石が1段持ち上がる (空いていれば)
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
const ST_INIT = `{ lifts: 0 }`;
module.exports = {
    file: 'frostpillargo.html',
    en: 'FROSTPILLARGO',
    jp: '霜柱碁',
    prefix: 'frostpillargo',
    desc: '24手ごとの早朝に霜柱が立ち、全ての石が上へ1段持ち上がる (上が空いていれば)。',
    kind: 'stone',
    icon: 'frostpillargo',
    spec: [
        ...K.rb('FROSTPILLARGO', '霜柱碁', 'frostpillargo'),
        K.params([
            { key: 'frost_interval', label: '霜柱の周期', min: 6, max: 90, def: 24, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 霜柱: 24手毎に全石が1段上へ持ち上がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 霜柱: 24手ごとの早朝に全石が1段上へ持ち上がる (上が空いていれば)
            if (history.length > 0 && history.length % Math.max(1, P('frost_interval') || 24) === 0) {
                let lifted = 0;
                // 上から順に処理 (持ち上げた先の石を連鎖しないよう上から)
                for (let y = 1; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x;
                        const up = i - BOARD_SIZE;
                        if ((board[i] === 1 || board[i] === 2) && board[up] === 0) {
                            board[up] = board[i];
                            board[i] = 0;
                            lifted++;
                        }
                    }
                }
                if (lifted > 0) {
                    st.lifts++;
                    // ピース記録を盤面に合わせて再構築
                    pieces = [];
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        for (let x = 0; x < BOARD_SIZE; x++) {
                            const v = board[y * BOARD_SIZE + x];
                            if (v === 1 || v === 2) pieces.push({ p: v, cells: [{ x, y }] });
                        }
                    }
                    fxText(0, '霜柱!', '#bae6fd', 1400);
                    fxShake(3, 300);
                }
            }

            turn = opponent;`],
        // 霜柱の予兆 (持ち上げ予告の上向き矢印)
        ...K.CUE_STARS(`
            // 霜柱予告: 次の早朝で持ち上がる石の上に薄い矢印
            if ((P('frost_interval') || 24) - (history.length % (P('frost_interval') || 24)) <= 3) {
                ctx.fillStyle = 'rgba(125,211,252,0.5)';
                for (let i = BOARD_SIZE; i < board.length; i++) {
                    if ((board[i] === 1 || board[i] === 2) && board[i - BOARD_SIZE] === 0) {
                        const mx = padding + (i % BOARD_SIZE) * cellSize;
                        const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(mx, my - cellSize * 0.42);
                        ctx.lineTo(mx + cellSize * 0.12, my - cellSize * 0.24);
                        ctx.lineTo(mx - cellSize * 0.12, my - cellSize * 0.24);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'霜柱まで ' + ((P('frost_interval') || 24) - history.length % (P('frost_interval') || 24)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            霜柱碁: 24手毎の早朝に霜柱が立ち、全石が上へ1段持ち上がる (上が空いていれば)<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '24手ごとの早朝に霜柱が立つ: 全ての石が1段上へ持ち上がる (直上が空いている石のみ)。',
            '持ち上がった先で呼吸や取りの関係が変わる。盤上辺に追い詰められると動けない。',
            '早朝3手前は持ち上がる石に上向き矢印が出る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.lifts = 0;
        board[5 * BOARD_SIZE + 5] = 1;
        board[0 * BOARD_SIZE + 7] = 2; // 上辺 (動けない)
        history.length = 23;
        executeMove({ cells: [{ x: 0, y: 12 }] }, 1);
        assert('石が1段持ち上がる', board[4 * BOARD_SIZE + 5] === 1 && board[5 * BOARD_SIZE + 5] === 0);
        assert('上辺の石は動かない', board[0 * BOARD_SIZE + 7] === 2);
        assert('持ち上げ記録', st.lifts === 1);
        // 上が上辺の不動石で塞がっていると動かない
        board[1 * BOARD_SIZE + 3] = 1; board[0 * BOARD_SIZE + 3] = 2;
        history.length = 47;
        executeMove({ cells: [{ x: 1, y: 12 }] }, 2);
        assert('直上に不動の石があれば動かない', board[1 * BOARD_SIZE + 3] === 1);
    `,
};
