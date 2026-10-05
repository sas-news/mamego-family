// RIMMEDGO — 覆輪碁: 4個置くごとに石に縁取りが付く。縁同士が隣接すると結合し、一度だけ取りを耐える
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
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
const ST_INIT = `{ placed: { 1: 0, 2: 0 }, rims: {} }`;
module.exports = {
    file: 'rimmedgo.html',
    en: 'RIMMEDGO',
    jp: '覆輪碁',
    prefix: 'rimmedgo',
    desc: '4個置くごとに石に縁取りが付く。縁同士が隣接して結合した石は一度だけ取りを耐える。',
    kind: 'stone',
    icon: 'rimmedgo',
    spec: [
        ...K.rb('RIMMEDGO', '覆輪碁', 'rimmedgo'),
        K.params([
            { key: 'rim_interval', label: '縁の付く間隔', min: 1, max: 12, def: 4, unit: '個置き' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 4個毎に縁取りが付く
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                board[p.y * BOARD_SIZE + p.x] = player;
            });
            // 覆輪: 一定数置くごとに今置いた石に縁取りが付く
            st.placed[player]++;
            if (st.placed[player] % Math.max(1, P('rim_interval') || 4) === 0) {
                const li = move.cells[move.cells.length - 1].y * BOARD_SIZE + move.cells[move.cells.length - 1].x;
                st.rims[li] = true;
                fxGlow(li, '#fbbf24', 900);
            }`],
        // 結合した縁の石は取りを一度だけ耐える (縁が壊れる)
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            // 縁取り同士が隣接して結合した石は一度だけ取りを耐える (縁が壊れる)
            const saved = captured.filter(i =>
                st.rims[i] && getNeighbors(i).some(n => board[n] === opponent && st.rims[n]));
            saved.forEach(i => { delete st.rims[i]; fxText(i, '縁が砕けた', '#fbbf24', 900); });
            captured = captured.filter(i => !saved.includes(i));
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 取られた/消えた石の縁を掃除
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 縁の掃除: 盤上に無い石の縁を除去
            Object.keys(st.rims).forEach(k => { if (board[+k] !== 1 && board[+k] !== 2) delete st.rims[k]; });

            turn = opponent;`],
        // 縁取りマーク
        ...K.STONE_MARKS_SPEC(`
            Object.keys(st.rims).forEach(k => {
                const i = +k;
                if (board[i] !== 1 && board[i] !== 2) return;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.07);
                ctx.beginPath();
                ctx.arc(mx, my, cellSize * 0.36, 0, Math.PI * 2);
                ctx.stroke();
            });`),
        ...K.EVENT_CHIP_SPEC(`'縁 ' + Object.keys(st.rims).length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            覆輪碁: 4個置く毎に今の石に縁取り。隣接する縁同士が結合し、その石は一度だけ取りを耐える<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分が4個置くごとに、今置いた石に金色の縁取りが付く。',
            '縁取りの石同士が隣接すると結合: 結合した石は取られそうになっても一度だけ耐える (縁が砕ける)。',
            '縁を残す配置と結合のタイミングが駆け引き。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.placed = { 1: 3, 2: 0 }; st.rims = {};
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('4個目に縁が付く', st.rims[5 * BOARD_SIZE + 5] === true);
        // 隣にも縁付きの石を置く (手動で縁を付与して結合状態に)
        board[5 * BOARD_SIZE + 6] = 1; st.rims[5 * BOARD_SIZE + 6] = true;
        // 結合した2石を完全に囲む
        [[4, 5], [5, 4], [5, 6], [7, 5], [6, 4], [6, 6]].forEach(([x, y]) => { board[y * BOARD_SIZE + x] = 2; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('結合した縁石は耐える', board[5 * BOARD_SIZE + 5] === 1 && board[5 * BOARD_SIZE + 6] === 1);
        assert('縁は砕けた', !st.rims[5 * BOARD_SIZE + 5] && !st.rims[5 * BOARD_SIZE + 6]);
    `,
};
