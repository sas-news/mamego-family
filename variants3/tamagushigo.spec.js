// TAMAGUSHIGO — 玉串碁: 「玉串を奉奠」で1手使い任意の空点に石を奉納。奉納石は神宿り、その連は常に+1呼吸
const K = require('../gen_kit.js');
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
const ST_INIT = `{ sacred: [], pend: { 1: false, 2: false } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.9)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tamagushigo.html',
    en: 'TAMAGUSHIGO',
    jp: '玉串碁',
    prefix: 'tamagushigo',
    desc: '「玉串」で任意の空点に石を奉納 (連結不要)。奉納石を含む連は神宿り+1呼吸。',
    kind: 'stone',
    icon: 'tamagushigo',
    spec: [
        ...K.rb('TAMAGUSHIGO', '玉串碁', 'tamagushigo'),
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 奉納石 (st.sacred に idx が残る) を含む連は神宿りで+1呼吸
        function groupHasSacred(group) {
            return group.some(i => st.sacred.includes(i));
        }`],
        // 捕獲判定: 神宿りの連は+1呼吸
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                    }

                    if (!hasLiberty) {`,
`                    }
                    if (groupHasSacred(group)) liberties += 1; // 奉納石の神宿り

                    if (liberties <= 0) {`],
        // 「玉串を奉奠」ボタン: 押すと奉納モード → 空点クリックで奉納 (1手使う)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnTamagu" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-500/50 text-amber-600 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                玉串奉奠
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnTamagu = document.getElementById('btnTamagu');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        if (btnTamagu) btnTamagu.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.pend[turn] = !st.pend[turn];
            render();
            updateUI();
        });`],
        // 奉納モード中の着手は奉納石になる (盤上のクリックは通常着手と同じ経路 — 奉納フラグを見て印を付ける)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (st.pend[player]) {
                st.pend[player] = false;
                const si = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.sacred.push(si);
                fxGlow(si, '#fbbf24', 900);
                fxText(si, '奉奠', '#d97706', 1100);
            }

            turn = opponent;`],
        // 奉納石に榊の印を描く
        ...K.STONE_MARKS_SPEC(`            // 奉納石: 玉串の榊印 (小さな緑の葉)
            ctx.save();
            st.sacred.forEach(i => {
                if (board[i] !== 1 && board[i] !== 2) return;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.strokeStyle = 'rgba(34,197,94,0.95)';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.07);
                ctx.beginPath();
                ctx.moveTo(cx, cy - cellSize * 0.2); ctx.lineTo(cx, cy + cellSize * 0.14);
                ctx.moveTo(cx, cy - cellSize * 0.06); ctx.lineTo(cx - cellSize * 0.14, cy - cellSize * 0.16);
                ctx.moveTo(cx, cy - cellSize * 0.06); ctx.lineTo(cx + cellSize * 0.14, cy - cellSize * 0.16);
                ctx.stroke();
            });
            ctx.restore();`),
        ...K.EVENT_CHIP_SPEC(`st.pend[turn] ? '奉奠先を選べ' : '奉納石 ' + st.sacred.length`),
        [K.ONE, K.INFO_ALGO, `            玉串碁: 「玉串奉奠」→空点を選ぶとその石は奉納石。奉納石を含む連は常に+1呼吸<br>
            PC: 「玉串奉奠」ボタン→クリック<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「玉串奉奠」ボタンを押してから空点を選ぶと、その着手は奉納石 (榊印) になる。',
            '奉納石を含む連は神が宿り、呼吸点が常に+1 — 取られにくい。',
            '奉納は1手を消費する通常着手。どの連に願いを託すかが腕の見せ所。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        resetGame();
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.sacred = []; st.pend = { 1: true, 2: false };
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('奉納石が記録される', st.sacred.includes(I(5, 5)));
        assert('奉納モードは消費される', st.pend[1] === false);
        // 神宿りの連は+1: (5,5)を四方囲���でも取られない
        board[I(4, 5)] = 2; board[I(6, 5)] = 2; board[I(5, 4)] = 2; board[I(5, 6)] = 2;
        assert('神宿りの連は取られない', !getCapturedStones(board, 1).includes(I(5, 5)));
        assert('普通の着手は奉納にならない', !st.sacred.includes(I(0, 0)));
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('白の着手は奉納でない', !st.sacred.includes(I(0, 0)));
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
    `,
};
