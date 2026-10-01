// BLINDSPOTGO — 盲点碁: 双方に1つずつ盲点があり、その点の敵石は盤の視界から消える
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
const ST_INIT = `{ spot: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
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
module.exports = {
    file: 'blindspotgo.html',
    en: 'BLINDSPOTGO',
    jp: '盲点碁',
    prefix: 'blindspotgo',
    desc: '双方に1つずつ盲点を設定。その点の敵石は視界から消え、取りの判定にも効く。',
    kind: 'stone',
    icon: 'blindspotgo',
    spec: [
        ...K.rb('BLINDSPOTGO', '盲点碁', 'blindspotgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        ...ST(ST_INIT),
        // 盲点の石は取り判定・窒息判定の対象外 (視界から消える)
        [K.ONE, `            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {`,
`            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i] && i !== st.spot[1] && i !== st.spot[2]) {`],
        // 「盲点」ボタン: 次のクリックで自分の盲点を設定
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnSpot" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-violet-500/50 text-violet-600 rounded-xl hover:bg-violet-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                盲点
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnSpot = document.getElementById('btnSpot');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnSpot.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            updateUI();
        });`],
        // 盲点モード中のクリック → 自分の盲点を設定 (盲点は敵の石に見えない = 取り判定から抜ける)
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;
            if (st.armed[turn] && !gameOver && gamePhase === 'playing') {
                const gx = Math.round((anchor.x - padding) / cellSize);
                const gy = Math.round((anchor.y - padding) / cellSize);
                if (gx >= 0 && gx < BOARD_SIZE && gy >= 0 && gy < BOARD_SIZE) {
                    st.spot[turn] = gy * BOARD_SIZE + gx;
                    st.armed[turn] = false;
                    render(); updateUI();
                }
                return;
            }`],
        // 盲点の罠: 取った石が相手の盲点なら取った側は幻を見ていた — 石は残る (取り不能)
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                const hidden = captured.filter(i => i === st.spot[opponent]);
                captured = captured.filter(i => i !== st.spot[opponent]);
                if (hidden.length > 0) fxText(hidden[0], '盲点!', '#8b5cf6', 1300);
            }
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 自分の盲点を薄い印で示す (相手からは見えないはずだが、ローカル確認用に淡く)
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                if (st.spot[w] >= 0) {
                    const cx = padding + (st.spot[w] % BOARD_SIZE) * cellSize;
                    const cy = padding + ((st.spot[w] / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(139,92,246,0.45)';
                    ctx.setLineDash([cellSize * 0.1, cellSize * 0.1]);
                    ctx.lineWidth = Math.max(1.1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            })`),
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '盲点の点をクリック' : st.spot[turn] >= 0 ? '盲点設定済み' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            盲点碁: 「盲点」ボタンで盤上1点を盲点に設定。その点の敵石は取り判定から抜ける<br>
            PC: 盲点→クリックで設定 / 通常クリックで着手<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「盲点」ボタンで盤上の1点を自分の盲点に設定できる (いつでも付け替え可)。',
            '盲点の点にある敵石は視界から消える — 囲んでも取ることができない。',
            '盲点は盤上に淡い印で示される。敵の要害を守る鍵点を盲点に読み合う。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.spot = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        const B = BOARD_SIZE;
        board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1;
        st.spot[2] = 4 * B + 4; // 白の盲点: (4,4)
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('盲点の敵石は取れない', board[4 * B + 4] === 2 && captures[1] === 0);
        st.spot[2] = -1;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1); // 盲点解除 → 0呼吸の白石は即取られる
        assert('盲点がなければ取れる', board[4 * B + 4] === 0 && captures[1] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
