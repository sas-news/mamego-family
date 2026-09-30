// KEMARIGO — 蹴鞠碁: 盤上を跳ねる鞠。隣に石を置くと鞠を蹴って+1目、鞠は石の向こうへ跳ねる
const K = require('../gen_kit.js');
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
const ST_INIT = `(function () { const m = Math.floor(BOARD_SIZE / 2); return { kicks: { 1: 0, 2: 0 }, ball: m * BOARD_SIZE + m }; })()`;
module.exports = {
    file: 'kemarigo.html',
    en: 'KEMARIGO',
    jp: '蹴鞠碁',
    prefix: 'kemarigo',
    desc: '盤上に鞠が1個転がる。隣に石を置けば蹴って+1目、鞠は石の向こうへ跳ねる。',
    kind: 'stone',
    icon: 'kemarigo',
    spec: [
        ...K.rb('KEMARIGO', '蹴鞠碁', 'kemarigo'),
        ...ST(ST_INIT),
        // 鞠の上には置けない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 鞠のある点には置けない
                if (p.y * BOARD_SIZE + p.x === st.ball) return false;
            }`],
        // 蹴り: 着手が鞠に隣接すれば+1目。鞠は石の向こう側へ跳ねる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蹴鞠: 置いた石が鞠に隣接していれば蹴って+1目
            {
                const mc = move.cells[0];
                const bx = st.ball % BOARD_SIZE, by = (st.ball / BOARD_SIZE) | 0;
                if (Math.abs(mc.x - bx) + Math.abs(mc.y - by) === 1) {
                    st.kicks[player]++;
                    // 鞠は石の向こう側 (反射点) へ跳ねる
                    const nx = 2 * bx - mc.x, ny = 2 * by - mc.y;
                    const ni = ny * BOARD_SIZE + nx;
                    if (nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE && board[ni] === 0) {
                        fxSlide(st.ball, ni, 420);
                        st.ball = ni;
                    }
                    fxText(st.ball, '蹴!', '#f59e0b', 1100);
                    fxGlow(st.ball, '#fbbf24', 700);
                }
            }

            turn = opponent;`],
        // 蹴数集計
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 蹴鞠ルール: 蹴った数を得点へ
            territory.black += st.kicks[1];
            territory.white += st.kicks[2];`],
        // 鞠の描画: 二色の革鞠
        K.CUE_STARS(`            // 鞠: 二色の革鞠
            {
                const bx = st.ball % BOARD_SIZE, by = (st.ball / BOARD_SIZE) | 0;
                const cx = padding + bx * cellSize, cy = padding + by * cellSize;
                const r = cellSize * 0.26;
                ctx.save();
                ctx.fillStyle = '#d97706';
                ctx.beginPath();
                ctx.arc(cx, cy, r, Math.PI * 0.5, Math.PI * 1.5);
                ctx.fill();
                ctx.fillStyle = '#fde68a';
                ctx.beginPath();
                ctx.arc(cx, cy, r, -Math.PI * 0.5, Math.PI * 0.5);
                ctx.fill();
                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'鞠 黒' + (st.kicks ? st.kicks[1] : 0) + ' 白' + (st.kicks ? st.kicks[2] : 0)`),
        [K.ONE, K.INFO_ALGO, `            蹴鞠碁: 鞠の隣に石を置くと蹴って+1目。鞠は石の向こうへ跳ねる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤上に鞠が1個転がっている (鞠の点には置けない)。鞠の隣に石を置けば蹴って+1目。鞠は石の向こう側へ跳ねる。',
            '跳ねた先を読んで追い続けるか、地取りに専念するか。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const bx = st.ball % BOARD_SIZE, by = (st.ball / BOARD_SIZE) | 0;
        assert('鞠は中央にある', bx === Math.floor(BOARD_SIZE / 2) && by === Math.floor(BOARD_SIZE / 2));
        assert('鞠の上には置けない', isValidPlacement([{ x: bx, y: by }], 1) === false);
        board.fill(0); pieces = []; history.length = 0; st.kicks = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: bx - 1, y: by }] }, 1); // 鞠の左隣に置く
        assert('蹴って+1目', st.kicks[1] === 1);
        assert('鞠は向こうへ跳ねた', st.ball === by * BOARD_SIZE + (bx + 1));
        board.fill(0); pieces = []; history.length = 0;
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
