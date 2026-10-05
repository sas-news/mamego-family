// GALAXYGO — 銀河碁: 石は星。8手ごとに全石が中心の重力で1歩ずつ引き寄せられる。
// 終局時、中心コア (距離2以内) の石1つにつき+2目。
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

module.exports = {
    file: 'galaxygo.html',
    en: 'GALAXYGO',
    jp: '銀河碁',
    prefix: 'galaxygo',
    desc: '8手ごとに全石が中心の重力で1歩動く。コアの石は終局時1石+2目。',
    kind: 'stone',
    icon: 'galaxygo',
    spec: [
        ...K.rb('GALAXYGO', '銀河碁', 'galaxygo'),
        K.params([
            { key: 'pulse_interval', label: '重力パルスの周期', min: 2, max: 30, def: 8, unit: '手' },
            { key: 'core_radius', label: 'コアの範囲', min: 1, max: 6, def: 2, unit: 'マス' },
            { key: 'core_pts', label: 'コア質量1石の得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.5, max: 2, step: 0.05, def: 1.1 },
        ]),
        ...PERSIST('{ pulse: 0 }'),
        [K.ONE, `        function isValidPlacement(cells, player) {`,
`        // 銀河の重力: 中心への距離 (チェビシェフ距離)
        const centerOf = () => (((BOARD_SIZE / 2) | 0) * BOARD_SIZE) + ((BOARD_SIZE / 2) | 0);
        const distCore = (i) => {
            const cx = (BOARD_SIZE / 2) | 0;
            return Math.max(Math.abs(i % BOARD_SIZE - cx), Math.abs(((i / BOARD_SIZE) | 0) - cx));
        };
        function isValidPlacement(cells, player) {`],
        // 重力ルール: 8手ごとに全石が中心へ1歩落ちる。取れなくなった連は消滅
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 重力ルール: 8手ごとの銀河パルス
            if (history.length % Math.max(1, P('pulse_interval') || 8) === 0) {
                st.pulse++;
                // 外側から順に中心へ1歩移動
                const stones = [];
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1 || board[i] === 2) stones.push(i);
                }
                stones.sort((a, b) => distCore(b) - distCore(a));
                stones.forEach(i => {
                    const v = board[i];
                    if (v !== 1 && v !== 2) return; // 先行の移動や消滅で空になった
                    let best = -1, bestD = distCore(i);
                    getNeighbors(i).forEach(n => {
                        if (board[n] === 0 && distCore(n) < bestD) { bestD = distCore(n); best = n; }
                    });
                    if (best >= 0) {
                        board[best] = v; board[i] = 0;
                        pieces.forEach(pc => {
                            if (pc.cells.some(cp => cp.x === i % BOARD_SIZE && cp.y === ((i / BOARD_SIZE) | 0))) {
                                pc.cells = [{ x: best % BOARD_SIZE, y: (best / BOARD_SIZE) | 0 }];
                            }
                        });
                        fxSlide(i, best);
                    }
                });
                // 重力で呼吸を失った連は消滅 (ブラックホールに呑まれる)
                let crushed = 0;
                for (let sweep = 0; sweep < 4; sweep++) {
                    let swept = false;
                    [1, 2].forEach(cc2 => {
                        getCapturedStones(board, cc2).forEach(i => { board[i] = 0; swept = true; crushed++; });
                    });
                    if (!swept) break;
                }
                cleanUpPieces();
                fxText(centerOf(), '重力パルス!', '#818cf8', 1200);
                if (crushed) fxShake(4, 300);
            }
${CAP}
            turn = opponent;`],
        // 採点: コア (中心から距離2以内) の石1つにつき+2
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            let coreB = 0, coreW = 0;
            for (let i = 0; i < board.length; i++) {
                if (distCore(i) <= (P('core_radius') || 2)) {
                    if (board[i] === 1) coreB += (P('core_pts') || 2);
                    else if (board[i] === 2) coreW += (P('core_pts') || 2);
                }
            }
            const blackTotal = territory.black + captures[1] + coreB;
            const whiteTotal = territory.white + captures[2] + coreW + komi;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒のコア質量:</span> <strong>\${coreB}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between"><span>白のコア質量:</span> <strong>\${coreW}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`],
        // 重力場: コアの輪と中心のブラックホール
        ...K.STONE_MARKS_SPEC(`            {
                const cx0 = (BOARD_SIZE / 2) | 0;
                const cpx = padding + cx0 * cellSize, cpy = padding + cx0 * cellSize;
                const now = fxNow();
                ctx.save();
                ctx.strokeStyle = 'rgba(129,140,248,0.35)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                [1, 2].forEach(r => {
                    ctx.beginPath();
                    ctx.arc(cpx, cpy, r * cellSize + cellSize * (0.3 + 0.05 * Math.sin(now / 600 + r)), 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.fillStyle = 'rgba(49,46,129,0.85)';
                ctx.beginPath();
                ctx.arc(cpx, cpy, cellSize * 0.16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'パルス ' + st.pulse + '回 次の重力 ' + ((P('pulse_interval') || 8) - history.length % (P('pulse_interval') || 8)) + '手後'`),
        [K.ONE, K.INFO_BASE, `            銀河碁: 8手ごとに重力パルスで全石が中心へ1歩動く。コアの石は終局時+2/石<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '8手ごとに重力パルス: 外側の石から順に中心へ1歩ずつ引き寄せられる (空きがあれば)。',
            'パルスで呼吸を失った連はブラックホールに呑まれ消滅する (アゲハマ無し)。',
            '終局時、中心から距離2以内のコアに残った石は1つ+2目。質量を中心に集めよ。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.pulse = 0; captures = { 1: 0, 2: 0 };
        const c = ((BOARD_SIZE / 2) | 0) * BOARD_SIZE + ((BOARD_SIZE / 2) | 0);
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        // 端の石が重力パルスで中心へ動く ((0,6) → (1,6))
        board[6] = 1;
        history.length = 7;
        executeMove({ cells: [{ x: 12, y: 12 }] }, 2); // 8手目でパルス
        assert('重力パルスが発火', st.pulse === 1);
        const moved = board.findIndex((v, i) => v === 1);
        assert('端の石が中心へ近づいた', moved >= 0 && Math.abs(moved % BOARD_SIZE - ((BOARD_SIZE / 2) | 0)) + Math.abs(((moved / BOARD_SIZE) | 0) - ((BOARD_SIZE / 2) | 0)) < 12);
        // コア内の石は終局時+2
        board.fill(0); board[c] = 1;
        endGameByScore();
        assert('コア質量が得点に', gameResultData.details.includes('黒のコア質量:</span> <strong>2</strong>'));
    `,
};
