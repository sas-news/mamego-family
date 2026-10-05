// DENSITYGO — 濃度碁: 3x3ゾーンの占有率が8割を超えると相転移 — 多数派が少数派を全て取る (1ゾーン1回)
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスで即採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り: 150手を超えたら即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= (P('cap_moves') || 150)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'densitygo.html',
    en: 'DENSITYGO',
    jp: '濃度碁',
    prefix: 'densitygo',
    desc: '9つのゾーンの占有率が8割を超えると相転移 — 多数派が少数派の石を全て取る。',
    kind: 'stone',
    icon: 'densitygo',
    spec: [
        ...K.rb('DENSITYGO', '濃度碁', 'densitygo'),
        K.params([
            { key: 'zone_n', label: 'ゾーン分割数', min: 2, max: 5, def: 3, unit: '×' },
            { key: 'occ_pct', label: '相転移の占有率', min: 60, max: 95, def: 80, unit: '%' },
            { key: 'cap_moves', label: '打ち切り手数', min: 60, max: 300, def: 150, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { zones: {} }; // 相転移済みゾーン`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { zones: {} };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { zones: {} };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { zones: {} };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { zones: {} };`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 濃度相転移: 占有率8割超のゾーンで多数派が少数派を全て取る (1ゾーン1回)
            {
                const Z = Math.max(1, P('zone_n') || 3);
                const zs = Math.ceil(BOARD_SIZE / Z);
                for (let zy = 0; zy < Z; zy++) for (let zx = 0; zx < Z; zx++) {
                    const zk = zy * Z + zx;
                    if (st.zones[zk]) continue;
                    let c1 = 0, c2 = 0, ce = 0;
                    for (let y = zy * zs; y < Math.min(BOARD_SIZE, (zy + 1) * zs); y++) {
                        for (let x = zx * zs; x < Math.min(BOARD_SIZE, (zx + 1) * zs); x++) {
                            const v = board[y * BOARD_SIZE + x];
                            if (v === 1) c1++; else if (v === 2) c2++; else ce++;
                        }
                    }
                    const total = c1 + c2 + ce;
                    if (ce <= Math.floor(total * (1 - (P('occ_pct') ?? 80) / 100)) && c1 !== c2) {
                        st.zones[zk] = true;
                        const win = c1 > c2 ? 1 : 2, lose = win === 1 ? 2 : 1;
                        const taken = [];
                        for (let y = zy * zs; y < Math.min(BOARD_SIZE, (zy + 1) * zs); y++) {
                            for (let x = zx * zs; x < Math.min(BOARD_SIZE, (zx + 1) * zs); x++) {
                                const i = y * BOARD_SIZE + x;
                                if (board[i] === lose) { board[i] = 0; taken.push(i); }
                            }
                        }
                        captures[win] += taken.length;
                        taken.forEach(i => fxBurst(i, '#22d3ee', 9, 1.6));
                        if (taken.length) {
                            fxShake(5, 320);
                            fxText(taken[0], '相転移!', '#22d3ee', 1300);
                        }
                        cleanUpPieces();
                    }
                }
            }

            turn = opponent;`],
        // ゾーン境界の破線
        K.CUE_GRID(`            // 濃度ゾーンの境界 (3x3 破線)
            {
                ctx.save();
                const Z2 = Math.max(1, P('zone_n') || 3);
                const zs2 = Math.ceil(BOARD_SIZE / Z2);
                ctx.strokeStyle = 'rgba(34,211,238,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.2, cellSize * 0.15]);
                for (let k = 1; k < Z2; k++) {
                    const p = padding + k * zs2 * cellSize - cellSize * 0.5;
                    ctx.beginPath(); ctx.moveTo(p, padding - cellSize * 0.5); ctx.lineTo(p, padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(padding - cellSize * 0.5, p); ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.5, p); ctx.stroke();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            濃度碁: 9つのゾーンの占有率が8割を超えると相転移 — 多数派が少数派を全て取る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は3x3の9ゾーン (水色の破線)。ゾーン内の占有率が8割を超え、多数派が決まっていると「相転移」が起きる。',
            '少数派の石は全て取られて相手のアゲハマに。各ゾーン1回限り。引き分け (同数) なら転移しない。',
            '打ち切り: 150手を超えると自動終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st = { zones: {} };
        // 左上ゾーン (x0-4,y0-4) を黒22+白3で埋める (占有100%)
        for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) board[I(x, y)] = 1;
        board[I(4, 2)] = 2; board[I(4, 3)] = 2; board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 7, y: 7 }] }, 1);
        assert('相転移で少数派が取られる', board[I(4, 3)] === 0 && captures[1] === 3);
        assert('ゾーンは処理済', st.zones[0] === true);
        // 未充填ゾーンは転移しない
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('他ゾーンは未処理', st.zones[4] === undefined);
        board.fill(0); st = { zones: {} };
        assert('起動して通常着手可', isValidPlacement([{ x: 6, y: 6 }], 1) === true);
    `,
};
