// TIGHTROPEGO — 綱渡碁: 中央の綱に乗った石は自分の手番ごとに向こう岸へ1マス歩く。渡りきると+2目
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
const ST_INIT = `{ walkers: { 1: [], 2: [] } }`;
module.exports = {
    file: 'tightropego.html',
    en: 'TIGHTROPEGO',
    jp: '綱渡碁',
    prefix: 'tightropego',
    desc: '中央横一列は綱。綱上の石は毎手自動で対岸へ歩き、渡りきると+2目。',
    kind: 'stone',
    icon: 'tightropego',
    spec: [
        ...K.rb('TIGHTROPEGO', '綱渡碁', 'tightropego'),
        ...ST(ST_INIT),

        // 綱渡り: 自分の手番のたび綱上の自石が対岸へ1マス歩く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 綱渡碁: 綱上の自石が対岸へ1歩。渡りきると+2目で消える
            {
                const ropeY = Math.floor(BOARD_SIZE / 2);
                const dir = player === 1 ? 1 : -1;
                const adv = (st.walkers[player] || []).filter(i => board[i] === player);
                st.walkers[player] = [];
                let arrived = false;
                adv.forEach(i => {
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const nx = x + dir;
                    if (nx < 0 || nx >= BOARD_SIZE) {
                        board[i] = 0;
                        captures[player] += 2;
                        fxBurst(i, '#34d399', 10, 1.6);
                        fxText(i, '到達 +2', '#34d399', 1200);
                        arrived = true;
                    } else {
                        const ni = y * BOARD_SIZE + nx;
                        if (board[ni] === 0) {
                            board[ni] = player; board[i] = 0;
                            fxSlide(i, ni, 380);
                            st.walkers[player].push(ni);
                        } else {
                            st.walkers[player].push(i); // 前が詰まっている
                        }
                    }
                });
                if (arrived) cleanUpPieces();
                // 新たに綱に乗った石を歩行者に登録
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (move.cells[0].y === ropeY && board[pi] === player) st.walkers[player].push(pi);
            }

            turn = opponent;`],
        // 綱: 中央行にロープを描く
        K.CUE_GRID(`            // 綱: 中央のロープ
            {
                const ropeY = Math.floor(BOARD_SIZE / 2);
                const cy = padding + ropeY * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(120,72,30,0.75)';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize * 0.3, cy + Math.sin(fxNow() / 700) * cellSize * 0.03);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.lineTo(padding + x * cellSize, cy + Math.sin(fxNow() / 700 + x * 0.9) * cellSize * 0.05);
                }
                ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.3, cy);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'綱上 ' + (st.walkers[turn] || []).filter(i => board[i] === turn).length + '人'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            綱渡碁: 中央行は綱。綱上の自石は自分の手番ごとに対岸へ1マス歩き、渡りきると+2目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '中央の横一列は綱。そこに置いた石は「渡り人」になり、自分の手番ごとに対岸へ1マス自動で歩く。',
            '黒は右へ、白は左へ歩く。渡りきると+2目で石は盤を去る。途中の敵石に普通に取られることもある。',
            '前に石があると歩けない (渋滞)。綱に乗せるか地取りかの駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.walkers = { 1: [], 2: [] };
        const ropeY = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: 1, y: ropeY }] }, 1); // 綱に乗る
        assert('綱に乗ると歩行者登録', st.walkers[1].includes(ropeY * BOARD_SIZE + 1));
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1); // 黒の手番 → 歩行者が前進
        assert('歩行者が1マス進む', board[ropeY * BOARD_SIZE + 2] === 1 && board[ropeY * BOARD_SIZE + 1] === 0);
        // 端まで歩かせる
        board[ropeY * BOARD_SIZE + 2] = 0; board[ropeY * BOARD_SIZE + (BOARD_SIZE - 1)] = 1;
        st.walkers[1] = [ropeY * BOARD_SIZE + (BOARD_SIZE - 1)];
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('渡りきると+2目', captures[1] === 2 && board[ropeY * BOARD_SIZE + (BOARD_SIZE - 1)] === 0);
    `,
};
