// EVACGO — 避難碁: 10手ごとに災害波が半盤を襲う。孤立石は消え、連携する石と避難所脇の石は残る
const K = require('../gen_kit.js');
module.exports = {
    file: 'evacgo.html',
    en: 'EVACGO',
    jp: '避難碁',
    prefix: 'evacgo',
    desc: '10手ごとに災害波が盤の半分を襲う。孤立した石は飲まれ、繋がった石と避難所脇の石は生き残る。',
    kind: 'stone',
    icon: 'evacgo',
    spec: [
        ...K.rb('EVACGO', '避難碁', 'evacgo'),
        K.params([
            { key: 'wave_interval', label: '災害波の間隔', min: 4, max: 40, def: 10, unit: '手' },
            { key: 'ply_cap', label: '打ち切り手数', min: 60, max: 600, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { lost: { 1: 0, 2: 0 } }; // 災害で失った石の数`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { lost: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { lost: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { lost: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { lost: { 1: 0, 2: 0 } };`],
        // 避難所の定義: 盤の上端中央と下端中央
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function shelterCells() {
            const mid = Math.floor(BOARD_SIZE / 2);
            return [mid, (BOARD_SIZE - 1) * BOARD_SIZE + mid];
        }
        function inWaveHalf(idx, topHalf) {
            const y = Math.floor(idx / BOARD_SIZE);
            return topHalf ? y <= Math.floor((BOARD_SIZE - 1) / 2) : y > Math.floor((BOARD_SIZE - 1) / 2);
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 災害波: 10手ごとに盤の半分を舐める — 孤立石は飲まれる
            const wi = Math.max(1, P('wave_interval') || 10);
            if (history.length > 0 && history.length % wi === 0) {
                const waveNo = Math.floor(history.length / wi);
                const topHalf = waveNo % 2 === 1; // 奇数回は上半分、偶数回は下半分
                const shel = shelterCells();
                const gone = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    if (!inWaveHalf(i, topHalf)) continue;
                    const nbs = getNeighbors(i);
                    const hasFriend = nbs.some(n => board[n] === board[i]);
                    const hasShelter = nbs.some(n => shel.includes(n));
                    if (!hasFriend && !hasShelter) gone.push(i);
                }
                gone.forEach(i => {
                    st.lost[board[i]]++;
                    board[i] = 0;
                    fxBurst(i, '#f97316', 8, 1.5);
                });
                if (gone.length > 0) {
                    fxText(gone[0], '災害 -' + gone.length, '#f97316', 1300);
                    fxShake(6, 400);
                    cleanUpPieces();
                }
            }

            // 打ち切り終局
            if (history.length >= Math.max(1, P('ply_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 避難所と次の波域の描画
        K.CUE_STARS(`            // 避難所 (緑の屋敷) と次に襲う半盤の警告色
            {
                const mid = Math.floor(BOARD_SIZE / 2);
                const nextWave = Math.floor(history.length / Math.max(1, P('wave_interval') || 10)) + 1;
                const topNext = nextWave % 2 === 1;
                const horizon = Math.floor((BOARD_SIZE - 1) / 2);
                ctx.save();
                ctx.fillStyle = 'rgba(249,115,22,0.08)';
                if (topNext) ctx.fillRect(padding, padding, BOARD_SIZE * cellSize, (horizon + 1) * cellSize);
                else ctx.fillRect(padding, padding + (horizon + 1) * cellSize, BOARD_SIZE * cellSize, (BOARD_SIZE - horizon - 1) * cellSize);
                ctx.restore();
                shelterCells().forEach(si => {
                    const sx = si % BOARD_SIZE, sy = Math.floor(si / BOARD_SIZE);
                    const cx = padding + sx * cellSize, cy = padding + sy * cellSize;
                    ctx.save();
                    ctx.fillStyle = 'rgba(34,197,94,0.85)';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.3, cy + cellSize * 0.25);
                    ctx.lineTo(cx, cy - cellSize * 0.32);
                    ctx.lineTo(cx + cellSize * 0.3, cy + cellSize * 0.25);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillRect(cx - cellSize * 0.2, cy, cellSize * 0.4, cellSize * 0.28);
                    ctx.restore();
                });
            }`),
        ...K.EVENT_CHIP_SPEC(`'被災 ' + st.lost[1] + '-' + st.lost[2]`),
        [K.ONE, K.INFO_ALGO, `            避難碁: 10手ごとに災害波が半盤を襲う — 孤立石は飲まれる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '10手ごとに災害波が盤の半分 (交互に上→下) を襲い、その半分で孤立した石 (味方も避難所も隣に無い) は全て消える。',
            '石を繋げておくか、上下中央の緑の避難所の隣に置けば生き残る。災害で消えた石はアゲハマにならない。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { lost: { 1: 0, 2: 0 } };
        const mid = Math.floor(BOARD_SIZE / 2);
        assert('避難所は2箇所', shelterCells().length === 2);
        board[0 * BOARD_SIZE + 0] = 1; // 上半分の孤立黒石
        board[0 * BOARD_SIZE + (mid - 1)] = 2; // 上端避難所の隣の白石 → 生存
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = 2; // 下半分の白石 → 今回の波域外
        board[1 * BOARD_SIZE + 2] = 1; board[1 * BOARD_SIZE + 3] = 1; // 連携した黒 → 生存
        for (let i = 0; i < 9; i++) history.push({ turn: 1 });
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 2); // 白の着手 → 10手目で波
        assert('孤立石は飲まれる', board[0] === 0 && st.lost[1] === 1);
        assert('避難所脇は残る', board[mid - 1] === 2);
        assert('波域外・連携石は残る', board[(BOARD_SIZE - 1) * BOARD_SIZE] === 2 && board[BOARD_SIZE + 2] === 1);
    `,
};
