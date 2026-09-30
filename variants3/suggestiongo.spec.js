// SUGGESTIONGO — 暗示碁: 空点に「暗示」をかけると、相手はその点に置きたくなる (置くと宣言者に1アゲハマ)
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
const ST_INIT = `{ sug: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
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
    file: 'suggestiongo.html',
    en: 'SUGGESTIONGO',
    jp: '暗示碁',
    prefix: 'suggestiongo',
    desc: '空点に暗示をかける。相手がそこに置くと暗示が功を奏し宣言者に1アゲハマ。',
    kind: 'stone',
    icon: 'suggestiongo',
    spec: [
        ...K.rb('SUGGESTIONGO', '暗示碁', 'suggestiongo'),
        ...ST(ST_INIT),
        // 暗示の成就: 相手が自分の暗示の点に打つと、宣言者に1アゲハマ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (st.sug[opponent] === pi) {
                st.sug[opponent] = -1;
                captures[opponent]++;
                fxText(pi, '暗示が効いた!', '#c084fc', 1400);
            }
            turn = opponent;`],
        // 「暗示」ボタン: 次のクリックの空点に暗示をかける
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnSug" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-purple-500/50 text-purple-600 rounded-xl hover:bg-purple-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                暗示
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnSug = document.getElementById('btnSug');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnSug.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            updateUI();
        });`],
        // 暗示モード中のクリック → 空点に暗示をかける
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;
            if (st.armed[turn] && !gameOver && gamePhase === 'playing') {
                const gx = Math.round((anchor.x - padding) / cellSize);
                const gy = Math.round((anchor.y - padding) / cellSize);
                if (gx >= 0 && gx < BOARD_SIZE && gy >= 0 && gy < BOARD_SIZE
                    && board[gy * BOARD_SIZE + gx] === 0) {
                    st.sug[turn] = gy * BOARD_SIZE + gx;
                    st.armed[turn] = false;
                    render(); updateUI();
                }
                return;
            }`],
        // 暗示の点を紫色の螺旋印で示す
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                if (st.sug[w] >= 0) {
                    const cx = padding + (st.sug[w] % BOARD_SIZE) * cellSize;
                    const cy = padding + ((st.sug[w] / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(192,132,252,0.85)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                    ctx.beginPath();
                    for (let t = 0; t <= Math.PI * 3; t += 0.25) {
                        const r = cellSize * 0.34 * t / (Math.PI * 3);
                        const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
                        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            })`),
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '暗示の点をクリック' : st.sug[turn] >= 0 ? '暗示をかけた' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            暗示碁: 「暗示」ボタンで空点に暗示をかける。相手がその点に打つと宣言者に1アゲハマ<br>
            PC: 暗示→クリックで宣言 / 通常クリックで着手<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「暗示」ボタンで盤上の空点を1つ暗示としてかけられる (効くまで持続)。',
            '相手がその点に着手すると暗示が功を奏し、宣言者に1アゲハマが入る。',
            '相手の欲しい点を読んで暗示をかける心理戦。双方1つずつ暗示を持てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.sug = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        const B = BOARD_SIZE;
        st.sug[1] = 6 * B + 6; // 黒が(6,6)に暗示
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 6, y: 6 }] }, 2); // 白が暗示の点へ
        assert('暗示が効いて宣言者にアゲハマ', captures[1] === 1);
        assert('暗示は消費される', st.sug[1] === -1);
        st.sug[2] = 3 * B + 3;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 黒が白の暗示の点へ
        assert('白の暗示も効く', captures[2] === 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
    `,
};
