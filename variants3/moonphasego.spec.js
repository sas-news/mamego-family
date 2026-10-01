// MOONPHASEGO — 月相碁: 29手周期の月の満ち欠けで石の強さが変わる (満月=取れない / 新月=2倍)
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST_INIT = `{ ply: 0 }`;
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
    file: 'moonphasego.html',
    en: 'MOONPHASEGO',
    jp: '月相碁',
    prefix: 'moonphasego',
    desc: '29手周期の月相で石の強さが変わる。満月は取れず、新月はアゲハマ2倍。',
    kind: 'stone',
    icon: 'moonphasego',
    spec: [
        ...K.rb('MOONPHASEGO', '月相碁', 'moonphasego'),
        K.params([
            { key: 'cycle', label: '月の周期', min: 10, max: 60, def: 29, unit: '手', hint: '1周の手数。最初の7%が新月' },
            { key: 'new_mult', label: '新月の得点倍率', min: 1, max: 5, def: 2, hint: '新月に取った石の得点倍率' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 月相: ply%29 が 0-4=新月 (取り2倍) / 14-18=満月 (取れない) / 他=通常
        [K.ONE, K.CAPTURE_BLOCK, `            st.ply++;
            const __cyc = Math.max(2, P('cycle') || 29);
            const ph = st.ply % __cyc;
            const newMoon = ph <= Math.max(0, Math.round(5 * __cyc / 29) - 1);
            const fullMoon = ph >= Math.round(14 * __cyc / 29) && ph <= Math.round(19 * __cyc / 29) - 1;
            const captured = fullMoon ? [] : getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += newMoon ? captured.length * (P('new_mult') || 2) : captured.length;
                if (newMoon) fxText(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '新月の収穫!', '#94a3b8', 1300);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
                if (fullMoon) fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#fef08a', 900);
            }`],
        // 満月期は盤の中央に淡い月の輪を描く
        K.CUE_STARS(`            // 月相の描画: 満月期は大きな月、新月期は細い月
            {
                const __cyc2 = Math.max(2, P('cycle') || 29);
                const ph = st.ply % __cyc2;
                const __fLo = Math.round(14 * __cyc2 / 29), __fHi = Math.round(19 * __cyc2 / 29) - 1, __nHi = Math.max(0, Math.round(5 * __cyc2 / 29) - 1);
                const cc = (BOARD_SIZE - 1) / 2;
                const cx = padding + cc * cellSize, cy = padding + cc * cellSize;
                ctx.save();
                if (ph >= __fLo && ph <= __fHi) {
                    ctx.strokeStyle = 'rgba(254,240,138,0.55)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 1.4, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (ph <= __nHi) {
                    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.9, Math.PI * 0.6, Math.PI * 1.4);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(() => { const c = Math.max(2, P('cycle') || 29); const p = st.ply % c; return p <= Math.max(0, Math.round(5 * c / 29) - 1) ? '新月' : p >= Math.round(14 * c / 29) && p <= Math.round(19 * c / 29) - 1 ? '満月' : p < Math.round(14 * c / 29) ? '上弦' : '下弦'; })()`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            月相碁: 29手周期の月の満ち欠け。満月期 (14-18手目) は取れず、新月期 (周期の最初5手) はアゲハマ2倍<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤を数える手数が29手周期で月が巡る。新月期 (周期の1-5手目) は石が脆く、アゲハマが2倍。',
            '満月期 (周期の14-18手目) は石が強く、どの連も取れない。',
            '月齢はチップに表示される。取りたい手は新月に、耐えたい手は満月に合わせる読み合い。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ply = 0;
        const B = BOARD_SIZE;
        const mk = () => { board.fill(0); board[4 * B + 4] = 2; board[4 * B + 3] = 1; board[5 * B + 4] = 1; board[3 * B + 4] = 1; };
        mk(); st.ply = 28;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 29手目 → 新月
        assert('新月は取り2倍', captures[1] === 2 && board[4 * B + 4] === 0);
        captures = { 1: 0, 2: 0 }; mk(); st.ply = 13;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 14手目 → 満月
        assert('満月は取れない', board[4 * B + 4] === 2);
        captures = { 1: 0, 2: 0 }; mk(); st.ply = 8;
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1); // 9手目 → 通常
        assert('通常期は取り1倍', captures[1] === 1);
    `,
};
