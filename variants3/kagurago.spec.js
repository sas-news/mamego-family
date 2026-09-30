// KAGURAGO — 神楽碁: 対角の星の神(中立点)を石で3方以上囲んだ側が招き+4点
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
const ST_INIT = `{ claim: { 1: 0, 2: 0 }, gods: {} }`;
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
    file: 'kagurago.html',
    en: 'KAGURAGO',
    jp: '神楽碁',
    prefix: 'kagurago',
    desc: '対角の星に神(中立)がいる。神の隣に自石を3方以上置いて招くと+4点。',
    kind: 'stone',
    icon: 'kagurago',
    spec: [
        ...K.rb('KAGURAGO', '神楽碁', 'kagurago'),
        ...ST(ST_INIT),
        // 神を対角の星に配置 (中立障害 board=4)
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            // 神を対角の星 (左上と右下) に置く
            { const q = Math.max(2, Math.floor(BOARD_SIZE / 4)), e = BOARD_SIZE - 1 - q;
              [q * BOARD_SIZE + q, e * BOARD_SIZE + e].forEach(i => { board[i] = 4; }); }`],
        // 神の座一覧ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 神の座: 対角の2星
        function kaguraGods() {
            const q = Math.max(2, Math.floor(BOARD_SIZE / 4)), e = BOARD_SIZE - 1 - q;
            return [q * BOARD_SIZE + q, e * BOARD_SIZE + e];
        }

        function endGameByScore() {`],
        // 採点に招き点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.claim[1];
            const whiteTotal = territory.white + captures[2] + komi + st.claim[2];`],
        // 神楽: 神の隣に自石が3方以上あれば招く (+4・各神1回)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 神楽: 着手した側が神の隣を3方以上埋めていれば神を招く
            {
                kaguraGods().forEach(i => {
                    if (board[i] !== 4 || st.gods[i]) return; // 招かれた神は二度と降りない
                    let n = 0;
                    getNeighbors(i).forEach(nb => { if (board[nb] === player) n++; });
                    if (n >= 3) {
                        st.gods[i] = player;
                        st.claim[player] += 4;
                        fxGlow(i, player === 1 ? '#fbbf24' : '#c4b5fd', 1000);
                        fxText(i, '神降り +4', '#fbbf24', 1400);
                        fxShake(4, 300);
                    }
                });
            }

            turn = opponent;`],
        // 神を光輪で描く (招かれた神は招いた側の色の輪)
        K.CUE_GRID(`            // 神楽: 神の座に揺れる光輪
            {
                const now = fxNow();
                ctx.save();
                kaguraGods().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const owner = st.gods[i];
                    const col = owner === 1 ? '#fbbf24' : owner === 2 ? '#c4b5fd' : '#fde68a';
                    ctx.strokeStyle = col;
                    ctx.globalAlpha = 0.55 + 0.3 * Math.sin(now / 500 + i);
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'神: 黒' + st.claim[1] + ' 白' + st.claim[2]`),
        [K.ONE, K.INFO_ALGO, `            神楽碁: 対角の星に神(中立)がいる。着手した側が神の隣を3方以上埋めると神を招いて+4点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の対角の2つの星には神がいる (中立。置けない・取れない)。',
            '自分の着手が終わった時点で、神の上下左右のうち3方以上が自分の石なら神を招き、+4点。',
            '招かれた神はその色の光輪を帯び、二度と移らない。神は2柱、双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.claim = { 1: 0, 2: 0 }; st.gods = {};
        const gods = kaguraGods();
        assert('神は2柱', gods.length === 2);
        board[gods[0]] = 4; board[gods[1]] = 4;
        assert('神の座には置けない', isValidPlacement([{ x: gods[0] % B, y: Math.floor(gods[0] / B) }], 1) === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        getNeighbors(gods[0]).slice(0, 3).forEach(n => { board[n] = 1; }); // 3方を黒で
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('3方で神を招く', st.claim[1] === 4 && st.gods[gods[0]] === 1);
        getNeighbors(gods[1]).forEach(n => { board[n] = 2; }); // 4方全て白
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        assert('白も同条件で招く', st.claim[2] === 4 && st.gods[gods[1]] === 2);
    `,
};
