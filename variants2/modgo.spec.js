// MODGO — 剰余碁: x+y mod 3 の許可帯が手数ごとに巡回する
const K = require('../gen_kit.js');
module.exports = {
    file: 'modgo.html',
    en: 'MODGO',
    jp: '剰余碁',
    prefix: 'modgo',
    desc: '着手点は (x+y) mod 3 が手数と一致する帯のみ。3手周期で許可域が回る。',
    kind: 'modulo',
    spec: [
        ...K.rb('MODGO', '剰余碁', 'modgo'),
        K.params([
            { key: 'mod', label: '帯の数 (剰余)', min: 2, max: 6, def: 3, hint: 'x+y mod N が手数と一致する帯のみ着手可' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 剰余碁ルール: (x+y) mod N が現在の許可帯 (手数-1 mod N) と一致する点のみ
            {
                const mm = Math.max(2, P('mod') || 3);
                const allowed = history.length % mm;
                for (const p of cells) {
                    if ((p.x + p.y) % mm !== allowed) return false;
                }
            }`],
        ...K.EVENT_CHIP_SPEC(`'許可帯: x+y ≡ ' + (history.length % Math.max(2, P('mod') || 3)) + ' (mod ' + Math.max(2, P('mod') || 3) + ')'`),
        ...K.LEGAL_DOTS_SPEC,
        K.CUE_GRID(`            // 剰余帯: N色の対角帯 (現在許可の帯は明るく大きく)
            {
                const mm = Math.max(2, P('mod') || 3);
                const band = history.length % mm;
                const cols = ['rgba(110,160,235,', 'rgba(235,180,90,', 'rgba(190,130,225,', 'rgba(120,220,160,', 'rgba(240,130,140,', 'rgba(140,170,255,'];
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const b = (x + y) % mm;
                    const cur = b === band;
                    ctx.fillStyle = cols[b] + (cur ? '0.30)' : '0.09)');
                    ctx.beginPath();
                    ctx.arc(padding + x * cellSize, padding + y * cellSize, cur ? cellSize * 0.32 : cellSize * 0.22, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '着手点は (x+y) mod 3 が許可帯と一致する交点のみ。許可帯は着手ごとに 0→1→2→0… と巡回する。',
            'パスは帯を進めない。打てる点が無い帯の番ではパスを選ぶしかない。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.MOVE_CAP_SPEC,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        history.length = 0;
        assert('帯0: x+y=0の点', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('帯0: x+y=3の点', isValidPlacement([{ x: 2, y: 1 }], 1) === true);
        assert('帯0: x+y=1の点は不可', isValidPlacement([{ x: 1, y: 0 }], 1) === false);
        board.fill(0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('帯1へ巡回: x+y=1が有効', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
        assert('帯1: x+y=0は不可', isValidPlacement([{ x: 3, y: 0 }], 2) === false);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
