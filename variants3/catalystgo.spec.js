// CATALYSTGO — 触媒碁: 6個目ごとの自分の石は触媒。隣の敵石を自石に変質させる
const K = require('../gen_kit.js');
module.exports = {
    file: 'catalystgo.html',
    en: 'CATALYSTGO',
    jp: '触媒碁',
    prefix: 'catalystgo',
    desc: '自分の6個目ごとの石は触媒。置くと隣接する敵石を自石に変質させる。',
    kind: 'stone',
    icon: 'catalystgo',
    spec: [
        ...K.rb('CATALYSTGO', '触媒碁', 'catalystgo'),
        K.params([
            { key: 'cat_every', label: '触媒の間隔', min: 2, max: 15, def: 6, unit: '個目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 }, cats: {} }; // 各プレイヤーの着手数と触媒の位置`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 }, cats: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 }, cats: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 }, cats: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 }, cats: {} };`],
        // 着手時: 6個目ごとの石は触媒 → 隣の敵石を変質
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells
            });
            // 触媒: 6個目ごとの自分の石は触媒 → 隣接する敵石を自石に変質
            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            if (st.pcnt[player] % (P('cat_every') || 6) === 0) {
                move.cells.forEach(p => {
                    const pi = p.y * BOARD_SIZE + p.x;
                    st.cats[pi] = true; // 触媒マーク
                    fxGlow(pi, '#c084fc', 900);
                    fxText(pi, '触媒!', '#c084fc', 1100);
                    getNeighbors(pi).forEach(n => {
                        if (board[n] === (player === 1 ? 2 : 1)) {
                            board[n] = player;
                            fxBurst(n, '#c084fc', 8, 1.3);
                        }
                    });
                });
            }`],
        // 触媒石の描画
        ...K.STONE_MARKS_SPEC(`            // 触媒石: 紫の六角リング
            {
                ctx.save();
                Object.keys(st.cats).forEach(k => {
                    const i = +k;
                    if (board[i] === 0 || board[i] === 3) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.strokeStyle = 'rgba(192,132,252,0.85)';
                    ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                    ctx.beginPath();
                    for (let k = 0; k <= 6; k++) {
                        const a = k * Math.PI / 3 + Math.PI / 6;
                        const px = cx + Math.cos(a) * cellSize * 0.38;
                        const py = cy + Math.sin(a) * cellSize * 0.38;
                        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            触媒碁: 6個目ごとの自分の石は触媒。隣の敵石を自石に変質<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分が置く6個目ごとの石は「触媒」。置いた瞬間、隣接する敵石を自石に変質させる。',
            '変質はアゲハマにならないが連を塗り替える。両者同じ周期で触媒が来る。',
        ])],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt[1] = 5; // 次の着手が6個目
        board[I(3, 3)] = 2; // 白を手配置
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 黒6個目 → 触媒
        assert('触媒マークが付く', !!st.cats[I(4, 3)]);
        assert('隣の敵石が変質する', board[I(3, 3)] === 1);
        // 7個目は触媒ではない
        board[I(8, 8)] = 2;
        executeMove({ cells: [{ x: 9, y: 8 }] }, 1);
        assert('7個目は触媒ではない', board[I(8, 8)] === 2);
        assert('着手できる', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
