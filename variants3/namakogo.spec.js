// NAMAKOGO — 鼠壁碁: 15手ごとに盤内の3x3で火事。2石以下の連は燃え落ちる。
const K = require('../gen_kit.js');
const ST = (init, extraDecl, extraReset) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};${extraDecl || ''}`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};${extraReset || ''}`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const SCORE_END = [
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
];
const ST_INIT = `{ score: { 1: 0, 2: 0 }, _end: false, nextFire: (P('fire_interval') || 15) }`;
module.exports = {
    file: 'namakogo.html',
    en: 'NAMAKOGO',
    jp: '鼠壁碁',
    prefix: 'namakogo',
    desc: '15手ごとに盤内の3x3で火事。2石以下の連は燃え落ちる。',
    kind: 'stone',
    icon: 'namakogo',
    spec: [
        ...K.rb('NAMAKOGO', '鼠壁碁', 'namakogo'),
        K.params([
            { key: 'fire_interval', label: '火事の間隔', min: 5, max: 40, def: 15, unit: '手' },
            { key: 'fire_proof', label: '耐火の連サイズ', min: 1, max: 8, def: 3, unit: '石', hint: 'この数以上の連は火事で焼けない' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT, '', ''),
        [K.ONE, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            turn = opponent;`, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 鼠壁火事: nextFire手ごとに3x3区域に火が入る。小連(2石以下)は焼失
            if (history.length === st.nextFire) {
                st.nextFire += (P('fire_interval') || 15);
                const fx = 1 + Math.floor(Math.random() * (BOARD_SIZE - 2));
                const fy = 1 + Math.floor(Math.random() * (BOARD_SIZE - 2));
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const idx = (fy + dy) * BOARD_SIZE + (fx + dx);
                    const v = board[idx];
                    if (v === 0) continue;
                    const g = getConnectedGroup(idx, v);
                    if (g.length < (P('fire_proof') || 3)) {
                        g.forEach(i => { if (board[i] === v) board[i] = 0; });
                        captures[v === 1 ? 2 : 1] += g.length;
                    }
                }
                cleanUpPieces();
            }

            turn = opponent;`],
        K.CUE_GRID(`            // 鼠壁: 火の入る3x3に警戒色の枠 (次の火事は直前手数で表示のみ)
            {
                const remain = st.nextFire - history.length;
                if (remain <= 3) {
                    ctx.strokeStyle = 'rgba(220,38,38,0.5)';
                    ctx.lineWidth = Math.max(1.5, cellSize * 0.08);
                    ctx.strokeRect(padding - cellSize / 2, padding - cellSize / 2, cellSize * BOARD_SIZE, cellSize * BOARD_SIZE);
                }
            }`),
        ...GAME_OVER,
        ...SCORE_END,
        ...K.EVENT_CHIP_SPEC(`'火事まで ' + Math.max(0, st.nextFire - history.length) + '手'`),
        [K.ONE, K.INFO_ALGO, `                        鼠壁碁: 15手ごとにランダムな3x3区域で火事が起き、2石以下の連は燃えて相手のアゲハマになる。3連以上の鼠壁は燃えない。<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '15手ごとに盤内のどこか3x3に火事が発生。区域の中の2石以下の連は燃え、相手のアゲハマになる。',
            '3石以上の連 (鼠壁) は耐火で燃えない。単石は危ない。',
            '取り・コウ・パス終局は通常通り。満局近くで強制採点。',
            '火事の位置は乱数。両者同じ確率で襲われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        board = Array(BOARD_SIZE * BOARD_SIZE).fill(0); pieces = [];
        board[I(5,5)]=1; board[I(6,5)]=2;
        board[I(5,7)]=2; board[I(6,7)]=2; board[I(7,7)]=2;
        board[I(1,1)]=2;
        Math.random = () => 0.5;
        st.nextFire = 1;
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 1);
        assert('区域内の単石は燃える', board[I(5,5)] === 0 && board[I(6,5)] === 0 && captures[2] === 1 && captures[1] === 1);
        assert('3連の鼠壁は燃えない', board[I(5,7)] === 2 && board[I(6,7)] === 2 && board[I(7,7)] === 2);
        assert('区域外は無事', board[I(1,1)] === 2);
    `,
};
