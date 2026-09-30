// SPELLCIRCLEGO — 魔法陣碁: 自石で2x2の魔法陣を描くと大魔法が発動し、周囲の敵石を吹き飛ばす。
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
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.1)) {
                endGameByScore();
                return;
            }
`;

module.exports = {
    file: 'spellcirclego.html',
    en: 'SPELLCIRCLEGO',
    jp: '魔法陣碁',
    prefix: 'spellcirclego',
    desc: '自石で2x2の魔法陣を描くと大魔法が発動。周囲の敵石を一掃する。',
    kind: 'stone',
    icon: 'spellcirclego',
    spec: [
        ...K.rb('SPELLCIRCLEGO', '魔法陣碁', 'spellcirclego'),
        ...PERSIST('{ fired: {} }'),
        // 魔法陣ルール: 着手で完成した2x2自石ブロックが発動 — 周囲フレームの敵石を爆破
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 魔法陣ルール: 2x2ブロックの完成で大魔法発動
            {
                const cell0 = move.cells[0];
                for (let ay = cell0.y - 1; ay <= cell0.y; ay++) {
                    for (let ax = cell0.x - 1; ax <= cell0.x; ax++) {
                        if (ax < 0 || ay < 0 || ax + 1 >= BOARD_SIZE || ay + 1 >= BOARD_SIZE) continue;
                        const key = ax + ',' + ay;
                        if (st.fired[key]) continue;
                        const cells = [
                            ay * BOARD_SIZE + ax, ay * BOARD_SIZE + ax + 1,
                            (ay + 1) * BOARD_SIZE + ax, (ay + 1) * BOARD_SIZE + ax + 1
                        ];
                        if (!cells.every(i => board[i] === player)) continue;
                        st.fired[key] = 1;
                        // 大魔法: ブロック周囲のフレーム (1マス外側) にいる敵石を消滅させる
                        const ci = (ay + 0.5) * BOARD_SIZE + (ax + 0.5);
                        fxGlow(ay * BOARD_SIZE + ax, '#c084fc', 900);
                        fxText(ay * BOARD_SIZE + ax, '魔法陣発動!', '#c084fc', 1300);
                        fxShake(5, 320);
                        let vapor = 0;
                        for (let ry = ay - 1; ry <= ay + 2; ry++) {
                            for (let rx = ax - 1; rx <= ax + 2; rx++) {
                                if (rx < 0 || ry < 0 || rx >= BOARD_SIZE || ry >= BOARD_SIZE) continue;
                                if (rx >= ax && rx <= ax + 1 && ry >= ay && ry <= ay + 1) continue;
                                const ri = ry * BOARD_SIZE + rx;
                                if (board[ri] === opponent) {
                                    board[ri] = 0;
                                    vapor++;
                                    fxBurst(ri, '#a855f7', 8, 1.4);
                                }
                            }
                        }
                        if (vapor > 0) {
                            captures[player] += vapor;
                            cleanUpPieces();
                        }
                    }
                }
            }
${CAP}
            turn = opponent;`],
        // 発動済み魔法陣に五芒星を描く
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                Object.keys(st.fired || {}).forEach(key => {
                    const [ax, ay] = key.split(',').map(Number);
                    const cx = padding + (ax + 0.5) * cellSize, cy = padding + (ay + 0.5) * cellSize;
                    const rr = cellSize * 0.9, now = fxNow();
                    ctx.strokeStyle = 'rgba(168,85,247,' + (0.55 + 0.25 * Math.sin(now / 500)) + ')';
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    ctx.beginPath();
                    for (let k = 0; k <= 5; k++) {
                        const a = -Math.PI / 2 + k * 4 * Math.PI / 5;
                        const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a);
                        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(216,180,254,0.35)';
                    ctx.beginPath();
                    ctx.arc(cx, cy, rr * 1.05, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'魔法陣 ' + Object.keys(st.fired || {}).length + '基発動'`),
        [K.ONE, K.INFO_ALGO, `            魔法陣碁: 自石で2x2の魔法陣を完成させると大魔法が発動。周囲の敵石を消滅させる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の石で2x2のブロック (魔法陣) を完成させると大魔法が発動する。',
            '発動した魔法陣は外周フレーム (1マス外側) の敵石をすべて消滅させ、アゲハマに加える。',
            '1つの魔法陣は1回だけ発動。敵に1マス欠けさせられると完成しない — 妨害が鍵。',
        ])],
        PASS_END,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.fired = {}; captures = { 1: 0, 2: 0 };
        assert('起動・通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[3 * BOARD_SIZE + 3] = 1; board[3 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 3] = 1;
        board[2 * BOARD_SIZE + 3] = 2; board[2 * BOARD_SIZE + 4] = 2; // 枠上の敵石
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 2x2完成
        assert('魔法陣が発動した', st.fired['3,3'] === 1);
        assert('周囲の敵石が消滅', board[2 * BOARD_SIZE + 3] === 0 && board[2 * BOARD_SIZE + 4] === 0);
        assert('消滅分がアゲハマに', captures[1] === 2);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        assert('同じ魔法陣は再発動しない', captures[1] === 2);
    `,
};
