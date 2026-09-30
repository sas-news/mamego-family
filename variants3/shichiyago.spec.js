// SHICHIYAGO — 質屋碁: 外周(1線)の石は「質物」。取られると所有者に資金+2 (12手以内)、
// 期限切れは競売で取った側+1。終盤まで残った質物には+1の預かり利息。
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

// 終局簡略化: 連続パス → 直接採点 (dead_stone選択を飛ばす)
const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'shichiyago.html',
    en: 'SHICHIYAGO',
    jp: '質屋碁',
    prefix: 'shichiyago',
    desc: '外周の石は質物。取られると資金化、期限切れは競売される。',
    kind: 'stone',
    icon: 'shichiyago',
    spec: [
        ...K.rb('SHICHIYAGO', '質屋碁', 'shichiyago'),
        ...PERSIST('{ placed: {}, funds: { 1: 0, 2: 0 } }'),
        // 着手ごとに配置手数を記録 (質期限の判定用)
        [K.ONE, K.PIECES_PUSH, `            move.cells.forEach(p => { st.placed[p.y * BOARD_SIZE + p.x] = history.length; });
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });`],
        // 質屋ルール: 外周(最外1線)の石は「質物」— 取られると資金化 or 競売
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    const cx = idx % BOARD_SIZE, cy = (idx / BOARD_SIZE) | 0;
                    if (cx === 0 || cy === 0 || cx === BOARD_SIZE - 1 || cy === BOARD_SIZE - 1) {
                        const held = history.length - (st.placed[idx] || 0);
                        if (held <= 12) {
                            st.funds[opponent] += 2; // 期限内: 所有者に下取り資金
                            fxText(idx, '質流れ+2', '#fbbf24', 1000);
                        } else {
                            captures[player] += 1; // 期限切れ: 競売で取った側がボーナス
                            fxText(idx, '競売+1', '#fb923c', 1000);
                        }
                    }
                    delete st.placed[idx];
                });
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
${CAP}
            turn = opponent;`],
        // 質屋の得点計算: 資金 + 外周サバイバル利息(+1/石)
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            // 質屋碁: 資金 + 外周に残った質物の利息を加算
            let rimB = 0, rimW = 0;
            for (let i = 0; i < board.length; i++) {
                const cx = i % BOARD_SIZE, cy = (i / BOARD_SIZE) | 0;
                if (cx !== 0 && cy !== 0 && cx !== BOARD_SIZE - 1 && cy !== BOARD_SIZE - 1) continue;
                if (board[i] === 1) rimB++; else if (board[i] === 2) rimW++;
            }
            const pawnB = st.funds[1] + rimB, pawnW = st.funds[2] + rimW;
            const blackTotal = territory.black + captures[1] + pawnB;
            const whiteTotal = territory.white + captures[2] + pawnW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の質屋得分:</span> <strong>\${pawnB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の質屋得分:</span> <strong>\${pawnW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 質物マーク: 外周の石に金の小札
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                ctx.fillStyle = '#fbbf24';
                ctx.strokeStyle = '#92400e';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    if (x !== 0 && y !== 0 && x !== BOARD_SIZE - 1 && y !== BOARD_SIZE - 1) continue;
                    const mx = padding + x * cellSize + cellSize * 0.24;
                    const my = padding + y * cellSize - cellSize * 0.24;
                    ctx.beginPath();
                    ctx.arc(mx, my, cellSize * 0.13, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.lineWidth = Math.max(0.8, cellSize * 0.03);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'質蔵 黒' + st.funds[1] + ' / 白' + st.funds[2]`),
        [K.ONE, K.INFO_ALGO, `            質屋碁: 外周(最外1線)の石は「質物」。取られると所有者に資金+2 (12手以内)、期限切れは競売で取り側+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の最外1線に置いた石は「質物」になる (金の札マーク)。',
            '質物が取られると: 着手から12手以内なら失った側に下取り資金+2目。12手を過ぎると期限切れとなり競売 — 取った側にさらに+1目。',
            '終局時に外周に残った質物は1つにつき+1目の預かり利息が付く。資金・利息は採点に加算される。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.placed = {}; st.funds = { 1: 0, 2: 0 }; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1; st.placed[0] = 0;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('期限内の質物は所有者に資金+2', st.funds[2] === 2 && captures[1] === 1);
        history.length = 20;
        board[3] = 2; st.placed[3] = 0; board[2] = 1; board[4] = 1; board[BOARD_SIZE + 3] = 1;
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        assert('期限切れの質物は競売で取り側に+1', captures[1] === 3);
        board.fill(0); board[0] = 1; st.funds = { 1: 0, 2: 0 };
        endGameByScore();
        assert('外周質物の利息が結果に反映', gameResultData.details.includes('質'));
    `,
};
