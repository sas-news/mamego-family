// WISHGO — 流星碁: 願いボタンで宣言した点に相手が打つと流星が落ち、願いが叶う (宣言者の石になる)
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
const ST_INIT = `{ wish: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
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
    file: 'wishgo.html',
    en: 'WISHGO',
    jp: '流星碁',
    prefix: 'wishgo',
    desc: '願いの点に相手が打つと流星が落ちて願いが叶い、その石は宣言者のものになる。',
    kind: 'stone',
    icon: 'wishgo',
    spec: [
        ...K.rb('WISHGO', '流星碁', 'wishgo'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 流星: 相手が自分の願いの点に打つと、その石は宣言者の石になる (相手は1手失う)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false;
            // 願いの成就: この着手が宣言者の願いの点なら石は宣言者のものに
            const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
            if (st.wish[opponent] === pi) {
                board[pi] = opponent;
                st.wish[opponent] = -1;
                fxText(pi, '願いが叶った!', '#facc15', 1500);
                fxBurst(pi, '#facc15', 10, 1.4);
                cleanUpPieces();
            }
            turn = opponent;`],
        // 「願い」ボタン: 次のクリックを願いの点として宣言
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnWish" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-yellow-500/50 text-yellow-600 rounded-xl hover:bg-yellow-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                願い
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnWish = document.getElementById('btnWish');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnWish.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            updateUI();
        });`],
        // 願いモード中のクリック → 点を宣言
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;
            if (st.armed[turn] && !gameOver && gamePhase === 'playing') {
                const gx = Math.round((anchor.x - padding) / cellSize);
                const gy = Math.round((anchor.y - padding) / cellSize);
                if (gx >= 0 && gx < BOARD_SIZE && gy >= 0 && gy < BOARD_SIZE
                    && board[gy * BOARD_SIZE + gx] === 0) {
                    st.wish[turn] = gy * BOARD_SIZE + gx;
                    st.armed[turn] = false;
                    render(); updateUI();
                }
                return;
            }`],
        // 自分の願いの点に金色の星を描く
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(w => {
                if (st.wish[w] >= 0) {
                    const cx = padding + (st.wish[w] % BOARD_SIZE) * cellSize;
                    const cy = padding + ((st.wish[w] / BOARD_SIZE) | 0) * cellSize;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(250,204,21,0.85)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.beginPath();
                    for (let a = 0; a < 4; a++) {
                        const ang = a * Math.PI / 2 + Math.PI / 4;
                        ctx.moveTo(cx + Math.cos(ang) * cellSize * 0.1, cy + Math.sin(ang) * cellSize * 0.1);
                        ctx.lineTo(cx + Math.cos(ang) * cellSize * 0.32, cy + Math.sin(ang) * cellSize * 0.32);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            })`),
        ...K.EVENT_CHIP_SPEC(`st.armed[turn] ? '願いの点をクリック' : st.wish[turn] >= 0 ? '願い宣言済み' : ''`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            流星碁: 「願い」ボタンで宣言した点に相手が打つと流星が落ち、その石は宣言者のものになる<br>
            PC: 願い→クリックで宣言 / 通常クリックで着手<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「願い」ボタンで盤上の空点を1つ宣言しておける (願い)。願いは成就するまで持続。',
            '相手がその点に着手した瞬間、流星が落ちてその石は宣言者の石に変わる — 相手は1手を失う。',
            '相手の利きそうな筋に願いを張る罠と読み合い。双方とも1つずつ願いを持てる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.wish = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        const B = BOARD_SIZE;
        st.wish[1] = 7 * B + 7; // 黒が(7,7)に願い
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1); // 黒の普通の手
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2); // 白が願いの点へ → 流星
        assert('願いが叶い石は宣言者のもの', board[7 * B + 7] === 1);
        assert('願いは消費される', st.wish[1] === -1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('起動して通常着手可', isValidPlacement([{ x: 8, y: 8 }], 2) === true);
        st.wish[2] = 1 * B + 1;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1); // 黒が白の願いの点へ
        assert('白の願いも叶う', board[1 * B + 1] === 2);
    `,
};
