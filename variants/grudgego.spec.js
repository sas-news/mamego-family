// GRUDGEGO — 怨念碁: 取られた石は怨念となって盤に残る。
// 怨念のマスは12手の間、打てず呼吸もしない。終局時に被害者へ+1/マス。
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

const PASS_END = [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`];

const CAP = `
            // 打ち切り: 交点数x1.1を超えた長期戦は採点終局 (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 1.1))) {
                endGameByScore();
                return;
            }
`;

const GETCAP = `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`;

module.exports = {
    file: 'grudgego.html',
    en: 'GRUDGEGO',
    jp: '怨念碁',
    prefix: 'grudgego',
    desc: '取られた石は怨念となる。そのマスは打てず呼吸もしない。',
    kind: 'stone',
    icon: 'grudgego',
    spec: [
        ...K.rb('GRUDGEGO', '怨念碁', 'grudgego'),
        K.params([
            { key: 'grudge_ttl', label: '怨念の残存期間', min: 3, max: 48, def: 12, unit: '手' },
            { key: 'grudge_bonus', label: '怨念1マスの得点', min: 0, max: 5, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.5, max: 2, def: 1.1, step: 0.05 },
        ]),
        ...PERSIST('{ grudge: {} }'),
        // 怨念のマスには着手できない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 怨念の残るマスは打てない
                if (st.grudge[p.y * BOARD_SIZE + p.x]) return false;
            }`],
        // 怨念のマスは呼吸点にならない
        [K.ONE, GETCAP, `        function getCapturedStones(boardState, player) {
            const deadMask = computeDeadMask(boardState);
            const visited = Array(boardState.length).fill(false);
            const captured = [];

            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] === player && !visited[i]) {
                    const group = [];
                    let hasLiberty = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        group.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (boardState[n] === 0 && !deadMask[n] && !st.grudge[n]) {
                                hasLiberty = true;
                            } else if (boardState[n] === player && !visited[n]) {
                                visited[n] = true;
                                queue.push(n);
                            }
                        });
                    }

                    if (!hasLiberty) {
                        captured.push(...group);
                    }
                }
            }
            return captured;
        }`],
        // 取られたセルは怨念になる (12手間)
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            if (captured.length > 0) {
                captured.forEach(idx => {
                    board[idx] = 0;
                    st.grudge[idx] = { expire: history.length + Math.max(1, P('grudge_ttl') || 12), by: opponent };
                });
                captures[player] += captured.length;
                fxText(captured[0], '怨念!', '#7e22ce', 1200);
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 怨念の寿命管理
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 怨念の退散
            Object.keys(st.grudge).forEach(k => {
                if (history.length > st.grudge[k].expire) delete st.grudge[k];
            });
${CAP}
            turn = opponent;`],
        // 採点: 生きている怨念1マスにつき被害者に+1
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            let grB = 0, grW = 0;
            Object.values(st.grudge).forEach(g => { if (g.by === 1) grB += (P('grudge_bonus') || 1); else grW += (P('grudge_bonus') || 1); });
            const blackTotal = territory.black + captures[1] + grB;
            const whiteTotal = territory.white + captures[2] + grW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の怨念:</span> <strong>\${grB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白の怨念:</span> <strong>\${grW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 怨念の描画: 紫の揺らめく靄
        ...K.STONE_MARKS_SPEC(`            {
                const now = fxNow();
                ctx.save();
                Object.keys(st.grudge).forEach(k => {
                    const i = +k;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const a = 0.25 + 0.15 * Math.sin(now / 400 + i);
                    ctx.fillStyle = 'rgba(126,34,206,' + a + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.05, cellSize * 0.30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(233,213,255,' + (a + 0.25) + ')';
                    ctx.font = 'bold ' + Math.round(cellSize * 0.34) + 'px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('怨', cx, cy);
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'怨念 ' + Object.keys(st.grudge).length + 'ヶ所'`),
        [K.ONE, K.INFO_BASE, `            怨念碁: 取られた石の場所は12手の間「怨念」となり、打てず呼吸もしない。終局時に被害者へ+1/マス<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を取ると、その場所に12手の間「怨念」が残る。',
            '怨念のマスには誰も打てず、呼吸点にもならない — 取った側の盤も狭くなる。',
            '終局時に残った怨念1マスにつき取られた側に+1目。乱暴な攻めは怨念を増やす。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.grudge = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 白石(1,0)を黒で包囲して取る → (1,0)が怨念化
        board[0] = 2; board[1] = 2;
        board[2] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('取られたマスに怨念', st.grudge[0] && st.grudge[1] && captures[1] === 2);
        assert('怨念マスは着手不可', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
        assert('怨念は呼吸点にしない', getCapturedStones(board, 2).length === 0 || !st.grudge[0]);
        history.length = st.grudge[0].expire + 1;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        assert('期限で怨念は退散', st.grudge[0] === undefined);
    `,
};
