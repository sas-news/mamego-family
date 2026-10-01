// RESERVOIRGO — 貯水槽碁: 雨で水が貯まり、満水で下2段が氾濫。「かんがい」で自石に水を与えて守る
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
const ST_INIT = `{ water: 0, moist: {} }`;
module.exports = {
    file: 'reservoirgo.html',
    en: 'RESERVOIRGO',
    jp: '貯水槽碁',
    prefix: 'reservoirgo',
    desc: '着手ごとに水+1。満水(10)で下2段が氾濫して石が流される。「かんがい」で自石を守る。',
    kind: 'stone',
    icon: 'reservoirgo',
    spec: [
        ...K.rb('RESERVOIRGO', '貯水槽碁', 'reservoirgo'),
        K.params([
            { key: 'water_max', label: '満水になる水量', min: 4, max: 20, def: 10 },
            { key: 'flood_rows', label: '氾濫する段数', min: 1, max: 4, def: 2, unit: '段' },
            { key: 'irrigate_cost', label: 'かんがいに必要な水量', min: 1, max: 10, def: 3 },
            { key: 'moist_turns', label: '潤いの持続', min: 4, max: 30, def: 12, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 潤い石は取られない
        [K.ONE, K.CAPTURE_BLOCK, `            let captured = getCapturedStones(board, opponent);
            // 潤いのある石は吸収されて取られない
            captured = captured.filter(i => !(st.moist[i] && st.moist[i] >= history.length));
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 降雨・満水時の氾濫・潤い期限切れ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 降雨: 着手ごとに水+1。満水で下段が氾濫
            const wmax = Math.max(1, P('water_max') || 10);
            st.water = Math.min(wmax, st.water + 1);
            if (st.water >= wmax) {
                const victims = [];
                const rows = Math.max(1, P('flood_rows') || 2);
                for (let x = 0; x < BOARD_SIZE; x++) {
                    for (let r = 1; r <= rows; r++) {
                        const y = BOARD_SIZE - r;
                        if (y < 0) break;
                        const i = y * BOARD_SIZE + x;
                        if ((board[i] === 1 || board[i] === 2) && !(st.moist[i] && st.moist[i] >= history.length)) {
                            victims.push(i);
                        }
                    }
                }
                // 全滅防止: 盤上の石が全部流されるなら1個残す
                const total = board.filter(v => v === 1 || v === 2).length;
                const kept = victims.length >= total && victims.length > 0 ? [victims[0]] : [];
                victims.forEach(i => {
                    if (kept.includes(i)) return;
                    board[i] = 0;
                    fxBurst(i, '#38bdf8', 8, 1.4);
                });
                if (victims.length - kept.length > 0) {
                    const fy = (BOARD_SIZE - 1) * BOARD_SIZE;
                    fxText(fy, '氾濫!', '#38bdf8', 1400);
                    soundManager.playCapture();
                }
                st.water = 0;
                cleanUpPieces();
            }
            // 潤い期限切れ
            Object.keys(st.moist).forEach(k => { if (st.moist[k] < history.length) delete st.moist[k]; });

            turn = opponent;`],
        // 「かんがい」ボタン: 水3以上を全消費して自石全部に潤い (12手)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnWater" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-sky-500/50 text-sky-600 rounded-xl hover:bg-sky-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                かんがい
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnWater = document.getElementById('btnWater');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnWater.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.water < Math.max(1, P('irrigate_cost') || 3)) return;
            st.water = 0;
            const until = history.length + Math.max(1, P('moist_turns') || 12);
            board.forEach((v, i) => { if (v === turn) st.moist[i] = until; });
            render();
            updateUI();
        });`],
        // 潤い石に水滴マーク
        ...K.STONE_MARKS_SPEC(`
            Object.keys(st.moist).forEach(k => {
                const i = +k;
                if (st.moist[k] < history.length || (board[i] !== 1 && board[i] !== 2)) return;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.ellipse(mx, my - cellSize * 0.18, cellSize * 0.09, cellSize * 0.13, 0, 0, Math.PI * 2);
                ctx.fill();
            });`),
        ...K.EVENT_CHIP_SPEC(`'水量 ' + st.water + '/' + (P('water_max') || 10)`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            貯水槽碁: 着手毎に水が貯まり、満水で下2段が氾濫。「かんがい」で自石に潤いを与えて守る<br>
            PC: クリックで配置 / 「かんがい」=水3以上消費で自石に潤い12手<br>
            スマホ: 同様にボタン操作`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手ごとに貯水槽の水量が+1 (上限10)。満水になると盤の下2段が氾濫し、石が流される。',
            '「かんがい」: 水量3以上を全消費し、自分の全石に12手分の潤いを与える。',
            '潤いのある石は氾濫で流されず、取りにもならない (水滴マーク)。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.water = 0; st.moist = {};
        // 下2段に石を置き、水9で着手 → 氾濫で流される
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = 1; pieces.push({ p: 1, cells: [{ x: 0, y: BOARD_SIZE - 1 }] });
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 1] = 1; pieces.push({ p: 1, cells: [{ x: 1, y: BOARD_SIZE - 1 }] });
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 2] = 2; pieces.push({ p: 2, cells: [{ x: 2, y: BOARD_SIZE - 1 }] });
        st.water = 9;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('氾濫で下段の石が流れる', board[(BOARD_SIZE - 1) * BOARD_SIZE + 2] === 0);
        assert('水はリセット', st.water === 0);
        // 潤い石は流されない (石を戻して潤いを付与)
        board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = 1;
        st.moist[(BOARD_SIZE - 1) * BOARD_SIZE + 0] = history.length + 12;
        st.water = 10;
        executeMove({ cells: [{ x: 6, y: 5 }] }, 2);
        assert('潤い石は残る', board[(BOARD_SIZE - 1) * BOARD_SIZE + 0] === 1);
        assert('潤いなし石は流れる', board[(BOARD_SIZE - 1) * BOARD_SIZE + 1] === 0);
    `,
};
