// YABUSAMEGO — 流鏑碁: 置いた石の行・列の一直線上にある的を射抜く。障害のない的は+1目 (各的1回)
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
const ST_INIT = `{ hit: {} }`;
module.exports = {
    file: 'yabusamego.html',
    en: 'YABUSAMEGO',
    jp: '流鏑碁',
    prefix: 'yabusamego',
    desc: '着手した石の行と列を馬が走り、一直線上の的を射抜く。的ごとに+1目 (各1回)。',
    kind: 'stone',
    icon: 'yabusamego',
    spec: [
        ...K.rb('YABUSAMEGO', '流鏑碁', 'yabusamego'),
        K.params([
            { key: 'target_dist', label: '的の距離', min: 1, max: 5, def: 2, hint: '辺からの距離 (行/列)' },
            { key: 'target_pts', label: '命中の点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 補助関数をページスコープへ注入
        [K.ONE, `        function executeMove(move, player) {`, `        // 流鏑馬の的: 盤の四辺寄り4箇所 (辺からdの距離)
let TARGETS = [];
function rebuildTargets() {
    const c = Math.floor(BOARD_SIZE / 2), d = Math.min(Math.floor(BOARD_SIZE / 2) - 1, P('target_dist') || 2);
    TARGETS = [d * BOARD_SIZE + c, (BOARD_SIZE - 1 - d) * BOARD_SIZE + c, c * BOARD_SIZE + d, c * BOARD_SIZE + (BOARD_SIZE - 1 - d)];
}
rebuildTargets();
function onVariantParam(p) { if (p.key === 'target_dist') rebuildTargets(); }

        function executeMove(move, player) {`],

        // 的の描画
        K.CUE_STARS(`            // 流鏑馬の的: 同心円
            {
                ctx.save();
                TARGETS.forEach(i => {
                    if (st.hit[i]) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    if (board[i] !== 0) {
                        ctx.globalAlpha = 0.25;
                    }
                    [0.3, 0.18].forEach((rr, k) => {
                        ctx.strokeStyle = k ? 'rgba(220,60,60,0.8)' : 'rgba(30,30,30,0.6)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * rr, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                    ctx.fillStyle = 'rgba(220,60,60,0.8)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.07, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });
                ctx.restore();
            }`),
        // 走り抜けて射る: 着手点の行・列を4方向走査、最初に見えた的を命中
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 流鏑碁: 着手点から行列4方向を走り、視界の的を射抜いて+1目
            {
                const bc = move.cells[0];
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    let x = bc.x + dx, y = bc.y + dy;
                    while (x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE) {
                        const i = y * BOARD_SIZE + x;
                        if (TARGETS.includes(i) && !st.hit[i]) {
                            st.hit[i] = player;
                            captures[player] += (P('target_pts') ?? 1);
                            fxText(i, '命中!', '#f43f5e', 1200);
                            fxBurst(i, '#f43f5e', 10, 1.6);
                            return;
                        }
                        if (board[i] !== 0 && !TARGETS.includes(i)) break;
                        if (board[i] !== 0 && TARGETS.includes(i)) break;
                        x += dx; y += dy;
                    }
                });
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'的 ' + Object.keys(st.hit || {}).length + '/' + TARGETS.length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            流鏑碁: 着手した石の行・列を馬が走り、一直線上に見える的を射抜く。的ごと+1目 (各1回)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した瞬間、騎手がその石の行と列の4方向へ駆け抜ける。途中に石がなければ一直線上の的に命中して+1目。',
            '各的は1回のみ。的の上に石があっても射られる (命中は的を消費)。',
            '行列を空けておく射線管理が鍵。的までの道に石を置いて遮るのも手。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.hit = {};
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: 8, y: 2 }] }, 1); // 上辺寄りの的 (c,2) と同じ行
        assert('的に命中+1', captures[1] === 1 && st.hit[2 * BOARD_SIZE + c] === 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2); // 的なし方向
        assert('的がなければ加点なし', captures[2] === 0);
        executeMove({ cells: [{ x: 9, y: 2 }] }, 1); // 既命中の的
        assert('既命中の的は加点なし', captures[1] === 1);
    `,
};
