// PESTILENCEGO — 黒死碁: 盤中央から疫病が8手ごとに蔓延していく。
// 感染マスは打てず・呼吸せず・地にならない。上の石は死ぬ。
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
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 1.1))) {
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

const CALCT = `        function calculateTerritory() {
            const deadMask = computeDeadMask(board);
            const visited = Array(board.length).fill(false);
            let blackTerritory = 0;
            let whiteTerritory = 0;

            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0 && !visited[i]) {
                    if (deadMask[i]) { // 窒息領域は壁扱い(地にならない)
                        visited[i] = true;
                        continue;
                    }
                    const region = [];
                    let touchesBlack = false;
                    let touchesWhite = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        region.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (board[n] === 0) {
                                if (!visited[n]) {
                                    visited[n] = true;
                                    queue.push(n);
                                }
                            } else if (board[n] === 1) touchesBlack = true;
                            else if (board[n] === 2) touchesWhite = true;
                        });
                    }

                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;
                }
            }
            return { black: blackTerritory, white: whiteTerritory };
        }`;

module.exports = {
    file: 'pestilencego.html',
    en: 'PESTILENCEGO',
    jp: '黒死碁',
    prefix: 'pestilencego',
    desc: '盤中央から疫病が8手ごとに蔓延。感染マスは打てず呼吸もしない。',
    kind: 'stone',
    icon: 'pestilencego',
    spec: [
        ...K.rb('PESTILENCEGO', '黒死碁', 'pestilencego'),
        K.params([{ key: 'plague_every', label: '疫病の蔓延間隔', min: 2, max: 20, def: 8, unit: '手' }, { key: 'plague_max', label: '蔓延の上限', min: 5, max: 120, def: 40, unit: 'マス' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 2.2, def: 1.1, step: 0.05, hint: '交点数×倍率' }]),
        ...PERSIST('{ plague: {} }'),
        // 感染マスには着手できない
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                // 感染マスは打てない
                if (st.plague[p.y * BOARD_SIZE + p.x]) return false;
            }`],
        // 感染マスは呼吸点にならない
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
                            if (boardState[n] === 0 && !deadMask[n] && !st.plague[n]) {
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
        // 感染マスは地にならない
        [K.ONE, CALCT, `        function calculateTerritory() {
            const deadMask = computeDeadMask(board);
            const visited = Array(board.length).fill(false);
            let blackTerritory = 0;
            let whiteTerritory = 0;

            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0 && !visited[i] && !st.plague[i]) {
                    if (deadMask[i]) { // 窒息領域は壁扱い(地にならない)
                        visited[i] = true;
                        continue;
                    }
                    const region = [];
                    let touchesBlack = false;
                    let touchesWhite = false;
                    const queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const curr = queue.shift();
                        region.push(curr);

                        const neighbors = getNeighbors(curr);
                        neighbors.forEach(n => {
                            if (board[n] === 0) {
                                if (!visited[n] && !st.plague[n]) {
                                    visited[n] = true;
                                    queue.push(n);
                                }
                            } else if (board[n] === 1) touchesBlack = true;
                            else if (board[n] === 2) touchesWhite = true;
                        });
                    }

                    if (touchesBlack && !touchesWhite) blackTerritory += region.length;
                    else if (touchesWhite && !touchesBlack) whiteTerritory += region.length;
                }
            }
            return { black: blackTerritory, white: whiteTerritory };
        }`],
        // 疫病の蔓延: 8手ごとに中心から1世代広がる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 疫病ルール: 8手ごとに蔓延 (中心を種に、既感染の全隣が感染)
            // 隔離帯: 感染は最大40マスで封じ込められる (全滅防止)
            if (history.length % Math.max(1, P('plague_every') || 8) === 0) {
                const center = ((BOARD_SIZE / 2) | 0) * BOARD_SIZE + ((BOARD_SIZE / 2) | 0);
                if (!st.plague[center]) st.plague[center] = 1;
                const prev = Object.keys(st.plague).map(Number);
                const newly = [];
                if (prev.length < (P('plague_max') || 40)) {
                    prev.forEach(i => getNeighbors(i).forEach(n => {
                        if (!st.plague[n]) { st.plague[n] = 1; newly.push(n); }
                    }));
                }
                // 感染した石は死ぬ (アゲハマにならない)
                newly.forEach(i => {
                    if (board[i] === 1 || board[i] === 2) {
                        board[i] = 0;
                        fxText(i, '病死', '#4d7c0f', 900);
                    }
                });
                if (newly.length) fxText(prev[0], '疫病蔓延!', '#65a30d', 1100);
                // 疫病で呼吸を失った連も死ぬ (両者共通の被害)
                for (let sweep = 0; sweep < 4; sweep++) {
                    let swept = false;
                    [1, 2].forEach(cc => {
                        getCapturedStones(board, cc).forEach(i => { board[i] = 0; swept = true; });
                    });
                    if (!swept) break;
                }
                cleanUpPieces();
            }
${CAP}
            turn = opponent;`],
        // 疫病の描画: 緑の瘴気とドクロ
        ...K.STONE_MARKS_SPEC(`            {
                const now = fxNow();
                ctx.save();
                Object.keys(st.plague).forEach(k => {
                    const i = +k;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    const a = 0.30 + 0.12 * Math.sin(now / 600 + i * 1.3);
                    ctx.fillStyle = 'rgba(101,163,13,' + a + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(26,46,5,' + (a + 0.35) + ')';
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'疫病 ' + Object.keys(st.plague).length + 'マス 蔓延まで' + ((P('plague_every') || 8) - history.length % (P('plague_every') || 8)) + '手'`),
        [K.ONE, K.INFO_BASE, `            黒死碁: 8手ごとに盤中央から疫病が蔓延。感染マスは打てず・呼吸せず・地にならない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '8手ごとに疫病が盤中央から1世代ずつ蔓延していく (最大40マスで封じ込め)。',
            '感染マスには打てず、呼吸点にもならず、地にもならない。上にあった石は病没する (アゲハマにならない)。',
            '疫病で呼吸を失った連も死ぬ。盤は徐々に痩せていく — 早期の決着か、疫病を牽制に使うか。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.plague = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        history.length = 7;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // 8手目で蔓延
        const center = ((BOARD_SIZE / 2) | 0) * BOARD_SIZE + ((BOARD_SIZE / 2) | 0);
        assert('疫病が発生した', st.plague[center] === 1);
        assert('疫病は隣へ蔓延した', Object.keys(st.plague).length >= 5);
        assert('感染マスは着手不可', isValidPlacement([{ x: (BOARD_SIZE / 2) | 0, y: (BOARD_SIZE / 2) | 0 }], 1) === false);
        board.fill(0);
        getNeighbors(5 * BOARD_SIZE + 5).forEach(n => { st.plague[n] = 1; });
        board[5 * BOARD_SIZE + 5] = 2;
        assert('疫病に囲まれた連は呼吸しない', getCapturedStones(board, 2).includes(5 * BOARD_SIZE + 5));
    `,
};
