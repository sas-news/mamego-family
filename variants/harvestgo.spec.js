// HARVESTGO — 収穫碁: 季節が巡り、実りの区域に多く石を持つ側が収穫点を得る
const K = require('../gen_kit.js');
module.exports = {
    file: 'harvestgo.html',
    en: 'HARVESTGO',
    jp: '収穫碁',
    prefix: 'harvestgo',
    desc: '12手ごとに季節が巡り、実りの象限で石が多い側が収穫点を得る。先に4点で豊作勝ち。',
    kind: 'stone',
    icon: 'harvestgo',
    spec: [
        ...K.rb('HARVESTGO', '収穫碁', 'harvestgo'),
        K.params([
            { key: 'season_len', label: '季節の長さ', min: 4, max: 30, def: 12, step: 2, unit: '手' },
            { key: 'harvest_win', label: '豊作勝ちに必要な収穫点', min: 2, max: 10, def: 4, unit: '点' },
            { key: 'cap_moves', label: '打ち切り手数', min: 50, max: 500, def: 140, step: 10, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { score: { 1: 0, 2: 0 } }; // 収穫点`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { score: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { score: { 1: 0, 2: 0 } };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { score: { 1: 0, 2: 0 } };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { score: { 1: 0, 2: 0 } };`],
        // 季節・象限の定義
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        const SEASONS = ['春', '夏', '秋', '冬'];
        function ripeQuadrant(season) { return season % 4; } // 0:左上 1:右上 2:右下 3:左下
        function quadrantOf(x, y) {
            const mid = (BOARD_SIZE - 1) / 2;
            if (x <= mid && y <= mid) return 0;
            if (x > mid && y <= mid) return 1;
            if (x > mid && y > mid) return 2;
            return 3;
        }
        function currentSeason() { return Math.floor(history.length / Math.max(1, P('season_len') || 12)); }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 収穫: 12手ごとに実りの象限で石が多い側が1点 (同数なら両方に)
            if (history.length > 0 && history.length % Math.max(1, P('season_len') || 12) === 0) {
                const q = ripeQuadrant(currentSeason() - 1);
                let c1 = 0, c2 = 0;
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        if (quadrantOf(x, y) !== q) continue;
                        const v = board[y * BOARD_SIZE + x];
                        if (v === 1) c1++; else if (v === 2) c2++;
                    }
                }
                if (c1 > c2) st.score[1]++;
                else if (c2 > c1) st.score[2]++;
                else if (c1 > 0) { st.score[1]++; st.score[2]++; }
                const mx = (q === 1 || q === 2) ? Math.floor(BOARD_SIZE * 0.75) : Math.floor(BOARD_SIZE * 0.25);
                const my = (q >= 2) ? Math.floor(BOARD_SIZE * 0.75) : Math.floor(BOARD_SIZE * 0.25);
                fxText(my * BOARD_SIZE + mx, '収穫!', '#eab308', 1200);
                if (st.score[1] >= (P('harvest_win') || 4) || st.score[2] >= (P('harvest_win') || 4)) {
                    const w = st.score[1] >= (P('harvest_win') || 4) ? 1 : 2;
                    winByRule(w, '豊作勝ち', '収穫点が4点に達しました'); return;
                }
            }

            // 打ち切り終局
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        // 実りの象限を金色に染める
        K.CUE_STARS(`            // 実りの象限を金色で染める
            {
                const q = ripeQuadrant(currentSeason());
                const mid = (BOARD_SIZE - 1) / 2;
                const x0 = (q === 1 || q === 2) ? mid + 1 : 0;
                const y0 = q >= 2 ? mid + 1 : 0;
                const w = (q === 1 || q === 2) ? BOARD_SIZE - mid - 1 : mid + 1;
                const h = q >= 2 ? BOARD_SIZE - mid - 1 : mid + 1;
                ctx.save();
                ctx.fillStyle = 'rgba(234,179,8,0.12)';
                ctx.fillRect(padding + x0 * cellSize, padding + y0 * cellSize, w * cellSize, h * cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`SEASONS[currentSeason() % 4] + ' ' + st.score[1] + '-' + st.score[2]`),
        [K.ONE, K.INFO_BASE, `            収穫碁: 季節ごとに実りの象限が回り、石が多い側が収穫点を得る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '12手ごとに季節が進み、金色に染まる象限 (左上→右上→右下→左下と巡回) で石が多い側が収穫点+1。同数なら両者に点。',
            '収穫点が先に4点で豊作勝ち。普通の地取り勝負と並行するので、どの季節にどの象限を取るかが鍵。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { score: { 1: 0, 2: 0 } };
        assert('季節0から', currentSeason() === 0);
        assert('春の実りは左上', ripeQuadrant(0) === 0);
        board[1 * BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE + 2] = 1; board[0 * BOARD_SIZE + 1] = 1;
        board[1 * BOARD_SIZE + (BOARD_SIZE - 2)] = 2; // 右上の白は今季関係なし
        for (let i = 0; i < 11; i++) history.push({ turn: 1 });
        executeMove({ cells: [{ x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 }] }, 2); // 12手目で収穫
        assert('黒が収穫点を得る', st.score[1] === 1 && st.score[2] === 0);
        board.fill(0); st.score = { 1: 3, 2: 0 }; history.length = 0; gameOver = false;
        board[0 * BOARD_SIZE + (BOARD_SIZE - 2)] = 1; // 次の実り象限(右上)に黒
        for (let i = 0; i < 11; i++) history.push({ turn: 1 });
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1); // 12手目で収穫 → 4点目
        assert('4点で豊作勝ち', gameOver === true && gameResultData && gameResultData.title.includes('豊作'));
    `,
};
