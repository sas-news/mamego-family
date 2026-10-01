// TSUITATEGO — 衝立碁: 「衝立」ボタンで構えて置くと石の代わりに一枚壁(視線を遮る)が立つ (各側1回)
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
const ST_INIT = `{ used: { 1: false, 2: false }, arm: { 1: false, 2: false } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false; let wallFlag = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tsuitatego.html',
    en: 'TSUITATEGO',
    jp: '衝立碁',
    prefix: 'tsuitatego',
    desc: '「衝立」ボタンで構えると次の一手が一枚壁(視線を遮る衝立)になる。各側1回。',
    kind: 'stone',
    icon: 'tsuitatego',
    spec: [
        ...K.rb('TSUITATEGO', '衝立碁', 'tsuitatego'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.8 },
        ]),
        ...ST(ST_INIT),
        // 衝立: 構え中の着手は石の代わりに壁(3)を立てる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            // 衝立ルール: 構え中なら石の代わりに一枚壁(値3)を立てる
            if (st.arm[player] && !st.used[player]) {
                st.arm[player] = false; st.used[player] = true; wallFlag = true;
                move.cells.forEach(p => {
                    board[p.y * BOARD_SIZE + p.x] = 3;
                    fxGlow(p.y * BOARD_SIZE + p.x, '#a16207', 700);
                });
                fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '衝立!', '#a16207', 1100);
            } else {
                move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            }`],
        // 衝立の手は石として記録しない
        [K.ONE, K.PIECES_PUSH, `            if (!wallFlag) pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });
            wallFlag = false;`],
        // 壁テクスチャ (木の衝立: 縦板と桟)
        [K.ONE, K.COVERED_ANCHOR, K.texDraw(`                    // 衝立の板面
                    const g = ctx.createLinearGradient(cx - hh, cy - hh, cx + hh, cy + hh);
                    g.addColorStop(0, '#8a5a24'); g.addColorStop(1, '#5c3a14');
                    ctx.fillStyle = g;
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize);
                    ctx.strokeStyle = 'rgba(40,24,10,0.7)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - hh); ctx.lineTo(cx, cy + hh);
                    ctx.moveTo(cx - hh, cy - hh * 0.4); ctx.lineTo(cx + hh, cy - hh * 0.4);
                    ctx.moveTo(cx - hh, cy + hh * 0.4); ctx.lineTo(cx + hh, cy + hh * 0.4);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255,235,200,0.10)';
                    ctx.fillRect(cx - hh, cy - hh, cellSize, cellSize * 0.18);`)],
        ...K.WALL_GUARD_SPEC,
        // 「衝立」ボタン (タッチ操作可)
        [K.ONE, `            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>`,
`            <button id="btnPass" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-sm">
                パス
            </button>
            <button id="btnTsuitate" class="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold border border-amber-600/50 text-amber-700 rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all shadow-sm disabled:opacity-40">
                衝立
            </button>`],
        [K.ONE, '        const btnPass = document.getElementById(\'btnPass\');',
`        const btnPass = document.getElementById('btnPass');
        const btnTsuitate = document.getElementById('btnTsuitate');`],
        [K.ONE, `        btnPass.addEventListener('click', handlePass);`,
`        btnPass.addEventListener('click', handlePass);
        btnTsuitate.addEventListener('click', () => {
            soundManager.playClick();
            if (gameOver || gamePhase !== 'playing' || !isMyTurn()) return;
            if (st.used[turn]) return;
            st.arm[turn] = !st.arm[turn];
            render();
            updateUI();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '衝立使用済' : (st.arm[turn] ? '衝立を立てる…' : '衝立あり')`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            衝立碁: 「衝立」ボタンで構えると次の一手が一枚壁になる (各側1回・呼吸点を塞ぐ障害物)<br>
            PC: 「衝立」→クリックで壁を設置<br>
            スマホ: 同様にボタン→タップ`],
        [K.ONE, K.RV_ALGO, K.rv([
            '「衝立」ボタンで構えてから打つと、石の代わりに一枚壁が立つ (各側1回)。',
            '壁は取れない障害物 — 呼吸点を塞ぎ、敵連の退路を断つ。乱用はできない一発の切り札。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.used = { 1: false, 2: false }; st.arm = { 1: true, 2: false };
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('衝立は壁になる', board[5 * BOARD_SIZE + 5] === 3);
        assert('使用済みになる', st.used[1] === true && st.arm[1] === false);
        assert('壁は石として記録されない', pieces.length === 0);
        assert('壁には置けない', isValidPlacement([{ x: 5, y: 5 }], 2) === false);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
