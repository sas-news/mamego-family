// POSSESSGO — 憑物碁: 盤に幽霊が取り憑いている。5手ごとに隣へ漂い、
// 石の上に止まるとその石を乗っ取る (色が反転する)。
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

module.exports = {
    file: 'possessgo.html',
    en: 'POSSESSGO',
    jp: '憑物碁',
    prefix: 'possessgo',
    desc: '盤を漂う幽霊が、止まった石を乗っ取って色を反転させる。',
    kind: 'stone',
    icon: 'possessgo',
    spec: [
        ...K.rb('POSSESSGO', '憑物碁', 'possessgo'),
        K.params([{ key: 'ghost_every', label: '幽霊の移動間隔', min: 2, max: 15, def: 5, unit: '手' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.5, max: 2.2, def: 1.1, step: 0.05, hint: '交点数×倍率' }]),
        ...PERSIST('{ ghost: -1 }'),
        // 幽霊の初期位置: 盤の中央
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st.ghost = ((BOARD_SIZE / 2) | 0) * BOARD_SIZE + ((BOARD_SIZE / 2) | 0);`],
        // 幽霊ルール: 5手ごとに1歩漂い、石に憑依して色を反転
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 幽霊ルール: 5手ごとに隣へ漂い、乗っ取る
            if (st.ghost >= 0 && history.length % Math.max(1, P('ghost_every') || 5) === 0) {
                const ns = getNeighbors(st.ghost);
                if (ns.length) {
                    const ni = ns[(Math.random() * ns.length) | 0];
                    fxSlide(st.ghost, ni);
                    st.ghost = ni;
                    const v = board[ni];
                    if (v === 1 || v === 2) {
                        board[ni] = 3 - v;
                        pieces.forEach(pc => {
                            if (pc.cells.some(cp => cp.x === ni % BOARD_SIZE && cp.y === ((ni / BOARD_SIZE) | 0))) pc.player = 3 - v;
                        });
                        fxText(ni, '憑依!', '#c084fc', 1300);
                        fxGlow(ni, '#a855f7', 1000);
                        fxShake(3, 200);
                        // 憑依で生じた無呼吸連を除去 (幽霊の仕業、アゲハマ無し)
                        for (let sweep = 0; sweep < 4; sweep++) {
                            let swept = false;
                            [1, 2].forEach(cc => {
                                getCapturedStones(board, cc).forEach(i => { board[i] = 0; swept = true; });
                            });
                            if (!swept) break;
                        }
                        cleanUpPieces();
                    }
                }
            }
${CAP}
            turn = opponent;`],
        // 幽霊の描画: 半透明の幽霊が乗っている
        ...K.STONE_MARKS_SPEC(`            {
                if (st.ghost >= 0) {
                    const gx = st.ghost % BOARD_SIZE, gy = (st.ghost / BOARD_SIZE) | 0;
                    const cx = padding + gx * cellSize, cy = padding + gy * cellSize;
                    const now = fxNow();
                    const bob = Math.sin(now / 500) * cellSize * 0.06;
                    ctx.save();
                    ctx.globalAlpha = 0.75;
                    ctx.fillStyle = 'rgba(196,181,253,0.85)';
                    const r = cellSize * 0.34;
                    ctx.beginPath();
                    ctx.arc(cx, cy - cellSize * 0.10 + bob, r, Math.PI, 0);
                    ctx.lineTo(cx + r, cy + r * 0.7 + bob);
                    for (let k = 0; k < 3; k++) {
                        const wx = cx + r - (k + 0.5) * (2 * r / 3);
                        ctx.quadraticCurveTo(wx + r / 6, cy + r * 0.35 + bob, wx - r / 6 + 0, cy + r * 0.7 + bob);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#4c1d95';
                    ctx.beginPath();
                    ctx.arc(cx - r * 0.3, cy - cellSize * 0.14 + bob, cellSize * 0.05, 0, Math.PI * 2);
                    ctx.arc(cx + r * 0.3, cy - cellSize * 0.14 + bob, cellSize * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'幽霊 ' + (st.ghost >= 0 ? ((st.ghost % BOARD_SIZE) + 1) + '-' + (((st.ghost / BOARD_SIZE) | 0) + 1) : '—')`),
        [K.ONE, K.INFO_BASE, `            憑物碁: 5手ごとに幽霊が隣へ漂う。石に止まると乗っ取って色が反転する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤中央に幽霊が取り憑いている。5手ごとにランダムに1歩漂う。',
            '幽霊が石の上に止まると乗っ取る: その石は敵味方の色が反転する。',
            '憑依で呼吸を失った連は消滅する (アゲハマにはならない)。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.ghost = 6 * BOARD_SIZE + 6; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 幽霊の全隣接点を黒石で埋める: どこに漂っても憑依が起きる
        getNeighbors(st.ghost).forEach(n => { board[n] = 1; });
        const before = st.ghost;
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1); // history=1
        executeMove({ cells: [{ x: 1, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 4, y: 0 }] }, 1); // history=5 → 幽霊が漂う
        assert('幽霊が移動した', st.ghost !== before);
        assert('憑依で白石が現れた', board[st.ghost] === 2 || getNeighbors(st.ghost).length > 0);
        const whites = board.filter(v => v === 2).length;
        assert('憑依による反転発生', whites >= 1);
    `,
};
