// PHOTOSYNTHESISGO — 光合成碁: 石は葉。中央の日当たり区域に石を置くと養分(ボーナス)を作る
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
    file: 'photosynthesisgo.html',
    en: 'PHOTOSYNTHESISGO',
    jp: '光合成碁',
    prefix: 'photosynthesisgo',
    desc: '石は葉。盤中央の日当たり区域に石が1手留まるたび養分+1目を得る。',
    kind: 'stone',
    icon: 'photosynthesisgo',
    spec: [
        ...K.rb('PHOTOSYNTHESISGO', '光合成碁', 'photosynthesisgo'),
        K.params([{ key: 'sun_edge', label: '日当たり区域の内側幅', min: 0, max: 5, def: 2, unit: '列' }, { key: 'leaf_pts', label: '葉1枚の養分', min: 1, max: 4, def: 1, unit: '目' }, { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 400, def: 150, unit: '手' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { bonus: { 1: 0, 2: 0 } };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 光合成: 中央の日当たり区域 (辺から2列以内の内側) にある自分の石が養分を作る
            {
                const EDGE = Math.max(0, P('sun_edge') || 2);
                let leaves = 0;
                board.forEach((v, i) => {
                    if (v !== player) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    if (x >= EDGE && x < BOARD_SIZE - EDGE && y >= EDGE && y < BOARD_SIZE - EDGE) leaves++;
                });
                if (leaves > 0) {
                    st.bonus[player] += leaves * (P('leaf_pts') || 1);
                    if (leaves >= 3) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '光合成 +' + (leaves * (P('leaf_pts') || 1)) + '目', '#84cc16', 1000);
                }
            }

            turn = opponent;`],
        // 日当たり区域: 内側を淡い陽光色に染める
        K.CUE_GRID(`            // 日当たり: 中央区域を淡い陽光色で染める
            {
                const EDGE = Math.max(0, P('sun_edge') || 2);
                const x0 = padding + EDGE * cellSize - cellSize / 2;
                const y0 = padding + EDGE * cellSize - cellSize / 2;
                const w = (BOARD_SIZE - EDGE * 2) * cellSize;
                ctx.save();
                const sun = ctx.createRadialGradient(
                    padding + (BOARD_SIZE - 1) * cellSize / 2, padding + (BOARD_SIZE - 1) * cellSize / 2, cellSize,
                    padding + (BOARD_SIZE - 1) * cellSize / 2, padding + (BOARD_SIZE - 1) * cellSize / 2, w);
                sun.addColorStop(0, 'rgba(253,224,71,0.28)');
                sun.addColorStop(1, 'rgba(253,224,71,0.06)');
                ctx.fillStyle = sun;
                ctx.fillRect(x0, y0, w, w);
                ctx.restore();
            }`),
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + st.bonus[1];
            const whiteTotal = territory.white + captures[2] + komi + st.bonus[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の養分:</span> <strong>\${st.bonus[1]}目</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の養分:</span> <strong>\${st.bonus[2]}目</strong></div>`],
        ...K.EVENT_CHIP_SPEC(`'養分 +' + st.bonus[turn] + '目'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            光合成碁: 中央の日当たり区域の石が1手ごとに養分+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央は日当たりのよい圃場。そこに葉(石)がある限り、自分の着手ごとに養分+1目ずつ溜まる。',
            '日陰(外側2列)の石は養分を作らない。中央を守りつつ敵の葉を刈り取れ。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const E2 = 2;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { bonus: { 1: 0, 2: 0 } };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 日当たり区域
        assert('日当たりで養分+1', st.bonus[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2); // 白: 日陰
        assert('日陰は養分なし', st.bonus[2] === 0);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 黒: 葉2枚
        assert('葉2枚で+2', st.bonus[1] === 3);
        board.fill(0); st = { bonus: { 1: 0, 2: 0 } };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
