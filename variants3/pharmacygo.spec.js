// PHARMACYGO — 薬籠碁: 石は生薬。同色の未調合の石が直線に3つ以上並ぶと調合され+5目の薬になる
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= 150) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'pharmacygo.html',
    en: 'PHARMACYGO',
    jp: '薬籠碁',
    prefix: 'pharmacygo',
    desc: '石は生薬。同色の未調合3つ以上が直線に並ぶと調合され、+5目の薬になる。',
    kind: 'stone',
    icon: 'pharmacygo',
    spec: [
        ...K.rb('PHARMACYGO', '薬籠碁', 'pharmacygo'),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 }, used: {} }; // 調合点・調合済みの生薬`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 }, used: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 }, used: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 }, used: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 }, used: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 調合: 直線に3つ以上並んだ未調合の自分の生薬は薬になり+5目 (石は残り、調合済みになる)
            {
                const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
                const hits = new Set();
                let doses = 0;
                DIRS.forEach(([dx, dy]) => {
                    for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                        const i = y * BOARD_SIZE + x;
                        if (board[i] !== player || st.used[i]) continue;
                        const px = x - dx, py = y - dy;
                        if (px >= 0 && px < BOARD_SIZE && py >= 0 && py < BOARD_SIZE && board[py * BOARD_SIZE + px] === player) continue; // 連の先頭のみ
                        const run = [];
                        let cx = x, cy = y;
                        while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && board[cy * BOARD_SIZE + cx] === player) {
                            run.push(cy * BOARD_SIZE + cx);
                            cx += dx; cy += dy;
                        }
                        if (run.length >= 3 && run.every(i2 => !st.used[i2])) {
                            run.forEach(i2 => hits.add(i2));
                            doses++;
                        }
                    }
                });
                if (doses) {
                    hits.forEach(i => { st.used[i] = true; fxBurst(i, '#34d399', 8, 1.5); });
                    st.bonus[player] += doses * 5;
                    fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '調合! +' + (doses * 5) + '目', '#34d399', 1200);
                }
                Object.keys(st.used).forEach(i => { if (board[i] === 0) delete st.used[i]; });
            }

            turn = opponent;`],
        // 調合直前 (2つ並び) の生薬に葉マーク
        ...K.STONE_MARKS_SPEC(`            // 生薬の葉マーク / 調合済みは金の環
            {
                ctx.save();
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    if (st.used && st.used[i]) {
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = Math.max(1.5, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                        ctx.stroke();
                    } else {
                        ctx.strokeStyle = v === 1 ? 'rgba(52,211,153,0.85)' : 'rgba(5,150,105,0.7)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.035);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy + cellSize * 0.1);
                        ctx.quadraticCurveTo(cx + cellSize * 0.12, cy - cellSize * 0.05, cx + cellSize * 0.02, cy - cellSize * 0.16);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の調合:</span> <strong>\${st.bonus[1]}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の調合:</span> <strong>\${st.bonus[2]}目</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'調合 +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            薬籠碁: 同色3つ以上の直線並びが薬に調合される<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '石は生薬。自分の着手で同色の未調合の石が縦・横・斜めに3つ以上連なると調合され、+5目の薬になる。',
            '調合済みの生薬は金の環。石は残るが同じ生薬では二度調合できない。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 }, used: {} };
        board[I(2, 4)] = 1; board[I(3, 4)] = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 3連で調合
        assert('3連が調合される', st.bonus[1] === 5);
        assert('調合済みになる', st.used[I(4, 4)] === true && board[I(2, 4)] === 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 既調合を含む連は再調合されない
        assert('調合済みは再調合されない', st.bonus[1] === 5);
        board.fill(0); st = { bonus: { 1: 0, 2: 0 }, used: {} };
        board[I(2, 4)] = 1; board[I(4, 4)] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1); // 飛び石は調合されない
        assert('飛び石は調合されない', st.bonus[1] === 0 && board[I(2, 4)] === 1);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
