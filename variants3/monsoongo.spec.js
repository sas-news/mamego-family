// MONSOONGO — 雨季碁: 12手周期で雨季(下2段が水没・石は流出)と乾季が巡る
const K = require('../gen_kit.js');
module.exports = {
    file: 'monsoongo.html',
    en: 'MONSOONGO',
    jp: '雨季碁',
    prefix: 'monsoongo',
    desc: '12手周期: 雨季は下2段が水没して着手不可、石は流出する。乾季で回復。',
    kind: 'weather',
    icon: 'monsoongo',
    spec: [
        ...K.rb('MONSOONGO', '雨季碁', 'monsoongo'),
        K.params([
            { key: 'season', label: '季節の周期', min: 4, max: 30, def: 12, unit: '手', hint: 'N手で雨季と乾季が交互に来る' },
            { key: 'flood_rows', label: '冠水行数', min: 1, max: 6, def: 2, unit: '行' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 雨季 (手数の12の位が奇数帯) は下2段が水没で着手不可
        [K.ONE, K.VALID_BOUNDS, `            const wet = Math.floor(history.length / Math.max(1, P('season') || 12)) % 2 === 1;
            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                if (wet && p.y >= BOARD_SIZE - (P('flood_rows') || 2)) return false; // 雨季の低地は水没
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 季節: 12手ごとに雨季/乾季が巡る (両者共通)
            if (history.length % Math.max(1, P('season') || 12) === 0) {
                const nowWet = Math.floor(history.length / Math.max(1, P('season') || 12)) % 2 === 1;
                if (nowWet) {
                    // 雨季: 下2段が水没 — その帯の石は全て流される (アゲハマにはならない)。全滅はさせない
                    const washed = [];
                    for (let i = 0; i < board.length; i++) {
                        const ty = Math.floor(i / BOARD_SIZE);
                        if (ty >= BOARD_SIZE - (P('flood_rows') || 2) && (board[i] === 1 || board[i] === 2)) washed.push(i);
                    }
                    if (washed.length < board.filter(v => v === 1 || v === 2).length) {
                        washed.forEach(i => { board[i] = 0; fxSplash(i, '#3b82f6', 6); });
                        cleanUpPieces();
                    }
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '雨季!', '#3b82f6', 1200);
                } else {
                    fxText(Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2), '乾季!', '#f59e0b', 1200);
                }
            }

            // 打ち切り: 交点数x1.1を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 雨季: 下2段を水面で覆う
            if (Math.floor(history.length / Math.max(1, P('season') || 12)) % 2 === 1) {
                ctx.save();
                ctx.fillStyle = 'rgba(59,130,246,0.35)';
                for (let x = 0; x < BOARD_SIZE; x++) for (let y = BOARD_SIZE - (P('flood_rows') || 2); y < BOARD_SIZE; y++) {
                    ctx.fillRect(padding + x * cellSize - cellSize / 2, padding + y * cellSize - cellSize / 2, cellSize, cellSize);
                }
                // 水面の波線
                ctx.strokeStyle = 'rgba(147,197,253,0.7)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                for (let x = 0; x < BOARD_SIZE - 1; x++) {
                    const cx = padding + (x + 0.5) * cellSize;
                    const cy = padding + (BOARD_SIZE - (P('flood_rows') || 2)) * cellSize - cellSize / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI);
                    ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`Math.floor(history.length / Math.max(1, P('season') || 12)) % 2 === 1 ? '雨季' : '乾季'`),
        [K.ONE, K.RV_BASE, K.rv([
            '季節は12手周期: 雨季の12手帯は盤の下2段 (低地) が水没し、着手もできない。',
            '雨季が始まる瞬間、低地の石は全て流される (アゲハマにはならない)。周期は両者共通。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('乾季は低地にも置ける', isValidPlacement([{ x: 5, y: BOARD_SIZE - 1 }], 1) === true);
        for (let k = 0; k < 11; k++) {
            executeMove({ cells: [{ x: 3 + (k % 6), y: 2 + Math.floor(k / 6) }] }, k % 2 === 0 ? 1 : 2);
        }
        board[I(6, BOARD_SIZE - 1)] = 1; // 低地に黒石
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2); // 12手目 → 雨季へ
        assert('雨季で低地の石が流出', board[I(6, BOARD_SIZE - 1)] === 0);
        assert('雨季は低地に置けない', isValidPlacement([{ x: 5, y: BOARD_SIZE - 1 }], 1) === false);
        assert('高台は置ける', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
