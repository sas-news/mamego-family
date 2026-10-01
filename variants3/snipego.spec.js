// SNIPEGO — 狙撃碁: 1手を使って狙撃点を指定。相手がそこに打つと石が撃ち落とされる
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
const ST_INIT = `{ snipe: { 1: -1, 2: -1 }, armed: { 1: false, 2: false } }`;
module.exports = {
    file: 'snipego.html',
    en: 'SNIPEGO',
    jp: '狙撃碁',
    prefix: 'snipego',
    desc: '1手を使って狙撃点を設定。相手がその点に打つと石を撃ち落とす。',
    kind: 'stone',
    icon: 'snipego',
    spec: [
        ...K.rb('SNIPEGO', '狙撃碁', 'snipego'),
        K.params([
            { key: 'snipe_pts', label: '撃墜のアゲハマ', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 狙撃的中: 狙われた点への着手は着弾せず撃墜される (狙撃手のアゲハマ+1)
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            let __sniped = false;
            {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if ((st.snipe[3 - player] || -1) === pi) {
                    st.snipe[3 - player] = -1;
                    __sniped = true;
                    captures[3 - player] += (P('snipe_pts') ?? 1); // 撃墜された石は狙撃手のアゲハマ
                    fxBurst(pi, '#22d3ee', 12, 2.0);
                    fxText(pi, '狙撃!', '#22d3ee', 1300);
                    fxShake(4, 300);
                } else {
                    move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
                }
            }`],
        [K.ONE, K.PIECES_PUSH, `            if (!__sniped) {
                pieces.push({
                    id: Date.now() + Math.random(),
                    player: player,
                    type: move.type,
                    rot: move.rot,
                    cells: move.cells
                });
            }`],
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = __sniped ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 「狙撃」ボタン → 空点クリックで狙撃点を設定 (1手を消費 = パス扱い)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnSnipe" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-cyan-500/50 text-cyan-600 rounded-xl hover:bg-cyan-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                狙撃
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnSnipe = document.getElementById('btnSnipe');`],
        [K.ONE, `            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;`,
`            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            // 狙撃モード: 空点をクリックして狙撃点を設定 (1手を消費 = 手番を渡す)
            if (st.armed[turn]) {
                st.armed[turn] = false;
                const gi = Math.round(anchor.v) * BOARD_SIZE + Math.round(anchor.u);
                if (gi >= 0 && gi < board.length && board[gi] === 0) {
                    st.snipe[turn] = gi;
                    fxGlow(gi, '#22d3ee', 800);
                    handlePass(); // 狙撃設定は1手を消費
                }
                render();
                updateUI();
                return;
            }`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnSnipe.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            st.armed[turn] = !st.armed[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.snipe[turn] >= 0 ? '狙撃待機中' : (st.armed[turn] ? '狙撃点を選んで' : '')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            狙撃碁: 「狙撃」→空点をクリックで狙撃点を設定 (1手を消費)。相手が打てば撃墜<br>
            PC: クリックで配置 / 「狙撃」→点をクリック<br>
            スマホ: 同様にボタン→点をタップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「狙撃」ボタン→空点をクリックで狙撃点を設定する。設定には1手を消費 (手番を渡す)。',
            '相手が狙撃点に着手すると、その石は着弾せず撃墜され狙撃手のアゲハマになる。',
            '狙撃は相手には見えない。外れれば狙撃点は残る。熱い点を読み合う心理戦の碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.snipe = { 1: -1, 2: -1 }; st.armed = { 1: false, 2: false };
        // 黒が (5,5) に狙撃を設定
        st.snipe[1] = 5 * BOARD_SIZE + 5;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2); // 狙撃点に着手 → 撃墜
        assert('狙われた石は着弾しない', board[5 * BOARD_SIZE + 5] === 0);
        assert('撃墜は狙撃手のアゲハマ', captures[1] === 1);
        assert('狙撃は消費される', st.snipe[1] === -1);
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 2);
        assert('狙われない点は通常着手', board[4 * BOARD_SIZE + 4] === 2);
    `,
};
