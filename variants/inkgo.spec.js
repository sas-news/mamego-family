// INKGO — 墨染碁: 敵石2個以上に囲まれた空点は墨で滲み、味方石がなければ着手不可
const K = require('../gen_kit.js');
module.exports = {
    file: 'inkgo.html',
    en: 'INKGO',
    jp: '墨染碁',
    prefix: 'inkgo',
    desc: '敵石2個以上に接する空点は墨の滲み。味方石と接しない限り打てない。',
    kind: 'stone',
    icon: 'inkgo',
    spec: [
        ...K.rb('INKGO', '墨染碁', 'inkgo'),
        K.params([
            { key: 'ink_min', label: '滲みに必要な敵石数', min: 2, max: 4, def: 2, unit: '個' },
        ]),
        // 滲み領域: 敵石が2個以上隣接し、味方石が0個の空点には着手不可
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 墨染ルール: 敵石2個以上に接し味方石に接しない空点は墨に滲んで打てない
            {
                const foe = player === 1 ? 2 : 1;
                for (const p of cells) {
                    const pi = p.y * BOARD_SIZE + p.x;
                    let ink = 0, own = 0;
                    getNeighbors(pi).forEach(n => {
                        if (board[n] === foe) ink++;
                        else if (board[n] === player) own++;
                    });
                    if (ink >= (P('ink_min') || 2) && own === 0) return false;
                }
            }`],
        // 滲み領域を墨色で塗る
        K.CUE_GRID(`            {
                ctx.save();
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const i = y * BOARD_SIZE + x;
                    if (board[i] !== 0) continue;
                    let b = 0, w = 0;
                    getNeighbors(i).forEach(n => {
                        if (board[n] === 1) b++; else if (board[n] === 2) w++;
                    });
                    let f = null;
                    if (b >= (P('ink_min') || 2) && w === 0) f = 'rgba(15, 23, 42, 0.28)';
                    else if (w >= (P('ink_min') || 2) && b === 0) f = 'rgba(15, 23, 42, 0.14)';
                    if (!f) continue;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = f;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.46, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, K.INFO_BASE, `            墨染碁: 敵石2個以上に接する空点は墨に滲む。味方石と接しない限り打てない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石の周囲には墨が滲む: 敵石2個以上に接した空点は、味方の石と接していない限り着手できない。',
            '滲みを利用して相手の侵入路を狭めよう。取り合いの接点は滲みの例外になる。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof isValidPlacement === 'function');
        // 敵石2個に挟まれた点は滲みで打てない
        board[2 * BOARD_SIZE + 1] = 2; board[2 * BOARD_SIZE + 3] = 2;
        assert('敵2個の滲み点は不可', isValidPlacement([{ x: 2, y: 2 }], 1) === false);
        // 敵石1個だけなら滲まない
        board.fill(0); board[2 * BOARD_SIZE + 1] = 2;
        assert('敵1個なら打てる', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
        // 味方石が接していれば滲みでも打てる
        board.fill(0);
        board[2 * BOARD_SIZE + 1] = 2; board[2 * BOARD_SIZE + 3] = 2;
        board[1 * BOARD_SIZE + 2] = 1;
        assert('味方接しなら滲みでも打てる', isValidPlacement([{ x: 2, y: 2 }], 1) === true);
        // 敵にも同じルール
        board.fill(0);
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 7] = 1;
        assert('白にも滲みは効く', isValidPlacement([{ x: 6, y: 5 }], 2) === false);
    `,
};
