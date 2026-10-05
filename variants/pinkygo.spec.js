// PINKYGO — 指切碁: 指切り(約束)を宣言した点に自分が打つと、その石が腐って相手のアゲハマになる
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ promise: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
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
    file: 'pinkygo.html',
    en: 'PINKYGO',
    jp: '指切碁',
    prefix: 'pinkygo',
    desc: '指切りを交わした点に打つと、その石が腐って相手のアゲハマになる。',
    kind: 'stone',
    icon: 'pinkygo',
    spec: [
        ...K.rb('PINKYGO', '指切碁', 'pinkygo'),
        K.params([{ key: 'rot_penalty', label: '指切り破りの代償', min: 1, max: 5, def: 1, unit: 'アゲハマ' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT),
        // 指切り破り: 自分が約束した点に打つと、その石が腐って相手のアゲハマになる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (st.promise[player] === pi) {
                    st.promise[player] = -1;
                    board[pi] = 0;
                    captures[opponent] += (P('rot_penalty') || 1);
                    fxText(pi, '指切り破り!', '#f472b6', 1300);
                    fxBurst(pi, '#f472b6', 9, 1.5);
                    cleanUpPieces();
                }
            }

            turn = opponent;`],
        // 「指切り」ボタン → 空点クリックで約束点を宣言
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnPinky" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-pink-500/50 text-pink-600 rounded-xl hover:bg-pink-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                指切り
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnPinky = document.getElementById('btnPinky');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 指切りモード: 空点をクリックして約束点を宣言 (手番は消費しない)
            if (st.armed[turn]) {
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                st.armed[turn] = false;
                if (gi >= 0 && gi < board.length && board[gi] === 0) {
                    st.promise[turn] = gi;
                    fxText(gi, 'ゆびきり!', '#f472b6', 1100);
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnPinky.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        // 約束点をピンクの糸マークで描く
        ...K.STONE_MARKS_SPEC(`            [1, 2].forEach(pl => {
                const pi = st.promise[pl];
                if (pi < 0) return;
                const cx = padding + (pi % BOARD_SIZE) * cellSize;
                const cy = padding + ((pi / BOARD_SIZE) | 0) * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(244,114,182,0.9)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - cellSize * 0.18, cy);
                ctx.lineTo(cx + cellSize * 0.18, cy);
                ctx.stroke();
                ctx.restore();
            });`),
        ...K.EVENT_CHIP_SPEC(`st.promise[turn] >= 0 ? '指切り中' : (st.armed[turn] ? '約束点を選択' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            指切碁: 「指切り」で約束点を宣言。自分がそこに打つと石が腐って相手のアゲハマになる<br>
            PC: クリックで配置 / 「指切り」ボタン→空点をクリックで宣言<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_BASE, K.rv([
            '「指切り」ボタン→空点をクリックで、その点に打たない約束 (指切り) を交わせる。',
            '自分が約束の点に打つと石が1つ腐り、相手のアゲハマになる。約束は1度破ると消える。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.promise = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        st.promise[1] = 5 * BOARD_SIZE + 5;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('約束の点に打つと石が腐る', board[5 * BOARD_SIZE + 5] === 0);
        assert('腐った石は相手のアゲハマ', captures[2] === 1);
        assert('約束は消費される', st.promise[1] === -1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('関係ない着手は通常通り', board[3 * BOARD_SIZE + 3] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
