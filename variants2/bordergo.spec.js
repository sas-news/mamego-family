// BORDERGO — 国境碁: 敵石に接する点 (斜め含む8近傍) にのみ着手可
const K = require('../gen_kit.js');
module.exports = {
    file: 'bordergo.html',
    en: 'BORDERGO',
    jp: '国境碁',
    prefix: 'bordergo',
    desc: '着手は敵石に接する点のみ。国境線でしか石は生まれない。',
    kind: 'border',
    spec: [
        ...K.rb('BORDERGO', '国境碁', 'bordergo'),
        K.params([
            { key: 'border_range', label: '接敵範囲', min: 1, max: 3, def: 1, hint: '敵石からの距離 (1=8近傍)' },
        ]),
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
            }

            // 国境碁ルール: 敵石の8近傍 (斜め含む) にのみ着手可 (敵石が無い間は自由)
            {
                const enemy = player === 1 ? 2 : 1;
                const rr = Math.max(1, P('border_range') || 1); // 接敵範囲
                let hasEnemy = false;
                const zone = new Set();
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== enemy) continue;
                    hasEnemy = true;
                    const ex = i % BOARD_SIZE, ey = Math.floor(i / BOARD_SIZE);
                    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = ex + dx, ny = ey + dy;
                        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) zone.add(ny * BOARD_SIZE + nx);
                    }
                }
                if (hasEnemy) {
                    for (const p of cells) {
                        if (!zone.has(p.y * BOARD_SIZE + p.x)) return false;
                    }
                }
            }`],
        ...K.LEGAL_DOTS_SPEC,
        // 国境線: 敵石の周囲に脈動する接敵リング (接敵域が可視化される)
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const enemy = turn === 1 ? 2 : 1;
            ctx2.strokeStyle = 'rgba(220,80,60,' + (0.22 + 0.14 * Math.sin(now / 500)) + ')';
            ctx2.lineWidth = Math.max(1.2, cs * 0.05);
            for (let i = 0; i < board.length; i++) {
                if (board[i] !== enemy) continue;
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                ctx2.beginPath();
                ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.52, 0, Math.PI * 2);
                ctx2.stroke();
            }
            ctx2.restore();
        });`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手は敵石に接する点 (斜め含む8近傍) のみ。敵が居ない間はどこにでも置ける。',
            '全ての石は国境線上で生まれる。接触戦から逃げられない激しい碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('敵石が無い初手は自由', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        board[6 * BOARD_SIZE + 6] = 2; // (6,6)に白
        assert('敵石の直交隣は置ける', isValidPlacement([{ x: 7, y: 6 }], 1) === true);
        assert('敵石の斜め隣も置ける', isValidPlacement([{ x: 7, y: 7 }], 1) === true);
        assert('接しない点は置けない', isValidPlacement([{ x: 9, y: 9 }], 1) === false);
        assert('白は黒石が無いので自由', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
        board[0] = 1; // (0,0)に黒が出現
        assert('黒出現後は白も接地点のみ', isValidPlacement([{ x: 9, y: 9 }], 2) === false);
        assert('白は黒石の隣なら置ける', isValidPlacement([{ x: 1, y: 0 }], 2) === true);
    `,
};
