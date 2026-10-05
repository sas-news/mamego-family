// ECHOLOCGO — 反響碁: 敵石は不可視。自石の2マス以内の敵石だけ反響で見える
const K = require('../gen_kit.js');
module.exports = {
    file: 'echolocgo.html',
    en: 'ECHOLOCGO',
    jp: '反響碁',
    prefix: 'echolocgo',
    desc: '敵石は闇の中。自石の反響が届く2マス以内だけ見える。',
    kind: 'echo',
    spec: [
        ...K.rb('ECHOLOCGO', '反響碁', 'echolocgo'),
        K.params([
            { key: 'sonar_range', label: '反響の届く範囲', min: 1, max: 6, def: 2, unit: 'マス' },
        ]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 反響碁: viewer の石から2マス以内の敵石だけが反響で見える
        function sonarSees(idx, viewer) {
            const x = idx % BOARD_SIZE, y = Math.floor(idx / BOARD_SIZE);
            for (let j = 0; j < board.length; j++) {
                if (board[j] !== viewer) continue;
                const jx = j % BOARD_SIZE, jy = Math.floor(j / BOARD_SIZE);
                if (Math.max(Math.abs(jx - x), Math.abs(jy - y)) <= (P('sonar_range') || 2)) return true;
            }
            return false;
        }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const sIdx = alive.length ? alive[0].y * BOARD_SIZE + alive[0].x : -1;
                const echoA = (pc.player !== turn && (sIdx < 0 || !sonarSees(sIdx, turn))) ? 0.08 : 1;
                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : echoA);`],
        ...K.STONE_MARKS_SPEC(`            // 反響が届く敵石にはソナー波の輪
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(45, 212, 191, 0.8)';
                ctx.lineWidth = Math.max(1.3, cellSize * 0.05);
                board.forEach((v, i) => {
                    if (v === 0 || v === turn) return;
                    if (!sonarSees(i, turn)) return;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    [0.30, 0.44].forEach(rr => {
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * rr, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'反響: 自石の' + (P('sonar_range') || 2) + 'マス以内のみ可視'`),
        [K.ONE, K.INFO_BASE, `            反響碁: 敵石は不可視。自分の石から2マス以内の敵石だけ反響で見える<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '相手の石はほぼ見えない。自分の石の2マス以内にある敵石だけが反響で姿を現す。',
            '不可視の敵石も呼吸・取り・地には普通に働く — 接触戦こそ情報戦。',
        ])],
        // 反響定位: 自石から周期的に広がるソナー波 — 「届く範囲しか見えない」を演出
        [K.ONE, '        let obstaclePainter = null;',
`        let obstaclePainter = null;
        // 反響碁: 自石からソナーの輪が周期的に広がる常時オーバーレイ
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            board.forEach((v, i) => {
                if (v !== turn) return;
                const cx = pad + (i % BOARD_SIZE) * cs;
                const cy = pad + Math.floor(i / BOARD_SIZE) * cs;
                for (let k = 0; k < 2; k++) {
                    const ph = (now / 2000 + k * 0.5) % 1;
                    ctx2.globalAlpha = 0.22 * (1 - ph);
                    ctx2.strokeStyle = '#2dd4bf';
                    ctx2.lineWidth = Math.max(1, cs * 0.05);
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, cs * (0.3 + ph * 2.2), 0, Math.PI * 2);
                    ctx2.stroke();
                }
            });
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = [];
        board[2 * BOARD_SIZE + 0] = 1; // 黒 (0,2)
        board[0 * BOARD_SIZE + 1] = 2; // 白 (1,0)
        board[8 * BOARD_SIZE + 8] = 2; // 白 (8,8) 遠方
        assert('2マス以内の敵石は見える', sonarSees(0 * BOARD_SIZE + 1, 1) === true);
        assert('遠い敵石は見えない', sonarSees(8 * BOARD_SIZE + 8, 1) === false);
        assert('見えなくても着手ルールは通常', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
    `,
};
