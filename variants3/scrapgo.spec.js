// SCRAPGO — 再資源碁: 取られた石は「スクラップ」として自分に還る。3個で「再生石」(2連)を錬成
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
const ST_INIT = `{ scrap: { 1: 0, 2: 0 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'scrapgo.html',
    en: 'SCRAPGO',
    jp: '再資源碁',
    prefix: 'scrapgo',
    desc: '取られた石はスクラップとして自分に還る。3個で2連「再生石」を錬成できる。',
    kind: 'stone',
    icon: 'scrapgo',
    spec: [
        ...K.rb('SCRAPGO', '再資源碁', 'scrapgo'),
        K.params([
            { key: 'scrap_cost', label: '再生石の錬成コスト', min: 1, max: 8, def: 3, unit: '個' },
        ]),
        ...ST(ST_INIT),
        // スクラップ: 取られた側がアゲハマの数だけ資材を得る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                st.scrap[opponent] += captured.length; // 取られた石はスクラップとして持ち主に還る
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 再生石: 錬成済みなら隣の空点にもう1石
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 再生石: 錬成済みなら隣の空点にもう1石 (生存可能な点のみ)
            if (st.armed[player]) {
                st.armed[player] = false;
                const si = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                for (const nb of getNeighbors(si)) {
                    if (board[nb] !== 0) continue;
                    board[nb] = player;
                    if (getCapturedStones(board, player).length === 0) {
                        pieces.push({ id: Date.now() + Math.random(), player, type: move.type, rot: move.rot, cells: [{ x: nb % BOARD_SIZE, y: Math.floor(nb / BOARD_SIZE) }] });
                        fxGlow(nb, '#a3e635', 700);
                        break;
                    }
                    board[nb] = 0;
                }
            }`],
        // 「再生石」ボタン (スクラップ3個)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnRecycle" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-lime-500/50 text-lime-600 rounded-xl hover:bg-lime-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                再生石 (3個)
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnRecycle = document.getElementById('btnRecycle');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnRecycle.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.armed[turn] || st.scrap[turn] < Math.max(1, P('scrap_cost') || 3)) return;
            st.scrap[turn] -= Math.max(1, P('scrap_cost') || 3);
            st.armed[turn] = true;
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`'スクラップ ' + (st.scrap[turn] || 0) + (st.armed[turn] ? ' 錬成待機' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            再資源碁: 取られた石はスクラップとして自分に還る。3個で2連「再生石」を錬成<br>
            PC: クリックで配置 / 「再生石」ボタンで錬成<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石が取られるたび、その数だけ「スクラップ」が貯まる (取られた側の補填)。',
            '「再生石」ボタン (3個): 次の着手で隣の空点にもう1石置ける (2連石)。',
            '取られるほど資材が増える敗者復活の経済。石を捨てて資材に換える戦略もあり。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.scrap = { 1: 0, 2: 0 }; st.armed = { 1: false, 2: false };
        // 白1石を囲んで取る → 白にスクラップ+1
        board[4 * BOARD_SIZE + 4] = 2;
        board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1; board[4 * BOARD_SIZE + 5] = 1;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1);
        assert('取られた側にスクラップ', st.scrap[2] === 1);
        // 再生石: 錬成済みの着手は2連
        st.scrap[2] = 3; st.armed[2] = true;
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('再生石は2連になる', board[9 * BOARD_SIZE + 9] === 2 && getNeighbors(9 * BOARD_SIZE + 9).some(n => board[n] === 2));
        assert('錬成フラグは消費される', st.armed[2] === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
