// POTTERYGO — 陶芸碁: 石は陶器の素地。星(窯)の上で15手焼成すると完成し+3目の金彩を得る
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
            if (!capFired && history.length >= (P('ply_cap') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'potterygo.html',
    en: 'POTTERYGO',
    jp: '陶芸碁',
    prefix: 'potterygo',
    desc: '石は陶器の素地。星(窯)の上で15手焼成すると完成し、+3目の金彩を得る。',
    kind: 'stone',
    icon: 'potterygo',
    spec: [
        ...K.rb('POTTERYGO', '陶芸碁', 'potterygo'),
        K.params([{ key: 'bake_turn', label: '焼成に必要な手数', min: 5, max: 40, def: 15, unit: '手' }, { key: 'bake_pts', label: '完成品の得点', min: 1, max: 9, def: 3, unit: '目' }, { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };
        // 窯 = 星の交点
        const KILNS = (() => {
            const s = BOARD_SIZE >= 13 ? [3, Math.floor(BOARD_SIZE / 2), BOARD_SIZE - 4] : [2, Math.floor(BOARD_SIZE / 2), BOARD_SIZE - 3];
            const set = new Set();
            s.forEach(y => s.forEach(x => set.add(y * BOARD_SIZE + x)));
            return set;
        })();`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 焼成: 置いた石に窯入りの時を刻み、窯の上で15手経つと完成 (+3目の金彩)
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (KILNS.has(li)) st.age[li] = history.length;
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    if (st.fired[i] || st.age[i] === undefined) return;
                    if (!KILNS.has(i)) { delete st.age[i]; return; } // 窯から外れた器は焼けない
                    if (history.length - st.age[i] >= (P('bake_turn') || 15)) {
                        st.fired[i] = true;
                        delete st.age[i];
                        st.bonus[v] += (P('bake_pts') || 3);
                        fxGlow(i, '#fbbf24', 1200);
                        fxText(i, '完成! +3目', '#fbbf24', 1200);
                    }
                });
                Object.keys(st.age).forEach(i => { if (board[i] === 0) delete st.age[i]; });
                Object.keys(st.fired).forEach(i => { if (board[i] === 0) delete st.fired[i]; });
            }

            turn = opponent;`],
        // 窯を示す赤熱の星と、完成品の金彩リング
        K.CUE_STARS(`            // 窯 (星) の赤熱マーク
            {
                ctx.save();
                KILNS.forEach(i => {
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(239,68,68,0.5)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.16, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.STONE_MARKS_SPEC(`            // 完成品の金彩リング / 焼成中の熱
            {
                ctx.save();
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    if (st.fired && st.fired[i]) {
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = Math.max(1.5, cellSize * 0.055);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                        ctx.stroke();
                    } else if (st.age && st.age[i] !== undefined) {
                        ctx.fillStyle = 'rgba(239,68,68,0.8)';
                        ctx.beginPath();
                        ctx.arc(cx + cellSize * 0.15, cy + cellSize * 0.15, cellSize * 0.06, 0, Math.PI * 2);
                        ctx.fill();
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
                    <div class="flex justify-between"><span>黒の完成品:</span> <strong>\${st.bonus[1]}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の完成品:</span> <strong>\${st.bonus[2]}目</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'完成品 +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            陶芸碁: 星(窯)の上で15手焼成すると完成し+3目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '星の交点は窯。素地(石)を窯に入れて15手守り抜くと完成品になり、+3目の金彩が付く。',
            '焼成中の器は赤い熱マーク、完成品は金の環。敵に割られると窯入りからやり直し。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };
        const ks = BOARD_SIZE >= 13 ? 3 : 2; // 窯の座標
        executeMove({ cells: [{ x: ks, y: ks }] }, 1); // 窯に置く
        assert('窯入りが刻まれる', st.age[I(ks, ks)] === 1);
        history.length = 16;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 17手目: 16手経過で完成
        assert('15手で完成する', st.fired[I(ks, ks)] === true && st.bonus[1] === 3);
        board.fill(0); st = { age: {}, fired: {}, bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 窯でない場所
        assert('窯以外は焼けない', Object.keys(st.age).length === 0);
        board.fill(0);
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
