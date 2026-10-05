// MIRAGEGO — 蜃気楼碁: 各石の蜃気楼 (幻影) が1マス右にずれて映る。実座標は正確
const K = require('../gen_kit.js');
module.exports = {
    file: 'mirage2go.html',
    en: 'MIRAGEGO',
    jp: '蜃気楼碁',
    prefix: 'mirage2go',
    desc: '各石の蜃気楼が1マス右にずれて映る。見えている位置は幻 — 実座標が真実。',
    kind: 'mirror',
    icon: 'mirage2go',
    spec: [
        ...K.rb('MIRAGEGO', '蜃気楼碁', 'mirage2go'),
        K.params([
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 1.1, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り: 交点数x係数を超えた長期戦は死に石選択へ (終局不能の防止)
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 1.1))) {
                endGameByScore();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 蜃気楼: 全ての石の幻影を1マス右に淡く映す (実座標が本体)
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== 1 && board[i] !== 2) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                const gx = x + 1;
                if (gx >= BOARD_SIZE) continue;
                const cx = padding + gx * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.globalAlpha = 0.32;
                const grd = ctx.createRadialGradient(cx - cellSize * 0.1, cy - cellSize * 0.1, 1, cx, cy, cellSize * 0.4);
                if (board[i] === 1) {
                    grd.addColorStop(0, '#94a3b8'); grd.addColorStop(1, '#1e293b');
                } else {
                    grd.addColorStop(0, '#ffffff'); grd.addColorStop(1, '#cbd5e1');
                }
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.40, 0, Math.PI * 2);
                ctx.fill();
                // 幻影の揺らぎ縁
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = 'rgba(125,211,252,0.8)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.setLineDash([cellSize * 0.12, cellSize * 0.08]);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'蜃気楼発生中'`),
        [K.ONE, K.RV_BASE, K.rv([
            '蜃気楼: 全ての石の幻影が1マス右に淡く映る。石の実座標は正確 — 幻影の側は空点として打てる。',
            '幻を追うと指を滑らせる。実座標 (濃い石) だけを信じて着手しよう。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('実座標に石がある', board[I(4, 4)] === 1);
        assert('幻影側の座標は実際は空', board[I(5, 4)] === 0);
        assert('幻影の側にも着手可能', isValidPlacement([{ x: 5, y: 4 }], 2) === true);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 2);
        assert('実座標は正確に記録される', board[I(5, 4)] === 2 && board[I(4, 4)] === 1);
    `,
};
