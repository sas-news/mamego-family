// SCROLLMOUNTGO — 表具碁: 盤の中央列は床の間。そこに連(掛軸)を掛けると長さに応じて得点
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
const ST_INIT = `{ hung: {}, score: { 1: 0, 2: 0 }, _end: false }`;
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
    file: 'scrollmountgo.html',
    en: 'SCROLLMOUNTGO',
    jp: '表具碁',
    prefix: 'scrollmountgo',
    desc: '中央列は床の間。3連以上の連を掛軸として掛けると長さ分の得点。',
    kind: 'stone',
    icon: 'scrollmountgo',
    spec: [
        ...K.rb('SCROLLMOUNTGO', '表具碁', 'scrollmountgo'),
        K.params([
            { key: 'hang_min', label: '掛軸に必要な床の間の石数', min: 1, max: 6, def: 3, unit: '石' },
            { key: 'hang_rate', label: '掛軸の石あたり得点', min: 1, max: 4, def: 1, unit: '点' },
        ]),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 床の間: 中央列 (天井から吊るす掛軸のレール)
        function tokonomaX() { return Math.floor(BOARD_SIZE / 2); }
        function onTokonoma(i) { return i % BOARD_SIZE === tokonomaX(); }
        // 掛軸判定: 着手者の連が床の間に3石以上接していれば掛けられる
        function hangingGroups(player) {
            const seen = new Set(), out = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== player || seen.has(i)) continue;
                const q = [i], g = []; seen.add(i);
                let touch = 0;
                while (q.length) {
                    const c = q.shift(); g.push(c);
                    if (onTokonoma(c)) touch++;
                    getNeighbors(c).forEach(n => { if (board[n] === player && !seen.has(n)) { seen.add(n); q.push(n); } });
                }
                if (touch >= Math.max(1, P('hang_min') || 3)) out.push(g);
            }
            return out;
        }`],
        // 掛軸を掛ける: 床の間に3連以上で接した連は表装され、長さ分の得点 (1石=1点)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 掛軸の表装: 床の間に3石以上で接した連を掛けると長さ分の得点
            hangingGroups(player).forEach(g => {
                const key = g.slice().sort((a, b) => a - b).join(',');
                if (st.hung[key]) return;
                st.hung[key] = player;
                st.score[player] += g.length * Math.max(1, P('hang_rate') || 1);
                g.forEach(i => fxGlow(i, '#c084fc', 1100));
                fxText(g[0], '掛軸 +' + (g.length * Math.max(1, P('hang_rate') || 1)), '#c084fc', 1500);
            });

            turn = opponent;`],
        // 床の間の描画: 中央列を床柱の木目で縁取る
        K.CUE_GRID(`            // 床の間: 中央列を床柱の木枠で縁取る
            {
                ctx.save();
                const tx = padding + tokonomaX() * cellSize;
                ctx.strokeStyle = 'rgba(120,72,20,0.8)';
                ctx.lineWidth = Math.max(2, cellSize * 0.10);
                ctx.beginPath();
                ctx.moveTo(tx - cellSize * 0.5, padding - cellSize * 0.5);
                ctx.lineTo(tx - cellSize * 0.5, padding + (BOARD_SIZE - 0.5) * cellSize);
                ctx.moveTo(tx + cellSize * 0.5, padding - cellSize * 0.5);
                ctx.lineTo(tx + cellSize * 0.5, padding + (BOARD_SIZE - 0.5) * cellSize);
                ctx.stroke();
                ctx.fillStyle = 'rgba(180,140,80,0.10)';
                ctx.fillRect(tx - cellSize * 0.5, padding - cellSize * 0.5, cellSize, BOARD_SIZE * cellSize);
                ctx.restore();
            }`),
        // 得点を終局時にアゲハマ相当で加算
        [K.ONE, `        function endGameByScore() {`,
`        function endGameByScore() {
            if (!st._end) {
                st._end = true;
                captures[1] += st.score[1] || 0;
                captures[2] += st.score[2] || 0;
            }
            _endGameByScoreCore();
        }
        function _endGameByScoreCore() {`],
        ...K.EVENT_CHIP_SPEC(`'掛軸 黒' + st.score[1] + ' / 白' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `            表具碁: 中央列は床の間。連が床の間に3石以上接すると掛軸として掛かり、長さ分得点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤の中央列は床の間。着手した連が床の間に3石以上で接すると掛軸として掛かる。',
            '掛かった掛軸は連の長さ (石数) 分だけ得点 — 終局時にアゲハマ相当で加算。',
            '掛軸を取られても得点は残る。長い掛軸ほど大きいが、床の間は双方の競合場。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        const c = tokonomaX();
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.hung = {}; st.score = { 1: 0, 2: 0 };
        board[I(c, 2)] = 1; board[I(c, 3)] = 1; // 床の間に2連
        executeMove({ cells: [{ x: c, y: 4 }] }, 1); // 3連目を掛ける
        assert('3連で掛軸完成', st.score[1] === 3);
        const keys = Object.keys(st.hung);
        assert('掛軸が記録される', keys.length === 1 && st.hung[keys[0]] === 1);
        assert('床の間判定', onTokonoma(I(c, 5)) && !onTokonoma(I(c + 1, 5)));
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 1 }], 1) === true);
    `,
};
