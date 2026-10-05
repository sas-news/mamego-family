// CRISISGO — 危機碁: アゲハマで劣勢の側は1回だけ「捨身の一手」(2連続着手) が使える
const K = require('../gen_kit.js');

const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

module.exports = {
    file: 'crisisgo.html',
    en: 'CRISISGO',
    jp: '危機碁',
    prefix: 'crisisgo',
    desc: '劣勢の側は1回だけ「捨身の一手」で2連続着手できる。',
    kind: 'rush',
    icon: 'crisisgo',
    spec: [
        ...K.rb('CRISISGO', '危機碁', 'crisisgo'),
        K.params([
            { key: 'deficit_min', label: '捨身に必要なアゲハマ差', min: 1, max: 10, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 1.1 },
        ]),
        ...PERSIST('{ used: { 1: false, 2: false }, arm: { 1: false, 2: false } }'),
        // 捨身ボタン: 劣勢 (アゲハマが相手より少ない) 側のみ使用可・1局1回
        [K.ONE, `            <button id="btnResign" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm">
                投了
            </button>`,
`            <button id="btnResign" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-red-500/50 text-red-600 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all shadow-sm">
                投了
            </button>
            <button id="btnDesperate" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/60 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                捨身
            </button>`],
        [K.ONE, `        btnResign.addEventListener('click', handleResign);`,
`        btnResign.addEventListener('click', handleResign);
        const btnDesperate = document.getElementById('btnDesperate');
        if (btnDesperate) btnDesperate.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            const foe = turn === 1 ? 2 : 1;
            if (st.used[turn] || st.arm[turn]) return;
            if (captures[turn] + (P('deficit_min') || 1) > captures[foe]) return; // 劣勢限定
            st.arm[turn] = true;
            const ci = lastMove ? lastMove.cells[0].y * BOARD_SIZE + lastMove.cells[0].x : 0;
            fxText(ci, '捨身!', '#f59e0b', 1000);
            updateUI();
            saveState();
        });`],
        // 武装中の着手は手番を渡さない (2連続着手)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 捨身: 宣言済みならこの着手は手番を消費しない (同一プレイヤーが続けて打つ)
            let grantExtra = false;
            if (st.arm[player]) {
                st.arm[player] = false;
                st.used[player] = true;
                grantExtra = true;
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '捨身の一手!', '#f59e0b', 1000);
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = grantExtra ? player : opponent;`],
        [K.ONE, K.UI_TAIL, `            const btnDesperateEl = document.getElementById('btnDesperate');
            if (btnDesperateEl) {
                const foe2 = turn === 1 ? 2 : 1;
                const eligible = !st.used[turn] && !st.arm[turn] && captures[turn] + (P('deficit_min') || 1) <= captures[foe2]
                    && !gameOver && gamePhase === 'playing' && isMyTurn();
                btnDesperateEl.disabled = !eligible;
                btnDesperateEl.title = st.used[turn] ? '捨身は使用済み' : 'アゲハマで劣勢の時だけ使える2連続着手';
            }
            btnUndo.disabled = !canUndo();
            updatePieceTrayUI();
            render();
        }`],
        ...K.EVENT_CHIP_SPEC(`st.arm[turn] ? '捨身発動中' : (st.used[turn] ? '捨身済' : (captures[turn] + (P('deficit_min') || 1) <= captures[turn === 1 ? 2 : 1] ? '捨身可' : ''))`),
        [K.ONE, K.RV_BASE, K.rv([
            'アゲハマで劣勢の側は「捨身」ボタンで1回だけ特別な手番を得られる。',
            '宣言した手番の着手後にもう1手続けて打てる (2連続着手)。各プレイヤー1局1回。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.arm = { 1: false, 2: false };
        captures[1] = 0; captures[2] = 3; // 黒が劣勢
        st.arm[1] = true;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('捨身で黒が連続番', turn === 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('2手目後は白番', turn === 2);
        assert('捨身は消費済み', st.used[1] === true && st.arm[1] === false);
    `,
};
