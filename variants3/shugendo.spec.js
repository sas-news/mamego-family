// SHUGENDO — 修験碁: 四隅の行場(星)で打った石は修行石となり、生き残れば採点で+2ずつ
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
const ST_INIT = `{ asc: {} }`;
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
    file: 'shugendo.html',
    en: 'SHUGENDO',
    jp: '修験碁',
    prefix: 'shugendo',
    desc: '四隅の星は行場。行場で打った石は修行し、終局まで残れば+2点。',
    kind: 'stone',
    icon: 'shugendo',
    spec: [
        ...K.rb('SHUGENDO', '修験碁', 'shugendo'),
        ...ST(ST_INIT),
        // 行場一覧ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 行場: 四隅の星 (天元を除く星の点)
        function shugendoSites() {
            const c = Math.floor(BOARD_SIZE / 2);
            return getStarPoints(BOARD_SIZE).filter(pt => pt.x !== c || pt.y !== c)
                .map(pt => pt.y * BOARD_SIZE + pt.x);
        }
        // 法力: 行場で打って生き残った石の数
        function shugendoBonus(pl) {
            let n = 0;
            shugendoSites().forEach(i => {
                if (st.asc[i] === pl && board[i] === pl) n++;
            });
            return n * 2;
        }

        function endGameByScore() {`],
        // 採点に法力点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + shugendoBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + shugendoBonus(2);`],
        // 行場で打った石を修行石として記録
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 修験: 行場に打った石は修行石になる
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (shugendoSites().includes(cell)) {
                    st.asc[cell] = player;
                    fxGlow(cell, '#a3e635', 900);
                    fxText(cell, '修行', '#a3e635', 1100);
                }
            }

            turn = opponent;`],
        // 行場に環と修行石の印を描く
        ...K.STONE_MARKS_SPEC(`            // 修験: 行場の環と修行石の印
            {
                ctx.save();
                shugendoSites().forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.strokeStyle = 'rgba(132,204,22,0.55)';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                    if (st.asc[i] === board[i] && (board[i] === 1 || board[i] === 2)) {
                        ctx.fillStyle = board[i] === 1 ? 'rgba(163,230,53,0.9)' : 'rgba(101,163,13,0.9)';
                        ctx.beginPath();
                        ctx.arc(cx, cy - cellSize * 0.16, cellSize * 0.08, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            修験碁: 四隅の星は行場。行場で打った石は修行石となり、終局まで生き残れば+2点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '四隅の星は修験の「行場」。行場に打った石は修行を積んだ石になる (緑の印)。',
            '終局時、行場に残っている自分の修行石1つにつき+2点。取られたり捨てたりすれば徳は消える。',
            '行場は四隅に4つ。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.asc = {};
        const sites = shugendoSites();
        assert('行場は4か所', sites.length === 4);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        const s0 = sites[0];
        executeMove({ cells: [{ x: s0 % B, y: Math.floor(s0 / B) }] }, 1);
        assert('行場で打つと修行石', st.asc[s0] === 1);
        assert('生き残れば+2', shugendoBonus(1) === 2);
        board[s0] = 0;
        assert('取られると法力は消える', shugendoBonus(1) === 0);
        board[s0] = 2;
        assert('敵に取られても敵の修行石にはならない', shugendoBonus(2) === 0);
    `,
};
