// GALEGO — 木枯碁: 12手ごとに木枯らしが吹き、全石が風下へ1マス流される。風向きは毎回まわる
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
const ST_INIT = `{ dir: 0, gusts: 0 }`;
const DIRS = `{ dx: [1, 0, -1, 0], dy: [0, 1, 0, -1], name: ['東', '南', '西', '北'] }`;
module.exports = {
    file: 'galego.html',
    en: 'GALEGO',
    jp: '木枯碁',
    prefix: 'galego',
    desc: '12手ごとに木枯らし。全石が風下へ1マス流される。風向きは東→南→西→北とまわる。',
    kind: 'stone',
    icon: 'galego',
    spec: [
        ...K.rb('GALEGO', '木枯碁', 'galego'),
        K.params([
            { key: 'gale_interval', label: '木枯らしの周期', min: 3, max: 48, def: 12, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 木枯らし: 12手毎に全石が風下へ1マス流される
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 木枯らし: 12手ごとに全石が風下へ流される (風向きは毎回まわる)
            if (history.length > 0 && history.length % Math.max(1, P('gale_interval') || 12) === 0) {
                const D = ${DIRS};
                const dx = D.dx[st.dir], dy = D.dy[st.dir];
                let blew = 0;
                // 風下側から処理して連鎖を防ぐ
                const order = [];
                for (let i = 0; i < board.length; i++) order.push(i);
                order.sort((a, b) => ((b % BOARD_SIZE) * dx + Math.floor(b / BOARD_SIZE) * dy)
                    - ((a % BOARD_SIZE) * dx + Math.floor(a / BOARD_SIZE) * dy));
                order.forEach(i => {
                    const v = board[i];
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return;
                    const ni = ny * BOARD_SIZE + nx;
                    if (board[ni] !== 0) return;
                    board[ni] = v;
                    board[i] = 0;
                    blew++;
                });
                if (blew > 0) {
                    st.gusts++;
                    st.dir = (st.dir + 1) % 4;
                    // ピース記録を盤面に合わせて再構築
                    pieces = [];
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        for (let x = 0; x < BOARD_SIZE; x++) {
                            const v = board[y * BOARD_SIZE + x];
                            if (v === 1 || v === 2) pieces.push({ p: v, cells: [{ x, y }] });
                        }
                    }
                    fxText(0, '木枯らし!', '#94a3b8', 1300);
                    fxShake(4, 350);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'木枯らし ' + ${DIRS}.name[st.dir] + ' まで ' + ((P('gale_interval') || 12) - history.length % (P('gale_interval') || 12)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            木枯碁: 12手毎に木枯らしが吹き、全石が風下へ1マス流される (風向きは東→南→西→北)<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '12手ごとに木枯らし: 全ての石が風下へ1マス流される (行き先が空いている石のみ)。',
            '風向きは吹くたびに東→南→西→北とまわる。',
            '流された先で呼吸や取りの関係が変わる。端に追い込まれた石は動けない。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.dir = 0; st.gusts = 0;
        board[5 * BOARD_SIZE + 5] = 1;
        board[5 * BOARD_SIZE + 12] = 2; // 東風の行き止まり
        history.length = 11;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('東へ流される', board[5 * BOARD_SIZE + 6] === 1 && board[5 * BOARD_SIZE + 5] === 0);
        assert('端の石は動かない', board[5 * BOARD_SIZE + 12] === 2);
        assert('風向きがまわる', st.dir === 1);
        // 塞がっていると動かない (風下の石が端で動けない場合)
        board[11 * BOARD_SIZE + 8] = 1; board[12 * BOARD_SIZE + 8] = 2;
        history.length = 23;
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('風下が不動なら動かない', board[11 * BOARD_SIZE + 8] === 1);
    `,
};
