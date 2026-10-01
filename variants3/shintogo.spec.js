// SHINTOGO — 神道碁: 自分の石が環状の神域(3x3の枠)を完成させると注連縄が張られ聖域点を得る
const K = require('../gen_kit.js');
module.exports = {
    file: 'shintogo.html',
    en: 'SHINTOGO',
    jp: '神道碁',
    prefix: 'shintogo',
    desc: '自石で3x3の環 (神域の注連縄) を張ると聖域点。3ヶ所の聖域で鎮座勝ち。',
    kind: 'stone',
    icon: 'shintogo',
    spec: [
        ...K.rb('SHINTOGO', '神道碁', 'shintogo'),
        K.params([
            { key: 'shrine_need', label: '鎮座に必要な聖域数', min: 1, max: 6, def: 3, unit: 'ヶ所' },
            { key: 'move_cap', label: '打ち切り手数', min: 60, max: 280, def: 140, step: 10, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { shrines: { 1: 0, 2: 0 }, rings: [] }; // 聖域数と張られた注連縄`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { shrines: { 1: 0, 2: 0 }, rings: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { shrines: { 1: 0, 2: 0 }, rings: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { shrines: { 1: 0, 2: 0 }, rings: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { shrines: { 1: 0, 2: 0 }, rings: [] };`],
        // 環判定: 3x3の8枠マスが全て自石
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        function shintoRingAt(cx, cy, player) {
            if (cx <= 0 || cy <= 0 || cx >= BOARD_SIZE - 1 || cy >= BOARD_SIZE - 1) return null;
            const ring = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const i = (cy + dy) * BOARD_SIZE + (cx + dx);
                    if (board[i] !== player) return null;
                    ring.push(i);
                }
            }
            return ring;
        }

        function isValidPlacement(cells, player) {`],
        [K.ONE, '        function endGameByScore() {', K.WIN_BY_RULE_FN + `
        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 聖域化: 打った石を含む3x3の環が完成すると注連縄が張られる
            {
                const li = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const lx = move.cells[0].x, ly = move.cells[0].y;
                let done = false;
                for (let cy = ly - 1; cy <= ly + 1 && !done; cy++) {
                    for (let cx = lx - 1; cx <= lx + 1 && !done; cx++) {
                        const ring = shintoRingAt(cx, cy, player);
                        if (ring) {
                            const key = ring.slice().sort((a, b) => a - b).join(',');
                            if (!st.rings.includes(key)) {
                                st.rings.push(key);
                                st.shrines[player]++;
                                ring.forEach(i => fxGlow(i, '#f87171', 900));
                                fxText(cy * BOARD_SIZE + cx, '注連縄!', '#f87171', 1200);
                                if (st.shrines[player] >= (P('shrine_need') || 3)) {
                                    winByRule(player, '鎮座勝ち', '神域を' + (P('shrine_need') || 3) + 'ヶ所聖域化しました'); return;
                                }
                            }
                            done = true;
                        }
                    }
                }
            }

            // 打ち切り終局
            if (history.length >= (P('move_cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        [K.ONE, K.INFO_ALGO, `            神道碁: 自石で3x3の環を張ると聖域点。3ヶ所で鎮座勝ち<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で3x3の環 (中央を除く8マス) を完成させると注連縄が張られ、聖域点+1。同じ環は一度だけ数える。',
            '先に3ヶ所の神域を聖域化した側が鎮座勝ち。環は崩されると二度と同じ形では数えない。',
            '打ち切り: 140手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { shrines: { 1: 0, 2: 0 }, rings: [] };
        // 3x3の環を7マス埋めておく (中央(4,4)を囲む)
        [[3, 3], [4, 3], [5, 3], [3, 4], [5, 4], [3, 5], [4, 5]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        assert('未だ環は完成していない', shintoRingAt(4, 4, 1) === null);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1); // 8マス目を打つ
        assert('環が完成して聖域点', st.shrines[1] === 1 && st.rings.length === 1);
        assert('同じ環は二度数えない', (executeMove({ cells: [{ x: 0, y: 0 }] }, 1), st.shrines[1] === 1));
        st.shrines[1] = 2;
        [[7, 7], [8, 7], [9, 7], [7, 8], [9, 8], [7, 9], [8, 9]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 1; });
        executeMove({ cells: [{ x: 9, y: 9 }] }, 1);
        assert('3ヶ所目で鎮座勝ち', gameOver === true && gameResultData && gameResultData.title.includes('鎮座'));
    `,
};
