// DIVEGO — 潜水碁: 敵に完全に囲まれた点に「潜水着手」できる。潜った石は3手後に浮上する
const K = require('../gen_kit.js');
module.exports = {
    file: 'divego.html',
    en: 'DIVEGO',
    jp: '潜水碁',
    prefix: 'divego',
    desc: '敵石に完全包囲された点にも潜水着手できる。3手後に浮上して石になる。',
    kind: 'stone',
    icon: 'divego',
    spec: [
        ...K.rb('DIVEGO', '潜水碁', 'divego'),
        K.params([
            { key: 'dive_turns', label: '潜水の手数', min: 1, max: 6, def: 3, unit: '手' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { dives: [] }; // 潜行中の石 [{idx, player, n}]`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { dives: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { dives: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { dives: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { dives: [] };`],
        // 潜水ヘルパー + 素の合法判定
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 潜水可否: 単一セルで、全ての盤内近傍が敵石 (通常着手では自殺になるポケット)
        function canDive(cells, player) {
            if (cells.length !== 1) return false;
            const p = cells[0];
            const opp = player === 1 ? 2 : 1;
            const ns = getNeighbors(p.y * BOARD_SIZE + p.x);
            return ns.length > 0 && ns.every(n => board[n] === opp);
        }
        // 潜水を考慮しない素の合法判定 (自殺・コウを含む)
        function isNormalLegal(cells, player) {
            const tempBoard = [...board];
            cells.forEach(p => { tempBoard[p.y * BOARD_SIZE + p.x] = player; });
            const opp = player === 1 ? 2 : 1;
            const capd = getCapturedStones(tempBoard, opp);
            const after = [...tempBoard];
            capd.forEach(i => after[i] = 0);
            if (getCapturedStones(after, player).length > 0) { return false; }
            if (capd.length > 0 && prevBoard && after.every((v, i) => v === prevBoard[i])) { return false; }
            return true;
        }

        function isValidPlacement(cells, player) {`],
        // 自殺チェックに潜水例外を追加
        [K.ONE, `            if (getCapturedStones(after, player).length > 0) return false;`,
`            if (getCapturedStones(after, player).length > 0 && !canDive(cells, player)) return false;`],
        // 配置処理: 潜水なら盤に置かず潜行登録
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            // 潜水着手: 通常は非合法だが潜水可能なら潜行登録 (盤には置かない)
            const isDive = !isNormalLegal(move.cells, player) && canDive(move.cells, player);
            if (isDive) {
                move.cells.forEach(p => {
                    const di = p.y * BOARD_SIZE + p.x;
                    st.dives.push({ idx: di, player, n: P('dive_turns') || 3 });
                    fxSplash(di, '#38bdf8', 12);
                    fxText(di, '潜水!', '#38bdf8', 1000);
                });
            } else {
                move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            }`],
        // 潜水着手はピース (描画用) を追加しない
        [K.ONE, K.PIECES_PUSH, `            if (!isDive) {
                pieces.push({
                    id: Date.now() + Math.random(),
                    player: player,
                    type: move.type,
                    rot: move.rot,
                    cells: move.cells
                });
            }`],
        // 手番交代直前: 潜行タイマー進行 & 浮上解決 & 長期戦打ち切り
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 潜行石: 自分の着手ごとに残数が減り、0で浮上
            {
                const surfacing = [];
                st.dives = st.dives.filter(d => {
                    if (d.player !== player) return true;
                    d.n--;
                    if (d.n > 0) return true;
                    surfacing.push(d);
                    return false;
                });
                surfacing.forEach(d => {
                    if (board[d.idx] === 0) {
                        board[d.idx] = d.player;
                        fxGlow(d.idx, '#38bdf8', 900);
                        fxText(d.idx, '浮上!', '#7dd3fc', 1200);
                        const ene = d.player === 1 ? 2 : 1;
                        getCapturedStones(board, ene).forEach(i => {
                            board[i] = 0; captures[d.player]++; fxBurst(i, '#f97316', 8, 1.4);
                        });
                        // 浮上先が自殺ならその石はそのまま消える
                        if (getCapturedStones(board, d.player).indexOf(d.idx) >= 0) board[d.idx] = 0;
                    }
                });
                if (surfacing.length) cleanUpPieces();
            }
            // 長期戦防止: 140手経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 潜行石を波紋マークで表示
        ...K.STONE_MARKS_SPEC(`            (st.dives || []).forEach(d => {
                const dx = d.idx % BOARD_SIZE, dy = Math.floor(d.idx / BOARD_SIZE);
                const cx = padding + dx * cellSize, cy = padding + dy * cellSize;
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.9)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let k = 0; k < 2; k++) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * (0.14 + k * 0.10 + ((P('dive_turns') || 3) - d.n) * 0.03), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            });`),
        [K.ONE, K.RV_ALGO, K.rv([
            '敵石に全方向を囲まれた空点には「潜水着手」ができる (盤には現れない)。',
            '潜った石は自分の3手後に浮上する。浮上で敵連を取れる。占領済み・自殺のままなら消える。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.dives = []; captures = { 1: 0, 2: 0 };
        board[3*BOARD_SIZE+4] = 2; board[4*BOARD_SIZE+3] = 2; board[5*BOARD_SIZE+4] = 2; board[4*BOARD_SIZE+5] = 2;
        assert('敵包囲の自殺点は潜水着手可能', isValidPlacement([{ x: 4, y: 4 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('潜水石は盤上に出ない', board[4*BOARD_SIZE+4] === 0 && st.dives.length === 1);
        board[2*BOARD_SIZE+4] = 1; board[3*BOARD_SIZE+3] = 1; board[3*BOARD_SIZE+5] = 1; // (4,3)の白の残り呼吸点は(4,4)のみに
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('潜水は3手目に浮上する', st.dives.length === 0);
        assert('浮上で敵石を取り自分は残る', board[4*BOARD_SIZE+4] === 1 && board[3*BOARD_SIZE+4] === 0 && captures[1] === 1);
    `,
};
