// FRACTALGO — フラクタル碁: シェルピンスキー自己相似点 ((x+1)&(y+1)===0) に置くと +1目
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
const ST_INIT = `{ bonus: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'fractalgo.html',
    en: 'FRACTALGO',
    jp: 'フラクタル碁',
    prefix: 'fractalgo',
    desc: 'シェルピンスキー自己相似パターンの交点に置くと +1目。同じ形が縮尺を変えて繰り返す盤。',
    kind: 'stone',
    icon: 'fractalgo',
    spec: [
        ...K.rb('FRACTALGO', 'フラクタル碁', 'fractalgo'),
        ...ST(ST_INIT),
        // 自己相似点 (1始まり座標の bitwise AND が0) に置くと +1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // フラクタル碁: シェルピンスキー点に置くと +1目ボーナス
            {
                const __p = move.cells[0];
                if (((__p.x + 1) & (__p.y + 1)) === 0) {
                    const __pi = __p.y * BOARD_SIZE + __p.x;
                    st.bonus[player] = (st.bonus[player] || 0) + 1;
                    fxText(__pi, '+1 相似点', '#34d399', 900);
                    fxGlow(__pi, '#34d399', 700);
                }
            }

            turn = opponent;`],
        // フラクタル点を三角ガスケット風の小マーカーで表示
        K.CUE_STARS(`            // フラクタル点: 自己相似な小三角マーク
            {
                ctx.save();
                ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
                for (let __y = 0; __y < BOARD_SIZE; __y++) for (let __x = 0; __x < BOARD_SIZE; __x++) {
                    if (((__x + 1) & (__y + 1)) !== 0) continue;
                    const __cx = padding + __x * cellSize, __cy = padding + __y * cellSize, __r = cellSize * 0.10;
                    ctx.beginPath();
                    ctx.moveTo(__cx, __cy - __r);
                    ctx.lineTo(__cx + __r, __cy + __r * 0.8);
                    ctx.lineTo(__cx - __r, __cy + __r * 0.8);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + ((st.bonus && st.bonus[1]) || 0);
            const whiteTotal = territory.white + captures[2] + komi + ((st.bonus && st.bonus[2]) || 0);`],
        ...K.EVENT_CHIP_SPEC(`'相似点 +' + ((st.bonus && st.bonus[turn]) || 0) + '目'`),
        [K.ONE, K.INFO_ALGO, `            フラクタル碁: 自己相似パターンの点 (▲) に置くと +1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '交点座標 (x+1, y+1) のビットANDが0になる点は自己相似な「フラクタル点」。',
            'フラクタル点に置くと +1目。パターンは盤面全体にフラクタル状に繰り返される。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1); // (2,1): 2&1=0 → フラクタル点
        assert('フラクタル点で+1目', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 2, y: 1 }] }, 2); // (3,2): 3&2=2 → 非対象
        assert('非対象点はボーナスなし', st.bonus[2] === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // (1,1): 1&1=1 → 非対象
        assert('隅(1,1)も非対象', st.bonus[2] === 0);
    `,
};
