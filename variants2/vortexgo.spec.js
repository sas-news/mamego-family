// VORTEXGO — 渦模様碁: 中心から渦を巻く壁が走る盤
const K = require('../gen_kit.js');
module.exports = {
    file: 'vortexgo.html',
    en: 'VORTEXGO',
    jp: '渦模様碁',
    prefix: 'vortexgo',
    desc: '中心から渦を巻く腕状の壁。流れに沿って戦線が歪む。',
    kind: 'stone',
    spec: [
        ...K.rb('VORTEXGO', '渦模様碁', 'vortexgo'),
        // 角度+半径の螺旋判定で渦状の腕壁
        [K.ONE, K.RESET_BOARD, `            board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
            {
                const c = Math.floor(BOARD_SIZE / 2);
                for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                    const dx = x - c, dy = y - c;
                    const d = Math.max(Math.abs(dx), Math.abs(dy));
                    if (d === 0) continue;
                    const t = Math.atan2(dy, dx);
                    const band = Math.floor(((t + Math.PI) / (Math.PI * 2)) * 12 + d) % 3;
                    if (band === 0) board[y * BOARD_SIZE + x] = 3;
                }
            }`],
        ...K.WALL_SPEC,
        [K.ONE, K.RV_ALGO, K.rv([
            '中心の渦の目から4本の腕状の壁が渦を巻いて伸びる。',
            '壁に沿って石を進めれば、流れに乗って敵地へ潜り込める。',
            '打ち切り: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)。',
        ])],
        // 打ち切り終局: 累計着手が交点数+2行ぶんに達したら強制終局して地計算 (無限対局を防ぐ安全装置)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る
            if (history.length >= BOARD_SIZE * (BOARD_SIZE + 2)) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        const c = Math.floor(BOARD_SIZE / 2);
        assert('渦の目は置ける', isValidPlacement([{ x: c, y: c }], 1) === true);
        let w = 0;
        for (const v of board) if (v === 3) w++;
        assert('渦状の壁が走る', w > 30);
        assert('壁には置けない', (() => {
            for (let i = 0; i < board.length; i++) if (board[i] === 3) return !isValidPlacement([{ x: i % BOARD_SIZE, y: Math.floor(i / BOARD_SIZE) }], 1);
            return false;
        })());
        assert('流れの上は置ける', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
